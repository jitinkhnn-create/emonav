import { useEffect, useRef, useState } from 'react';

export interface SpeechResult {
  transcript: string;
  error?: string;
  isListening: boolean;
}

export interface SpeechRecognitionOptions {
  language: string;
  onResult?: (transcript: string) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

export default function useSpeechRecognition(options: SpeechRecognitionOptions) {
  const { language, onResult, onError, onEnd } = options;
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0]?.transcript?.trim() || '';
      setTranscript(transcript);
      onResult?.(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const message = event.error || 'Speech recognition error.';
      setError(message);
      onError?.(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      onEnd?.();
    };

    recognitionRef.current = recognition;
  }, [language, onEnd, onError, onResult]);

  const start = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setError('Speech recognition unavailable.');
      return;
    }

    try {
      recognition.start();
      setTranscript('');
      setError(undefined);
      setIsListening(true);
    } catch (err) {
      setError('Unable to start recognition.');
    }
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return {
    transcript,
    error,
    isListening,
    start,
    stop,
    supported: typeof (window as any).SpeechRecognition !== 'undefined' || typeof (window as any).webkitSpeechRecognition !== 'undefined'
  };
}
