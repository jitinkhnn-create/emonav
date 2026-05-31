import { useMemo, useState } from 'react';
import type { UserData, WordEntry } from '../types';
import WordCloud from '../components/WordCloud';
import Timeline from '../components/Timeline';
import WordDetail from '../components/WordDetail';
import { groupByMonth } from '../utils/dateUtils';

interface Props {
  userData: UserData;
  onBack: () => void;
}

export default function WordGardenScreen({ userData, onBack }: Props) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  const months = useMemo(() => groupByMonth(userData.sessions), [userData.sessions]);

  const filteredWords = useMemo(() => {
    if (!activeMonth) return userData.words;
    return userData.words.filter((entry) => entry.date.startsWith(activeMonth));
  }, [activeMonth, userData.words]);

  const wordEntry = useMemo(() => {
    if (!selectedWord) return null;
    return filteredWords.find((entry) => entry.word === selectedWord) ?? null;
  }, [filteredWords, selectedWord]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-textMuted">Your words</p>
            <h2 className="mt-2 text-2xl font-display text-green-pale">
              Your words · {userData.sessions.length} sessions
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full bg-white/5 px-4 py-2 text-sm text-textSecondary"
            onClick={onBack}
          >
            Home
          </button>
        </div>
      </section>

      <section className="card p-6">
        <WordCloud words={filteredWords} selected={selectedWord} onSelect={setSelectedWord} />
      </section>

      <section className="card p-6">
        <Timeline months={months} activeMonth={activeMonth} onSelectMonth={setActiveMonth} />
      </section>

      {wordEntry && (
        <section className="card p-6">
          <WordDetail entry={wordEntry} sessions={userData.sessions} />
        </section>
      )}
    </div>
  );
}
