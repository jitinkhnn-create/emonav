// _worker.js — EmoNav (Cloudflare Pages, no-build / vanilla)
//
// The live app is index.html. Its ONLY backend dependency is:
//   POST /api/analyze   body: { prompt }   ->   { text }
//
// "text" is ALWAYS a valid JSON string. The worker parses the model's
// output itself, validates it, and re-serializes cleanly — so the browser's
// JSON.parse can never choke on unescaped quotes/newlines from the model.
//
// Provider order (LLM_PROVIDER):
//   "auto"       -> Workers AI first (fast, edge), fall back to Gemini  [default]
//   "cloudflare" -> Workers AI only
//   "gemini"     -> Gemini only
//
// Env / bindings:
//   AI             : Workers AI binding
//   CF_AI_MODEL    : e.g. "@cf/google/gemma-4-26b-a4b-it"
//   GEMINI_API_KEY : secret
//   GEMINI_MODEL   : e.g. "gemini-2.5-flash"
//   LLM_PROVIDER   : "auto" | "cloudflare" | "gemini"

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(request) });
    }
    if (url.pathname === '/api/analyze') {
      if (request.method !== 'POST') {
        return json(request, { error: 'Method not allowed' }, 405);
      }
      return handleAnalyze(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

function cors(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = origin.startsWith('http://localhost')
    ? origin
    : new URL(request.url).origin;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(request), 'Content-Type': 'application/json' },
  });
}

// Pull the first {...} block out of arbitrary model text and parse it.
// Returns a JS object, or throws with a clear message.
function extractJson(raw) {
  if (!raw) throw new Error('empty model output');
  let s = String(raw).trim();
  // strip ```json ... ``` fences
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const a0 = s.indexOf('{');
  const a1 = s.lastIndexOf('}');
  if (a0 === -1 || a1 === -1 || a1 < a0) {
    throw new Error('no JSON object in model output');
  }
  const slice = s.slice(a0, a1 + 1);
  return JSON.parse(slice); // throws on malformed JSON -> caught upstream
}

async function handleAnalyze(request, env) {
  let prompt;
  try {
    ({ prompt } = await request.json());
  } catch {
    return json(request, { error: 'Invalid JSON body' }, 400);
  }
  if (!prompt || typeof prompt !== 'string') {
    return json(request, { error: 'Missing "prompt" string' }, 400);
  }
  if (prompt.length > 20000) {
    return json(request, { error: 'Prompt too long' }, 413);
  }

  const provider = (env.LLM_PROVIDER || 'auto').toLowerCase();
  const wantCF = provider === 'auto' || provider === 'cloudflare';
  const wantGemini = provider === 'auto' || provider === 'gemini';

  let lastError = '';

  // Workers AI first (fast, on-edge)
  if (wantCF && env.AI && env.CF_AI_MODEL) {
    try {
      const raw = await callWorkersAI(env, prompt);
      const obj = extractJson(raw); // validate
      return json(request, { text: JSON.stringify(obj) });
    } catch (err) {
      lastError = `Workers AI: ${err.message || err}`;
      if (provider === 'cloudflare') {
        return json(request, { error: 'AI request failed', detail: lastError }, 502);
      }
      // else fall through to Gemini
    }
  } else if (provider === 'cloudflare') {
    return json(request, { error: 'Workers AI not configured', detail: 'Bind AI and set CF_AI_MODEL' }, 500);
  }

  // Gemini fallback
  if (wantGemini && env.GEMINI_API_KEY) {
    try {
      const raw = await callGemini(env, prompt);
      const obj = extractJson(raw); // validate
      return json(request, { text: JSON.stringify(obj) });
    } catch (err) {
      lastError = `Gemini: ${err.message || err}`;
    }
  } else if (provider === 'gemini') {
    return json(request, { error: 'Gemini not configured', detail: 'Set GEMINI_API_KEY (and GEMINI_MODEL)' }, 500);
  }

  return json(
    request,
    { error: 'No AI provider available', detail: lastError || 'Configure AI / CF_AI_MODEL or GEMINI_API_KEY' },
    502
  );
}

async function callWorkersAI(env, prompt) {
  const out = await env.AI.run(env.CF_AI_MODEL, {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
  });
  if (typeof out === 'string') return out.trim();
  return String(out?.response || out?.result?.response || '').trim();
}

async function callGemini(env, prompt) {
  // gemini-1.5-* are SHUT DOWN (404 on v1beta). Default to a live model.
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
    `?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        // 2.5-flash defaults to "thinking" which adds many seconds of latency.
        // Disable it for this fast, structured task.
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('').trim();
}
