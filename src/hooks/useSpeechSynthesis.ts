import { useCallback } from 'react';

export default function useSpeechSynthesis() {
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text.trim()) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.onend = () => resolve();

      const voices = window.speechSynthesis.getVoices();
      const female = voices.find((voice) => /female|woman|girl/i.test(voice.name));
      if (female) {
        utterance.voice = female;
      }

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  return { speak };
}
