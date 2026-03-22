const startListeningBtn = document.getElementById("startListeningBtn");
const stopListeningBtn = document.getElementById("stopListeningBtn");
const clearCurrentBtn = document.getElementById("clearCurrentBtn");
const playbackBtn = document.getElementById("playbackBtn");
const listenerPerspectiveBtn = document.getElementById("listenerPerspectiveBtn");
const confirmMeaningBtn = document.getElementById("confirmMeaningBtn");
const speakReplyBtn = document.getElementById("speakReplyBtn");
const speakSupportBtn = document.getElementById("speakSupportBtn");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const logoutBtn = document.getElementById("logoutBtn");

const startReflectionBtn = document.getElementById("startReflectionBtn");
const speakReflectionBtn = document.getElementById("speakReflectionBtn");
const saveReflectionBtn = document.getElementById("saveReflectionBtn");
const currentExperienceInput = document.getElementById("currentExperienceInput");
const triggerInput = document.getElementById("triggerInput");
const specificFeelingInput = document.getElementById("specificFeelingInput");
const reflectionQuestions = document.getElementById("reflectionQuestions");
const growthThreadOutput = document.getElementById("growthThreadOutput");

const googleLoginBtn = document.getElementById("googleLoginBtn");
const authStatus = document.getElementById("authStatus");
const authUser = document.getElementById("authUser");

const transcriptInput = document.getElementById("transcriptInput");
const statusEl = document.getElementById("status");
const replyOutput = document.getElementById("replyOutput");
const listenerPerspectiveOutput = document.getElementById("listenerPerspectiveOutput");
const supportOutput = document.getElementById("supportOutput");

const emotionScoreEl = document.getElementById("emotionScore");
const confidenceScoreEl = document.getElementById("confidenceScore");
const pointScoreEl = document.getElementById("pointScore");
const wordChoiceNotesEl = document.getElementById("wordChoiceNotes");
const comparisonOutputEl = document.getElementById("comparisonOutput");
const historyListEl = document.getElementById("historyList");

const STORAGE_KEY = "emonav_voice_reflections_v1";

const positiveWords = ["calm", "hopeful", "better", "strong", "grateful", "okay", "fine", "confident", "focused", "good", "happy"];
const challengingWords = ["anxious", "afraid", "fear", "scared", "stressed", "overwhelmed", "sad", "angry", "alone", "lost", "worthless"];
const fillerWords = ["um", "uh", "like", "you know", "actually", "basically", "kind of", "sort of"];

let finalReplyText = "";
let finalSupportText = "";
let currentUser = null;
let reflectionQuestionsText = "";
let growthInsights = "";

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function speakText(text) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.96;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function setStatus(text, listening = false) {
  isListening = listening;
  statusEl.textContent = `Status: ${text}`;
  startListeningBtn.disabled = listening;
  stopListeningBtn.disabled = !listening;
}

function normalizeScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 50;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function countMatches(text, dictionary) {
  const lower = text.toLowerCase();
  return dictionary.reduce((acc, word) => {
    if (word.includes(" ")) return acc + (lower.includes(word) ? 1 : 0);
    return acc + (lower.split(/\W+/).filter((token) => token === word).length || 0);
  }, 0);
}

function extractTopWords(text) {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "to", "is", "am", "are", "was", "were", "be", "i", "me", "my", "it", "of", "for", "on", "in", "that", "this", "with", "as", "at", "from", "have", "has", "had"
  ]);

  const counts = {};
  text
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .forEach((word) => {
      counts[word] = (counts[word] || 0) + 1;
    });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((entry) => entry[0]);
}

function localEmotionLabel(text) {
  const pos = countMatches(text, positiveWords);
  const neg = countMatches(text, challengingWords);
  const net = pos - neg;
  if (net >= 2) return "Mostly positive / steady";
  if (net <= -2) return "Emotionally heavy / distressed";
  return "Mixed emotions / neutral";
}

function localConfidenceScore(text) {
  const uncertainty = ["maybe", "not sure", "i guess", "perhaps", "i think", "probably"];
  const confidenceCues = ["i will", "i can", "i am sure", "definitely", "clear", "certain"];
  const score = 50 + countMatches(text, confidenceCues) * 15 - countMatches(text, uncertainty) * 10;
  return normalizeScore(score);
}

function localPointScore(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const fillerCount = countMatches(text, fillerWords);
  const sentenceCount = text.split(/[.?!]+/).filter((s) => s.trim().length > 0).length || 1;
  const avgWordsPerSentence = words.length / sentenceCount;
  const score = 100 - fillerCount * 12 - (avgWordsPerSentence > 25 ? 10 : 0);
  return normalizeScore(score);
}

