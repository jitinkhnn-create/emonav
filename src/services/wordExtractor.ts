import { emotionWords } from '../data/emotionWords';
import { indianVocabulary } from '../data/indianVocabulary';

const englishWords = emotionWords.map((item) => item.word.toLowerCase());
const indianWords = indianVocabulary.map((item) => item.word.toLowerCase());

export function extractEmotionWords(transcript: string): string[] {
  const normalized = transcript.toLowerCase();
  const tokens = normalized.split(/[^\p{Letter}]+/u).filter(Boolean);
  const matched = new Set<string>();

  for (const token of tokens) {
    if (englishWords.includes(token) || indianWords.includes(token)) {
      matched.add(token);
    }
  }

  if (matched.size === 0) {
    const adjectives = tokens.filter((token) => token.length > 4 && !['really', 'always', 'never', 'maybe', 'often'].includes(token));
    adjectives.slice(0, 3).forEach((word) => matched.add(word));
  }

  return Array.from(matched);
}
