import { callAI, PROMPTS } from './ai';
import type { Session } from '../types';

interface AnalysisResult {
  confidence: number;
  clarity: number;
  emotionalIntensity: number;
  dominantEmotions: string[];
  negativeWords: string[];
  positiveWords: string[];
  repeatedWords: string[];
}

const defaultAnalysis: AnalysisResult = {
  confidence: 5,
  clarity: 5,
  emotionalIntensity: 5,
  dominantEmotions: [],
  negativeWords: [],
  positiveWords: [],
  repeatedWords: [],
};

export async function analyzeTranscript(transcript: string): Promise<AnalysisResult> {
  try {
    const raw = await callAI(PROMPTS.analyze, `Transcript: "${transcript}"`);
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as AnalysisResult;
    return {
      confidence: clamp(parsed.confidence, 1, 10),
      clarity: clamp(parsed.clarity, 1, 10),
      emotionalIntensity: clamp(parsed.emotionalIntensity, 1, 10),
      dominantEmotions: Array.isArray(parsed.dominantEmotions) ? parsed.dominantEmotions.slice(0, 3) : [],
      negativeWords: Array.isArray(parsed.negativeWords) ? parsed.negativeWords : [],
      positiveWords: Array.isArray(parsed.positiveWords) ? parsed.positiveWords : [],
      repeatedWords: Array.isArray(parsed.repeatedWords) ? parsed.repeatedWords : [],
    };
  } catch {
    return defaultAnalysis;
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(Number(v) || min, min), max);
}

export function buildReportData(sessions: Session[], periodDays: number) {
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const confidences = sessions.map((s) => s.scores.confidence);
  const clarities = sessions.map((s) => s.scores.clarity);
  const intensities = sessions.map((s) => s.scores.emotionalIntensity);

  const wordFreq: Record<string, number> = {};
  sessions.forEach((s) => {
    [...s.wordPatterns.negativeWords, ...s.wordPatterns.positiveWords].forEach((w) => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
  });

  const trends = sessions.map((s) => ({
    date: s.createdAt.slice(0, 10),
    confidence: s.scores.confidence,
    clarity: s.scores.clarity,
    emotionalIntensity: s.scores.emotionalIntensity,
  }));

  return {
    sessions,
    periodDays,
    averageConfidence: Math.round(avg(confidences) * 10) / 10,
    averageClarity: Math.round(avg(clarities) * 10) / 10,
    averageEmotionalIntensity: Math.round(avg(intensities) * 10) / 10,
    wordFrequencyMap: wordFreq,
    trendsOverTime: trends,
  };
}
