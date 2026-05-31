import { useCallback, useState } from 'react';
import type { WordEntry, Session, UserData, IndianWord } from '../types';
import { extractEmotionWords } from '../services/wordExtractor';

const STORAGE_KEY = 'emonav_user';

export function useWordTracker(initialData: UserData) {
  const [data, setData] = useState<UserData>(initialData);

  const saveSession = useCallback((session: Session, transcripts: string[], selectedIndianWords: string[], context: string) => {
    const allWords = transcripts.flatMap((text) => extractEmotionWords(text));
    const sessionWords: WordEntry[] = allWords.map((word) => ({
      word,
      date: new Date().toISOString().slice(0, 10),
      sessionId: session.id,
      isIndian: selectedIndianWords.includes(word),
      bodyLocation: session.step2BodyLocation ?? undefined,
      context: selectedIndianWords.includes(word) ? context : undefined
    }));

    const nextWords = [...sessionWords, ...data.words].slice(0, 2000);
    const nextSessions = [session, ...data.sessions].slice(0, 100);

    const next: UserData = {
      ...data,
      sessions: nextSessions,
      words: nextWords,
      firstSessionDate: data.firstSessionDate || session.date
    };

    setData(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }, [data]);

  return {
    data,
    saveSession
  };
}
