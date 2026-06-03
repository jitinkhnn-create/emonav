interface Props {
  transcript: string;
  howItLandsText: string;
  onContinue: () => void;
  onChange: () => void;
}

export default function ConfirmOrChange({ transcript, howItLandsText, onContinue, onChange }: Props) {
  const preview = transcript.length > 100 ? transcript.slice(0, 100) + '...' : transcript;
  // Extract the last sentence of howItLands (usually "Is this really what you want them to hear?")
  const keyLine = howItLandsText.split('. ').slice(-2).join('. ').trim() || howItLandsText;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="rounded-xl bg-bgSecondary p-4 border border-borderSubtle space-y-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-textMuted mb-1">You said</p>
          <p className="text-sm text-textPrimary italic leading-relaxed">"{preview}"</p>
        </div>
        <div className="h-px bg-borderSubtle" />
        <div>
          <p className="text-xs uppercase tracking-widest text-textMuted mb-1">How it lands</p>
          <p className="text-sm text-textSecondary leading-relaxed">{keyLine}</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="btn-primary w-full py-4 text-center text-sm"
        >
          Yes, I mean it — continue
        </button>
        <button
          type="button"
          onClick={onChange}
          className="btn-secondary w-full py-4 text-center text-sm"
        >
          I want to change what I said
        </button>
      </div>
    </div>
  );
}
