const WORKER_URL = import.meta.env.VITE_WORKER_URL || '/api/ai';

export async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userMessage }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as { text?: string };
    return data.text || '';
  } catch (error) {
    console.error('AI call failed:', error);
    return '';
  }
}

export const PROMPTS = {
  howItLands: `You are simulating how a listener would receive and interpret someone's words.
The user just said the following out loud during an emotional moment.
Your job: rewrite what they said from the LISTENER's perspective.

Rules:
- Show what the listener actually hears — the tone, the accusations, the assumptions, the blame
- Be honest but not cruel. The goal is awareness, not shame.
- If the words contain blame ("you always...", "you never..."), point out how absolute language sounds to a listener
- If the words contain catastrophizing ("everything is ruined", "I can never..."), show how exaggerated it sounds from outside
- Keep it in second person — "When you say [X], the person hearing it feels [Y]"
- Keep response under 150 words
- End with: "Is this really what you want them to hear?"`,

  calming: (transcript: string) => `The user just went through an emotional processing session. They spoke about something that was bothering them, heard themselves back, heard how their words land on others, and confirmed they want to continue.

Their transcript was: ${transcript}

Your job: help them ground themselves. Write a short, warm, direct message that:

1. Acknowledges they're in an emotional state — name it without judgment
2. Explains plainly: when we're emotional, our mind attracts and amplifies negative thoughts. These thoughts FEEL completely real and logical, but they're filtered through the emotional burst. The reality is usually less extreme than what the mind is presenting right now.
3. Offer ONE specific calming technique (rotate between these — pick one that fits the emotional tone):
   - Deep breathing: "Breathe in for 4 counts, hold for 4, out for 6. Do this 3 times."
   - Body grounding: "Feel your feet on the ground. Press your palms together for 10 seconds. Notice the pressure."
   - Time perspective: "Ask yourself — will this matter in one week? In one month? In one year?"
   - Name it to tame it: "Say out loud: 'I am feeling [emotion]. It is a feeling. It will pass.'"
   - The 5-4-3-2-1 method: "Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste."
4. End with: "Now, rethink what you were thinking. You might find it looks a little different."

Keep total response under 200 words. Warm tone. No jargon. Like a wise older friend, not a therapist.`,

  analyze: `Analyze this transcript from someone who was speaking during an emotional moment.
Return ONLY a JSON object with no other text, no markdown, no explanation:

{
  "confidence": <1-10, where 1 = extremely uncertain/hesitant, 10 = very assertive/certain>,
  "clarity": <1-10, where 1 = scattered/incoherent, 10 = clear and structured thinking>,
  "emotionalIntensity": <1-10, where 1 = calm/neutral, 10 = extremely emotional/agitated>,
  "dominantEmotions": ["<top emotion>", "<second emotion>", "<third emotion>"],
  "negativeWords": ["<list of harsh, blaming, catastrophizing words used>"],
  "positiveWords": ["<list of constructive, growth-oriented, balanced words used>"],
  "repeatedWords": ["<words repeated 3+ times, indicating fixation>"]
}`,
};

export const FALLBACKS = {
  howItLands: "We couldn't process this right now. Read your words again slowly — how would they sound to someone else?",
  calming: "You're in an emotional moment right now, and that's completely understandable. When we're upset, our mind tends to magnify every negative detail and make things feel more permanent than they are. The intensity you feel is real — but the story your mind is telling might be more extreme than reality.\n\nTry this: breathe in for 4 counts, hold for 4, breathe out for 6. Do it three times.\n\nNow, rethink what you were thinking. You might find it looks a little different.",
};
