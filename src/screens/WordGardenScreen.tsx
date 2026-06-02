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
            <h2 className="mt-2 text-2xl font-display text-greenPale">
              {userData.sessions.length} {userData.sessions.length === 1 ? 'session' : 'sessions'}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full bg-white/8 px-4 py-2 text-sm text-textSecondary hover:bg-white/12 transition"
            onClick={onBack}
          >
            ← Home
          </button>
        </div>
      </section>

      {userData.words.length === 0 ? (
        <section className="card p-8 text-center">
          <p className="text-textSecondary text-sm leading-7">
            No words yet. Complete a session to grow your garden.
          </p>
        </section>
      ) : (
        <>
          <section className="card p-6">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-textMuted">Word garden</p>
            <WordCloud words={filteredWords} selected={selectedWord} onSelect={setSelectedWord} />
          </section>

          <section className="card p-6">
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-textMuted">Timeline</p>
            <Timeline months={months} activeMonth={activeMonth} onSelectMonth={setActiveMonth} />
          </section>

          {wordEntry && (
            <section className="card p-6">
              <WordDetail entry={wordEntry} sessions={userData.sessions} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
