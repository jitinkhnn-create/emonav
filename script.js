// Element references
const startListeningBtn = document.getElementById("startListeningBtn");
const stopListeningBtn = document.getElementById("stopListeningBtn");
const clearCurrentBtn = document.getElementById("clearCurrentBtn");
const playbackBtn = document.getElementById("playbackBtn");
const listenerPerspectiveBtn = document.getElementById("listenerPerspectiveBtn");
const confirmTranscriptBtn = document.getElementById("confirmTranscriptBtn");

const bodyCheckSection = document.getElementById("bodyCheckSection");
const bodyCheckQuestion = document.getElementById("bodyCheckQuestion");
const bodySignalInput = document.getElementById("bodySignalInput");
const submitBodyCheckBtn = document.getElementById("submitBodyCheckBtn");

const analysisSection = document.getElementById("analysisSection");
const eventStoryOutput = document.getElementById("eventStoryOutput");
const confirmAnalysisBtn = document.getElementById("confirmAnalysisBtn");
const correctAnalysisBtn = document.getElementById("correctAnalysisBtn");
const correctionSection = document.getElementById("correctionSection");
const correctedEmotion = document.getElementById("correctedEmotion");
const submitCorrectionBtn = document.getElementById("submitCorrectionBtn");

const needsSection = document.getElementById("needsSection");
const needsOutput = document.getElementById("needsOutput");
const confirmNeedBtn = document.getElementById("confirmNeedBtn");
const alternativeNeedBtn = document.getElementById("alternativeNeedBtn");
const alternativeNeedsSection = document.getElementById("alternativeNeedsSection");
const alternativeNeedSelect = document.getElementById("alternativeNeedSelect");
const submitAlternativeNeedBtn = document.getElementById("submitAlternativeNeedBtn");
const alternativeNeedsMessage = document.getElementById("alternativeNeedsMessage");

const resolutionSection = document.getElementById("resolutionSection");
const groundingOutput = document.getElementById("groundingOutput");
const nextStepOutput = document.getElementById("nextStepOutput");

const reflectionSection = document.getElementById("reflectionSection");
const speakReflectionBtn = document.getElementById("speakReflectionBtn");
const saveReflectionBtn = document.getElementById("saveReflectionBtn");
const currentExperienceInput = document.getElementById("currentExperienceInput");
const triggerInput = document.getElementById("triggerInput");
const specificFeelingInput = document.getElementById("specificFeelingInput");

const growthThreadSection = document.getElementById("growthThreadSection");
const growthThreadOutput = document.getElementById("growthThreadOutput");
const changePatternBtn = document.getElementById("changePatternBtn");
const understandPatternBtn = document.getElementById("understandPatternBtn");

const googleLoginBtn = document.getElementById("googleLoginBtn");
const authStatus = document.getElementById("authStatus");
const authUser = document.getElementById("authUser");
const logoutBtn = document.getElementById("logoutBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

const transcriptInput = document.getElementById("transcriptInput");
const statusEl = document.getElementById("status");
const analysisErrorEl = document.getElementById("analysisError");
const historyListEl = document.getElementById("historyList");

const STORAGE_KEY = "emonav_voice_reflections_v2";

// Session state
let currentUser = null;
let currentTranscript = "";
let bodySignal = "";
let analysisResult = null;
let identifiedNeed = "";
let sessionHistory = [];
let listenerPerspectiveText = "";

// Speech recognition
let recognition = null;
let isListening = false;
let accumulatedTranscript = "";

// Initialize
document.addEventListener("DOMContentLoaded", init);

function init() {
  setupSpeechRecognition();
  setupEventListeners();
  checkAuth();
  loadHistory();
  updateListenerPerspectiveState();
  clearAnalysisError();
}

function setupSpeechRecognition() {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    statusEl.textContent = "Status: Speech recognition not supported";
    startListeningBtn.disabled = true;
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => setStatus("Listening...", true);
  recognition.onresult = handleSpeechResult;
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    setStatus(`Error: ${event.error}`, false);
  };
  recognition.onend = () => {
    setStatus("Idle", false);
    stopListeningBtn.disabled = true;
    startListeningBtn.disabled = false;
  };
}

