import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  Upload,
  Volume2,
  Copy,
  Check,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  Languages,
  MapPin,
  FileAudio,
  Radio,
  Sparkles,
} from 'lucide-react';
import {
  LanguageCode,
  DetectedLanguageLabel,
  SubmissionRecord,
} from '../types';
import { TYPEWRITER_PHRASES } from './HeaderWithTypewriter';
import { QrCodePanel } from './QrCodePanel';

interface VoiceTextCaptureHeroProps {
  activePhraseIndex: number;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  isQrModalOpen: boolean;
  onOpenQrModal: () => void;
  onCloseQrModal: () => void;
}

const KENYAN_LOCATIONS = [
  'Nairobi · Westlands / CBD',
  'Nairobi · Roysambu / Kasarani',
  'Nairobi · Embakasi / Umoja',
  'Nairobi · Kibra / Langata',
  'Mombasa · Mvita / Nyali',
  'Kisumu · Kisumu Central',
  'Nakuru · Nakuru Town East',
  'Kiambu · Thika / Ruiru',
  'Uasin Gishu · Eldoret',
  'Machakos · Machakos Town',
];

// Kenyan linguistic classifier
function detectClientLanguage(rawText: string): DetectedLanguageLabel {
  const lower = rawText.toLowerCase();
  const shengWords = [
    'manze', 'rada', 'noma', 'mtaani', 'wasee', 'bazenga', 'form', 'kuom',
    'kanairo', 'chapaa', 'nduthi', 'mbogi', 'nganya', 'keja', 'morio',
    'doba', 'mavitu', 'aresa', 'buda', 'sindano', 'tuchanue', 'tutaisort',
    'imetoka', 'kupanic', 'imebeat', 'riba', 'bonga', 'chali', 'madhe'
  ];
  const swahiliWords = [
    'habari', 'jambo', 'tafadhali', 'shida', 'tatizo', 'stima', 'maji',
    'barabara', 'serikali', 'huduma', 'tunaomba', 'watu', 'mtaa', 'hospitali',
    'taka', 'usafi', 'usalama', 'jirani', 'hapa', 'sana', 'kazi', 'tatua',
    'tuambie', 'mwananchi', 'haraka', 'shule'
  ];

  let shengScore = 0;
  let swahiliScore = 0;

  for (const w of shengWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) shengScore += 2;
  }
  for (const w of swahiliWords) {
    if (new RegExp(`\\b${w}\\b`, 'i').test(lower)) swahiliScore += 1;
  }

  if (shengScore >= 2) return 'Sheng';
  if (swahiliScore >= 1) return 'Kiswahili';
  return 'English';
}

