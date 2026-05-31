import type { Session, WordEntry } from '../types';

interface Props {
  entry: WordEntry;
  sessions: Session[];
}

export default function WordDetail({ entry, sessions }: Props) {
  const appearances = sessions.filter((session) => session.id === entry.sessionId);
  const firstSeen = entry.date;
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
        <p className="text-sm uppercase tracking-[0.3em] text-textDim">Word detail</p>
        <h3 className="mt-2 text-2xl font-display text-green-pale">{entry.word}</h3>
      </div>
      {entry.isIndian && entry.context && (
        <p className="text-sm text-textSecondary">
          You chose this word on {firstSeen} when you were talking about {entry.context}.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(frequencyByMonth).map(([month, count]) => (
          <p key={month} className="text-sm text-textSecondary">
            {month}: {count} time{count > 1 ? 's' : ''}
          </p>
        ))}
      </div>
      <p className="text-sm text-textSecondary">You first used this word on {firstSeen}.</p>
    </div>
  );
}
