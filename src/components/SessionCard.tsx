import { useState } from 'react';
import type { Session } from '../types';
import { formatDateTime, formatDuration } from '../utils/formatters';

interface Props {
  session: Session;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 w-[60px] rounded-full bg-bgCard overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${(value / 10) * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function SessionCard({ session }: Props) {
  const [expanded, setExpanded] = useState(false);
  const preview = session.transcript.slice(0, 80) + (session.transcript.length > 80 ? '...' : '');

  return (
    <button
      type="button"
      onClick={() => setExpanded((e) => !e)}
      className="w-full text-left card p-4 space-y-3 transition-colors hover:bg-bgCardHover"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-textMuted">{formatDateTime(session.createdAt)}</p>
          <p className="text-xs text-textMuted mt-0.5">{formatDuration(session.durationSeconds)}</p>
        </div>
        {session.changeCount > 0 && (
          <span className="rounded-full bg-greenDim border border-green/20 px-2 py-0.5 text-[10px] text-green flex-shrink-0">
            Revised {session.changeCount}×
          </span>
        )}
      </div>

      {/* Scores */}
      <div className="flex gap-3 items-center">
        <ScoreBar value={session.scores.confidence} color="#2D8A5E" />
        <ScoreBar value={session.scores.clarity} color="#3A7BD5" />
        <ScoreBar value={session.scores.emotionalIntensity} color="#D4953A" />
      </div>

      {/* Preview */}
      <p className="text-sm text-textSecondary leading-relaxed">{preview}</p>

      {/* Expanded */}
      {expanded && (
        <div className="pt-3 border-t border-borderSubtle space-y-3">
          <p className="text-sm text-textPrimary leading-relaxed">{session.transcript}</p>
          {session.dominantEmotions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {session.dominantEmotions.map((e) => (
                <span key={e} className="rounded-full bg-bgCard border border-borderSubtle px-2 py-0.5 text-xs text-textMuted">{e}</span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Confidence', value: session.scores.confidence, color: '#2D8A5E' },
              { label: 'Clarity', value: session.scores.clarity, color: '#3A7BD5' },
              { label: 'Intensity', value: session.scores.emotionalIntensity, color: '#D4953A' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-bgSecondary p-2">
                <p className="text-base font-medium" style={{ color }}>{value}/10</p>
                <p className="text-[10px] text-textMuted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}
