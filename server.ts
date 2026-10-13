import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function hasGeminiKey(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
    typeof key === 'string' &&
    key.trim().length > 0 &&
    !key.includes('MY_GEMINI_API_KEY')
  );
}

function getGenAIClient(): GoogleGenAI | null {
  if (!hasGeminiKey()) {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch {
    return null;
  }
}

export interface SubmissionRecord {
  id: string;
  referenceCode: string;
  text: string;
  detectedLanguage: 'English' | 'Kiswahili' | 'Sheng';
  englishTranslation?: string;
  category: string;
  countyOrWard: string;
  contactInfo?: string;
  captureMethod: 'voice' | 'text' | 'hybrid';
  aiCommitmentResponse: string;
  status: 'Received' | 'Assigned' | 'In Resolution';
  createdAt: string;
}

// Rule-based Kenyan linguistic helper for instant fallback
function detectKenyanLanguage(text: string): 'English' | 'Kiswahili' | 'Sheng' {
  const lower = text.toLowerCase();
  const shengWords = [
    'manze', 'rada', 'noma', 'mtaani', 'wasee', 'bazenga', 'form', 'kuom',
    'kanairo', 'chapaa', 'nduthi', 'mbogi', 'nganya', 'keja', 'morio',
    'doba', 'mavitu', 'aresa', 'buda', 'sindano', 'tuchanue', 'tutaisort',
    'imetoka', 'kupanic', 'imebeat', 'riba', 'bonga', 'chali', 'madhe', 'fade'
  ];
  const swahiliWords = [
    'habari', 'jambo', 'tafadhali', 'shida', 'tatizo', 'stima', 'maji',
    'barabara', 'serikali', 'huduma', 'tunaomba', 'watu', 'mtaa', 'hospitali',
    'taka', 'usafi', 'usalama', 'jirani', 'hapa', 'sana', 'kazi', 'tatua',
    'tuambie', 'mwananchi', 'viongozi', 'haraka', 'shule', 'watoto'
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

function detectIssueCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(stima|power|lights?|electricity|transformer|blackout|giza)\b/i.test(lower)) {
    return 'Power & Street Lighting';
  }
  if (/\b(maji|water|pipe|bomba|burst|taps?|sewer|drainage|flood)\b/i.test(lower)) {
    return 'Water & Sanitation';
  }
  if (/\b(road|barabara|pothole|matatu|nduthi|traffic|bridge|crossing)\b/i.test(lower)) {
    return 'Roads & Infrastructure';
  }
  if (/\b(hospital|clinic|dispensary|dawa|medicine|doctor|nurse|afya)\b/i.test(lower)) {
    return 'Health & Medical Services';
  }
  if (/\b(taka|garbage|waste|chafu|dampo|litter|clean)\b/i.test(lower)) {
    return 'Waste Management';
  }
  if (/\b(security|usalama|police|thief|wezi|danger|taa)\b/i.test(lower)) {
    return 'Public Safety & Security';
  }
  return 'Civic & Public Services';
}

function generateLocalCommitment(text: string, lang: 'English' | 'Kiswahili' | 'Sheng', category: string): string {
  if (lang === 'Sheng') {
    return `Rada imefika poa! Tumelogi hii issue ya ${category} na wasee wa ground wamechanuliwa kuisort mbio bila delay.`;
  }
  if (lang === 'Kiswahili') {
    return `Asante mwananchi. Tumepokea ripoti yako kuhusu ${category}. Timu yetu ya huduma za dharura imejulishwa na inashughulikia jambo hili mara moja.`;
  }
  return `Thank you. SEMA has officially logged your report regarding ${category}. Our rapid response team has been dispatched to investigate and resolve this issue.`;
}

const submissionsStore: SubmissionRecord[] = [
  {
    id: 'sema-101',
    referenceCode: 'SEMA-KE-8041',
    text: 'Stima imepotea hapa Roysambu karibu na TRM tangu jana usiku na transformers zinatoa cheche. Tafadhali mtusaidie haraka.',
    detectedLanguage: 'Kiswahili',
    englishTranslation: 'Electricity has been out here in Roysambu near TRM since last night and the transformers are sparking. Please help us urgently.',
    category: 'Power & Street Lighting',
    countyOrWard: 'Nairobi · Roysambu',
    captureMethod: 'voice',
    aiCommitmentResponse: 'Tumepokea ripoti yako kuhusu hitilafu ya stima Roysambu. Timu ya dharura imetumwa kuchunguza transformer hiyo mara moja.',
    status: 'In Resolution',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'sema-102',
    referenceCode: 'SEMA-KE-8042',
    text: 'Manze maji imelost huku Umoja Innercore for four days sasa na mabomba zimepasuka hapo kwa stage. Chanueni wasee wa maji wafix hii noma.',
    detectedLanguage: 'Sheng',
    englishTranslation: 'Water has been out here in Umoja Innercore for four days now and the pipes have burst near the bus stage. Alert the water maintenance team to fix this issue.',
    category: 'Water & Sanitation',
    countyOrWard: 'Nairobi · Umoja',
    captureMethod: 'voice',
    aiCommitmentResponse: 'Rada imefika! Wasee wa maji wamepewa alert kuhusu hiyo bomba imepasuka hapo Umoja stage na wako njiani kuisort.',
    status: 'Assigned',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'sema-103',
    referenceCode: 'SEMA-KE-8043',
    text: 'The drainage channel along Kenyatta Avenue in Nakuru CBD is blocked with debris and causing flooding near the pedestrian crossing whenever it rains.',
    detectedLanguage: 'English',
    category: 'Roads & Infrastructure',
    countyOrWard: 'Nakuru · Biashara Ward',
    captureMethod: 'text',
    aiCommitmentResponse: 'Thank you for reporting this blockage. Our county drainage maintenance crew has scheduled clearance along Kenyatta Avenue within 24 hours.',
    status: 'Received',
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // 1. Audio Transcription Endpoint
  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioBase64, mimeType = 'audio/webm', languageHint = 'auto', clientTranscript = '' } = req.body;

      let fallbackText = typeof clientTranscript === 'string' ? clientTranscript.trim() : '';

      const ai = getGenAIClient();
      if (!ai || !audioBase64 || typeof audioBase64 !== 'string') {
        const detectedLanguage = fallbackText ? detectKenyanLanguage(fallbackText) : 'English';
        return res.json({
          transcript: fallbackText,
          detectedLanguage,
          englishTranslation: '',
          source: 'browser_speech',
          apiKeyConfigured: false,
        });
      }

      const languageGuidance =
        languageHint === 'sw'
          ? 'The speaker is primarily speaking Kiswahili (Kenyan Swahili), possibly with English or Sheng words.'
          : languageHint === 'sheng'
          ? 'The speaker is primarily speaking Kenyan Sheng (Nairobi urban vernacular blending Swahili and English).'
          : languageHint === 'en'
          ? 'The speaker is primarily speaking Kenyan English, possibly with Swahili or Sheng expressions.'
          : 'The speaker is from Kenya and may speak in English, Kiswahili (Swahili), Kenyan Sheng (urban youth slang/code-switching), or a mix of all three.';

      const promptText = `Transcribe this audio recording accurately into text.
${languageGuidance}
Rules:
1. Transcribe the exact words spoken verbatim in English, Kiswahili, or Kenyan Sheng (e.g. words like "manze", "rada", "noma", "mtaani", "stima", "maji", "wasee", "imetoka", "chanua").
2. Do not translate Sheng or Kiswahili into English in the main transcript—keep the speaker's exact language and code-switching intact.
3. Add natural punctuation and capitalization.
4. If the audio has no speech, return an empty string.`;

      const cleanBase64 = audioBase64.includes(',')
        ? audioBase64.split(',')[1]
        : audioBase64;

      let rawTranscript = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
        });
        rawTranscript = (response.text || '').trim();
      } catch (geminiErr: any) {
        console.warn('Gemini 3.5 transcribe notice:', geminiErr?.message || 'Using client speech');
        rawTranscript = fallbackText;
      }

      const finalTranscript = rawTranscript || fallbackText;
      let detectedLanguage: 'English' | 'Kiswahili' | 'Sheng' = detectKenyanLanguage(finalTranscript);
      let englishTranslation = '';

      if (finalTranscript.length > 0 && ai) {
        try {
          const metaResp = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Analyze this Kenyan citizen statement: "${finalTranscript}"
Determine whether the primary language is "English", "Kiswahili", or "Sheng". If it is in Kiswahili or Sheng, provide a concise English translation.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  detectedLanguage: {
                    type: Type.STRING,
                    description: 'Must be one of: English, Kiswahili, Sheng',
                  },
                  englishTranslation: {
                    type: Type.STRING,
                  },
                },
                required: ['detectedLanguage', 'englishTranslation'],
              },
            },
          });

          if (metaResp.text) {
            const parsed = JSON.parse(metaResp.text.trim());
            if (
              parsed.detectedLanguage === 'Kiswahili' ||
              parsed.detectedLanguage === 'Sheng' ||
              parsed.detectedLanguage === 'English'
            ) {
              detectedLanguage = parsed.detectedLanguage;
            }
            englishTranslation = parsed.englishTranslation || '';
          }
        } catch {
          // Keep rule-based language
        }
      }

      return res.json({
        transcript: finalTranscript,
        detectedLanguage,
        englishTranslation,
        source: rawTranscript ? 'gemini_transcribe' : 'browser_speech',
        apiKeyConfigured: Boolean(ai),
      });
    } catch {
      return res.json({
        transcript: req.body?.clientTranscript || '',
        detectedLanguage: 'English',
        englishTranslation: '',
        apiKeyConfigured: false,
      });
    }
  });

  // 2. Synthesize or Provide Sample Kenyan Voice Audio + Transcribe Demo
  app.post('/api/sample-voice', async (req, res) => {
    try {
      const { language = 'sheng' } = req.body;
      const samples: Record<
        string,
        { text: string; style: string; langLabel: 'English' | 'Kiswahili' | 'Sheng'; translation?: string }
      > = {
        en: {
          text: 'Hello SEMA team, the street lights along Ngong Road near Adams Arcade have been off for a week and pedestrians feel unsafe at night. Please fix this urgently.',
          style: 'Clear, earnest Kenyan citizen reporting a community issue',
          langLabel: 'English',
        },
        sw: {
          text: 'Habari SEMA, tuna shida ya maji hapa mtaa wa South B karibu na soko. Mabomba yamekauka kwa siku nne sasa, tunaomba mrekebishe haraka.',
          style: 'Clear, articulate Kiswahili speaker from Kenya',
          langLabel: 'Kiswahili',
          translation: 'Hello SEMA, we have a water shortage here in South B near the market. Taps have been dry for four days now, please fix it urgently.',
        },
        sheng: {
          text: 'Niaje SEMA, manze hapa Kasarani barabara imeharibika mbaya sana na matatu zinakwama kwa matope. Tuchanueni vile mtafix hii noma haraka.',
          style: 'Natural urban Nairobi youth speaking Kenyan Sheng',
          langLabel: 'Sheng',
          translation: 'Hi SEMA, seriously here in Kasarani the road is badly damaged and matatus are getting stuck in the mud. Let us know how you will fix this problem quickly.',
        },
      };

      const chosen = samples[language] || samples.sheng;
      const ai = getGenAIClient();

      let audioBase64: string | null = null;
      if (ai) {
        try {
          const ttsResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: chosen.text,
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
              },
            },
          });

          audioBase64 =
            ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        } catch (ttsErr: any) {
          console.warn('TTS sample generation notice:', ttsErr?.message || 'Using fallback audio');
        }
      }

      return res.json({
        transcript: chosen.text,
        detectedLanguage: chosen.langLabel,
        englishTranslation: chosen.translation || '',
        audioBase64,
        mimeType: 'audio/wav',
        apiKeyConfigured: Boolean(ai),
      });
    } catch {
      return res.json({
        transcript: 'Hello SEMA team, street lights along Ngong Road are off. Please fix this.',
        detectedLanguage: 'English',
        englishTranslation: '',
        apiKeyConfigured: false,
      });
    }
  });

  // 3. AI Text Refinement / Translation between English, Kiswahili, and Sheng
  app.post('/api/transform-text', async (req, res) => {
    try {
      const { text, targetMode } = req.body;
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.json({ transformedText: '' });
      }

      const input = text.trim();
      const ai = getGenAIClient();

      if (ai) {
        try {
          const instructions: Record<string, string> = {
            polish:
              'Clean up punctuation, spelling, and clarity while strictly keeping the original language (whether English, Kiswahili, or Kenyan Sheng) and authentic tone.',
            to_en:
              'Translate this Kenyan problem report accurately into clear, professional English while preserving all location and issue details.',
            to_sw:
              'Translate this Kenyan problem report into natural, respectful Kenyan Kiswahili (Swahili) while preserving all location and issue details.',
            to_sheng:
              'Express this Kenyan problem report in authentic, natural Kenyan Sheng (Nairobi urban vernacular) while keeping the problem clear and accurate.',
          };

          const selectedInstruction = instructions[targetMode] || instructions.polish;
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `${selectedInstruction}\n\nInput text: "${input}"\n\nOutput only the resulting text without quotation marks or extra commentary.`,
          });

          if (response.text && response.text.trim()) {
            return res.json({
              transformedText: response.text.trim(),
            });
          }
        } catch {
          // fall through to rule based
        }
      }

      // Rule-based fallback
      let fallbackTransformed = input;
      if (targetMode === 'to_en') {
        fallbackTransformed = `[Report in English]: ${input} (Please dispatch field officer for resolution)`;
      } else if (targetMode === 'to_sw') {
        fallbackTransformed = `[Ripoti kwa Kiswahili]: Habari SEMA, ${input}. Tunaomba msaada wa haraka.`;
      } else if (targetMode === 'to_sheng') {
        fallbackTransformed = `[Rada kwa Sheng]: Niaje SEMA, manze ${input}. Chanueni wasee waisort haraka.`;
      }

      return res.json({
        transformedText: fallbackTransformed,
      });
    } catch {
      return res.json({ transformedText: req.body?.text || '' });
    }
  });

  // 4. Get Submissions
  app.get('/api/submissions', (_req, res) => {
    return res.json({ submissions: submissionsStore });
  });

  // 5. Submit Problem Report to SEMA
  app.post('/api/submissions', async (req, res) => {
    try {
      const {
        text,
        countyOrWard = 'Nairobi County',
        contactInfo = '',
        captureMethod = 'text',
      } = req.body;

      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.json({ error: 'Please describe or speak the problem before submitting.' });
      }

      const input = text.trim();
      const ai = getGenAIClient();
      let detectedLanguage: 'English' | 'Kiswahili' | 'Sheng' = detectKenyanLanguage(input);
      let englishTranslation = '';
      let category = detectIssueCategory(input);
      let aiCommitmentResponse = generateLocalCommitment(input, detectedLanguage, category);

      if (ai) {
        try {
          const analysisResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `A citizen in Kenya (${countyOrWard}) submitted this problem report to SEMA ("Tell us the problem and we will fix it"):
"${input}"

Analyze the report and return JSON with:
1. detectedLanguage: "English", "Kiswahili", or "Sheng"
2. englishTranslation: Clear English translation if the report is in Kiswahili or Sheng, or empty string if already in English.
3. category: Short 2-3 word issue category (e.g. "Water & Sanitation", "Power & Lighting", "Roads & Infrastructure", "Healthcare & Clinics", "Waste Management", "Public Safety", "Civic Services").
4. aiCommitmentResponse: A warm, reassuring 1-2 sentence response written IN THE SAME LANGUAGE (English, Kiswahili, or Kenyan Sheng) as the citizen's report, confirming that SEMA has logged the issue and how the fix team will handle it.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  detectedLanguage: { type: Type.STRING },
                  englishTranslation: { type: Type.STRING },
                  category: { type: Type.STRING },
                  aiCommitmentResponse: { type: Type.STRING },
                },
                required: [
                  'detectedLanguage',
                  'englishTranslation',
                  'category',
                  'aiCommitmentResponse',
                ],
              },
            },
          });

          if (analysisResponse.text) {
            const parsed = JSON.parse(analysisResponse.text.trim());
            if (
              parsed.detectedLanguage === 'English' ||
              parsed.detectedLanguage === 'Kiswahili' ||
              parsed.detectedLanguage === 'Sheng'
            ) {
              detectedLanguage = parsed.detectedLanguage;
            }
            englishTranslation = parsed.englishTranslation || '';
            category = parsed.category || category;
            aiCommitmentResponse = parsed.aiCommitmentResponse || aiCommitmentResponse;
          }
        } catch {
          // fall through
        }
      }

      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const newRecord: SubmissionRecord = {
        id: `sema-${Date.now()}`,
        referenceCode: `SEMA-KE-${randomDigits}`,
        text: input,
        detectedLanguage,
        englishTranslation: englishTranslation || undefined,
        category,
        countyOrWard: countyOrWard.trim() || 'Kenya (General)',
        contactInfo: contactInfo.trim() || undefined,
        captureMethod,
        aiCommitmentResponse,
        status: 'Received',
        createdAt: new Date().toISOString(),
      };

      submissionsStore.unshift(newRecord);

      return res.status(201).json({ submission: newRecord });
    } catch {
      // Safe fallback record
      const fallbackRecord: SubmissionRecord = {
        id: `sema-${Date.now()}`,
        referenceCode: `SEMA-KE-${Math.floor(1000 + Math.random() * 9000)}`,
        text: req.body?.text || 'Report received',
        detectedLanguage: 'English',
        category: 'Civic Services',
        countyOrWard: req.body?.countyOrWard || 'Kenya (General)',
        captureMethod: 'text',
        aiCommitmentResponse: 'Your report has been received by SEMA rapid response desk.',
        status: 'Received',
        createdAt: new Date().toISOString(),
      };
      submissionsStore.unshift(fallbackRecord);
      return res.status(201).json({ submission: fallbackRecord });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SEMA server listening on http://localhost:${PORT}`);
  });
}

startServer();
