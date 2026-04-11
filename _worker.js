const COOKIE_SESSION = "emonav_session";
const COOKIE_OAUTH_STATE = "emonav_oauth_state";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_CF_MODEL = "@cf/google/gemma-4-26b-a4b-it";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/auth/google/login" && request.method === "GET") {
      return handleGoogleLogin(request, env);
    }
    if (url.pathname === "/api/auth/google/callback" && request.method === "GET") {
      return handleGoogleCallback(request, env);
    }
    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      return handleMe(request, env);
    }
    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      return handleLogout(request, env);
    }
    if (url.pathname === "/api/infer" && request.method === "POST") {
      return handleInfer(request, env);
    }
    if (url.pathname === "/api/ai/status" && request.method === "GET") {
      return handleAiStatus(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers
    }
  });
}

function parseCookies(request) {
  const cookie = request.headers.get("cookie") || "";
  const out = {};
  for (const pair of cookie.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    out[key] = decodeURIComponent(value);
  }
  return out;
}

function base64UrlEncode(bytes) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i += 1) bytes[i] = str.charCodeAt(i);
  return bytes;
}

function randomString(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function secureCookie(name, value, maxAgeSec, sameSite = "Strict") {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=${sameSite}; Max-Age=${maxAgeSec}`;
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function requireEnv(env, keys) {
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Missing environment variable(s): ${missing.join(", ")}`);
  }
}

function getBaseUrl(request, env) {
  if (env.PUBLIC_BASE_URL) return env.PUBLIC_BASE_URL;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

async function createSession(env, userData) {
  const sessionId = randomString(32);
  const sessionData = {
    ...userData,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };

  await env.EMONAV_SESSIONS.put(sessionId, JSON.stringify(sessionData), {
    expirationTtl: 7 * 24 * 60 * 60 // 7 days in seconds
  });

  return sessionId;
}

async function getSession(env, sessionId) {
  if (!sessionId) return null;

  try {
    const sessionData = await env.EMONAV_SESSIONS.get(sessionId);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    if (session.expiresAt < Date.now()) {
      await env.EMONAV_SESSIONS.delete(sessionId);
      return null;
    }

    return session;
  } catch (error) {
    console.error("Session retrieval error:", error);
    return null;
  }
}

async function deleteSession(env, sessionId) {
  if (sessionId) {
    await env.EMONAV_SESSIONS.delete(sessionId);
  }
}

async function requireSession(request, env) {
  const cookies = parseCookies(request);
  const sessionId = cookies[COOKIE_SESSION];
  if (!sessionId) return null;
  return getSession(env, sessionId);
}

async function handleGoogleLogin(request, env) {
  try {
    requireEnv(env, ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "SESSION_SECRET"]);
  } catch (err) {
    return json({ error: err.message }, 500);
  }

  const state = randomString(24);
  const base = getBaseUrl(request, env);
  const redirectUri = `${base}/api/auth/google/callback`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return new Response(null, {
    status: 302,
    headers: {
      location: authUrl.toString(),
      "set-cookie": secureCookie(COOKIE_OAUTH_STATE, state, 600, "Lax"),
      "cache-control": "no-store"
    }
  });
}

