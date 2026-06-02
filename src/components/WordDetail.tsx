import type { Session, WordEntry } from '../types';

interface Props {
  entry: WordEntry;
  sessions: Session[];
}

export default function WordDetail({ entry, sessions }: Props) {
  const frequencyByMonth = sessions.reduce<Record<string, number>>((acc, session) => {
    if (session.step1Transcript.includes(entry.word) || session.step3Transcript.includes(entry.word)) {
      const month = session.date.slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-textMuted">Word detail</p>
        <h3 className="mt-2 text-2xl font-display text-greenPale">{entry.word}</h3>
      </div>
      {entry.context && (
        <p className="text-sm leading-6 text-textSecondary">
          First used on {entry.date} — &ldquo;{entry.context}&rdquo;
        </p>
      )}
      {Object.keys(frequencyByMonth).length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(frequencyByMonth).map(([month, count]) => (
            <p key={month} className="text-sm text-textSecondary">
              {month}: {count} time{count !== 1 ? 's' : ''}
            </p>
          ))}
        </div>
      )}
      <p className="text-xs text-textMuted">First used on {entry.date}.</p>
    </div>
  );
}
