import { useEffect, useRef, useState } from 'react';

interface Props {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  canStop: boolean; // false during first 3s
}

export default function VoiceRecorder({
  isRecording,
  transcript,
  interimTranscript,
  error,
  onStart,
  onStop,
  canStop,
}: Props) {
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
        <div className="text-4xl">🎤</div>
        <p className="text-sm text-textSecondary leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Mic button */}
      <div className="relative flex items-center justify-center">
        {isRecording && (
          <>
            <span className="record-pulse absolute inset-0 rounded-full" />
          </>
        )}
        <button
          type="button"
          onClick={isRecording ? undefined : onStart}
          disabled={isRecording}
          className={`relative z-10 flex h-[72px] w-[72px] items-center justify-center rounded-full transition-all active:scale-95 ${
            isRecording
              ? 'bg-recordingRed shadow-lg shadow-recordingRed/30 cursor-default'
              : 'bg-bgCard border border-borderSubtle hover:border-borderHover cursor-pointer'
          }`}
          aria-label={isRecording ? 'Recording' : 'Start recording'}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={`h-7 w-7 ${isRecording ? 'text-white' : 'text-textSecondary'}`}>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h-3v2h8v-2h-3v-2.06A9 9 0 0 0 21 12v-2h-2Z" />
          </svg>
        </button>
      </div>

      {/* Status */}
      <p className={`text-sm font-medium ${isRecording ? 'text-recordingRed' : 'text-textMuted'}`}>
        {isRecording ? 'Recording...' : 'Tap to start'}
      </p>

      {/* Live transcript */}
      {isRecording && (
        <div
          ref={transcriptRef}
          className="w-full max-h-48 overflow-y-auto rounded-xl bg-bgSecondary p-4 border border-borderSubtle"
        >
          {transcript || interimTranscript ? (
            <p className="transcript-text">
              <span>{transcript}</span>
              {interimTranscript && (
                <span className="text-textMuted"> {interimTranscript}</span>
              )}
            </p>
          ) : (
            <p className="text-textMuted text-sm">Say something...</p>
          )}
        </div>
      )}

      {/* Stop button */}
      {isRecording && (
        <button
          type="button"
          onClick={onStop}
          disabled={!canStop}
          className="flex items-center gap-2 rounded-xl bg-bgCard border border-borderSubtle px-6 py-3 text-sm font-medium text-textSecondary disabled:opacity-40 transition-all active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
          Stop
        </button>
      )}
    </div>
  );
}
