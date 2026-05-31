import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BodyLocation, SessionStep, Session, IndianWord } from '../types';
import { indianVocabulary } from '../data/indianVocabulary';
import { getAIResponse } from '../services/ai';
import { extractEmotionWords } from '../services/wordExtractor';

const bodyOptions: Record<BodyLocation, { label: string; suggestions: string[]; indian: IndianWord }> = {
  head: {
    label: 'Head',
    suggestions: ['confused', 'overthinking', 'pressure'],
    indian: { word: 'avaraodh', devanagari: 'अवरोध', meaning: 'a block or resistance in how you feel', category: 'confusion' }
  },
  throat: {
    label: 'Throat',
    suggestions: ['choked', 'silenced', 'holding back'],
    indian: { word: 'avaroDh', devanagari: 'अवरोध', meaning: 'a block or resistance in how you feel', category: 'confusion' }
  },
  chest: {
    label: 'Chest',
    suggestions: ['heavy', 'tight', 'aching'],
    indian: { word: 'abhimaan', devanagari: 'अभिमान', meaning: 'loving hurt when someone you care about lets you down', category: 'hurt' }
  },
  stomach: {
    label: 'Stomach',
    suggestions: ['anxious', 'sick', 'knotted'],
    indian: { word: 'vyakulta', devanagari: 'व्याकुलता', meaning: 'restless anxiety in the belly', category: 'fear' }
  },
  hands: {
    label: 'Hands',
    suggestions: ['restless', 'clenching', 'wanting to act'],
    indian: { word: 'uchatan', devanagari: 'उचाटन', meaning: 'restless unease — wanting to escape', category: 'fear' }
  },
  legs: {
    label: 'Legs',
    suggestions: ['shaky', 'weak', 'unsteady'],
    indian: { word: 'adhiratha', devanagari: 'अधीरता', meaning: 'nervous agitation in the limbs', category: 'fear' }
  }
};

