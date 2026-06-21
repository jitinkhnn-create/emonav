// _worker.js — EmoNav (Cloudflare Pages, no-build / vanilla)
//
// The live app is index.html. Its ONLY backend dependency is:
//   POST /api/analyze   body: { prompt }   ->   { text }
//
// Everything else (auth, history, TTS, scoring) runs client-side in
// index.html. There is no Firebase, no sessions, no /api/ai, no /api/infer.
//
// Provider order is controlled by LLM_PROVIDER:
//   "auto"       -> try Workers AI, fall back to Gemini   (default)
//   "cloudflare" -> Workers AI only
//   "gemini"     -> Gemini only
//
// Bindings / env (Pages -> Settings -> Variables & Bindings):
//   AI            : Workers AI binding (type "AI")            [for cloudflare/auto]
//   CF_AI_MODEL   : e.g. "@cf/meta/llama-3.1-8b-instruct"    [plain var]
//   GEMINI_API_KEY: secret                                    [for gemini/auto]
//   GEMINI_MODEL  : e.g. "gemini-1.5-flash"                   [plain var]
//   LLM_PROVIDER  : "auto" | "cloudflare" | "gemini"          [plain var, default auto]
//
// Errors are returned as real JSON ({ error, detail }) — never silent empty text.

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

    // Everything else: serve the static site (index.html, styles, etc.)
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

async function handleAnalyze(request, env) {
  // 1. Parse + validate input
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

  // 2. Try Workers AI first (for auto / cloudflare)
  if (wantCF && env.AI && env.CF_AI_MODEL) {
    try {
      const text = await callWorkersAI(env, prompt);
      if (text) return json(request, { text });
      lastError = 'Workers AI returned empty text';
    } catch (err) {
      lastError = `Workers AI: ${err.message || err}`;
      if (provider === 'cloudflare') {
        return json(request, { error: 'AI request failed', detail: lastError }, 502);
      }
      // else fall through to Gemini
    }
  } else if (provider === 'cloudflare') {
    return json(
      request,
      { error: 'Workers AI not configured', detail: 'Bind AI and set CF_AI_MODEL' },
      500
    );
  }

  // 3. Gemini (for auto fallback / gemini)
  if (wantGemini && env.GEMINI_API_KEY) {
    try {
      const text = await callGemini(env, prompt);
      if (text) return json(request, { text });
      lastError = 'Gemini returned empty text';
    } catch (err) {
      lastError = `Gemini: ${err.message || err}`;
    }
  } else if (provider === 'gemini') {
    return json(
      request,
      { error: 'Gemini not configured', detail: 'Set GEMINI_API_KEY (and GEMINI_MODEL)' },
      500
    );
  }

  // 4. Nothing worked
  return json(
    request,
    {
      error: 'No AI provider available',
      detail: lastError || 'Set LLM_PROVIDER and configure AI / CF_AI_MODEL or GEMINI_API_KEY',
    },
    502
  );
}

async function callWorkersAI(env, prompt) {
  const out = await env.AI.run(env.CF_AI_MODEL, {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
  });
  // Workers AI shapes vary by model; normalize the common ones.
  if (typeof out === 'string') return out.trim();
  return String(out?.response || out?.result?.response || '').trim();
}

async function callGemini(env, prompt) {
  const model = env.GEMINI_MODEL || 'gemini-1.5-flash';
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` +
    `?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('').trim();
}
