import type { Session } from '../types';

interface Props {
  sessions: Session[];
}

export default function WordChangeTracker({ sessions }: Props) {
  if (sessions.length < 2) {
    return (
      <p className="text-sm text-textMuted">More sessions will reveal your word patterns.</p>
    );
  }

  const half = Math.floor(sessions.length / 2);
  const older = sessions.slice(half);
  const recent = sessions.slice(0, half);

  const freq = (ss: Session[], key: 'negativeWords' | 'positiveWords') => {
    const map: Record<string, number> = {};
    ss.forEach((s) => s.wordPatterns[key].forEach((w) => { map[w] = (map[w] || 0) + 1; }));
    return map;
  };

  const olderNeg = freq(older, 'negativeWords');
  const recentNeg = freq(recent, 'negativeWords');
  const olderPos = freq(older, 'positiveWords');
  const recentPos = freq(recent, 'positiveWords');

  const disappeared = Object.keys(olderNeg).filter((w) => !recentNeg[w]).slice(0, 6);
  const appeared = Object.keys(recentNeg).filter((w) => !olderNeg[w]).slice(0, 6);
  const newPositive = Object.keys(recentPos).filter((w) => !olderPos[w]).slice(0, 6);

  const allRepeated = Array.from(
    new Set(sessions.flatMap((s) => s.wordPatterns.repeatedWords))
  ).slice(0, 8);

  return (
    <div className="space-y-5">
      {disappeared.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-textMuted mb-2">Words you used to say more</p>
          <div className="flex flex-wrap gap-2">
            {disappeared.map((w) => (
              <span key={w} className="rounded-full bg-coralDim border border-coral/20 px-3 py-1 text-xs text-coral">{w}</span>
            ))}
          </div>
        </div>
      )}
      {newPositive.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-textMuted mb-2">New words appearing</p>
          <div className="flex flex-wrap gap-2">
            {newPositive.map((w) => (
              <span key={w} className="rounded-full bg-greenDim border border-green/20 px-3 py-1 text-xs text-green">{w}</span>
            ))}
          </div>
        </div>
      )}
      {appeared.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-textMuted mb-2">Recurring harsh words</p>
          <div className="flex flex-wrap gap-2">
            {appeared.map((w) => (
              <span key={w} className="rounded-full bg-bgCard border border-borderSubtle px-3 py-1 text-xs text-textSecondary">{w}</span>
            ))}
          </div>
        </div>
      )}
      {allRepeated.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-textMuted mb-2">Words you keep repeating</p>
          <div className="flex flex-wrap gap-2">
            {allRepeated.map((w) => (
              <span key={w} className="rounded-full bg-amberDim border border-amber/20 px-3 py-1 text-xs text-amber">{w}</span>
            ))}
          </div>
        </div>
      )}
      {disappeared.length === 0 && newPositive.length === 0 && appeared.length === 0 && allRepeated.length === 0 && (
        <p className="text-sm text-textMuted">Patterns will emerge after more sessions.</p>
      )}
    </div>
  );
}
