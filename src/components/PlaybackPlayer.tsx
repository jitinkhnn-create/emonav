import { useEffect, useRef, useState } from 'react';

interface Props {
  blobUrl: string | null;
  transcript: string;
  onHasPlayed: () => void;
}

export default function PlaybackPlayer({ blobUrl, transcript, onHasPlayed }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration);
    const onTime = () => {
      setProgress(audio.currentTime / audio.duration || 0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      if (!hasPlayed) {
        setHasPlayed(true);
        onHasPlayed();
      }
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [hasPlayed, onHasPlayed]);

  // Mark played after 5s as well
  useEffect(() => {
    if (hasPlayed) return;
    const timer = setTimeout(() => {
      setHasPlayed(true);
      onHasPlayed();
    }, 5000);
    return () => clearTimeout(timer);
  }, [hasPlayed, onHasPlayed]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      await audio.play().catch(() => {});
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Transcript */}
      <div className="rounded-xl bg-bgSecondary p-4 border border-borderSubtle max-h-40 overflow-y-auto">
        <p className="transcript-text">{transcript}</p>
      </div>

      {/* Player */}
      {blobUrl ? (
        <div className="flex flex-col gap-3">
          <audio ref={audioRef} src={blobUrl} preload="metadata" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green text-white transition-colors hover:bg-greenLight"
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 translate-x-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            {/* Progress bar */}
            <div
              className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-bgCard"
              onClick={seek}
            >
              <div
                className="h-full rounded-full bg-green transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-xs text-textMuted tabular-nums">
              {fmt(duration * progress)} / {fmt(duration)}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-textMuted">Audio recording unavailable — read your words above.</p>
      )}
    </div>
  );
}