function setupEventListeners() {
  // Recording controls
  startListeningBtn.addEventListener("click", startListening);
  stopListeningBtn.addEventListener("click", stopListening);
  clearCurrentBtn.addEventListener("click", clearCurrent);
  playbackBtn.addEventListener("click", () => speakText(transcriptInput.value));
  listenerPerspectiveBtn.addEventListener("click", playListenerPerspective);
  transcriptInput.addEventListener("input", handleTranscriptInputChange);
  confirmTranscriptBtn.addEventListener("click", confirmTranscript);

  // Body check
  submitBodyCheckBtn.addEventListener("click", submitBodyCheck);

  // Analysis
  confirmAnalysisBtn.addEventListener("click", confirmAnalysis);
  correctAnalysisBtn.addEventListener("click", showCorrection);
  submitCorrectionBtn.addEventListener("click", submitCorrection);

  // Needs
  confirmNeedBtn.addEventListener("click", confirmNeed);
  alternativeNeedBtn.addEventListener("click", showAlternativeNeeds);
  submitAlternativeNeedBtn.addEventListener("click", submitAlternativeNeed);

  // Reflection
  speakReflectionBtn.addEventListener("click", speakReflection);
  saveReflectionBtn.addEventListener("click", saveReflection);

  // Growth thread
  changePatternBtn.addEventListener("click", () => handleGrowthChoice("change"));
  understandPatternBtn.addEventListener("click", () => handleGrowthChoice("understand"));

  // Auth
  logoutBtn.addEventListener("click", logout);
  clearHistoryBtn.addEventListener("click", clearHistory);
}

function startListening() {
  if (!recognition) return;
  transcriptInput.value = "";
  accumulatedTranscript = "";
  listenerPerspectiveBtn.disabled = true;
  listenerPerspectiveText = "";
  analysisResult = null;
  hideAllSections();
  clearAnalysisError();
  recognition.start();
}

function stopListening() {
  if (!recognition) return;
  recognition.stop();
}

function clearCurrent() {
  transcriptInput.value = "";
  hideAllSections();
  setStatus("Idle", false);
  listenerPerspectiveBtn.disabled = true;
  listenerPerspectiveText = "";
  analysisResult = null;
  clearAnalysisError();
}

function handleSpeechResult(event) {
  let interimTranscript = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript;
    if (event.results[i].isFinal) {
      accumulatedTranscript += transcript;
    } else {
      interimTranscript += transcript;
    }
  }

  transcriptInput.value = accumulatedTranscript + interimTranscript;
}

function setStatus(text, listening = false) {
  isListening = listening;
  statusEl.textContent = `Status: ${text}`;
  startListeningBtn.disabled = listening;
  stopListeningBtn.disabled = !listening;
}

function confirmTranscript() {
  currentTranscript = transcriptInput.value.trim();
  if (!currentTranscript) {
    alert("Please record some speech first.");
    return;
  }

  // Show body check section
  bodyCheckQuestion.textContent = `Before we look at what you said — where did you feel this in your body while you were speaking?

For example: chest tight, stomach heavy, throat closed, shoulders raised, jaw clenched, hands restless, breath shallow — or nothing noticeable.

There is no right answer. Even 'I didn't notice anything' is useful information.`;
  bodyCheckSection.hidden = false;
  analysisSection.hidden = true;
  needsSection.hidden = true;
  resolutionSection.hidden = true;
  reflectionSection.hidden = true;
  growthThreadSection.hidden = true;
}

function submitBodyCheck() {
  bodySignal = bodySignalInput.value.trim();
  bodyCheckSection.hidden = true;

  // Generate analysis
  generateAnalysis();
}

async function generateAnalysis() {
  if (!currentUser) {
    alert("Please sign in to continue.");
    return;
  }

  clearAnalysisError();
  try {
    const response = await fetch("/api/infer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: currentTranscript,
        bodySignal: bodySignal,
        previousInput: sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1].transcript : ""
      })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      const errorPayload = data?.error || {};
      const apiMessage = [
        errorPayload.message || data?.message || `Request failed with status ${response.status}`,
        errorPayload.status ? `status ${errorPayload.status}` : "",
        errorPayload.statusText ? errorPayload.statusText : "",
        errorPayload.details ? `details: ${String(errorPayload.details).slice(0, 300)}` : ""
      ].filter(Boolean).join(" | ");
      throw new Error(apiMessage);
    }

    analysisResult = data.result;

    displayAnalysis();
    analysisSection.hidden = false;

  } catch (error) {
    console.error("Analysis error:", error);
    analysisSection.hidden = true;
    needsSection.hidden = true;
    resolutionSection.hidden = true;
    reflectionSection.hidden = true;
    growthThreadSection.hidden = true;
    showAnalysisError(error.message || "Gemini failed to answer.");
    alert(`AI analysis failed: ${error.message || "unknown error"}`);
  }
}

