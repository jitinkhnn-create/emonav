const COOKIE_SESSION = "emonav_session";
const COOKIE_OAUTH_STATE = "emonav_oauth_state";

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

function fallbackInference(input, previous) {
  const text = (input || "").toLowerCase();
  const distressHints = ["anxious", "scared", "sad", "overwhelmed", "angry", "lost"];
  const distressCount = distressHints.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
  const emotionLabel =
    distressCount >= 2 ? "Emotionally heavy / distressed" : "Mixed emotions / neutral";

  const confidenceScore = Math.max(
    20,
    Math.min(90, 55 + (text.includes("i will") ? 20 : 0) - (text.includes("maybe") ? 15 : 0))
  );
  const pointScore = Math.max(20, Math.min(95, 85 - (text.split(/\s+/).length > 40 ? 20 : 0)));
  const words = text
    .split(/\W+/)
    .filter((w) => w && w.length > 2)
    .slice(0, 8);
  const previousWords = (previous || "")
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w && w.length > 2);
  const newWords = words.filter((w) => !previousWords.includes(w)).slice(0, 5);

  return {
    emotionLabel,
    confidenceScore,
    pointScore,
    wordChoiceNotes: `New repeated words: ${newWords.join(", ") || "none notable"}.`,
    listenerPerspective:
      "A listener may hear vulnerability and a need for clear support. Add one direct sentence with your exact need.",
    acknowledgment:
      "Thank you for sharing openly. You are focused, and these thoughts are temporary. Other areas of life can still remain stable and good.",
    supportSuggestions:
      "Take 5 deep breaths. Pause for 5 minutes before reacting. Ground yourself by naming 3 things you can see, 2 you can hear, and 1 you can feel."
  };
}

async function callGemini(env, input, previousInput) {
  requireEnv(env, ["GEMINI_API_KEY"]);
  const model = env.GEMINI_MODEL || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const prompt = [
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

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3
      }
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini call failed: ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned);

  return {
    emotionLabel: String(parsed.emotionLabel || "Mixed emotions / neutral"),
    confidenceScore: normalizeScore(parsed.confidenceScore),
    pointScore: normalizeScore(parsed.pointScore),
    wordChoiceNotes: String(parsed.wordChoiceNotes || ""),
    listenerPerspective: String(parsed.listenerPerspective || ""),
    acknowledgment: String(parsed.acknowledgment || ""),
    supportSuggestions: String(parsed.supportSuggestions || "")
  };
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
  if (!input) return json({ error: "input is required" }, 400);

  try {
    const result = await callGemini(env, input, previousInput);
    return json({ ok: true, result });
  } catch (err) {
    const fallback = fallbackInference(input, previousInput);
    return json({
      ok: true,
      result: fallback,
      warning: `Gemini unavailable, fallback used: ${err.message}`
    });
  }
}
