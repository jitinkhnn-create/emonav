interface Props {
  active: boolean;
}

export default function ListeningIndicator({ active }: Props) {
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <span className={`absolute inset-0 rounded-full border border-green-bright/30 ${active ? 'animate-pulse' : ''}`} />
      <span className={`absolute inset-5 rounded-full border border-green-bright/20 ${active ? 'animate-pulse delay-150' : ''}`} />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-green-deep text-sm text-green-pale">
        {active ? 'Listening' : 'Ready'}
      </span>
    </div>
  );
}
