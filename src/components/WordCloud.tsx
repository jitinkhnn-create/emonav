import type { WordEntry } from '../types';

interface Props {
  words: WordEntry[];
  selected: string | null;
  onSelect: (word: string) => void;
}

const sizeFromCount = (count: number) => 12 + Math.min(14, count * 2);

export default function WordCloud({ words, selected, onSelect }: Props) {
  const frequency = words.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.word] = (acc[entry.word] || 0) + 1;
    return acc;
  }, {});

  const unique = Array.from(
    new Map(words.map((entry) => [entry.word, entry])).values()
  );

  if (unique.length === 0) {
    return <p className="text-sm text-textMuted text-center py-4">No words yet.</p>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {unique.map((entry) => {
        const count = frequency[entry.word] || 1;
        const isNew = Date.now() - new Date(entry.date).getTime() < 1000 * 60 * 60 * 24 * 60;
        return (
          <button
            key={entry.word}
            type="button"
            className={`rounded-full border px-3 py-1.5 transition-all duration-200 ${
              selected === entry.word
                ? 'border-greenBright bg-greenBright/15 text-greenPale'
                : 'border-white/14 bg-white/6 text-textPrimary hover:border-greenBright/40 hover:bg-white/10'
            }`}
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
