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
    listenerPerspective,
    listenerPerspectiveLoading,
    selectedWords,
    indianWordOffer,
    stepLabel,
    startListening,
    stopListening,
    proceedToBodyStep,
    fetchListenerPerspective,
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
      // Do NOT auto-advance — let the user tap Done so they can hear it back first
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
              <div className="w-full space-y-2">
                <p className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-textPrimary">
                  {fallbackText}
                </p>
                <button
                  type="button"
                  onClick={() => speak(fallbackText)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-white/6 px-4 py-2 text-xs text-textSecondary hover:bg-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                  </svg>
                  Hear it back
                </button>
              </div>
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
          <div className="space-y-5 pt-2">
            {/* AI mirror response */}
            <p className="text-sm leading-7 text-textPrimary">{response}</p>

            {/* Hear back your own words */}
            {fallbackText && (
              <button
                type="button"
                onClick={() => speak(fallbackText)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white/6 px-4 py-2 text-xs text-textSecondary hover:bg-white/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                </svg>
                Hear your words back
              </button>
            )}

            {/* Listener perspective — loads automatically */}
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4 space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-textMuted">How might this have sounded to them?</p>
              {listenerPerspectiveLoading && !listenerPerspective ? (
                <p className="text-xs text-textMuted animate-pulse">Thinking...</p>
              ) : listenerPerspective ? (
                <div className="space-y-2">
                  <p className="text-sm leading-7 text-textPrimary">{listenerPerspective}</p>
                  <button
                    type="button"
                    onClick={() => speak(listenerPerspective)}
                    className="flex items-center gap-2 text-xs text-textMuted hover:text-textSecondary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                    </svg>
                    Hear it
                  </button>
                </div>
              ) : null}
            </div>

            {/* Advance to next step */}
            <button
              type="button"
              onClick={proceedToBodyStep}
              className="rounded-full bg-greenBright px-5 py-3 text-sm font-medium text-bg"
            >
              Continue →
            </button>
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
              {fallbackText.trim() && (
                <button
                  type="button"
                  onClick={() => speak(fallbackText)}
                  className="flex items-center justify-center gap-2 rounded-full bg-white/6 px-4 py-2 text-xs text-textSecondary hover:bg-white/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                  </svg>
                  Hear it back
                </button>
              )}
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
