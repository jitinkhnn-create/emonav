import type { Session } from '../types';

interface Props {
  months: Array<{ label: string; key: string; sessions: Session[] }>;
  activeMonth: string | null;
  onSelectMonth: (month: string | null) => void;
}

export default function Timeline({ months, activeMonth, onSelectMonth }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          className={`rounded-full px-3 py-2 text-xs ${activeMonth === null ? 'bg-green-bright text-bg-primary' : 'bg-white/5 text-textSecondary'}`}
          onClick={() => onSelectMonth(null)}
        >
          All
        </button>
        {months.map((month) => (
          <button
            key={month.key}
            type="button"
            className={`rounded-full px-3 py-2 text-xs ${activeMonth === month.key ? 'bg-green-bright text-bg-primary' : 'bg-white/5 text-textSecondary'}`}
            onClick={() => onSelectMonth(month.key)}
          >
            {month.label}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2 overflow-x-auto py-2">
        {months.map((month) => (
          <div key={month.key} className="flex flex-col items-center gap-2">
            {month.sessions.map((session) => (
              <div
                key={session.id}
                className={`h-12 w-1 rounded-full ${activeMonth === month.key ? 'bg-green-bright' : 'bg-white/10'}`}
              />
            ))}
            <span className="text-[10px] uppercase text-textDim">{month.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
