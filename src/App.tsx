import { useMemo, useState } from 'react';
import type { UserData, Session } from './types';
import HomeScreen from './screens/HomeScreen';
import SessionScreen from './screens/SessionScreen';
import WordGardenScreen from './screens/WordGardenScreen';
import { indianVocabulary } from './data/indianVocabulary';
import { extractEmotionWords } from './services/wordExtractor';
import { loadUserData, saveUserData } from './utils/storage';

const STORAGE_KEY = 'emonav_user';

const defaultUserData: UserData = {
  name: '',
  language: 'en',
  firstSessionDate: '',
  sessions: [],
  words: []
};

function App() {
  const [userData, setUserData] = useState<UserData>(() => loadUserData(STORAGE_KEY) ?? defaultUserData);
  const [screen, setScreen] = useState<'home' | 'session' | 'words'>('home');
  const [pendingSession, setPendingSession] = useState<Session | null>(null);

  const sessionCount = userData.sessions.length;

  const updateAndSave = (next: UserData) => {
    setUserData(next);
    saveUserData(STORAGE_KEY, next);
  };

  const handleSaveSettings = (name: string, language: 'en' | 'hi') => {
    const next = {
      ...userData,
      name,
      language,
      firstSessionDate: userData.firstSessionDate || new Date().toISOString().slice(0, 10)
    };
    updateAndSave(next);
  };

  const handleSaveSession = (session: Session) => {
    const wordCandidates = extractEmotionWords(`${session.step1Transcript} ${session.step3Transcript}`);
    const indianSet = new Set(indianVocabulary.map((item) => item.word));
    const entries = wordCandidates.map((word) => ({
      word,
      date: session.date,
      sessionId: session.id,
      isIndian: indianSet.has(word),
      context: session.step1Transcript.slice(0, 100)
    }));

    const sessions = [session, ...userData.sessions].slice(0, 100);
    const words = [...entries, ...userData.words].slice(0, 2000);

    const next: UserData = {
      ...userData,
      sessions,
      words,
      firstSessionDate: userData.firstSessionDate || session.date
    };
    updateAndSave(next);
    setPendingSession(session);
    setScreen('home');
  };

  const currentName = userData.name || 'Friend';
  const isFirstTime = !userData.name;

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      {screen === 'home' && (
        <HomeScreen
          userData={userData}
          sessionCount={sessionCount}
          onStartSession={() => setScreen('session')}
          onShowWords={() => setScreen('words')}
          onSaveSettings={handleSaveSettings}
          isFirstTime={isFirstTime}
        />
      )}

      {screen === 'session' && (
        <SessionScreen
          language={userData.language}
          name={currentName}
          onComplete={handleSaveSession}
          onCancel={() => setScreen('home')}
        />
      )}

      {screen === 'words' && (
        <WordGardenScreen
          userData={userData}
          onBack={() => setScreen('home')}
        />
      )}
    </div>
  );
}

export default App;
