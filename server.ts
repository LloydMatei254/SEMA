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

export type PriorityLevel = 'Urgent' | 'High' | 'Medium' | 'Routine';
export type ReportStatus = 'Received' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export interface AIClassification {
  category: string;
  urgency: PriorityLevel;
  recommendedTeam: string;
  rationale: string;
  estimatedSLA: string;
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
  status: ReportStatus;
  createdAt: string;
  assignedTeam?: string;
  assignedOfficer?: string;
  priority?: PriorityLevel;
  aiClassification?: AIClassification;
  adminNotes?: string;
  resolvedAt?: string;
}

const KENYAN_RESPONSE_TEAMS = [
  {
    id: 'team-kplc',
    name: 'Kenya Power Emergency & Streetlighting Unit',
    department: 'Power & Street Lighting',
    leadOfficer: 'Eng. Dennis Kiprono',
  },
  {
    id: 'team-water',
    name: 'Nairobi / County Water & Sewerage Rapid Response',
    department: 'Water & Sanitation',
    leadOfficer: 'Officer Grace Mwangi',
  },
  {
    id: 'team-roads',
    name: 'KeRRA & KURA Urban Roads & Drainage Taskforce',
    department: 'Roads & Infrastructure',
    leadOfficer: 'Supervisor Brian Otieno',
  },
  {
    id: 'team-health',
    name: 'County Public Health & Clinic Inspection Unit',
    department: 'Health & Medical Services',
    leadOfficer: 'Dr. Faith Wanjiku',
  },
  {
    id: 'team-waste',
    name: 'National Environment & Waste Clearance Team',
    department: 'Waste Management',
    leadOfficer: 'Insp. Hassan Ali',
  },
  {
    id: 'team-safety',
    name: 'Administration Police & Community Safety Rapid Unit',
    department: 'Public Safety & Security',
    leadOfficer: 'Sgt. John Kimani',
  },
  {
    id: 'team-huduma',
    name: 'Huduma Citizen Digital Services & Registry Desk',
    department: 'Civic & Public Services',
    leadOfficer: 'Coordinator Agnes Muthoni',
  },
];

// Rule-based Kenyan linguistic helper
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

function determineClassificationRuleBased(text: string): AIClassification {
  const lower = text.toLowerCase();
  const category = detectIssueCategory(text);

  let urgency: PriorityLevel = 'Medium';
  let recommendedTeam = 'Huduma Citizen Digital Services & Registry Desk';
  let rationale = 'Routine civic service inquiry';
  let estimatedSLA = '48 hours';

  if (category === 'Power & Street Lighting') {
    recommendedTeam = 'Kenya Power Emergency & Streetlighting Unit';
    if (/\b(spark|fire|moto|wire|cheche|danger|electrocution)\b/i.test(lower)) {
      urgency = 'Urgent';
      rationale = 'Live transformer fault or sparking electrical hazard poses immediate public safety risk.';
      estimatedSLA = '2 hours';
    } else {
      urgency = 'High';
      rationale = 'Blackout or dark streets affect business and evening security.';
      estimatedSLA = '6 hours';
    }
  } else if (category === 'Water & Sanitation') {
    recommendedTeam = 'Nairobi / County Water & Sewerage Rapid Response';
    if (/\b(burst|sewer|chafu|flooding|overflow)\b/i.test(lower)) {
      urgency = 'High';
      rationale = 'Burst water or sewer pipe causing loss of clean water and potential health hazard.';
      estimatedSLA = '4 hours';
    } else {
      urgency = 'Medium';
      rationale = 'Dry taps reported in local ward for multiple days.';
      estimatedSLA = '24 hours';
    }
  } else if (category === 'Roads & Infrastructure') {
    recommendedTeam = 'KeRRA & KURA Urban Roads & Drainage Taskforce';
    if (/\b(impassable|stuck|accident|bridge|collapsed|flooded)\b/i.test(lower)) {
      urgency = 'High';
      rationale = 'Critical transport disruption with matatus and vehicles immobilized.';
      estimatedSLA = '12 hours';
    } else {
      urgency = 'Medium';
      rationale = 'Potholes or drainage clearing needed along local corridor.';
      estimatedSLA = '36 hours';
    }
  } else if (category === 'Health & Medical Services') {
    recommendedTeam = 'County Public Health & Clinic Inspection Unit';
    urgency = 'High';
    rationale = 'Dispensary medication shortage or sanitation concern requiring medical inspection.';
    estimatedSLA = '8 hours';
  } else if (category === 'Waste Management') {
    recommendedTeam = 'National Environment & Waste Clearance Team';
    urgency = 'Medium';
    rationale = 'Uncollected garbage or illegal dump-site clearance requested.';
    estimatedSLA = '24 hours';
  } else if (category === 'Public Safety & Security') {
    recommendedTeam = 'Administration Police & Community Safety Rapid Unit';
    urgency = 'Urgent';
    rationale = 'Immediate community safety, theft, or night mugging hotspot report.';
    estimatedSLA = '1 hour';
  }

  return {
    category,
    urgency,
    recommendedTeam,
    rationale,
    estimatedSLA,
  };
}

