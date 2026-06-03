import { useCallback, useEffect, useRef, useState } from 'react';

interface VoiceRecorderState {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  audioBlob: Blob | null;
  audioBlobUrl: string | null;
  error: string | null;
  supported: { mediaRecorder: boolean; speechRecognition: boolean };
}

export default function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    transcript: '',
    interimTranscript: '',
    audioBlob: null,
    audioBlobUrl: null,
    error: null,
    supported: {
      mediaRecorder: typeof MediaRecorder !== 'undefined',
      speechRecognition:
        typeof (window as any).SpeechRecognition !== 'undefined' ||
        typeof (window as any).webkitSpeechRecognition !== 'undefined',
    },
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const isRecordingRef = useRef(false);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const startRecognition = useCallback((lang = 'en-IN') => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let interim = '';
      let newFinal = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += text + ' ';
        } else {
          interim += text;
        }
      }
      if (newFinal) {
        finalTranscriptRef.current += newFinal;
        setState((s) => ({
          ...s,
          transcript: finalTranscriptRef.current.trim(),
          interimTranscript: interim,
        }));
      } else {
        setState((s) => ({ ...s, interimTranscript: interim }));
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore no-speech errors — just restart
      if (event.error === 'no-speech' && isRecordingRef.current) {
        recognition.stop();
        return;
      }
      if (event.error === 'not-allowed') {
        setState((s) => ({
          ...s,
          error: 'EmoNav needs your microphone to work. Please allow access and try again.',
        }));
      }
    };

    recognition.onend = () => {
      // Auto-restart on silence if still recording
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}
  }, []);

  const startRecording = useCallback(async () => {
    setState((s) => ({
      ...s,
      isRecording: true,
      transcript: '',
      interimTranscript: '',
      audioBlob: null,
      audioBlobUrl: null,
      error: null,
    }));
    finalTranscriptRef.current = '';
    isRecordingRef.current = true;
    chunksRef.current = [];

    // Request mic access
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState((s) => ({
        ...s,
        isRecording: false,
        error: 'EmoNav needs your microphone to work. Please allow access and try again.',
      }));
      isRecordingRef.current = false;
      return;
    }

    // MediaRecorder for audio blob
    if (state.supported.mediaRecorder) {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mr = new MediaRecorder(stream, { mimeType });
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = mr;
      mr.start(500);
    }

    // Speech recognition for live transcript
    startRecognition('en-IN');
  }, [startRecognition, state.supported.mediaRecorder]);

  const stopRecording = useCallback((): Promise<{ blob: Blob | null; blobUrl: string | null; transcript: string }> => {
    return new Promise((resolve) => {
      isRecordingRef.current = false;
      stopRecognition();

      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') {
        mr.onstop = () => {
          const mimeType = mr.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);
          // Stop all tracks
          mr.stream.getTracks().forEach((t) => t.stop());
          setState((s) => ({
            ...s,
            isRecording: false,
            interimTranscript: '',
            audioBlob: blob,
            audioBlobUrl: blobUrl,
          }));
          resolve({ blob, blobUrl, transcript: finalTranscriptRef.current.trim() });
        };
        mr.stop();
      } else {
        setState((s) => ({ ...s, isRecording: false, interimTranscript: '' }));
        resolve({ blob: null, blobUrl: null, transcript: finalTranscriptRef.current.trim() });
      }
    });
  }, [stopRecognition]);

  const reset = useCallback(() => {
    finalTranscriptRef.current = '';
    chunksRef.current = [];
    setState((s) => ({
      ...s,
      transcript: '',
      interimTranscript: '',
      audioBlob: null,
      audioBlobUrl: null,
      error: null,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      stopRecognition();
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stopRecognition]);

  return {
    ...state,
    startRecording,
    stopRecording,
    reset,
  };
}
