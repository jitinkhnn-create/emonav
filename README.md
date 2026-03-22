# EmoNav Voice Reflection App

Voice reflection app with:

- Google sign-in
- Secure server-side auth cookies (`HttpOnly`, `Secure`)
- Gemini AI inference from backend (API key never exposed to browser)
- Cloudflare Worker API + static frontend hosting

## Core flow

1. User signs in with Google.
2. User records voice and sees transcript.
3. User can hear:
   - exact replay, and
   - listener-perspective interpretation.
4. On confirmation, backend calls Gemini for:
   - emotion signal
   - confidence score
   - to-the-point score
   - word-choice notes
   - acknowledgment response
   - immediate grounding actions
5. App compares current metrics vs previous interaction (stored in local browser history).

## Architecture

- Frontend: `index.html`, `styles.css`, `script.js`
- Worker backend: `_worker.js`
- Static assets served through binding `ASSETS`
- Auth/session:
  - Google OAuth 2.0 login
  - session cookie: `HttpOnly; Secure; SameSite=Strict`
  - OAuth state cookie: `HttpOnly; Secure; SameSite=Lax`

## Environment Variables

Use `.dev.vars` locally (see `.dev.vars.example`):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (example: `gemini-2.0-flash`)
- `PUBLIC_BASE_URL` (your deployed app origin)

## Google OAuth setup

1. Go to Google Cloud Console.
2. Create OAuth 2.0 Client ID (`Web application`).
3. Add Authorized redirect URI:
   - `https://<your-domain>/api/auth/google/callback`
4. Add Authorized JavaScript origins:
   - `https://<your-domain>`

For Cloudflare Pages default domain, it will look like:
- `https://<project-name>.pages.dev/api/auth/google/callback`

## Local dev (with Wrangler)

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```
2. Create local vars file:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
3. Fill real values in `.dev.vars`.
4. Run:
   ```bash
   wrangler dev
   ```

## Deploy on Cloudflare Pages + Workers

1. Push repo to GitHub.
2. In Cloudflare dashboard, create a new Pages project from GitHub.
3. Build config:
   - Framework preset: `None`
   - Build command: *(empty)*
   - Build output directory: `.`
4. In project settings, add variables/secrets:
   - `GOOGLE_CLIENT_ID` (variable)
   - `GOOGLE_CLIENT_SECRET` (secret)
   - `SESSION_SECRET` (secret)
   - `GEMINI_API_KEY` (secret)
   - `GEMINI_MODEL` (variable, optional)
   - `PUBLIC_BASE_URL` (variable, your Pages URL or custom domain)
5. Redeploy.

## Browser support

- Voice capture requires Web Speech API (`SpeechRecognition` or `webkitSpeechRecognition`).
- Voice output uses `speechSynthesis`.
- HTTPS is required for microphone + secure cookies (Cloudflare Pages provides this).
