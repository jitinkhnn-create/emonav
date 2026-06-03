export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  durationSeconds: number;

  transcript: string;
  audioUrl: string; // Blob URL — local only, not persisted

  howItLandsText: string;

  didChange: boolean;
  changeCount: number;

  calmingTechniqueShown: string;

  scores: {
    confidence: number;
    clarity: number;
    emotionalIntensity: number;
  };
  dominantEmotions: string[];
  wordPatterns: {
    negativeWords: string[];
    positiveWords: string[];
    repeatedWords: string[];
  };
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: string;
  totalSessions: number;
}

export interface ReportData {
  sessions: Session[];
  periodDays: number;
  averageConfidence: number;
  averageClarity: number;
  averageEmotionalIntensity: number;
  wordFrequencyMap: Record<string, number>;
  trendsOverTime: {
    date: string;
    confidence: number;
    clarity: number;
    emotionalIntensity: number;
  }[];
}
