import { useState } from 'react';

interface Props {
  text: string;
  loading: boolean;
  onDone: () => void;
}

export default function CalmingScreen({ text, loading, onDone }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = () => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88;
    u.pitch = 0.95;
    u.onstart = () => setIsPlaying(true);
    u.onend = () => setIsPlaying(false);
    u.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(u);
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="h-4 w-full animate-pulse rounded bg-bgCard" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-bgCard" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-bgCard" />
        <div className="h-4 w-full animate-pulse rounded bg-bgCard" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-bgCard" />
      </div>
    );
  }

  const paragraphs = text.split('\n').filter((p) => p.trim());

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="text-sm leading-relaxed text-textPrimary fade-in"
            style={{ animationDelay: `${i * 0.3}s`, opacity: 0, animationFillMode: 'forwards', animationName: 'fadeInUp', animationDuration: '0.5s' }}
          >
            {p}
          </p>
        ))}
      </div>

      {/* Optional TTS */}
      <button
        type="button"
        onClick={isPlaying ? stopSpeaking : speak}
        className="self-start flex items-center gap-2 text-xs text-textMuted hover:text-textSecondary transition-colors"
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
            Read aloud
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onDone}
        className="btn-primary w-full py-4"
      >
        Done
      </button>
    </div>
  );
}