function createLocalListenerPerspective(text) {
  const emotionLabel = localEmotionLabel(text);
  const confidence = localConfidenceScore(text);
  const point = localPointScore(text);

  const tone = emotionLabel === "Emotionally heavy / distressed"
    ? "emotionally heavy and vulnerable"
    : emotionLabel === "Mostly positive / steady"
      ? "steady and constructive"
      : "mixed and searching for clarity";

  const confidenceText = confidence >= 70 ? "clear and confident" : confidence >= 45 ? "partly clear with some uncertainty" : "uncertain and needing support";
  const pointText = point >= 70 ? "direct" : point >= 45 ? "somewhat indirect" : "not yet to the point";

  return `Another person may hear this as ${tone}. They may understand you as ${confidenceText}. Your message may land as ${pointText}. Consider adding one direct line: "Right now I need _____."`;
}

function compareWithLast(current, previous) {
  if (!previous) return "No previous interaction for comparison yet.";

  const confidenceDiff = current.confidenceScore - previous.confidenceScore;
  const pointDiff = current.pointScore - previous.pointScore;
  const emotionLine = current.emotionLabel === previous.emotionLabel
    ? "Emotion pattern is similar to your last input."
    : `Emotion pattern changed from "${previous.emotionLabel}" to "${current.emotionLabel}".`;

  const newWords = current.topWords.filter((word) => !(previous.topWords || []).includes(word));
  const droppedWords = (previous.topWords || []).filter((word) => !current.topWords.includes(word));

  return [
    emotionLine,
    `Confidence moved ${confidenceDiff >= 0 ? "up" : "down"} by ${Math.abs(confidenceDiff)} points.`,
    `To-the-point score moved ${pointDiff >= 0 ? "up" : "down"} by ${Math.abs(pointDiff)} points.`,
    `Newly frequent words: ${newWords.length ? newWords.join(", ") : "none"}.`,
    `Less frequent words: ${droppedWords.length ? droppedWords.join(", ") : "none"}.`
  ].join(" ");
}

function generateReflectionQuestions() {
  return [
    "What is your experience now after the grounding exercises?",
    "What ignited your earlier emotional burst? What was the trigger?",
    "Did you feel fear, being stuck between what is right and what should be done, or something else? Describe the specific feeling or dilemma.",
    "How has your perspective shifted since your initial input?"
  ];
}

function analyzeReflectionGrowth(currentReflection, previousInteractions) {
  const currentExp = (currentReflection.currentExperience || "").toLowerCase();
  const trigger = (currentReflection.trigger || "").toLowerCase();
  const feeling = (currentReflection.specificFeeling || "").toLowerCase();

  let insights = [];

  // Analyze current experience
  if (currentExp.includes("calm") || currentExp.includes("better") || currentExp.includes("peace")) {
    insights.push("You're showing positive growth in emotional regulation.");
  } else if (currentExp.includes("still") || currentExp.includes("same")) {
    insights.push("This suggests the grounding techniques may need more time or different approaches.");
  }

  // Analyze triggers
  if (trigger.includes("work") || trigger.includes("relationship") || trigger.includes("stress")) {
    insights.push("External stressors are common triggers - consider proactive coping strategies.");
  }

  // Analyze specific feelings
  if (feeling.includes("fear") || feeling.includes("afraid")) {
    insights.push("Fear often masks deeper needs. Your direct expression is a step toward clarity.");
  } else if (feeling.includes("stuck") || feeling.includes("between")) {
    insights.push("Feeling caught between options is normal. Your growing awareness will help resolve this.");
  }

  // Compare with previous patterns
  if (previousInteractions.length > 0) {
    const recent = previousInteractions.slice(-3);
    const avgConfidence = recent.reduce((sum, i) => sum + (i.confidenceScore || 50), 0) / recent.length;
    const currentSession = previousInteractions[previousInteractions.length - 1];
    
    if (currentSession && currentSession.confidenceScore > avgConfidence) {
      insights.push("Your confidence in expression is trending upward across sessions.");
    }
  }

  return insights.length ? insights.join(" ") : "Continue reflecting to build clearer patterns of growth and insight.";
}

function updateAnalysisUI(result) {
  emotionScoreEl.textContent = result.emotionLabel;
  confidenceScoreEl.textContent = `${result.confidenceScore}/100`;
  pointScoreEl.textContent = `${result.pointScore}/100`;
  wordChoiceNotesEl.textContent = result.wordChoiceNotes || "-";
}

