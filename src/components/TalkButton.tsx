interface Props {
  onClick: () => void;
  disabled?: boolean;
}

export default function TalkButton({ onClick, disabled = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 text-sm font-medium text-greenPale shadow-lg transition-all duration-300
        ${disabled
          ? 'border-greenMid bg-greenDeep opacity-50 cursor-not-allowed'
          : 'border-greenBright bg-gradient-to-br from-greenDeep to-greenMid hover:scale-[1.05] hover:border-greenGlow'
        }`}
      aria-label="Start talk session"
    >
      <span className="text-base font-medium text-greenPale">Talk</span>
      {!disabled && (
        <span className="pointer-events-none absolute inset-0 rounded-full animate-pulse opacity-30 bg-greenMid" />
      )}
    </button>
  );
}
