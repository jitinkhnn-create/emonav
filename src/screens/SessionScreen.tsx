import { useEffect, useMemo, useState } from 'react';
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
  const [transcriptionSource, setTranscriptionSource] = useState<'speech' | 'typing'>('speech');

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

  useEffect(() => {
    if (step === 'step1_listening' || step === 'step3_underneath') {
      if (!isListening) {
        speech.start();
      }
    }
  }, [step, isListening, speech]);

  useEffect(() => {
    if (step === 'step1_listening' || step === 'step3_underneath') {
      if (speech.transcript) {
        setFallbackText(speech.transcript);
      }
    }
  }, [speech.transcript, step]);

  useEffect(() => {
    if (response && (step === 'step1_responding' || step === 'step2_responding' || step === 'step3_responding')) {
      speak(response);
    }
  }, [response, speak, step]);

  const bodyLabel = bodyLocation ? bodyLocation.charAt(0).toUpperCase() + bodyLocation.slice(1) : 'your body';

  const handleContinue = () => {
    if (step === 'step1_listening') {
      setTranscriptionSource('typing');
      setFallbackTranscript(fallbackText);
      stopListening();
    }
    if (step === 'step3_underneath') {
      setTranscriptionSource('typing');
      setFallbackTranscript(fallbackText);
      stopListening();
    }
  };

  const handleFinish = () => {
    const session = completeSession();
    onComplete(session);
  };

  const bodySuggestions = useMemo(() => {
    if (!bodyLocation) return [];
    const mapping: Record<BodyLocation, string[]> = {
      head: ['confused', 'overthinking', 'pressure'],
      throat: ['choked', 'silenced', 'holding back'],
      chest: ['heavy', 'tight', 'aching'],
      stomach: ['anxious', 'sick', 'knotted'],
      hands: ['restless', 'clenching', 'wanting to act']
    };
    return mapping[bodyLocation];
  }, [bodyLocation]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="card p-6">
        <StepIndicator step={stepLabel} />
        {step === 'step1_listening' && (
          <div className="flex flex-col items-center gap-6">
            <ListeningIndicator active={isListening} />
            <p className="max-w-md text-sm leading-7 text-textPrimary text-center">Take your time. Just tell me what happened.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button className="rounded-full bg-green-bright px-5 py-3 text-sm text-bg-primary" type="button" onClick={handleContinue}>
                Done
              </button>
              <button className="rounded-full bg-white/10 px-5 py-3 text-sm text-textSecondary" type="button" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'step1_responding' && (
          <div className="space-y-4">
            <p className="text-sm leading-7 text-textPrimary">{response}</p>
          </div>
        )}

        {step === 'step2_body' && (
          <div className="space-y-6">
            <p className="text-sm leading-7 text-textPrimary">Where are you feeling this?</p>
            <BodyMap selected={bodyLocation} onSelect={selectBodyLocation} />
            <p className="text-sm text-textSecondary">Tap a zone or speak instead.</p>
          </div>
        )}

        {step === 'step2_responding' && (
          <div className="space-y-4">
            <p className="text-sm leading-7 text-textPrimary">{response}</p>
          </div>
        )}

        {step === 'step3_underneath' && (
          <div className="space-y-4">
            <p className="text-sm leading-7 text-textPrimary">Behind the feeling from earlier, what else is there?</p>
            <div className="flex flex-col gap-3">
              <textarea
                value={fallbackText}
                onChange={(event) => setFallbackText(event.target.value)}
                placeholder="Type it here if speech is unavailable..."
                className="min-h-[120px] rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-textPrimary outline-none"
              />
              <button className="rounded-full bg-green-bright px-5 py-3 text-sm text-bg-primary" type="button" onClick={handleContinue}>
                Done
              </button>
            </div>
          </div>
        )}

        {step === 'step3_responding' && (
          <div className="space-y-4">
            <p className="text-sm leading-7 text-textPrimary">{response}</p>
          </div>
        )}

        {step === 'step4_witness' && (
          <div className="space-y-6">
            <p className="whitespace-pre-line text-lg leading-9 text-green-light">
              The part of you that just told me all this —

              is that part also {bodyLabel}?

              Or is it just... watching?
            </p>
            <button className="rounded-full bg-green-bright px-5 py-3 text-sm text-bg-primary" type="button" onClick={() => markStep4Response()}>
              I noticed it
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            <p className="text-sm leading-7 text-textPrimary">Session saved. Your words from today have been added to your garden.</p>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-green-bright px-5 py-3 text-sm text-bg-primary" type="button" onClick={handleFinish}>
                See your words →
              </button>
              <button className="rounded-full bg-white/10 px-5 py-3 text-sm text-textSecondary" type="button" onClick={onCancel}>
                Home
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
