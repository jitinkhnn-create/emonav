import type { BodyLocation } from '../types';

interface Props {
  selected: BodyLocation | null;
  onSelect: (location: BodyLocation) => void;
}

const zones: Array<{ location: BodyLocation; label: string; top: string; left: string }> = [
  { location: 'head', label: 'Head', top: '8%', left: '50%' },
  { location: 'throat', label: 'Throat', top: '27%', left: '50%' },
  { location: 'chest', label: 'Chest', top: '46%', left: '50%' },
  { location: 'stomach', label: 'Stomach', top: '65%', left: '50%' },
  { location: 'hands', label: 'Hands', top: '56%', left: '14%' }
];

export default function BodyMap({ selected, onSelect }: Props) {
  return (
    <div className="relative mx-auto h-[320px] w-full max-w-xs">
      <svg viewBox="0 0 180 320" className="h-full w-full" aria-hidden="true">
        {/* Head */}
        <path d="M90 10c-14 0-25 11-25 25v25c0 14 11 25 25 25s25-11 25-25V35c0-14-11-25-25-25Z" fill="rgba(74,175,133,0.12)" stroke="rgba(74,175,133,0.3)" strokeWidth="1" />
        {/* Torso outline */}
        <path d="M45 90c0 40 30 70 45 70s45-30 45-70" stroke="rgba(74,175,133,0.25)" strokeWidth="3" fill="none" />
        {/* Lower body */}
        <path d="M55 170c0 45 70 45 70 0v80c0 10-8 18-18 18H73c-10 0-18-8-18-18v-80Z" fill="rgba(74,175,133,0.08)" stroke="rgba(74,175,133,0.2)" strokeWidth="1" />
        {/* Arm lines */}
        <path d="M35 190c15 10 34 12 54 12s39-2 54-12" stroke="rgba(74,175,133,0.25)" strokeWidth="2" fill="none" />
      </svg>
      {zones.map((zone) => (
        <button
          key={zone.location}
          type="button"
          onClick={() => onSelect(zone.location)}
          className={`absolute -translate-x-1/2 rounded-full border px-3 py-2 text-xs font-medium transition-all duration-200
            ${selected === zone.location
              ? 'border-greenBright bg-greenDeep text-greenPale ring-2 ring-greenBright/40'
              : 'border-greenBright/30 bg-white/6 text-textSecondary hover:bg-greenDeep/60 hover:border-greenBright/60 hover:text-textPrimary'
            }`}
          style={{ top: zone.top, left: zone.left }}
        >
          {zone.label}
        </button>
      ))}
    </div>
  );
}
