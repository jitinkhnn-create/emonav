import { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  loading: boolean;
}

export default function HowItLandsPlayer({ text, loading }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    if (!text || hasAutoPlayed.current) return;
    hasAutoPlayed.current = true;
    // Brief delay, then auto-play
    const timer = setTimeout(() => speak(), 800);
    return () => clearTimeout(timer);
  }, [text]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = () => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = 1;
    u.onstart = () => setIsPlaying(true);
    u.onend = () => setIsPlaying(false);
    u.onerror = () => setIsPlaying(false);
    utteranceRef.current = u;
    window.speechSynthesis.speak(u);
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-bgCard" />
        <div className="h-4 w-full animate-pulse rounded bg-bgCard" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-bgCard" />
        <p className="text-xs text-textMuted mt-1">Preparing...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-textPrimary" style={{ lineHeight: '1.75' }}>{text}</p>
      <button
        type="button"
        onClick={isPlaying ? stop : speak}
        className="self-start flex items-center gap-2 rounded-lg bg-bgCard border border-borderSubtle px-4 py-2 text-xs text-textSecondary hover:border-borderHover transition-colors"
      >
        {isPlaying ? (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
            Stop
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 translate-x-px">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play again
          </>
        )}
      </button>
    </div>
  );
}
