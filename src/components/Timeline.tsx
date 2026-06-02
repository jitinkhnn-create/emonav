import type { Session } from '../types';

interface Props {
  months: Array<{ label: string; key: string; sessions: Session[] }>;
  activeMonth: string | null;
  onSelectMonth: (month: string | null) => void;
}

export default function Timeline({ months, activeMonth, onSelectMonth }: Props) {
  if (months.length === 0) {
    return <p className="text-sm text-textMuted">No sessions yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          className={`rounded-full px-3 py-2 text-xs font-medium transition ${
            activeMonth === null ? 'bg-greenBright text-bg' : 'bg-white/8 text-textSecondary hover:bg-white/12'
          }`}
          onClick={() => onSelectMonth(null)}
        >
          All
        </button>
        {months.map((month) => (
          <button
            key={month.key}
            type="button"
            className={`rounded-full px-3 py-2 text-xs font-medium transition ${
              activeMonth === month.key ? 'bg-greenBright text-bg' : 'bg-white/8 text-textSecondary hover:bg-white/12'
            }`}
            onClick={() => onSelectMonth(month.key)}
          >
            {month.label}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-4 overflow-x-auto py-2">
        {months.map((month) => (
          <div key={month.key} className="flex flex-col items-center gap-1">
            <span className="text-xs text-textSecondary">{month.sessions.length}</span>
            <div
              className={`w-6 rounded-t-sm transition-all ${
                activeMonth === month.key ? 'bg-greenBright' : 'bg-white/15'
              }`}
              style={{ height: `${Math.max(8, month.sessions.length * 16)}px` }}
            />
            <span className="text-[10px] uppercase text-textMuted">{month.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