function displayAnalysis() {
  const { event, story, emotion, need, grounding, nextStep } = analysisResult;
  const safeStory = story || "what you just shared";
  listenerPerspectiveText = (analysisResult.listenerPerspective || "").trim();
  updateListenerPerspectiveState();
  const bridgingCopy = story
    ? `We separated what happened from what you are saying it means. Read the story out loud: "${safeStory}". How sure do you feel that this version matches what actually happened?`
    : "We separated the facts from the meaning you gave them. Notice where the two feel different or the same.";
  const confirmationText = `If the story feels right, tap "This Matches My Experience." If it feels off, tap "Something Feels Off" and we can adjust it together.`;

  eventStoryOutput.innerHTML = `
    <div class="analysis-block">
      <h3>THE EVENT (What actually happened):</h3>
      <p>${event}</p>
    </div>
    <div class="analysis-block">
      <h3>THE STORY (What you are currently making it mean):</h3>
      <p>${story}</p>
    </div>
    <p class="bridging-statement">${bridgingCopy}</p>
    <p class="confirmation-question">${confirmationText}</p>
    <div class="listener-perspective">
      <h3>LISTENER PERSPECTIVE</h3>
      <p>${listenerPerspectiveText || "Listener perspective was not returned by the model."}</p>
    </div>
  `;
}

function confirmAnalysis() {
  analysisSection.hidden = true;
  displayNeeds();
  needsSection.hidden = false;
}

function showCorrection() {
  correctionSection.hidden = false;
}

function submitCorrection() {
  const corrected = correctedEmotion.value.trim();
  if (corrected) {
    analysisResult.emotion = corrected;
  }
  correctionSection.hidden = true;
  confirmAnalysis();
}

function displayNeeds() {
  const { need, alternativeNeeds } = analysisResult;

  needsOutput.innerHTML = `
    <div class="needs-block">
      <h3>WHAT THIS MAY BE ASKING FOR:</h3>
      <p>It sounds like you might have been needing ${need} in that moment. Say it out loud and notice how it feels — is that what mattered most to you?</p>
      <p class="needs-question">
        If it feels right, tap "This Feels Closer." If it still misses the mark, tap "Another Possibility" to explore other words or pick one from the list below.
      </p>
    </div>
  `;

  if (alternativeNeeds && alternativeNeeds.length > 0) {
    alternativeNeedsMessage.textContent = `Pick the need that feels truer to what you actually wanted, then press "Continue With This."`;
    alternativeNeedSelect.innerHTML = '<option value="">Choose the need that fits...</option>';
    alternativeNeeds.forEach(altNeed => {
      const option = document.createElement("option");
      option.value = altNeed;
      option.textContent = altNeed;
      alternativeNeedSelect.appendChild(option);
    });
  } else {
    alternativeNeedsMessage.textContent = "There are no extra suggestions right now. If you still want to adjust the feeling, tap \"Another Possibility\" and rewrite your words.";
    alternativeNeedSelect.innerHTML = '<option value="">There are no extra options yet</option>';
  }
}

function confirmNeed() {
  identifiedNeed = analysisResult.need;
  needsSection.hidden = true;
  displayResolution();
  resolutionSection.hidden = false;
}

function showAlternativeNeeds() {
  alternativeNeedsSection.hidden = false;
}

function submitAlternativeNeed() {
  const selected = alternativeNeedSelect.value;
  if (selected) {
    identifiedNeed = selected;
    analysisResult.need = selected;
  }
  alternativeNeedsSection.hidden = true;
  confirmNeed();
}

function displayResolution() {
  const { grounding, nextStep } = analysisResult;

  groundingOutput.innerHTML = `
    <h3>GROUNDING STEPS:</h3>
    <p>${grounding}</p>
  `;

  nextStepOutput.innerHTML = `
    <h3>ONE CONCRETE NEXT STEP:</h3>
    <p>${nextStep}</p>
    <p>This is not about resolving everything. It is about taking one honest step in the right direction within the next 24 hours.</p>
  `;
}

function speakReflection() {
  const reflectionText = `
    Current experience: ${currentExperienceInput.value}
    Trigger: ${triggerInput.value}
    Specific feeling: ${specificFeelingInput.value}
  `;
  speakText(reflectionText);
}

