interface Props {
  onHome: () => void;
}

export default function SessionComplete({ onHome }: Props) {
  return (
    <div className="flex flex-col items-center gap-8 py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-greenDim flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8 text-green">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-display text-textPrimary">Session saved.</h2>
        <p className="text-sm text-textSecondary">Take care of yourself.</p>
      </div>
      <button type="button" onClick={onHome} className="btn-primary px-8 py-3">
        Go home
      </button>
    </div>
  );
}
