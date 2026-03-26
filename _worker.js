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

function fallbackInference(input, bodySignal, previous) {
  const text = (input || "").toLowerCase();

  // Simple emotion detection
  const distressHints = ["anxious", "scared", "sad", "overwhelmed", "angry", "lost"];
  const distressCount = distressHints.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
  const emotion = distressCount >= 2
    ? "Your words carry signals that often accompany emotional distress."
    : "Your words carry signals that often accompany mixed or neutral emotional states.";

  // Extract basic event (simplified)
  const event = "The transcript describes a situation where the speaker experienced some form of difficulty or challenge.";

  // Extract basic story (simplified)
  const story = "This situation means that something important is being threatened or lost.";

  // Basic need identification
  const need = distressCount >= 2 ? "safety and support" : "clarity and understanding";

  // Grounding steps
  const grounding = "Take three slow, deep breaths. Name three things you can see around you. Name two things you can hear. Name one thing you can feel with your hands.";

  // Next step
  const nextStep = "Write down one thing you can do today that would make you feel a little more in control of your situation.";

  // Alignment
  const alignment = bodySignal
    ? "Your body and words appear to be in agreement based on the signals reported."
    : "No body signal was noticed. This is common when we are more in our head than in our body during an experience.";

  return {
    event,
    story,
    emotion,
    need,
    alternativeNeeds: ["connection", "autonomy"],
    grounding,
    nextStep,
    alignment
  };
}

async function callGemini(env, input, bodySignal, previousInput) {
  requireEnv(env, ["GEMINI_API_KEY"]);
  const model = env.GEMINI_MODEL || "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const prompt = [
    "You are EmoNav — a voice reflection tool that helps people hear themselves clearly, separate facts from the stories they construct, identify what they genuinely need, and take one honest step forward.",
    "You are not a therapist. You are not a diagnosis tool. You are a mirror — precise, honest, and non-judgmental.",
    "",
    "MANDATORY LANGUAGE RULES:",
    "NEVER USE: 'You are feeling [emotion]', 'Emotion detected: [emotion]', 'This indicates [emotion or state]', 'You are experiencing [condition]'",
    "ALWAYS USE: 'Your words carry signals that often accompany [emotion]', 'There are patterns here that sometimes point toward [emotion]', 'This may reflect [emotion or state] — does that resonate?', 'One possibility here is [emotion]', 'Based on the language, this could be [finding] — you would know better than I do'",
    "",
    "ANALYZE THIS TRANSCRIPT:",
    `"""${input}"""`,
    "",
    "BODY SIGNAL REPORTED:",
    `"""${bodySignal || "No body signal reported"}"""`,
    "",
    "PREVIOUS SESSION TRANSCRIPT (for context only):",
    `"""${previousInput || "No previous session"}"""`,
    "",
    "FOLLOW THIS EXACT STRUCTURE:",
    "",
    "1. EVENT ANALYSIS:",
    "Extract only what is observable and unchallengeable. A fact is something a camera could have recorded.",
    "Strip all interpretation words. Keep to 2–3 sentences maximum.",
    "",
    "2. STORY ANALYSIS:",
    "Extract the interpretation — the meaning the user has constructed around the event.",
    "Name it directly. Keep to 1–2 sentences.",
    "",
    "3. EMOTION IDENTIFICATION:",
    "Based on the story layer, identify the most likely emotion.",
    "Use the mandatory language rules above.",
    "",
    "4. NEED IDENTIFICATION:",
    "Every difficult emotion signals an unmet need.",
    "Using this mapping:",
    "- Anger, Rage, Resentment → Need for: respect, fairness, autonomy, to be taken seriously",
    "- Anxiety, Fear, Worry → Need for: safety, predictability, a sense of control, or certainty about an outcome",
    "- Sadness, Grief, Emptiness → Need for: connection, acknowledgment, significance, or to matter to someone",
    "- Frustration, Irritation → Need for: effectiveness, to be understood, or for things to make sense",
    "- Guilt → Need for: integrity, to feel like a good person, or to maintain belonging",
    "- Shame → Need for: unconditional acceptance, worth that is not conditional on performance",
    "- Overwhelm → Need for: support, reduced load, or explicit permission to not be managing everything",
    "- Loneliness → Need for: genuine connection, or to matter to one specific person",
    "",
    "5. GROUNDING STEPS:",
    "Provide 3-5 concrete, immediate grounding actions.",
    "Focus on physical sensations and present moment awareness.",
    "",
    "6. ONE CONCRETE NEXT STEP:",
    "Suggest ONE specific, small, doable action the person can take in the next 24 hours.",
    "Rules: Must be something they can do without requiring another person to change first.",
    "Must be physical, written, or spoken — not internal.",
    "Must connect directly to the identified need.",
    "Must be proportionate to the situation.",
    "",
    "7. ALIGNMENT ANALYSIS:",
    "Compare body signal with emotional language.",
    "Determine if they appear in agreement, contradict, or if no body signal was noticed.",
    "",
    "RETURN JSON ONLY:",
    "{",
    '  "event": "factual description (2-3 sentences max)",',
    '  "story": "interpretation named directly (1-2 sentences)",',
    '  "emotion": "emotion identification using mandatory language",',
    '  "need": "primary unmet need",',
    '  "alternativeNeeds": ["array of 1-2 alternative possibilities"],',
    '  "grounding": "3-5 concrete grounding steps",',
    '  "nextStep": "one concrete next step instruction",',
    '  "alignment": "body-words alignment analysis"',
    "}",
    "",
    "Return only the JSON. No additional text."
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
    event: String(parsed.event || "Unable to extract factual event."),
    story: String(parsed.story || "Unable to identify story layer."),
    emotion: String(parsed.emotion || "Unable to identify emotion."),
    need: String(parsed.need || "Unable to identify need."),
    alternativeNeeds: Array.isArray(parsed.alternativeNeeds) ? parsed.alternativeNeeds : [],
    grounding: String(parsed.grounding || "Take three deep breaths. Name three things you can see. Name two things you can hear. Name one thing you can feel."),
    nextStep: String(parsed.nextStep || "Write one sentence describing what you actually needed in that moment."),
    alignment: String(parsed.alignment || "Unable to analyze alignment.")
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
  const bodySignal = String(body?.bodySignal || "").trim();
  const previousInput = String(body?.previousInput || "").trim();
  if (!input) return json({ error: "input is required" }, 400);

  try {
    const result = await callGemini(env, input, bodySignal, previousInput);
    return json({ ok: true, result });
  } catch (err) {
    const fallback = fallbackInference(input, bodySignal, previousInput);
    return json({
      ok: true,
      result: fallback,
      warning: `Gemini unavailable, fallback used: ${err.message}`
    });
  }
}
