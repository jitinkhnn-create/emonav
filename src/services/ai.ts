const API_URL = 'https://api.anthropic.com/v1/messages';

interface ContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content?: ContentBlock[];
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
        max_tokens: 150,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = (await response.json()) as AnthropicResponse;
    if (!response.ok) {
      console.error('AI error:', data);
      return "I'm here. Take your time.";
    }

    const text = data.content
      ?.filter((block: ContentBlock) => block.type === 'text')
      .map((block: ContentBlock) => block.text)
      .join('')
      .trim();

    return text || "I'm here. Take your time.";
  } catch (error) {
    console.error('AI response error:', error);
    return "I'm here. Take your time.";
  }
}