async function handleGoogleCallback(request, env) {
  try {
    requireEnv(env, ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "SESSION_SECRET"]);
  } catch (err) {
    return json({ error: err.message }, 500);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = parseCookies(request);
  const savedState = cookies[COOKIE_OAUTH_STATE];

  if (!code || !state || !savedState || state !== savedState) {
    return new Response("OAuth state validation failed.", { status: 400 });
  }

  const base = getBaseUrl(request, env);
  const redirectUri = `${base}/api/auth/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!tokenRes.ok) {
    const details = await tokenRes.text();
    return new Response(`Google token exchange failed: ${details}`, { status: 401 });
  }

  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    return new Response("Google token response missing access token.", { status: 401 });
  }

  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  if (!profileRes.ok) {
    return new Response("Failed to fetch Google user profile.", { status: 401 });
  }
  const profile = await profileRes.json();

  const sessionData = {
    sub: profile.sub,
    email: profile.email,
    name: profile.name,
    picture: profile.picture
  };
  const sessionId = await createSession(env, sessionData);

  const headers = new Headers({
    location: "/",
    "cache-control": "no-store"
  });
  headers.append("set-cookie", secureCookie(COOKIE_SESSION, sessionId, 7 * 24 * 60 * 60, "Strict"));
  headers.append("set-cookie", clearCookie(COOKIE_OAUTH_STATE));

  return new Response(null, {
    status: 302,
    headers
  });
}

async function handleMe(request, env) {
  const session = await requireSession(request, env);
  if (!session) return json({ authenticated: false }, 401);
  return json({
    authenticated: true,
    user: {
      email: session.email,
      name: session.name,
      picture: session.picture
    }
  });
}

async function handleLogout(request, env) {
  const cookies = parseCookies(request);
  const sessionId = cookies[COOKIE_SESSION];
  if (sessionId) {
    await deleteSession(env, sessionId);
  }

  return json(
    { ok: true },
    200,
    {
      "set-cookie": clearCookie(COOKIE_SESSION)
    }
  );
}

function getInferenceProvider(env) {
  const raw = String(env.LLM_PROVIDER || "auto").toLowerCase().trim();
  if (raw === "cloudflare" || raw === "gemini" || raw === "auto") return raw;
  return "auto";
}

function sanitizeProvider(value) {
  const raw = String(value || "").toLowerCase().trim();
  if (raw === "cloudflare" || raw === "gemini" || raw === "auto") return raw;
  return "";
}

function resolveInferenceConfig(env, providerOverride, modelOverride) {
  const provider = sanitizeProvider(providerOverride) || getInferenceProvider(env);
  const normalizedModel = String(modelOverride || "").trim();
  const cloudflareModel = provider === "cloudflare" || provider === "auto"
    ? (normalizedModel || env.CF_AI_MODEL || DEFAULT_CF_MODEL)
    : (env.CF_AI_MODEL || DEFAULT_CF_MODEL);
  const geminiModel = provider === "gemini"
    ? (normalizedModel || env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL)
    : (env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL);

  return {
    provider,
    cloudflareModel,
    geminiModel
  };
}

function buildInferencePrompt(input, previousInput) {
  return [
    "You are an emotional reflection assistant. Return strict JSON only.",
    "Analyze current user input and optionally compare with previous input.",
    "JSON schema:",
    "{",
    '  "emotionLabel": string,',
    '  "confidenceScore": number,',
    '  "pointScore": number,',
    '  "wordChoiceNotes": string,',
    '  "listenerPerspective": string,',
    '  "acknowledgment": string,',
    '  "supportSuggestions": string',
    "}",
    "Constraints:",
    "- confidenceScore and pointScore must be integers from 0 to 100.",
    "- acknowledgment should be validating and mention thoughts can be temporary.",
    "- supportSuggestions should include concrete immediate actions (breathing, pause, grounding).",
    "- listenerPerspective should explain how message may land for another person.",
    `Current input: """${input}"""`,
    `Previous input: """${previousInput || ""}"""`,
    "Return only JSON."
  ].join("\n");
}

function parseJsonFromText(text) {
  const cleaned = String(text || "").replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  if (!cleaned) throw new Error("Model returned an empty response.");
  return JSON.parse(cleaned);
}

function normalizeInferenceResult(parsed, providerLabel) {
  const result = {
    emotionLabel: String(parsed.emotionLabel || ""),
    confidenceScore: normalizeScore(parsed.confidenceScore),
    pointScore: normalizeScore(parsed.pointScore),
    wordChoiceNotes: String(parsed.wordChoiceNotes || ""),
    listenerPerspective: String(parsed.listenerPerspective || ""),
    acknowledgment: String(parsed.acknowledgment || ""),
    supportSuggestions: String(parsed.supportSuggestions || "")
  };

  if (
    !result.emotionLabel
    || !result.acknowledgment
    || !result.supportSuggestions
    || !result.listenerPerspective
    || !result.wordChoiceNotes
  ) {
    throw new Error(`${providerLabel} response did not include required fields.`);
  }

  return result;
}

function extractTextFromCloudflareAi(raw) {
  if (typeof raw === "string") return raw;
  if (!raw || typeof raw !== "object") return "";
  if (typeof raw.response === "string") return raw.response;
  if (typeof raw.result?.response === "string") return raw.result.response;
  if (typeof raw.output_text === "string") return raw.output_text;
  if (Array.isArray(raw.choices) && typeof raw.choices[0]?.message?.content === "string") {
    return raw.choices[0].message.content;
  }
  if (Array.isArray(raw.output) && typeof raw.output[0]?.content?.[0]?.text === "string") {
    return raw.output[0].content[0].text;
  }
  return "";
}

async function callGemini(env, input, previousInput, model) {
  requireEnv(env, ["GEMINI_API_KEY"]);
  const selectedModel = model || env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const prompt = buildInferencePrompt(input, previousInput);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    })
  });

  if (!res.ok) {
    const details = (await res.text()).slice(0, 400);
    throw new Error(`Gemini call failed: ${res.status}${details ? `: ${details}` : ""}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const parsed = parseJsonFromText(text);
  return normalizeInferenceResult(parsed, "Gemini");
}

