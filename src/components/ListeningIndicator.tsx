interface Props {
  active: boolean;
}

export default function ListeningIndicator({ active }: Props) {
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <span
        className={`absolute inset-0 rounded-full border border-greenBright/40 ${active ? 'animate-pulse' : 'opacity-40'}`}
      />
      <span
        className={`absolute inset-5 rounded-full border border-greenBright/25 ${active ? 'animate-pulse' : 'opacity-30'}`}
        style={{ animationDelay: '150ms' }}
      />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-greenDeep border border-greenMid">
        <span className="text-sm font-medium text-greenPale">
          {active ? 'Listening' : 'Ready'}
        </span>
      </span>
    </div>
  );
}
