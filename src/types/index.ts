export type BodyLocation = 'head' | 'throat' | 'chest' | 'stomach' | 'hands' | 'legs';

export type SessionStep =
  | 'idle'
  | 'step1_listening'
  | 'step1_responding'
  | 'step2_body'
  | 'step2_responding'
  | 'step3_underneath'
  | 'step3_responding'
  | 'step4_witness'
  | 'complete';

export interface IndianWord {
  word: string;
  devanagari: string;
  meaning: string;
  category: string;
}

export interface WordEntry {
  word: string;
  date: string;
  sessionId: string;
  isIndian: boolean;
  bodyLocation?: BodyLocation;
  context?: string;
}

export interface Session {
  id: string;
  date: string;
  step1Transcript: string;
  step2BodyLocation: BodyLocation | null;
  step2Words: string[];
  step3Transcript: string;
  step3Words: string[];
  step4UserResponded: boolean;
  allWordsUsed: string[];
  indianWordsOffered: IndianWord[];
  indianWordsSelected: string[];
  durationSeconds: number;
}

export interface UserData {
  name: string;
  language: 'en' | 'hi';
  sessions: Session[];
  words: WordEntry[];
  firstSessionDate: string;
}
