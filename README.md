# EmoNav Voice Reflection App

A voice reflection tool that helps people hear themselves clearly, separate facts from the stories they construct, identify what they genuinely need, and take one honest step forward.

## Core Flow

1. **Record Voice Input** - User records their thoughts via speech-to-text
2. **Body Check** - User reports physical sensations experienced while speaking
3. **Event vs Story Separation** - Analysis separates observable facts from constructed interpretations
4. **Needs Identification** - Identifies unmet needs beneath the expressed emotion
5. **Grounding & Next Step** - Provides immediate calming techniques and one concrete action
6. **End-of-Session Reflection** - User reflects on their experience for growth tracking
7. **Growth Thread Pattern** - Identifies recurring patterns across sessions (after 2+ sessions)

## Psychological Framework

- **Not a therapist or diagnosis tool** - Acts as a precise, honest mirror
- **Mandatory language rules** - Uses observation-based language ("Your words carry signals that often accompany...")
- **Event vs Story separation** - Distinguishes facts from interpretations
- **Need identification** - Maps emotions to underlying unmet needs
- **Action-oriented** - Provides one concrete, doable next step per session

## Architecture

- Frontend: `index.html`, `styles.css`, `script.js`
- Backend: Cloudflare Worker (`_worker.js`) with KV storage
- Authentication: Google OAuth 2.0 with KV-based sessions
- AI: Gemini API for structured psychological analysis
- Storage: Cloudflare KV for session data, localStorage for user history
- Static assets served through Cloudflare Pages

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
