# EmoNav Voice Reflection - Hosting Guide

This guide provides complete instructions for hosting the EmoNav Voice Reflection app using Cloudflare Workers and Pages with KV storage for sessions and secrets.

## Prerequisites

- Cloudflare account
- GitHub repository with the EmoNav code
- Google Cloud Console account (for OAuth)
- Gemini AI API key (from Google AI Studio)

## Step 1: Set up Google OAuth

### 1.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Set name to "EmoNav"
   - Add authorized redirect URIs:
     - For local development: `http://localhost:8787/api/auth/google/callback`
     - For production: `https://your-domain.pages.dev/api/auth/google/callback`
   - Add authorized JavaScript origins:
     - For local development: `http://localhost:8787`
     - For production: `https://your-domain.pages.dev`
5. Note down your `Client ID` and `Client Secret`

### 1.2 Get Gemini AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Note down the API key

## Step 2: Set up Cloudflare KV Namespace

### 2.1 Create KV Namespace

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to "Workers & Pages" > "KV"
3. Click "Create namespace"
4. Name it `emonav-sessions` (or any name you prefer)
5. Note down the "Namespace ID" (something like `1234567890abcdef1234567890abcdef`)

### 2.2 Update wrangler.toml

In your `wrangler.toml` file, replace `your_kv_namespace_id_here` with your actual KV namespace ID:

```toml
[[kv_namespaces]]
binding = "EMONAV_SESSIONS"
id = "your_actual_kv_namespace_id_here"
```

## Step 3: Deploy to Cloudflare Pages

### 3.1 Connect GitHub Repository

1. In Cloudflare Dashboard, go to "Workers & Pages"
2. Click "Create application" > "Pages" > "Connect to Git"
3. Select your GitHub repository (`jitinkhnn-create/emonav`)
4. Configure build settings:
   - **Framework preset**: `None`
   - **Build command**: Leave empty
   - **Build output directory**: `.`
   - **Root directory**: Leave empty

### 3.2 Set Environment Variables

In your Pages project settings, go to "Environment variables" and add:

#### Production Environment Variables:
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
PUBLIC_BASE_URL=https://your-project-name.pages.dev
```

#### Preview Environment Variables (for testing):
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
PUBLIC_BASE_URL=https://your-project-name.pages.dev
```

### 3.3 Configure KV Namespace Binding

In your Pages project settings:

1. Go to "Functions" > "KV namespace bindings"
2. Add a binding:
   - **Variable name**: `EMONAV_SESSIONS`
   - **KV namespace**: Select the `emonav-sessions` namespace you created

### 3.4 Deploy

1. Go back to "Deployments" in your Pages project
2. Click "Create deployment"
3. Cloudflare will build and deploy your app
4. Once deployed, note your production URL (e.g., `https://emonav.pages.dev`)

## Step 4: Update Google OAuth Redirect URI

Go back to Google Cloud Console and update the authorized redirect URI to your actual Cloudflare Pages URL:

```
https://your-project-name.pages.dev/api/auth/google/callback
```

## Step 5: Test the Application

1. Visit your deployed URL
2. Click "Continue with Google" to sign in
3. Test the voice recording and analysis features
4. Verify that sessions persist across page reloads

## Step 6: Local Development (Optional)

For local development with Wrangler:

### 6.1 Install Wrangler

```bash
npm install -g wrangler
```

### 6.2 Create Local Environment File

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars` with your actual values:

```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
PUBLIC_BASE_URL=http://localhost:8787
```

### 6.3 Create Local KV Namespace

```bash
# Create local KV namespace
wrangler kv:namespace create "EMONAV_SESSIONS"

# Note the namespace ID and update wrangler.toml
```

### 6.4 Run Locally

```bash
wrangler dev
```

Visit `http://localhost:8787` to test locally.

## Troubleshooting

### Common Issues:

1. **"Invalid OAuth access token"**
   - Check that your Google OAuth credentials are correct
   - Verify the redirect URI matches exactly

2. **"KV namespace not found"**
   - Ensure the KV namespace ID in `wrangler.toml` is correct
   - Check that the KV binding is properly configured in Cloudflare

3. **"Gemini API error"**
   - Verify your Gemini API key is valid
   - Check that the API key has sufficient quota

4. **Session not persisting**
   - Ensure cookies are enabled in your browser
   - Check that the domain matches your PUBLIC_BASE_URL

### Debug Commands:

```bash
# Check KV namespace contents
wrangler kv:key list --namespace-id YOUR_NAMESPACE_ID

# View deployment logs
# In Cloudflare Dashboard > Workers & Pages > Your project > Logs
```

## Security Notes

- All session data is stored in Cloudflare KV with automatic expiration (7 days)
- Cookies are HttpOnly, Secure, and SameSite=Strict
- API keys are stored as environment variables, never exposed to the client
- All authentication happens server-side in the Worker

## Cost Considerations

- **Cloudflare Pages**: Free tier includes 100 GB bandwidth/month
- **Cloudflare Workers**: Free tier includes 100,000 requests/day
- **Cloudflare KV**: Free tier includes 1 GB storage, 10 million operations/month
- **Gemini AI API**: Pay-as-you-go pricing (see Google AI pricing)
- **Google OAuth**: Free

## Support

If you encounter issues:

1. Check the browser console for JavaScript errors
2. Check Cloudflare Workers logs in the dashboard
3. Verify all environment variables are set correctly
4. Ensure your domain is added to Google OAuth authorized origins

---

**Your EmoNav Voice Reflection app is now ready to help users process emotions through voice-powered self-reflection!** 🎉