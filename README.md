# EmoNav Voice Reflection App

Voice reflection app with:

- Google OAuth authentication
- Secure session management with Cloudflare KV storage
- Gemini AI inference from backend (API key never exposed to browser)
- Cloudflare Worker API + Pages static hosting

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
6. End-of-session reflection for growth tracking.

## Architecture

- Frontend: `index.html`, `styles.css`, `script.js`
- Backend: Cloudflare Worker (`_worker.js`) with KV storage
- Authentication: Google OAuth 2.0 with KV-based sessions
- AI: Gemini API for emotional analysis
- Storage: Cloudflare KV for session data, localStorage for user history
- Static assets served through Cloudflare Pages
- Auth/session:
  - Google OAuth 2.0 login
  - Session data stored in Cloudflare KV
  - Session cookie: `HttpOnly; Secure; SameSite=Strict`
  - OAuth state cookie: `HttpOnly; Secure; SameSite=Lax`

## Environment Variables

Use `.dev.vars` locally (see `.dev.vars.example`):

- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
- `GEMINI_API_KEY` - Your Gemini AI API key
- `GEMINI_MODEL` (optional, default: `gemini-2.0-flash`)
- `PUBLIC_BASE_URL` - Your deployed app origin (e.g., `https://your-app.pages.dev`)

## Cloudflare Resources Required

- **KV Namespace**: For storing user sessions
- **Pages Project**: For hosting static assets
- **Worker**: For API endpoints and authentication

## Deployment

For complete hosting instructions, see [HOSTING.md](HOSTING.md) which includes:

- Google OAuth setup
- Cloudflare KV namespace configuration
- Pages deployment with environment variables
- Local development setup
- Troubleshooting guide

## Quick Local Development

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```
2. Create local vars file:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
3. Fill real values in `.dev.vars`.
4. Create KV namespace:
   ```bash
   wrangler kv:namespace create "EMONAV_SESSIONS"
   ```
5. Update `wrangler.toml` with your KV namespace ID
6. Run:
   ```bash
   wrangler dev
   ```

## Production Deployment

See [HOSTING.md](HOSTING.md) for complete Cloudflare Pages + Workers deployment instructions.

## Browser Support

- Voice capture requires Web Speech API (`SpeechRecognition` or `webkitSpeechRecognition`)
- Voice output uses `speechSynthesis`
- HTTPS is required for microphone access and secure cookies (Cloudflare Pages provides this)

## Features

- **Voice Input**: Record and transcribe spoken thoughts
- **Dual Playback**: Hear exact words or listener perspective
- **AI Analysis**: Emotional signals, confidence, directness scoring
- **Growth Tracking**: Compare sessions and track improvement
- **Grounding Support**: Immediate calming techniques
- **Session Reflection**: End-of-session insights and growth threads
- **Secure Auth**: Google OAuth with KV-based sessions
