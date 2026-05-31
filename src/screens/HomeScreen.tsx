import { useMemo, useState } from 'react';
import type { UserData } from '../types';
import { riddles } from '../data/riddles';
import DailyRiddle from '../components/DailyRiddle';
import TalkButton from '../components/TalkButton';

interface Props {
  userData: UserData;
  sessionCount: number;
  onStartSession: () => void;
  onShowWords: () => void;
  onSaveSettings: (name: string, language: 'en' | 'hi') => void;
  isFirstTime: boolean;
}

const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' }
] as const;

export default function HomeScreen({ userData, sessionCount, onStartSession, onShowWords, onSaveSettings, isFirstTime }: Props) {
  const [name, setName] = useState(userData.name || '');
  const [language, setLanguage] = useState<'en' | 'hi'>(userData.language);

  const todayRiddle = useMemo(() => {
    return riddles[new Date().getDate() % riddles.length];
  }, []);

  const greeting = userData.name ? `Welcome back, ${userData.name}` : 'Hello';

  return (
    <div className="mx-auto max-w-xl">
      <div className="space-y-6">
        <section className="card p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-textMuted">{greeting}</p>
          <h1 className="mt-4 text-3xl font-display text-green-pale">EmoNav</h1>
          <p className="mt-3 text-sm leading-7 text-textSecondary">
            A quiet companion for noticing your feelings and building a personal word mirror.
          </p>
        </section>

        <DailyRiddle riddle={todayRiddle} />

        <section className="card p-6 flex flex-col items-center gap-4">
          <TalkButton onClick={onStartSession} />
          <p className="text-xs uppercase tracking-[0.3em] text-textMuted">tap to begin</p>
        </section>

        {isFirstTime && (
          <section className="card p-6 space-y-4">
            <p className="text-sm text-textSecondary">What should I call you?</p>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-textPrimary outline-none focus:border-green-bright"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
            />
            <div className="flex gap-3">
              {languages.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm ${language === option.value ? 'bg-green-bright text-bg-primary' : 'bg-white/5 text-textSecondary'}`}
                  onClick={() => setLanguage(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-green-bright px-4 py-3 text-sm font-semibold text-bg-primary"
              onClick={() => {
                if (name.trim()) onSaveSettings(name.trim(), language);
              }}
            >
              Start
            </button>
          </section>
        )}

        {!isFirstTime && (
          <section className="card p-6 flex flex-col gap-4">
            <button
              type="button"
              className="w-full rounded-full bg-white/5 px-5 py-4 text-sm font-semibold text-textPrimary ring-1 ring-white/10 transition hover:bg-white/10"
              onClick={onShowWords}
            >
              My words · {sessionCount} sessions
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
