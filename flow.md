# EmoNav Conversation Flow

## 1) Authentication and setup
1. User opens app.
2. Frontend calls `GET /api/auth/me`.
3. If authenticated, frontend calls `GET /api/ai/status`.
4. Worker validates session and checks Gemini connectivity/model.
5. UI shows either:
   - `AI setup OK. Gemini model: <model>`
   - or a clear setup failure message.

## 2) Voice capture
1. User clicks `Start listening`.
2. Browser speech recognition transcribes voice into the input box.
3. User can click `Playback` to hear exact transcript (local TTS only).

## 3) Listen: how it may land for others
1. User clicks `Listen: how it may land for others`.
2. Frontend validates:
   - transcript exists
   - user is signed in
3. Frontend calls `POST /api/infer` with:
   - `input` = current transcript
   - `previousInput` = last saved transcript (if any)
4. Worker calls Gemini and returns strict JSON.
5. Frontend reads `listenerPerspective` from Gemini result, displays it, and speaks it.
6. If API fails, frontend shows explicit error status.

## 4) This is what I mean (confirm)
1. User clicks `This is what I mean`.
2. Frontend validates transcript + sign-in.
3. Frontend calls `POST /api/infer` (same endpoint).
4. Worker calls Gemini and returns:
   - `emotionLabel`
   - `confidenceScore`
   - `pointScore`
   - `wordChoiceNotes`
   - `listenerPerspective`
   - `acknowledgment`
   - `supportSuggestions`
5. Frontend updates UI with Gemini outputs.
6. Current interaction is saved into local history for trend comparison.

## 5) Reflection and growth
1. User starts reflection questions (local generation).
2. User saves reflection answers.
3. Frontend attaches reflection to latest session and updates growth insight text in local history.

## 6) Error behavior
1. Worker returns clear HTTP errors for auth, bad input, or Gemini failure.
2. Frontend parses server error payload and shows readable status.
3. No hardcoded fallback response is used for confirmed AI output paths.
