import type { BodyLocation } from '../types';

interface Props {
  selected: BodyLocation | null;
  onSelect: (location: BodyLocation) => void;
}

const zones: Array<{ location: BodyLocation; label: string; top: string; left: string }> = [
  { location: 'head', label: 'Head', top: '10%', left: '50%' },
  { location: 'throat', label: 'Throat', top: '30%', left: '50%' },
  { location: 'chest', label: 'Chest', top: '50%', left: '50%' },
  { location: 'stomach', label: 'Stomach', top: '68%', left: '50%' },
  { location: 'hands', label: 'Hands', top: '58%', left: '18%' }
];

export default function BodyMap({ selected, onSelect }: Props) {
  return (
    <div className="relative mx-auto h-[320px] w-full max-w-xs">
      <svg viewBox="0 0 180 320" className="h-full w-full" aria-hidden="true">
        <path d="M90 10c-14 0-25 11-25 25v25c0 14 11 25 25 25s25-11 25-25V35c0-14-11-25-25-25Z" fill="rgba(255,255,255,0.08)" />
        <path d="M45 90c0 40 30 70 45 70s45-30 45-70" stroke="rgba(255,255,255,0.12)" strokeWidth="4" fill="none" />
        <path d="M55 170c0 45 70 45 70 0v80c0 10-8 18-18 18H73c-10 0-18-8-18-18v-80Z" fill="rgba(255,255,255,0.06)" />
        <path d="M35 190c15 10 34 12 54 12s39-2 54-12" stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
      </svg>
      {zones.map((zone) => (
        <button
          key={zone.location}
          type="button"
          onClick={() => onSelect(zone.location)}
          className={`absolute -translate-x-1/2 rounded-full border border-green-bright/30 bg-white/5 p-3 text-[10px] text-textPrimary transition ${selected === zone.location ? 'bg-green-bright/20 ring-2 ring-green-bright/30' : 'hover:bg-white/10'}`}
          style={{ top: zone.top, left: zone.left }}
        >
          {zone.label}
        </button>
      ))}
    </div>
  );
}
