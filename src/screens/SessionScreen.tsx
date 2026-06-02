import { useEffect, useRef, useState } from 'react';
import type { BodyLocation, Session } from '../types';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useSession from '../hooks/useSession';
import StepIndicator from '../components/StepIndicator';
import ListeningIndicator from '../components/ListeningIndicator';
import BodyMap from '../components/BodyMap';

interface Props {
  language: 'en' | 'hi';
  name: string;
  onComplete: (session: Session) => void;
  onCancel: () => void;
}

export default function SessionScreen({ language, name, onComplete, onCancel }: Props) {
  const [fallbackText, setFallbackText] = useState('');
  const startedRef = useRef(false);

  const {
    step,
    transcript,
    bodyLocation,
    response,
    selectedWords,
    indianWordOffer,
    stepLabel,
    startListening,
    stopListening,
    selectBodyLocation,
    selectSuggestedWord,
    markStep4Response,
    completeSession,
    setFallbackTranscript
  } = useSession(language, name);

  const { speak } = useSpeechSynthesis();

  const speech = useSpeechRecognition({
    language: language === 'hi' ? 'hi-IN' : 'en-IN',
    onResult: (text) => {
      setFallbackText(text);
      setFallbackTranscript(text);
    },
    onError: () => {},
    onEnd: () => {
      if (step === 'step1_listening' || step === 'step3_underneath') {
        stopListening();
      }
    }
  });

  const isListening = speech.isListening;

  // Auto-start the session when the screen first mounts
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      startListening();
    }
  }, [startListening]);

  // Start browser speech recognition when session step enters a listening state
  useEffect(() => {
    if (step === 'step1_listening' || step === 'step3_underneath') {
      if (!isListening) {
        speech.start();
      }
    }
  }, [step]);

  // Keep fallbackText in sync with speech recognition transcript
  useEffect(() => {
    if ((step === 'step1_listening' || step === 'step3_underneath') && speech.transcript) {
      setFallbackText(speech.transcript);
    }
  }, [speech.transcript, step]);

  // Speak AI responses aloud
  useEffect(() => {
    if (response && (step === 'step1_responding' || step === 'step2_responding' || step === 'step3_responding')) {
      speak(response);
    }
  }, [response, step]);

  const bodyLabel = bodyLocation ? bodyLocation.charAt(0).toUpperCase() + bodyLocation.slice(1) : 'your body';

  const handleContinue = () => {
    const text = fallbackText.trim();
    if (text) {
      setFallbackTranscript(text);
    }
    stopListening();
  };

  const handleFinish = () => {
    const session = completeSession();
    onComplete(session);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="card p-6">
        <StepIndicator step={stepLabel} />

        {(step === 'idle' || step === 'step1_listening') && (
          <div className="flex flex-col items-center gap-6 pt-2">
            <ListeningIndicator active={isListening} />
            <p className="max-w-md text-center text-sm leading-7 text-textPrimary">
              {step === 'idle'
                ? 'Getting ready...'
                : 'Take your time. Just tell me what happened.'}
            </p>
            {fallbackText && (
              <p className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-textPrimary">
                {fallbackText}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                className="rounded-full bg-greenBright px-5 py-3 text-sm font-medium text-bg"
                type="button"
                onClick={handleContinue}
                disabled={step === 'idle'}
              >
                Done
              </button>
              <button
                className="rounded-full bg-white/10 px-5 py-3 text-sm text-textSecondary hover:bg-white/15"
                type="button"
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'step1_responding' && (
          <div className="space-y-4 pt-2">
            <p className="text-sm leading-7 text-textPrimary">{response}</p>
          </div>
        )}

        {step === 'step2_body' && (
          <div className="space-y-6 pt-2">
            <p className="text-sm leading-7 text-textPrimary">Where are you feeling this in your body?</p>
            <BodyMap selected={bodyLocation} onSelect={selectBodyLocation} />
            <p className="text-xs text-textMuted">Tap a zone on the body map above.</p>
          </div>
        )}

        {step === 'step2_responding' && (
          <div className="space-y-4 pt-2">
            <p className="text-sm leading-7 text-textPrimary">{response}</p>
          </div>
        )}

        {step === 'step3_underneath' && (
          <div className="space-y-4 pt-2">
            <p className="text-sm leading-7 text-textPrimary">Behind the feeling from earlier, what else is there?</p>
            <div className="flex flex-col gap-3">
              <textarea
                value={fallbackText}
                onChange={(e) => setFallbackText(e.target.value)}
                placeholder="Type here, or just speak..."
                className="min-h-[120px] w-full rounded-2xl border border-white/12 bg-white/6 p-4 text-sm text-textPrimary placeholder:text-textMuted outline-none focus:border-greenBright/50"
              />
              <button
                className="rounded-full bg-greenBright px-5 py-3 text-sm font-medium text-bg"
                type="button"
                onClick={handleContinue}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {step === 'step3_responding' && (
          <div className="space-y-4 pt-2">
            <p className="text-sm leading-7 text-textPrimary">{response}</p>
          </div>
        )}

        {step === 'step4_witness' && (
          <div className="space-y-6 pt-2">
            <p className="whitespace-pre-line text-lg leading-9 text-greenLight">
              {`The part of you that just told me all this —\n\nis that part also ${bodyLabel}?\n\nOr is it just... watching?`}
            </p>
            <button
              className="rounded-full bg-greenBright px-5 py-3 text-sm font-medium text-bg"
              type="button"
              onClick={markStep4Response}
            >
              I noticed it
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4 pt-2">
            <p className="text-sm leading-7 text-textPrimary">
              Session saved. Your words from today have been added to your garden.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-greenBright px-5 py-3 text-sm font-medium text-bg"
                type="button"
                onClick={handleFinish}
              >
                See your words →
              </button>
              <button
                className="rounded-full bg-white/10 px-5 py-3 text-sm text-textSecondary hover:bg-white/15"
                type="button"
                onClick={onCancel}
              >
                Home
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