async function classifyWithAI(text: string): Promise<AIClassification> {
  const ai = getGenAIClient();
  if (!ai) {
    return determineClassificationRuleBased(text);
  }

  try {
    const teamsList = KENYAN_RESPONSE_TEAMS.map((t) => t.name).join(', ');
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an expert dispatcher for the Kenyan citizen problem resolution platform SEMA.
Citizen Report (may be in English, Kiswahili, or Sheng): "${text}"

Available Response Teams:
${teamsList}

Determine:
1. category: The specific domain category (Power & Street Lighting, Water & Sanitation, Roads & Infrastructure, Health & Medical Services, Waste Management, Public Safety & Security, Civic & Public Services).
2. urgency: One of: "Urgent", "High", "Medium", "Routine" (Urgent if life/fire/live electric/crime danger, High if widespread disruption, Medium if local community delay, Routine if general query).
3. recommendedTeam: The exact matching team name from the list above.
4. rationale: A concise 1-sentence explanation of why this request fits this team and urgency level.
5. estimatedSLA: Target response turnaround (e.g. "2 hours", "4 hours", "24 hours", "48 hours").`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            urgency: { type: Type.STRING },
            recommendedTeam: { type: Type.STRING },
            rationale: { type: Type.STRING },
            estimatedSLA: { type: Type.STRING },
          },
          required: ['category', 'urgency', 'recommendedTeam', 'rationale', 'estimatedSLA'],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      const urgencyVal: PriorityLevel =
        ['Urgent', 'High', 'Medium', 'Routine'].includes(parsed.urgency)
          ? parsed.urgency
          : 'Medium';

      return {
        category: parsed.category || detectIssueCategory(text),
        urgency: urgencyVal,
        recommendedTeam: parsed.recommendedTeam || KENYAN_RESPONSE_TEAMS[0].name,
        rationale: parsed.rationale || 'Classified by SEMA automated dispatcher.',
        estimatedSLA: parsed.estimatedSLA || '24 hours',
      };
    }
  } catch (err: any) {
    console.warn('AI classification notice:', err?.message || 'Using rule-based fallback');
  }

  return determineClassificationRuleBased(text);
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
    status: 'In Progress',
    priority: 'Urgent',
    assignedTeam: 'Kenya Power Emergency & Streetlighting Unit',
    assignedOfficer: 'Eng. Dennis Kiprono',
    aiClassification: {
      category: 'Power & Street Lighting',
      urgency: 'Urgent',
      recommendedTeam: 'Kenya Power Emergency & Streetlighting Unit',
      rationale: 'Active sparking transformer near TRM poses immediate fire and electrocution hazard.',
      estimatedSLA: '2 hours',
    },
    adminNotes: 'Field crew dispatched with hydraulic lift truck. Transformer isolation in progress.',
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
    priority: 'High',
    assignedTeam: 'Nairobi / County Water & Sewerage Rapid Response',
    assignedOfficer: 'Officer Grace Mwangi',
    aiClassification: {
      category: 'Water & Sanitation',
      urgency: 'High',
      recommendedTeam: 'Nairobi / County Water & Sewerage Rapid Response',
      rationale: 'Burst water mains along public stage causing major water loss and street pooling.',
      estimatedSLA: '4 hours',
    },
    adminNotes: 'Assigned to Eastern Zone water maintenance crew.',
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
    priority: 'Medium',
    aiClassification: {
      category: 'Roads & Infrastructure',
      urgency: 'Medium',
      recommendedTeam: 'KeRRA & KURA Urban Roads & Drainage Taskforce',
      rationale: 'Stormwater overflow risk in commercial district; requires silt and debris clearance.',
      estimatedSLA: '24 hours',
    },
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
          ? 'The speaker is primarily speaking Kiswahili (Kenyan Swahili).'
          : languageHint === 'sheng'
          ? 'The speaker is primarily speaking Kenyan Sheng.'
          : 'The speaker is from Kenya and may speak in English, Kiswahili, Sheng, or a mix.';

      const promptText = `Transcribe this audio recording accurately into text.
${languageGuidance}
Rules:
1. Transcribe the exact words spoken verbatim in English, Kiswahili, or Kenyan Sheng.
2. Do not translate Sheng or Kiswahili into English in the main transcript.
3. Add natural punctuation.`;

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
      const detectedLanguage = detectKenyanLanguage(finalTranscript);
      let englishTranslation = '';

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

  // 2. Synthesize or Provide Sample Kenyan Voice Audio
  app.post('/api/sample-voice', async (req, res) => {
    try {
      const { language = 'sheng' } = req.body;
      const samples: Record<
        string,
        { text: string; langLabel: 'English' | 'Kiswahili' | 'Sheng'; translation?: string }
      > = {
        en: {
          text: 'Hello SEMA team, the street lights along Ngong Road near Adams Arcade have been off for a week and pedestrians feel unsafe at night. Please fix this urgently.',
          langLabel: 'English',
        },
        sw: {
          text: 'Habari SEMA, tuna shida ya maji hapa mtaa wa South B karibu na soko. Mabomba yamekauka kwa siku nne sasa, tunaomba mrekebishe haraka.',
          langLabel: 'Kiswahili',
          translation: 'Hello SEMA, we have a water shortage here in South B near the market. Taps have been dry for four days now, please fix it urgently.',
        },
        sheng: {
          text: 'Niaje SEMA, manze hapa Kasarani barabara imeharibika mbaya sana na matatu zinakwama kwa matope. Tuchanueni vile mtafix hii noma haraka.',
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
                parts: [{ text: chosen.text }],
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
        } catch {
          // ignore
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

  // 3. AI Text Refinement / Translation
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
            polish: 'Clean up punctuation and clarity while preserving the original language.',
            to_en: 'Translate this Kenyan problem report into professional English.',
            to_sw: 'Translate this Kenyan problem report into natural Kenyan Kiswahili.',
            to_sheng: 'Express this Kenyan problem report in natural Kenyan Sheng.',
          };

          const selectedInstruction = instructions[targetMode] || instructions.polish;
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `${selectedInstruction}\n\nInput text: "${input}"\n\nOutput only the resulting text.`,
          });

          if (response.text && response.text.trim()) {
            return res.json({ transformedText: response.text.trim() });
          }
        } catch {
          // fall through
        }
      }

      let fallbackTransformed = input;
      if (targetMode === 'to_en') {
        fallbackTransformed = `[Report in English]: ${input} (Please dispatch field officer for resolution)`;
      } else if (targetMode === 'to_sw') {
        fallbackTransformed = `[Ripoti kwa Kiswahili]: Habari SEMA, ${input}. Tunaomba msaada wa haraka.`;
      } else if (targetMode === 'to_sheng') {
        fallbackTransformed = `[Rada kwa Sheng]: Niaje SEMA, manze ${input}. Chanueni wasee waisort haraka.`;
      }

      return res.json({ transformedText: fallbackTransformed });
    } catch {
      return res.json({ transformedText: req.body?.text || '' });
    }
  });

  // 4. Get Submissions (Admin + Public)
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
      const detectedLanguage = detectKenyanLanguage(input);
      const category = detectIssueCategory(input);
      const aiCommitmentResponse = generateLocalCommitment(input, detectedLanguage, category);

      // Pre-compute AI classification for immediate routing insight
      const classification = await classifyWithAI(input);

      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const newRecord: SubmissionRecord = {
        id: `sema-${Date.now()}`,
        referenceCode: `SEMA-KE-${randomDigits}`,
        text: input,
        detectedLanguage,
        englishTranslation: detectedLanguage !== 'English' ? `Translation: ${input}` : undefined,
        category: classification.category,
        countyOrWard: countyOrWard.trim() || 'Kenya (General)',
        contactInfo: contactInfo.trim() || undefined,
        captureMethod,
        aiCommitmentResponse,
        status: 'Received',
        priority: classification.urgency,
        aiClassification: classification,
        createdAt: new Date().toISOString(),
      };

      submissionsStore.unshift(newRecord);
      return res.status(201).json({ submission: newRecord });
    } catch {
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

  // 6. Admin: AI Classify Single Submission
  app.post('/api/submissions/:id/ai-classify', async (req, res) => {
    const { id } = req.params;
    const item = submissionsStore.find((s) => s.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const classification = await classifyWithAI(item.text);
    item.aiClassification = classification;
    item.category = classification.category;
    item.priority = classification.urgency;

    return res.json({ submission: item, classification });
  });

  // 7. Admin: Assign Report to Team
  app.patch('/api/submissions/:id/assign', (req, res) => {
    const { id } = req.params;
    const { assignedTeam, assignedOfficer, priority, status = 'Assigned', adminNotes } = req.body;

    const item = submissionsStore.find((s) => s.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (assignedTeam) item.assignedTeam = assignedTeam;
    if (assignedOfficer) item.assignedOfficer = assignedOfficer;
    if (priority) item.priority = priority;
    if (status) item.status = status;
    if (adminNotes !== undefined) item.adminNotes = adminNotes;

    return res.json({ submission: item });
  });

  // 8. Admin: Auto-Assign All Unassigned Reports Using AI
  app.post('/api/submissions/auto-assign-all', async (_req, res) => {
    const unassigned = submissionsStore.filter(
      (s) => s.status === 'Received' || !s.assignedTeam
    );

    const updatedRecords: SubmissionRecord[] = [];

    for (const item of unassigned) {
      const classification = await classifyWithAI(item.text);
      item.aiClassification = classification;
      item.category = classification.category;
      item.priority = classification.urgency;
      item.assignedTeam = classification.recommendedTeam;

      // Match lead officer
      const matchedTeam = KENYAN_RESPONSE_TEAMS.find(
        (t) => t.name === classification.recommendedTeam
      );
      item.assignedOfficer = matchedTeam ? matchedTeam.leadOfficer : 'Field Dispatch Desk';
      item.status = 'Assigned';
      item.adminNotes = `AI Auto-assigned: ${classification.rationale} (Target SLA: ${classification.estimatedSLA})`;

      updatedRecords.push(item);
    }

    return res.json({
      message: `Successfully classified and auto-assigned ${updatedRecords.length} reports.`,
      count: updatedRecords.length,
      submissions: submissionsStore,
    });
  });

  // 9. Admin: Update Report Status
  app.patch('/api/submissions/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const item = submissionsStore.find((s) => s.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (status) item.status = status;
    if (adminNotes !== undefined) item.adminNotes = adminNotes;
    if (status === 'Resolved' || status === 'Closed') {
      item.resolvedAt = new Date().toISOString();
    }

    return res.json({ submission: item });
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