function playListenerPerspective() {
  if (listenerPerspectiveText) {
    speakText(listenerPerspectiveText);
    return;
  }

  alert("Listener perspective is not available yet because the AI did not return it.");
}

function updateListenerPerspectiveState() {
  listenerPerspectiveBtn.disabled = !listenerPerspectiveText;
}

function handleTranscriptInputChange() {
  if (analysisResult) {
    analysisResult = null;
    listenerPerspectiveText = "";
    analysisSection.hidden = true;
    needsSection.hidden = true;
    resolutionSection.hidden = true;
    reflectionSection.hidden = true;
    growthThreadSection.hidden = true;
  }
  updateListenerPerspectiveState();
}

function showAnalysisError(message) {
  if (!analysisErrorEl) return;
  analysisErrorEl.textContent = `AI analysis failed: ${message}`;
  analysisErrorEl.hidden = false;
  analysisErrorEl.classList.add("status-error");
}

function clearAnalysisError() {
  if (!analysisErrorEl) return;
  analysisErrorEl.textContent = "";
  analysisErrorEl.hidden = true;
  analysisErrorEl.classList.remove("status-error");
}

function saveReflection() {
  const reflection = {
    timestamp: new Date().toISOString(),
    transcript: currentTranscript,
    bodySignal: bodySignal,
    analysis: analysisResult,
    identifiedNeed: identifiedNeed,
    reflection: {
      currentExperience: currentExperienceInput.value,
      trigger: triggerInput.value,
      specificFeeling: specificFeelingInput.value
    }
  };

  sessionHistory.push(reflection);
  saveHistory(sessionHistory);

  // Check if we should show growth thread
  if (sessionHistory.length >= 2) {
    generateGrowthThread();
    growthThreadSection.hidden = false;
  } else {
    alert("Reflection saved. Complete more sessions to see growth patterns.");
  }

  updateHistoryDisplay();
}

function generateGrowthThread() {
  // This would be implemented based on the growth thread logic from the prompt
  // For now, show a placeholder
  growthThreadOutput.innerHTML = `
    <h3>YOUR GROWTH THREAD:</h3>
    <p>Across your sessions, patterns are emerging...</p>
    <p>Do you want to change this pattern, or understand it better first?</p>
  `;
}

function handleGrowthChoice(choice) {
  if (choice === "change") {
    alert("Pattern change logic would be implemented here.");
  } else {
    alert("Pattern understanding logic would be implemented here.");
  }
  growthThreadSection.hidden = true;
}

function hideAllSections() {
  bodyCheckSection.hidden = true;
  analysisSection.hidden = true;
  needsSection.hidden = true;
  resolutionSection.hidden = true;
  reflectionSection.hidden = true;
  growthThreadSection.hidden = true;
  correctionSection.hidden = true;
  alternativeNeedsSection.hidden = true;
}

function speakText(text) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function checkAuth() {
  fetch("/api/auth/me")
    .then(res => res.json())
    .then(data => {
      if (data.user) {
        currentUser = data.user;
        authStatus.textContent = "Status: Signed in";
        authUser.textContent = `Welcome, ${data.user.name || data.user.email}`;
        logoutBtn.hidden = false;
      } else {
        authStatus.textContent = "Status: Not signed in";
        logoutBtn.hidden = true;
      }
    })
    .catch(() => {
      authStatus.textContent = "Status: Auth check failed";
    });
}

function logout() {
  fetch("/api/auth/logout", { method: "POST" })
    .then(() => {
      currentUser = null;
      authStatus.textContent = "Status: Signed out";
      authUser.textContent = "";
      logoutBtn.hidden = true;
    });
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    sessionHistory = raw ? JSON.parse(raw) : [];
    updateHistoryDisplay();
  } catch {
    sessionHistory = [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function updateHistoryDisplay() {
  historyListEl.innerHTML = "";
  sessionHistory.slice(-5).reverse().forEach((session, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${new Date(session.timestamp).toLocaleDateString()}</strong><br>
      Need: ${session.identifiedNeed || "Not identified"}<br>
      ${session.reflection ? `Reflection: ${session.reflection.currentExperience.substring(0, 50)}...` : "No reflection"}
    `;
    historyListEl.appendChild(li);
  });
}

function clearHistory() {
  if (confirm("Clear all session history?")) {
    sessionHistory = [];
    saveHistory(sessionHistory);
    updateHistoryDisplay();
  }
}
