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

  const handleStart = () => {
    if (isFirstTime) {
      if (name.trim()) {
        onSaveSettings(name.trim(), language);
      }
    } else {
      onStartSession();
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="space-y-6">

        {/* Header */}
        <section className="card p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-textMuted">{greeting}</p>
          <h1 className="mt-3 text-3xl font-display text-greenPale">EmoNav</h1>
          <p className="mt-3 text-sm leading-7 text-textSecondary">
            A quiet companion for noticing your feelings and building a personal word mirror.
          </p>
        </section>

        {/* Daily riddle */}
        <DailyRiddle riddle={todayRiddle} />

        {/* First-time setup — collect name before starting */}
        {isFirstTime && (
          <section className="card p-6 space-y-4">
            <p className="text-sm font-medium text-textPrimary">What should I call you?</p>
            <input
              className="w-full rounded-2xl border border-white/14 bg-white/6 px-4 py-3 text-sm text-textPrimary placeholder:text-textMuted outline-none focus:border-greenBright/60"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <div className="flex gap-3">
              {languages.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    language === option.value
                      ? 'bg-greenBright text-bg'
                      : 'bg-white/8 text-textSecondary hover:bg-white/12'
                  }`}
                  onClick={() => setLanguage(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Talk button */}
        <section className="card p-6 flex flex-col items-center gap-4">
          <TalkButton onClick={handleStart} disabled={isFirstTime && !name.trim()} />
          <p className="text-xs uppercase tracking-[0.3em] text-textMuted">
            {isFirstTime ? 'enter your name above, then tap' : 'tap to begin'}
          </p>
        </section>

        {/* Return user — show session count */}
        {!isFirstTime && (
          <section className="card p-6">
            <button
              type="button"
              className="w-full rounded-full bg-white/6 px-5 py-4 text-sm font-medium text-textPrimary ring-1 ring-white/12 transition hover:bg-white/10"
              onClick={onShowWords}
            >
              My words · {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
            </button>
          </section>
        )}

      </div>
    </div>
  );
}