async function callCloudflareAi(env, input, previousInput, model) {
  if (!env.AI || typeof env.AI.run !== "function") {
    throw new Error("Cloudflare AI binding missing. Add binding name AI.");
  }

  const selectedModel = model || env.CF_AI_MODEL || DEFAULT_CF_MODEL;
  const prompt = buildInferencePrompt(input, previousInput);
  const response = await env.AI.run(selectedModel, {
    messages: [
      { role: "system", content: "Return strict JSON only." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });
  const text = extractTextFromCloudflareAi(response);
  const parsed = parseJsonFromText(text);
  return normalizeInferenceResult(parsed, "Cloudflare AI");
}

async function inferWithProvider(env, input, previousInput, providerOverride, modelOverride) {
  const config = resolveInferenceConfig(env, providerOverride, modelOverride);
  const provider = config.provider;
  const errors = [];

  if (provider === "cloudflare") {
    return callCloudflareAi(env, input, previousInput, config.cloudflareModel);
  }
  if (provider === "gemini") {
    return callGemini(env, input, previousInput, config.geminiModel);
  }

  try {
    return await callCloudflareAi(env, input, previousInput, config.cloudflareModel);
  } catch (err) {
    errors.push(`cloudflare=${err.message}`);
  }
  try {
    return await callGemini(env, input, previousInput, config.geminiModel);
  } catch (err) {
    errors.push(`gemini=${err.message}`);
  }
  throw new Error(`All inference providers failed: ${errors.join(" | ")}`);
}

async function checkGeminiStatus(env, modelOverride) {
  const model = String(modelOverride || "").trim() || env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  if (!env.GEMINI_API_KEY) {
    return {
      ok: false,
      provider: "gemini",
      configured: false,
      model,
      error: "Missing GEMINI_API_KEY environment variable."
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: 'Return {"ok":true} as JSON only.' }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json"
        }
      })
    });
    if (!res.ok) {
      const details = (await res.text()).slice(0, 400);
      return {
        ok: false,
        provider: "gemini",
        configured: true,
        model,
        status: res.status,
        error: `Gemini health check failed: ${details || "Unknown error"}`
      };
    }
    return { ok: true, provider: "gemini", configured: true, model };
  } catch (err) {
    return {
      ok: false,
      provider: "gemini",
      configured: true,
      model,
      error: `Gemini health check exception: ${err.message}`
    };
  }
}

async function checkCloudflareAiStatus(env, modelOverride) {
  const model = String(modelOverride || "").trim() || env.CF_AI_MODEL || DEFAULT_CF_MODEL;
  if (!env.AI || typeof env.AI.run !== "function") {
    return {
      ok: false,
      provider: "cloudflare",
      configured: false,
      model,
      error: "Cloudflare AI binding missing. Add binding name AI."
    };
  }

  try {
    await env.AI.run(model, {
      messages: [{ role: "user", content: "Reply with OK" }],
      max_tokens: 8,
      temperature: 0
    });
    return { ok: true, provider: "cloudflare", configured: true, model };
  } catch (err) {
    return {
      ok: false,
      provider: "cloudflare",
      configured: true,
      model,
      error: `Cloudflare AI health check failed: ${err.message}`
    };
  }
}

async function handleAiStatus(request, env) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "Unauthorized" }, 401);
  const url = new URL(request.url);
  const providerOverride = url.searchParams.get("provider") || "";
  const modelOverride = url.searchParams.get("model") || "";
  const config = resolveInferenceConfig(env, providerOverride, modelOverride);
  const provider = config.provider;

  if (provider === "cloudflare") {
    const status = await checkCloudflareAiStatus(env, config.cloudflareModel);
    return json(status, status.ok ? 200 : 502);
  }
  if (provider === "gemini") {
    const status = await checkGeminiStatus(env, config.geminiModel);
    return json(status, status.ok ? 200 : 502);
  }

  const cfStatus = await checkCloudflareAiStatus(env, config.cloudflareModel);
  if (cfStatus.ok) {
    return json({ ...cfStatus, provider: "auto", activeProvider: "cloudflare" });
  }
  const geminiStatus = await checkGeminiStatus(env, config.geminiModel);
  if (geminiStatus.ok) {
    return json({ ...geminiStatus, provider: "auto", activeProvider: "gemini" });
  }
  return json(
    {
      ok: false,
      provider: "auto",
      activeProvider: null,
      error: `No provider healthy. cloudflare=${cfStatus.error}; gemini=${geminiStatus.error}`
    },
    502
  );
}

function normalizeScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num)));
}

async function handleInfer(request, env) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: "Unauthorized" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const input = String(body?.input || "").trim();
  const previousInput = String(body?.previousInput || "").trim();
  const providerOverride = String(body?.provider || "").trim();
  const modelOverride = String(body?.model || "").trim();
  if (!input) return json({ error: "input is required" }, 400);

  try {
    const result = await inferWithProvider(env, input, previousInput, providerOverride, modelOverride);
    return json({ ok: true, result });
  } catch (err) {
    return json({ error: `LLM inference failed: ${err.message}` }, 502);
  }
}