export const VoiceTextCaptureHero: React.FC<VoiceTextCaptureHeroProps> = ({
  activePhraseIndex,
  textareaRef,
  isQrModalOpen,
  onOpenQrModal,
  onCloseQrModal,
}) => {
  const [text, setText] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [languageHint, setLanguageHint] = useState<LanguageCode>('auto');
  const [detectedLanguage, setDetectedLanguage] = useState<DetectedLanguageLabel | null>(null);
  const [englishTranslation, setEnglishTranslation] = useState<string>('');
  const [captureMethod, setCaptureMethod] = useState<'voice' | 'text' | 'hybrid'>('text');

  // Recording & AI Transcription states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([20, 32, 24, 40, 26, 36, 22, 28]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [sampleLoadingLang, setSampleLoadingLang] = useState<string | null>(null);
  const [lastSampleAudioUrl, setLastSampleAudioUrl] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Submission states
  const [countyOrWard, setCountyOrWard] = useState(KENYAN_LOCATIONS[0]);
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSubmission, setLatestSubmission] = useState<SubmissionRecord | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [submissionFilter, setSubmissionFilter] = useState<'All' | DetectedLanguageLabel>('All');
  const [copiedText, setCopiedText] = useState(false);

  // Refs for MediaRecorder, Web Audio API, and SpeechRecognition
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isRecordingStateRef = useRef<boolean>(false);

  const currentPhrase = TYPEWRITER_PHRASES[activePhraseIndex] || TYPEWRITER_PHRASES[0];

  // Fetch initial submissions on mount
  useEffect(() => {
    fetch('/api/submissions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.submissions)) {
          setSubmissions(data.submissions);
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  // Sync ref with state
  useEffect(() => {
    isRecordingStateRef.current = isRecording;
  }, [isRecording]);

  const stopAllAudioResources = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudioResources();
    };
  }, [stopAllAudioResources]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const transcribeAudioWithGemini = async (audioBlob: Blob, mimeType: string, currentClientText: string) => {
    setIsTranscribing(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType,
          languageHint,
          clientTranscript: currentClientText,
        }),
      });

      const data = await response.json();

      if (data.transcript && data.transcript.trim()) {
        const refined = data.transcript.trim();
        if (!currentClientText || refined.length >= currentClientText.length) {
          setText(refined);
        }
        setCaptureMethod((prev) => (prev === 'text' ? 'voice' : 'hybrid'));
      }

      if (data.detectedLanguage) {
        setDetectedLanguage(data.detectedLanguage);
      } else if (currentClientText) {
        setDetectedLanguage(detectClientLanguage(currentClientText));
      }

      if (data.englishTranslation) {
        setEnglishTranslation(data.englishTranslation);
      }
    } catch {
      if (currentClientText) {
        setDetectedLanguage(detectClientLanguage(currentClientText));
      }
    } finally {
      setIsTranscribing(false);
      setInterimTranscript('');
    }
  };

  const startRecording = async () => {
    setVoiceNotice(null);
    setLatestSubmission(null);

    // 1. Initialize real-time Web Speech Recognition
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // Choose universal BCP-47 speech locale
        if (languageHint === 'sw') {
          recognition.lang = 'sw';
        } else if (languageHint === 'sheng') {
          recognition.lang = 'sw';
        } else {
          recognition.lang = 'en-US';
        }

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let newFinal = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const piece = event.results[i][0]?.transcript || '';
            if (event.results[i].isFinal) {
              newFinal += ' ' + piece;
            } else {
              currentInterim += piece;
            }
          }

          if (newFinal.trim()) {
            setText((prev) => {
              const updated = (prev ? `${prev.trim()} ${newFinal.trim()}` : newFinal.trim()).trim();
              setDetectedLanguage(detectClientLanguage(updated));
              return updated;
            });
            setCaptureMethod('voice');
            setInterimTranscript('');
          } else {
            setInterimTranscript(currentInterim.trim());
            if (currentInterim.trim()) {
              setDetectedLanguage(detectClientLanguage(currentInterim.trim()));
            }
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition warning:', err?.error);
          // If dialect was not supported, smoothly fall back to en-US
          if (err?.error === 'language-not-supported' && recognition.lang !== 'en-US') {
            try {
              recognition.lang = 'en-US';
              recognition.start();
            } catch {
              // ignore
            }
          }
        };

        recognition.onend = () => {
          if (isRecordingStateRef.current && recognitionRef.current) {
            try {
              recognition.start();
            } catch {
              // ignore
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (recErr) {
        console.warn('Speech recognition start note:', recErr);
      }
    } else {
      setVoiceNotice('Your browser does not have built-in Web Speech API enabled. Voice audio will be captured and you can also type directly or test using the sample buttons.');
    }

    // 2. Initialize MediaRecorder audio capture and waveform analyser
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
      ];
      let selectedMimeType = 'audio/webm';
      for (const t of preferredTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          selectedMimeType = t;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        stopAllAudioResources();

        let currentFullText = text;
        if (interimTranscript && interimTranscript.trim()) {
          currentFullText = text
            ? `${text.trim()} ${interimTranscript.trim()}`
            : interimTranscript.trim();
          setText(currentFullText);
          setInterimTranscript('');
        }

        if (currentFullText) {
          setDetectedLanguage(detectClientLanguage(currentFullText));
        }

        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
          await transcribeAudioWithGemini(audioBlob, selectedMimeType.split(';')[0], currentFullText);
        }
      };

      // Sound level frequency analyser
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevels = () => {
          analyser.getByteFrequencyData(dataArray);
          const bars = Array.from({ length: 8 }, (_, idx) => {
            const val = dataArray[idx] || 0;
            return Math.max(16, Math.min(100, Math.round((val / 255) * 100)));
          });
          setAudioLevels(bars);
          animationFrameRef.current = requestAnimationFrame(updateLevels);
        };
        updateLevels();
      } catch {
        // ignore
      }

      recorder.start(250);
      setIsRecording(true);
      isRecordingStateRef.current = true;
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setVoiceNotice('Microphone access was not permitted. Please allow microphone permissions in your browser, upload an audio file, or click any "Try Sample Voice" button.');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    isRecordingStateRef.current = false;

    if (interimTranscript && interimTranscript.trim()) {
      setText((prev) => {
        const updated = prev ? `${prev.trim()} ${interimTranscript.trim()}` : interimTranscript.trim();
        setDetectedLanguage(detectClientLanguage(updated));
        return updated;
      });
      setInterimTranscript('');
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      stopAllAudioResources();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mimeType = file.type || 'audio/wav';
    await transcribeAudioWithGemini(file, mimeType, text);
    e.target.value = '';
  };

  // Stream text directly into the textarea for sample voice simulation
  const handleRunSampleVoice = async (sampleLang: 'en' | 'sw' | 'sheng') => {
    setSampleLoadingLang(sampleLang);
    setVoiceNotice(null);
    setLatestSubmission(null);

    try {
      const response = await fetch('/api/sample-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: sampleLang }),
      });

      const data = await response.json();

      if (data.audioBase64) {
        const audioDataUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        setLastSampleAudioUrl(audioDataUrl);
        try {
          const audio = new Audio(audioDataUrl);
          audio.play().catch(() => {});
        } catch {
          // ignore
        }
      }

      const fullTranscript: string = data.transcript || '';
      setDetectedLanguage(data.detectedLanguage || detectClientLanguage(fullTranscript));
      setEnglishTranslation(data.englishTranslation || '');
      setCaptureMethod('voice');

      setText('');
      const words = fullTranscript.split(' ');
      let currentIndex = 0;
      const streamTimer = setInterval(() => {
        currentIndex += 1;
        setText(words.slice(0, currentIndex).join(' '));
        if (currentIndex >= words.length) {
          clearInterval(streamTimer);
        }
      }, 45);
    } catch {
      // fallback
    } finally {
      setSampleLoadingLang(null);
    }
  };

  const handleTransformText = async (targetMode: 'polish' | 'to_en' | 'to_sw' | 'to_sheng') => {
    if (!text.trim()) {
      setVoiceNotice('Please speak or type your issue in the box first.');
      return;
    }
    setIsTransforming(true);
    setVoiceNotice(null);
    try {
      const response = await fetch('/api/transform-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetMode }),
      });
      const data = await response.json();
      if (data.transformedText) {
        setText(data.transformedText);
        if (targetMode === 'to_en') setDetectedLanguage('English');
        if (targetMode === 'to_sw') setDetectedLanguage('Kiswahili');
        if (targetMode === 'to_sheng') setDetectedLanguage('Sheng');
      }
    } catch {
      // ignore
    } finally {
      setIsTransforming(false);
    }
  };

  const handleCopyText = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const problemContent = (text + (interimTranscript ? ` ${interimTranscript}` : '')).trim();

    if (!problemContent) {
      setVoiceNotice('Please speak into the microphone or type your problem before submitting.');
      textareaRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setVoiceNotice(null);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: problemContent,
          countyOrWard,
          contactInfo,
          captureMethod,
        }),
      });
      const data = await response.json();

      if (data.submission) {
        setLatestSubmission(data.submission);
        setSubmissions((prev) => [data.submission, ...prev]);
        setDetectedLanguage(data.submission.detectedLanguage);
        setEnglishTranslation(data.submission.englishTranslation || '');
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const filteredSubmissions =
    submissionFilter === 'All'
      ? submissions
      : submissions.filter((s) => s.detectedLanguage === submissionFilter);

  const displayedBoxValue = interimTranscript
    ? `${text}${text ? ' ' : ''}${interimTranscript}`
    : text;

  return (
    <main className="max-w-[1280px] mx-auto px-6 py-8 space-y-12">
      {/* Primary Hero Split: Voice & Text Box (8 cols) + QR Code Panel (4 cols) */}
      <section
        id="voice-capture"
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
      >
        {/* Dominant Focal Anchor: Voice & Text Capture Box */}
        <div className="lg:col-span-8 bg-white border border-emerald-950/15 rounded-xl p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
          <div className="space-y-5">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  SEMA Voice &amp; Text Capture Box
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Speak in English, Kiswahili, or Sheng — your words transcribe directly into the text box
                </p>
              </div>

              {/* Language Capture Filter Controls */}
              <div
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto"
                role="group"
                aria-label="Transcription language mode"
              >
                {(
                  [
                    { id: 'auto', label: 'Auto-Detect' },
                    { id: 'en', label: 'English' },
                    { id: 'sw', label: 'Kiswahili' },
                    { id: 'sheng', label: 'Sheng' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setLanguageHint(mode.id)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      languageHint === mode.id
                        ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Voice Recording Bar + Sample Voice Triggers */}
            <div className="bg-emerald-50/70 border border-emerald-900/12 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isTranscribing}
                    className="inline-flex items-center gap-2.5 px-5 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Tap to Speak (Mic)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="inline-flex items-center gap-2.5 px-5 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Recording ({formatSeconds(recordingSeconds)})</span>
                  </button>
                )}

                {/* Upload Audio Note Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecording || isTranscribing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-emerald-950 bg-white hover:bg-emerald-100/70 border border-emerald-900/15 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  title="Upload recorded audio file (.wav, .mp3, .webm, .m4a)"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Upload Audio</span>
                </button>
              </div>

              {/* Live Audio Level Visualizer or Sample Voice Simulator */}
              {isRecording ? (
                <div className="flex items-center gap-3 px-3.5 py-2 bg-white rounded-lg border border-emerald-300 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                    <span className="text-xs font-bold">Listening Live</span>
                  </div>
                  <div className="flex items-end gap-1 h-5" aria-hidden="true">
                    {audioLevels.map((lvl, i) => (
                      <span
                        key={i}
                        className="w-1.5 bg-emerald-600 rounded-full transition-all duration-75"
                        style={{
                          height: '20px',
                          transform: `scaleY(${Math.max(0.2, lvl / 100)})`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-emerald-900 font-mono tabular-nums">
                    {formatSeconds(recordingSeconds)}
                  </span>
                </div>
              ) : isTranscribing ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white px-3.5 py-2 rounded-lg border border-emerald-200">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>Refining transcription...</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-emerald-950/70 font-medium mr-1">
                    Try Sample Voice:
                  </span>
                  {(
                    [
                      { code: 'en', label: 'English' },
                      { code: 'sw', label: 'Kiswahili' },
                      { code: 'sheng', label: 'Sheng' },
                    ] as const
                  ).map((sample) => (
                    <button
                      key={sample.code}
                      type="button"
                      disabled={sampleLoadingLang !== null}
                      onClick={() => handleRunSampleVoice(sample.code)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-900 bg-white hover:bg-emerald-100 border border-emerald-800/15 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {sampleLoadingLang === sample.code ? (
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
                      ) : (
                        <Volume2 className="w-3 h-3 text-emerald-700" />
                      )}
                      <span>{sample.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Text Box (Textarea) */}
            <div className="relative">
              <label htmlFor="sema-main-textbox" className="sr-only">
                Tell us the problem in English, Kiswahili, or Sheng
              </label>
              <textarea
                id="sema-main-textbox"
                ref={textareaRef}
                rows={6}
                value={displayedBoxValue}
                onChange={(e) => {
                  setText(e.target.value);
                  setInterimTranscript('');
                  setCaptureMethod((prev) => (prev === 'voice' ? 'hybrid' : 'text'));
                  setDetectedLanguage(detectClientLanguage(e.target.value));
                }}
                placeholder={currentPhrase.placeholder}
                className="w-full p-4 text-base text-slate-900 bg-white border-2 border-emerald-800/20 focus:border-emerald-700 rounded-xl focus:outline-none leading-relaxed placeholder:text-slate-400 resize-y transition-colors"
              />

              {/* Bottom Bar inside/below Textarea */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono tabular-nums">
                    {displayedBoxValue.trim().length} characters
                  </span>
                  {detectedLanguage && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-emerald-800">
                        Language: {detectedLanguage}
                      </span>
                    </>
                  )}
                  {isRecording && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                        Speaking live into box...
                      </span>
                    </>
                  )}
                  {lastSampleAudioUrl && (
                    <>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          const audio = new Audio(lastSampleAudioUrl);
                          audio.play().catch(() => {});
                        }}
                        className="inline-flex items-center gap-1 text-emerald-800 hover:underline font-medium cursor-pointer"
                      >
                        <FileAudio className="w-3.5 h-3.5" />
                        <span>Replay Audio</span>
                      </button>
                    </>
                  )}
                </div>

                {/* AI Language Transform & Box Controls */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-slate-400 mr-1">
                    <Languages className="w-3.5 h-3.5" />
                    <span>Convert:</span>
                  </span>
                  <button
                    type="button"
                    disabled={isTransforming || !displayedBoxValue.trim()}
                    onClick={() => handleTransformText('to_en')}
                    className="px-2 py-1 text-xs font-medium text-slate-700 hover:text-emerald-900 bg-slate-100 hover:bg-emerald-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    English
                  </button>
                  <button
                    type="button"
                    disabled={isTransforming || !displayedBoxValue.trim()}
                    onClick={() => handleTransformText('to_sw')}
                    className="px-2 py-1 text-xs font-medium text-slate-700 hover:text-emerald-900 bg-slate-100 hover:bg-emerald-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    Kiswahili
                  </button>
                  <button
                    type="button"
                    disabled={isTransforming || !displayedBoxValue.trim()}
                    onClick={() => handleTransformText('to_sheng')}
                    className="px-2 py-1 text-xs font-medium text-slate-700 hover:text-emerald-900 bg-slate-100 hover:bg-emerald-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    Sheng
                  </button>
                  <button
                    type="button"
                    disabled={!displayedBoxValue.trim()}
                    onClick={handleCopyText}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                    title="Copy text"
                  >
                    {copiedText ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedText ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={!displayedBoxValue.trim()}
                    onClick={() => {
                      setText('');
                      setInterimTranscript('');
                      setDetectedLanguage(null);
                      setEnglishTranslation('');
                      setLatestSubmission(null);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
                    title="Clear text box"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Translation preview if available */}
            {englishTranslation && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-emerald-900">
                  English Translation ({detectedLanguage} → English):
                </p>
                <p className="leading-relaxed">{englishTranslation}</p>
              </div>
            )}

            {/* Helper Notice if needed */}
            {voiceNotice && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
                <span>{voiceNotice}</span>
              </div>
            )}
          </div>

          {/* Submission Form Bar: County/Ward + Contact + Primary Submit Button */}
          <form
            onSubmit={handleSubmitReport}
            className="pt-4 border-t border-slate-100 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="sema-location-select"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  County / Ward Location in Kenya
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="sema-location-select"
                    value={countyOrWard}
                    onChange={(e) => setCountyOrWard(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                  >
                    {KENYAN_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="sema-contact-input"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Phone or Email for Resolution Updates (Optional)
                </label>
                <input
                  id="sema-contact-input"
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="e.g., 0712 345 678 or citizen@email.co.ke"
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Direct dispatch to SEMA Kenya rapid response teams · Free of charge
              </p>

              <button
                type="submit"
                disabled={isSubmitting || isTranscribing}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging Issue with SEMA...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{currentPhrase.ctaLabel}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Instant Resolution Confirmation Banner */}
          {latestSubmission && (
            <div
              className="bg-emerald-50 border border-emerald-700/25 rounded-xl p-4 space-y-2"
              role="status"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Report Logged · Ticket {latestSubmission.referenceCode}</span>
                </div>
                <div className="text-xs text-emerald-900 font-medium">
                  <span>{latestSubmission.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{latestSubmission.detectedLanguage}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                {latestSubmission.aiCommitmentResponse}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Scannable QR Code Panel leading to the Landing Page */}
        <div className="lg:col-span-4 flex">
          <div className="w-full flex flex-col justify-between">
            <QrCodePanel
              isModalOpen={isQrModalOpen}
              onOpenModal={onOpenQrModal}
              onCloseModal={onCloseQrModal}
            />
          </div>
        </div>
      </section>

      {/* Live Citizen Voice & Text Submissions Feed */}
      <section
        id="recent-reports"
        className="pt-6 border-t border-slate-200/80 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Citizen Voices &amp; Resolution Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live reports captured in English, Kiswahili, and Sheng across Kenya
            </p>
          </div>

          {/* Interactive Language Filter Tabs */}
          <div
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto"
            role="tablist"
            aria-label="Filter reports by language"
          >
            {(['All', 'English', 'Kiswahili', 'Sheng'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={submissionFilter === tab}
                onClick={() => setSubmissionFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  submissionFilter === tab
                    ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredSubmissions.slice(0, 6).map((item) => (
            <article
              key={item.id}
              className="bg-white border border-slate-200/90 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-emerald-800 tabular-nums">
                    {item.referenceCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700">{item.detectedLanguage}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.countyOrWard}</span>
                </div>

                <p className="text-sm text-slate-900 leading-relaxed font-medium">
                  &ldquo;{item.text}&rdquo;
                </p>

                {item.englishTranslation && (
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    Translation: &ldquo;{item.englishTranslation}&rdquo;
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs text-emerald-900 leading-relaxed">
                  <span className="font-semibold">SEMA Action: </span>
                  {item.aiCommitmentResponse}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{item.category}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setText(item.text);
                      setDetectedLanguage(item.detectedLanguage);
                      setEnglishTranslation(item.englishTranslation || '');
                      textareaRef.current?.focus();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-emerald-800 hover:underline font-medium cursor-pointer"
                  >
                    Load into Text Box
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};
