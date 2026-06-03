import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import useVoiceRecorder from '../hooks/useVoiceRecorder';
import useSessionHistory from '../hooks/useSessionHistory';
import VoiceRecorder from '../components/VoiceRecorder';
import PlaybackPlayer from '../components/PlaybackPlayer';
import HowItLandsPlayer from '../components/HowItLandsPlayer';
import ConfirmOrChange from '../components/ConfirmOrChange';
import CalmingScreen from '../components/CalmingScreen';
import SessionComplete from '../components/SessionComplete';
import { callAI, PROMPTS, FALLBACKS } from '../services/ai';
import { analyzeTranscript } from '../services/analyzer';

type Step = 'recording' | 'playback' | 'howItLands' | 'confirm' | 'calming' | 'complete';

interface SessionState {
  step: Step;
  transcript: string;
  audioBlobUrl: string | null;
  howItLandsText: string;
  howItLandsLoading: boolean;
  calmingText: string;
  calmingLoading: boolean;
  changeCount: number;
  startTime: number;
}

interface Props {
  user: User;
}

const MIN_WORDS = 10;

export default function SessionPage({ user }: Props) {
  const navigate = useNavigate();
  const { saveSession } = useSessionHistory(user.uid);

  const [session, setSession] = useState<SessionState>({
    step: 'recording',
    transcript: '',
    audioBlobUrl: null,
    howItLandsText: '',
    howItLandsLoading: false,
    calmingText: '',
    calmingLoading: false,
    changeCount: 0,
    startTime: Date.now(),
  });

  const recorder = useVoiceRecorder();
  const [canStop, setCanStop] = useState(false);
  const [shortWarning, setShortWarning] = useState(false);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enable Stop after 3 seconds of recording
  useEffect(() => {
    if (recorder.isRecording) {
      setCanStop(false);
      stopTimerRef.current = setTimeout(() => setCanStop(true), 3000);
    }
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, [recorder.isRecording]);

  const handleStart = useCallback(async () => {
    setShortWarning(false);
    await recorder.startRecording();
  }, [recorder]);

  const handleStop = useCallback(async () => {
    const { blobUrl, transcript } = await recorder.stopRecording();
    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < MIN_WORDS) {
      setShortWarning(true);
      return;
    }

    // Move to playback, kick off "how it lands" in background
    setSession((s) => ({
      ...s,
      step: 'playback',
      transcript,
      audioBlobUrl: blobUrl,
      howItLandsLoading: true,
    }));

    callAI(PROMPTS.howItLands, transcript).then((text) => {
      setSession((s) => ({
        ...s,
        howItLandsText: text || FALLBACKS.howItLands,
        howItLandsLoading: false,
      }));
    });
  }, [recorder]);

  const goToHowItLands = useCallback(() => {
    setSession((s) => ({ ...s, step: 'howItLands' }));
  }, []);

  const goToConfirm = useCallback(() => {
    setSession((s) => ({ ...s, step: 'confirm' }));
  }, []);

  const handleContinue = useCallback(() => {
    // Start calming generation
    setSession((s) => ({ ...s, step: 'calming', calmingLoading: true }));
    callAI(PROMPTS.calming(session.transcript), session.transcript).then((text) => {
      setSession((s) => ({
        ...s,
        calmingText: text || FALLBACKS.calming,
        calmingLoading: false,
      }));
    });
  }, [session.transcript]);

  const handleChange = useCallback(() => {
    recorder.reset();
    setShortWarning(false);
    setSession((s) => ({
      ...s,
      step: 'recording',
      transcript: '',
      audioBlobUrl: null,
      howItLandsText: '',
      calmingText: '',
      changeCount: s.changeCount + 1,
    }));
  }, [recorder]);

  const handleDone = useCallback(async () => {
    const durationSeconds = Math.round((Date.now() - session.startTime) / 1000);

    // Run analysis
    const analysis = await analyzeTranscript(session.transcript);

    await saveSession({
      createdAt: new Date().toISOString(),
      durationSeconds,
      transcript: session.transcript,
      howItLandsText: session.howItLandsText,
      didChange: session.changeCount > 0,
      changeCount: session.changeCount,
      calmingTechniqueShown: session.calmingText.slice(0, 60),
      scores: {
        confidence: analysis.confidence,
        clarity: analysis.clarity,
        emotionalIntensity: analysis.emotionalIntensity,
      },
      dominantEmotions: analysis.dominantEmotions,
      wordPatterns: {
        negativeWords: analysis.negativeWords,
        positiveWords: analysis.positiveWords,
        repeatedWords: analysis.repeatedWords,
      },
    });

    setSession((s) => ({ ...s, step: 'complete' }));
  }, [session, saveSession]);

  const stepMeta: Record<Step, { label: string; number: number; total: number } | null> = {
    recording: { label: 'Step 1 of 5', number: 1, total: 5 },
    playback: { label: 'Step 2 of 5', number: 2, total: 5 },
    howItLands: { label: 'Step 3 of 5', number: 3, total: 5 },
    confirm: { label: 'Step 4 of 5', number: 4, total: 5 },
    calming: { label: 'Step 5 of 5', number: 5, total: 5 },
    complete: null,
  };

  const meta = stepMeta[session.step];

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        {meta && (
          <p className="step-indicator">{meta.label}</p>
        )}
        {session.step !== 'complete' && session.step !== 'recording' && (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-textMuted hover:text-textSecondary"
          >
            ✕
          </button>
        )}
      </header>

      {/* Progress bar */}
      {meta && (
        <div className="h-0.5 bg-bgCard mx-5 rounded-full overflow-hidden">
          <div
            className="h-full bg-green rounded-full transition-all duration-500"
            style={{ width: `${(meta.number / meta.total) * 100}%` }}
          />
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-5 py-8">

        {/* Step 1: Recording */}
        {session.step === 'recording' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-display text-textPrimary">What's on your mind?</h2>
              <p className="text-sm text-textSecondary mt-1">Say what's bothering you. Don't filter.</p>
            </div>
            <VoiceRecorder
              isRecording={recorder.isRecording}
              transcript={recorder.transcript}
              interimTranscript={recorder.interimTranscript}
              error={recorder.error}
              onStart={handleStart}
              onStop={handleStop}
              canStop={canStop}
            />
            {shortWarning && (
              <p className="text-sm text-amber text-center">
                Say a little more — the more you speak, the more clearly you'll hear yourself.
              </p>
            )}
          </div>
        )}

        {/* Step 2: Playback */}
        {session.step === 'playback' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-display text-textPrimary">Hear what you just said.</h2>
              <p className="text-sm text-textSecondary mt-1">Your own voice. No filters.</p>
            </div>
            <PlaybackPlayer
              blobUrl={session.audioBlobUrl}
              transcript={session.transcript}
              onHasPlayed={goToHowItLands}
            />
            <button
              type="button"
              onClick={goToHowItLands}
              className="btn-primary w-full py-4"
            >
              Next →
            </button>
          </div>
        )}

        {/* Step 3: How it lands */}
        {session.step === 'howItLands' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-display text-textPrimary">Now hear how your words land on someone else.</h2>
            </div>
            <HowItLandsPlayer
              text={session.howItLandsText}
              loading={session.howItLandsLoading}
            />
            {!session.howItLandsLoading && (
              <button
                type="button"
                onClick={goToConfirm}
                className="btn-primary w-full py-4"
              >
                Next →
              </button>
            )}
          </div>
        )}

        {/* Step 4: Confirm or change */}
        {session.step === 'confirm' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-display text-textPrimary">Do you really mean what you said?</h2>
            </div>
            <ConfirmOrChange
              transcript={session.transcript}
              howItLandsText={session.howItLandsText}
              onContinue={handleContinue}
              onChange={handleChange}
            />
          </div>
        )}

        {/* Step 5: Calming */}
        {session.step === 'calming' && (
          <CalmingScreen
            text={session.calmingText}
            loading={session.calmingLoading}
            onDone={handleDone}
          />
        )}

        {/* Complete */}
        {session.step === 'complete' && (
          <SessionComplete onHome={() => navigate('/')} />
        )}
      </main>
    </div>
  );
}
