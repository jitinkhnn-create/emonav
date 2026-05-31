interface Props {
  riddle: string;
}

export default function DailyRiddle({ riddle }: Props) {
  return (
    <section className="card p-6 border border-white/10">
      <p className="text-xs uppercase tracking-[0.3em] text-textMuted">today's riddle</p>
      <p className="mt-4 text-sm italic leading-7 text-green-text">{riddle}</p>
    </section>
  );
}
