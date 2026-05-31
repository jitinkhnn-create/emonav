interface Props {
  step: string;
}

export default function StepIndicator({ step }: Props) {
  return (
    <div className="mb-4 text-xs uppercase tracking-[0.35em] text-textDim">{step}</div>
  );
}
