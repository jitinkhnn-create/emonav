const API_URL = 'https://api.anthropic.com/v1/messages';

interface AnthropicResponse {
  completion?: string;
  error?: { message: string };
}

export async function getAIResponse(systemPrompt: string, userMessage: string): Promise<string> {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) {
    return "I'm here. Take your time.";
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ]
      })
    });

    const data = (await response.json()) as AnthropicResponse;
    if (!response.ok || !data.completion) {
      console.error('AI error:', data);
      return "I'm here. Take your time.";
    }

    return data.completion.trim();
  } catch (error) {
    console.error('AI response error:', error);
    return "I'm here. Take your time.";
  }
}