function renderHistory() {
  const history = loadHistory();
  historyListEl.innerHTML = "";
  if (!history.length) {
    const li = document.createElement("li");
    li.textContent = "No saved interactions yet.";
    historyListEl.appendChild(li);
    return;
  }

  const recent = [...history].slice(-8).reverse();
  recent.forEach((entry) => {
    const li = document.createElement("li");
    const date = new Date(entry.createdAt).toLocaleString();
    const reflection = entry.reflection ? " (with reflection)" : "";
    li.textContent = `${date}${reflection} | Emotion: ${entry.emotionLabel} | Confidence: ${entry.confidenceScore} | Point: ${entry.pointScore} | Top words: ${(entry.topWords || []).join(", ") || "n/a"}`;
    
    if (entry.growthInsights) {
      const insightsP = document.createElement("p");
      insightsP.textContent = `Growth: ${entry.growthInsights}`;
      insightsP.style.margin = "0.25rem 0 0 1rem";
      insightsP.style.fontSize = "0.9rem";
      insightsP.style.color = "var(--ok)";
      li.appendChild(insightsP);
    }
    
    historyListEl.appendChild(li);
  });
}

function setAuthenticatedUI(user) {
  currentUser = user;
  const authenticated = Boolean(user);
  confirmMeaningBtn.disabled = !authenticated;

  if (authenticated) {
    authStatus.textContent = "Status: Signed in";
    authUser.textContent = `${user.name || "User"} (${user.email || "no-email"})`;
    logoutBtn.hidden = false;
    googleLoginBtn.hidden = true;
  } else {
    authStatus.textContent = "Status: Sign in required for AI analysis";
    authUser.textContent = "";
    logoutBtn.hidden = true;
    googleLoginBtn.hidden = false;
  }
}

async function checkAuth() {
  try {
    const res = await fetch("/api/auth/me", { method: "GET", credentials: "same-origin" });
    if (!res.ok) {
      setAuthenticatedUI(null);
      return;
    }
    const data = await res.json();
    if (data?.authenticated && data?.user) {
      setAuthenticatedUI(data.user);
    } else {
      setAuthenticatedUI(null);
    }
  } catch {
    setAuthenticatedUI(null);
  }
}