const dontKnowPatterns = [/don't know/i, /not sure/i, /pata nahi/i, /kuch nahi/i];

export interface UseSessionResult {
  step: SessionStep;
  transcript: string;
  bodyLocation: BodyLocation | null;
  bodyPrompt: string;
  response: string;
  selectedWords: string[];
  indianWordOffer: IndianWord | null;
  stepLabel: string;
  startListening: () => void;
  stopListening: () => void;
  selectBodyLocation: (location: BodyLocation) => void;
  selectSuggestedWord: (word: string) => void;
  markStep4Response: () => void;
  completeSession: () => Session;
  canTypeFallback: boolean;
  setFallbackTranscript: (text: string) => void;
}

export default function useSession(language: 'en' | 'hi', name: string): UseSessionResult {
  const [step, setStep] = useState<SessionStep>('idle');
  const [transcript, setTranscript] = useState('');
  const [step1Transcript, setStep1Transcript] = useState('');
  const [step3Transcript, setStep3Transcript] = useState('');
  const [bodyLocation, setBodyLocation] = useState<BodyLocation | null>(null);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [response, setResponse] = useState('');
  const [indianWordOffer, setIndianWordOffer] = useState<IndianWord | null>(null);
  const [step4UserResponded, setStep4UserResponded] = useState(false);
  const [canTypeFallback] = useState(false);

  const stepLabel = useMemo(() => {
    const labels: Record<SessionStep, string> = {
      idle: 'Ready to begin',
      step1_listening: 'Step 1 of 4',
      step1_responding: 'Step 1 of 4',
      step2_body: 'Step 2 of 4',
      step2_responding: 'Step 2 of 4',
      step3_underneath: 'Step 3 of 4',
      step3_responding: 'Step 3 of 4',
      step4_witness: 'Step 4 of 4',
      complete: 'Complete'
    };
    return labels[step];
  }, [step]);

  const bodyPrompt = useMemo(() => {
    if (step === 'step2_body') {
      return 'Where are you feeling this?';
    }
    if (step === 'step3_underneath') {
      return `Behind the feeling from earlier, what else is there?`;
    }
    return '';
  }, [step]);

  const startListening = useCallback(() => {
    if (step === 'idle') {
      setStep('step1_listening');
    }
  }, [step]);

  const stopListening = useCallback(() => {
    if (step === 'step1_listening') {
      setStep('step1_responding');
    }
    if (step === 'step3_underneath') {
      setStep3Transcript(transcript);
      setStep('step3_responding');
    }
  }, [step, transcript]);

  useEffect(() => {
    if (step === 'step1_responding') {
      const run = async () => {
        const prompt = `You are EmoNav, a calm voice companion. The user just told you what happened in their day. Your job: mirror back what they said in 1-2 short sentences. Paraphrase warmly. Do not judge. Do not label emotions as good or bad. End with: ask where they feel it in their body. Example: User said: \"My friend didn't save me a seat at lunch and everyone laughed\" You say: \"So your friend didn't save you a spot, and that moment with everyone watching felt like a lot. Where are you feeling this right now — in your body?\" Keep response under 40 words. Speak simply. This is a teenager.`;
        setResponse('Mmm...');
        const result = await getAIResponse(prompt, transcript || '');
        setResponse(result);
        setStep1Transcript(transcript);
        setTimeout(() => setStep('step2_body'), 400);
      };
      run();
    }
  }, [step, transcript]);

  useEffect(() => {
    if (step === 'step2_responding' && bodyLocation) {
      const run = async () => {
        const prompt = `You are EmoNav. The user pointed to their ${bodyLocation}. They were talking about: ${step1Transcript}. Respond in 1-2 sentences connecting the body sensation to a possible feeling. Offer one Indian emotion word (Hindi/Sanskrit) with its meaning that might fit. Ask: \"Is that close, or is it something else?\" Keep response under 40 words. Do not judge. Do not advise.`;
        setResponse('Mmm...');
        const result = await getAIResponse(prompt, step1Transcript);
        setResponse(result);
        setTimeout(() => setStep('step3_underneath'), 400);
      };
      run();
    }
  }, [step, bodyLocation, step1Transcript]);

  useEffect(() => {
    if (step === 'step3_responding') {
      const run = async () => {
        if (dontKnowPatterns.some((pattern) => pattern.test(transcript))) {
          setResponse("That's completely fine. Sometimes feelings don't have names yet. Let's just sit with it.");
          setTimeout(() => setStep('step4_witness'), 500);
          return;
        }

        const prompt = `You are EmoNav. The user is exploring what's underneath their surface emotion. Surface emotion context: ${step1Transcript} and ${bodyLocation}. What they just said about the deeper feeling: ${transcript}. Respond in 1-2 sentences. Acknowledge what they found underneath. Offer ONE Indian emotion word (from this list) that matches, with its meaning: abhimaan (अभिमान): loving hurt when someone you care about lets you down; karuna (करुणा): compassion mixed with sadness; vairagya (वैराग्य): feeling detached, like things don't matter anymore (not depression — clarity); sneha (स्नेह): tender affection, warmth; viraha (विरह): pain of missing someone or something; glani (ग्लानि): a heavy guilt or self-disappointment; udvega (उद्वेग): anxious agitation, can't settle; vishada (विषाद): a deep, quiet despair; amarsha (अमर्ष): indignation — "this is not right and I feel it in my bones"; nirveda (निर्वेद): weariness with the world, tired of everything; harsha (हर्ष): a burst of joy or delight; mudita (मुदिता): happiness at someone else's happiness; dhairya (धैर्य): patient courage, steadiness under pressure. Format: \"In Hindi there's a word '[word]' ([devanagari]) — it means [meaning]. Is that close?\" Keep total response under 50 words. Do not judge. Do not advise.`;
        setResponse('Mmm...');
        const result = await getAIResponse(prompt, transcript);
        setResponse(result);
        setTimeout(() => setStep('step4_witness'), 400);
      };
      run();
    }
  }, [step, transcript, bodyLocation, step1Transcript]);

  const selectBodyLocation = useCallback((location: BodyLocation) => {
    setBodyLocation(location);
    setSelectedWords(bodyOptions[location].suggestions.slice(0, 2));
    setIndianWordOffer(bodyOptions[location].indian);
    setStep('step2_responding');
  }, []);

  const selectSuggestedWord = useCallback((word: string) => {
    setSelectedWords((current) => Array.from(new Set([...current, word])));
  }, []);

  const markStep4Response = useCallback(() => {
    setStep4UserResponded(true);
  }, []);

  const completeSession = useCallback(() => {
    const allWordsUsed = Array.from(new Set([
      ...extractEmotionWords(step1Transcript),
      ...extractEmotionWords(transcript),
      ...selectedWords
    ]));
    return {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      step1Transcript,
      step2BodyLocation: bodyLocation,
      step2Words: selectedWords,
      step3Transcript,
      step3Words: extractEmotionWords(transcript),
      step4UserResponded,
      allWordsUsed,
      indianWordsOffered: indianWordOffer ? [indianWordOffer] : [],
      indianWordsSelected: selectedWords.filter((word) => indianWordOffer?.word === word),
      durationSeconds: 0
    };
  }, [bodyLocation, indianWordOffer, selectedWords, step1Transcript, step3Transcript, transcript, step4UserResponded]);

  useEffect(() => {
    if (step === 'step4_witness') {
      setTimeout(() => {
        setStep('complete');
      }, 6000);
    }
  }, [step]);

  const setFallbackTranscript = (text: string) => {
    setTranscript(text);
  };

  return {
    step,
    transcript,
    bodyLocation,
    bodyPrompt,
    response,
    selectedWords,
    indianWordOffer,
    stepLabel,
    startListening,
    stopListening,
    selectBodyLocation,
    selectSuggestedWord,
    markStep4Response,
    completeSession,
    canTypeFallback,
    setFallbackTranscript
  };
}
