interface Props {
  onClick: () => void;
}

export default function TalkButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-deep to-green-mid border-2 border-green-bright text-sm font-medium text-green-pale shadow-[0_0_0_0_rgba(87,181,141,0.35)] transition-all duration-300 hover:scale-[1.05] hover:border-green-glow"
      aria-label="Start talk session"
    >
      Talk
      <span className="pointer-events-none absolute inset-0 rounded-full animate-pulse" />
    </button>
  );
}
