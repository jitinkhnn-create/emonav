import type { WordEntry } from '../types';

interface Props {
  words: WordEntry[];
  selected: string | null;
  onSelect: (word: string) => void;
}

const sizeFromCount = (count: number) => 10 + Math.min(16, count * 2);

export default function WordCloud({ words, selected, onSelect }: Props) {
  const frequency = words.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.word] = (acc[entry.word] || 0) + 1;
    return acc;
  }, {});

  const unique = Array.from(
    new Map(words.map((entry) => [entry.word, entry])).values()
  );

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {unique.map((entry) => {
        const count = frequency[entry.word] || 1;
        const isNew = new Date().getTime() - new Date(entry.date).getTime() < 1000 * 60 * 60 * 24 * 60;
        return (
          <button
            key={entry.word}
            type="button"
            className={`rounded-full border px-3 py-1 text-sm transition ${selected === entry.word ? 'border-green-bright bg-green-bright/15 text-green-pale' : 'border-white/10 bg-white/5 text-textPrimary'}`}
            style={{ fontSize: `${sizeFromCount(count)}px` }}
            onClick={() => onSelect(entry.word)}
          >
            {entry.word}
            {isNew ? ' ✦' : ''}
          </button>
        );
      })}
    </div>
  );
}