async function inferWithGemini(input, previousInput) {
  const res = await fetch("/api/infer", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input, previousInput })
  });

  if (res.status === 401) {
    setAuthenticatedUI(null);
    throw new Error("Please sign in with Google to continue.");
  }

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Inference failed: ${txt}`);
  }

  const data = await res.json();
  return data.result;
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setStatus("Speech recognition not supported in this browser.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => setStatus("Listening...", true);
  recognition.onerror = (event) => setStatus(`Error: ${event.error}`);
  recognition.onend = () => setStatus("Idle");

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = 0; i < event.results.length; i += 1) {
      transcript += event.results[i][0].transcript;
      if (!event.results[i].isFinal) transcript += " ";
    }
    transcriptInput.value = transcript.trim();
  };
}

startListeningBtn.addEventListener("click", () => {
  if (!recognition) return;
  recognition.start();
});

stopListeningBtn.addEventListener("click", () => {
  if (!recognition || !isListening) return;
  recognition.stop();
});

clearCurrentBtn.addEventListener("click", () => {
  transcriptInput.value = "";
  finalReplyText = "";
  finalSupportText = "";
  replyOutput.textContent = "Confirm your input to generate the response.";
  listenerPerspectiveOutput.textContent = "Choose the second listen option to hear a listener-perspective interpretation.";
  supportOutput.textContent = "Confirm your input to get tailored suggestions for calming and returning to the present moment.";
  speakReplyBtn.disabled = true;
  speakSupportBtn.disabled = true;
  emotionScoreEl.textContent = "-";
  confidenceScoreEl.textContent = "-";
  pointScoreEl.textContent = "-";
  wordChoiceNotesEl.textContent = "-";
  // Reset reflection state
  reflectionQuestions.hidden = true;
  currentExperienceInput.value = "";
  triggerInput.value = "";
  specificFeelingInput.value = "";
  speakReflectionBtn.disabled = true;
  startReflectionBtn.disabled = false;
  growthThreadOutput.textContent = "Complete a reflection to see your growth insights.";
});

playbackBtn.addEventListener("click", () => {
  const text = transcriptInput.value.trim();
  if (!text) {
    setStatus("Please provide voice/text input first.");
    return;
  }
  speakText(text);
  setStatus("Playing your input back for confirmation.");
});

listenerPerspectiveBtn.addEventListener("click", () => {
  const text = transcriptInput.value.trim();
  if (!text) {
    setStatus("Please provide voice/text input first.");
    return;
  }

  const perspectiveText = createLocalListenerPerspective(text);
  listenerPerspectiveOutput.textContent = perspectiveText;
  speakText(perspectiveText);
  setStatus("Playing listener-perspective interpretation.");
});

confirmMeaningBtn.addEventListener("click", async () => {
  const transcript = transcriptInput.value.trim();
  if (!transcript) {
    setStatus("Please provide input before confirming.");
    return;
  }
  if (!currentUser) {
    setStatus("Sign in with Google first.");
    return;
  }

  setStatus("Analyzing input with Gemini...");

  const history = loadHistory();
  const previous = history.length ? history[history.length - 1] : null;

  try {
    const ai = await inferWithGemini(transcript, previous?.transcript || "");

    const current = {
      transcript,
      emotionLabel: ai.emotionLabel || localEmotionLabel(transcript),
      confidenceScore: normalizeScore(ai.confidenceScore),
      pointScore: normalizeScore(ai.pointScore),
      wordChoiceNotes: ai.wordChoiceNotes || "",
      topWords: extractTopWords(transcript),
      createdAt: new Date().toISOString()
    };

    finalReplyText = ai.acknowledgment || "Thank you for sharing openly.";
    finalSupportText = ai.supportSuggestions || "Take 5 deep breaths and pause for 5 minutes.";

    replyOutput.textContent = finalReplyText;
    supportOutput.textContent = finalSupportText;
    listenerPerspectiveOutput.textContent = ai.listenerPerspective || createLocalListenerPerspective(transcript);

    speakReplyBtn.disabled = false;
    speakSupportBtn.disabled = false;

    updateAnalysisUI(current);
    comparisonOutputEl.textContent = compareWithLast(current, previous);

    history.push(current);
    saveHistory(history);
    renderHistory();
    setStatus("Input confirmed and analyzed.");
  } catch (err) {
    setStatus(err.message || "Analysis failed.");
  }
});

speakReplyBtn.addEventListener("click", () => {
  if (!finalReplyText) return;
  speakText(finalReplyText);
});

speakSupportBtn.addEventListener("click", () => {
  if (!finalSupportText) return;
  speakText(finalSupportText);
});

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  comparisonOutputEl.textContent = "No previous interactions yet. Complete one confirmation to begin trend tracking.";
  renderHistory();
});

startReflectionBtn.addEventListener("click", () => {
  const questions = generateReflectionQuestions();
  reflectionQuestionsText = questions.join(" ");
  reflectionQuestions.hidden = false;
  speakReflectionBtn.disabled = false;
  startReflectionBtn.disabled = true;
  setStatus("Reflection questions ready. Take your time to respond thoughtfully.");
});

speakReflectionBtn.addEventListener("click", () => {
  if (!reflectionQuestionsText) return;
  speakText(reflectionQuestionsText);
});

saveReflectionBtn.addEventListener("click", () => {
  const currentExp = currentExperienceInput.value.trim();
  const trigger = triggerInput.value.trim();
  const feeling = specificFeelingInput.value.trim();

  if (!currentExp && !trigger && !feeling) {
    setStatus("Please provide at least one reflection response.");
    return;
  }

  const reflection = {
    currentExperience: currentExp,
    trigger: trigger,
    specificFeeling: feeling,
    timestamp: new Date().toISOString()
  };

  const history = loadHistory();
  const lastSession = history.length > 0 ? history[history.length - 1] : null;
  
  if (lastSession && !lastSession.reflection) {
    lastSession.reflection = reflection;
    lastSession.growthInsights = analyzeReflectionGrowth(reflection, history.slice(0, -1));
    saveHistory(history);
    renderHistory();
  }

  growthInsights = analyzeReflectionGrowth(reflection, history);
  growthThreadOutput.textContent = growthInsights;
  
  // Reset form
  currentExperienceInput.value = "";
  triggerInput.value = "";
  specificFeelingInput.value = "";
  reflectionQuestions.hidden = true;
  speakReflectionBtn.disabled = true;
  startReflectionBtn.disabled = false;
  
  setStatus("Reflection saved. Growth insights generated.");
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  setAuthenticatedUI(null);
  setStatus("Logged out.");
});

initSpeechRecognition();
renderHistory();
checkAuth();
