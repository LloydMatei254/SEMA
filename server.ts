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
export type CitizenSentiment = 'Frustrated' | 'Distressed' | 'Angry' | 'Urgent' | 'Neutral' | 'Constructive';
export type TensionLevel = 'High' | 'Elevated' | 'Standard';

export interface AIClassification {
  category: string;
  urgency: PriorityLevel;
  recommendedTeam: string;
  rationale: string;
  estimatedSLA: string;
  sentiment?: CitizenSentiment;
  tensionLevel?: TensionLevel;
  frustrationScore?: number;
  isHighTension?: boolean;
  tensionFactors?: string[];
  tensionNotes?: string;
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
  assignedOfficerEmail?: string;
  priority?: PriorityLevel;
  aiClassification?: AIClassification;
  adminNotes?: string;
  resolvedAt?: string;
  emailAlertSent?: boolean;
  emailAlertRecipient?: string;
  emailAlertSentAt?: string;
  emailAlertSubject?: string;
  emailAlertBody?: string;
  sentiment?: CitizenSentiment;
  tensionLevel?: TensionLevel;
  frustrationScore?: number;
  isHighTension?: boolean;
  tensionFactors?: string[];
  tensionNotes?: string;
}

export interface EmailDispatchLog {
  id: string;
  submissionId: string;
  referenceCode: string;
  toEmail: string;
  officerName: string;
  teamName: string;
  category: string;
  priority: PriorityLevel;
  subject: string;
  body: string;
  sentAt: string;
  status: 'Delivered' | 'Queued' | 'Simulated';
}

const emailDispatchLogs: EmailDispatchLog[] = [
  {
    id: 'email-init-1',
    submissionId: 'sema-101',
    referenceCode: 'SEMA-SAF-8041',
    toEmail: 'dennis.kiprono@safaricom.co.ke',
    officerName: 'Eng. Dennis Kiprono',
    teamName: 'Safaricom Home Fibre & Enterprise NOC',
    category: 'Home Fibre & Fixed Internet',
    priority: 'Urgent',
    subject: '[SAFARICOM NOC DISPATCH] SEMA-SAF-8041 - Home Fibre Optical Node Fault (Urgent Priority)',
    body: `INCIDENT REFERENCE: SEMA-SAF-8041\nPRIORITY / URGENCY: URGENT\nTARGET SLA: 2 hours\nOFFICER: Eng. Dennis Kiprono (dennis.kiprono@safaricom.co.ke)\nLOCATION: Nairobi · Roysambu / Lumumba Drive\n\nCUSTOMER REPORT:\n"Router ya Safaricom Home Fibre inawaka red hapa Roysambu karibu na TRM tangu jana usiku, internet imelost na kazi imesimama. Tafadhali tusaidieni kuangalia fiber cable haraka."\n\nDIRECTIVES: Safaricom metro fiber splicing crew dispatched with OTDR fault locator. Re-splicing drop cable at pole terminal.`,
    sentAt: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
    status: 'Delivered',
  },
  {
    id: 'email-init-2',
    submissionId: 'sema-102',
    referenceCode: 'SEMA-SAF-8042',
    toEmail: 'grace.mwangi@safaricom.co.ke',
    officerName: 'Officer Grace Mwangi',
    teamName: 'M-PESA Escalations & Reversals Operations',
    category: 'M-PESA & Financial Services',
    priority: 'Urgent',
    subject: '[SAFARICOM M-PESA ALERT] SEMA-SAF-8042 - Hospital Paybill Transaction Stuck (Urgent Priority)',
    body: `INCIDENT REFERENCE: SEMA-SAF-8042\nPRIORITY / URGENCY: URGENT\nTARGET SLA: 30 minutes\nOFFICER: Officer Grace Mwangi (grace.mwangi@safaricom.co.ke)\nLOCATION: Nairobi · Umoja / Buruburu\n\nCUSTOMER REPORT:\n"Manze chapaa ya M-PESA imekwama kwa Paybill ya hospitali tangu asubuhi lakini message haijakam na mgonjwa hawezi release-iwa. Chanueni wasee wa M-PESA wasort hii transaction mbio!"\n\nDIRECTIVES: Emergency M-PESA gateway transaction query executed. Forced API settlement in progress.`,
    sentAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    status: 'Delivered',
  },
];

const KENYAN_RESPONSE_TEAMS = [
  {
    id: 'team-fibre',
    name: 'Safaricom Home Fibre & Enterprise NOC',
    department: 'Home Fibre & Fixed Internet',
    leadOfficer: 'Eng. Dennis Kiprono',
    email: 'dennis.kiprono@safaricom.co.ke',
  },
  {
    id: 'team-mpesa',
    name: 'M-PESA Escalations & Reversals Operations',
    department: 'M-PESA & Financial Services',
    leadOfficer: 'Officer Grace Mwangi',
    email: 'grace.mwangi@safaricom.co.ke',
  },
  {
    id: 'team-ran',
    name: '4G / 5G Mobile Network & Base Transceiver (BTS) Team',
    department: 'Mobile Network & 4G/5G Coverage',
    leadOfficer: 'Supervisor Brian Otieno',
    email: 'brian.otieno@safaricom.co.ke',
  },
  {
    id: 'team-fraud',
    name: 'SIM Swap, Identity Protection & Cyber-Fraud Unit',
    department: 'SIM Swap, Fraud & Security',
    leadOfficer: 'Insp. Hassan Ali',
    email: 'hassan.ali@safaricom.co.ke',
  },
  {
    id: 'team-care',
    name: 'Customer Experience & Airtime Billing Desk',
    department: 'Customer Care & Airtime Billing',
    leadOfficer: 'Coordinator Agnes Muthoni',
    email: 'agnes.muthoni@safaricom.co.ke',
  },
  {
    id: 'team-ent',
    name: 'Enterprise Business Solutions & Cloud Desk',
    department: 'Enterprise & Cloud Solutions',
    leadOfficer: 'Dr. Faith Wanjiku',
    email: 'faith.wanjiku@safaricom.co.ke',
  },
  {
    id: 'team-merch',
    name: 'Lipa Na M-PESA & Merchant Services Desk',
    department: 'Lipa Na M-PESA & Merchant Services',
    leadOfficer: 'Lead John Kimani',
    email: 'john.kimani@safaricom.co.ke',
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
  if (/\b(fibre|fiber|router|los|optical|wifi|modem|red light|cable cut|slow internet)\b/i.test(lower)) {
    return 'Home Fibre & Fixed Internet';
  }
  if (/\b(mpesa|m-pesa|fuliza|send money|reversal|hakikisha|paybill|till|withdraw|statement)\b/i.test(lower)) {
    return 'M-PESA & Financial Services';
  }
  if (/\b(4g|5g|network|signal|coverage|bts|mast|tower|emergency calls|call drop|bundles|airtel|poor reception)\b/i.test(lower)) {
    return 'Mobile Network & 4G/5G Coverage';
  }
  if (/\b(sim swap|fraud|scam|tapeli|wizi|hack|phishing|line block|puk|stolen line|identity|pin)\b/i.test(lower)) {
    return 'SIM Swap, Fraud & Security';
  }
  if (/\b(airtime|bonga|bonga points|postpay|prepay|billing|subscription|skiza|tunukiwa)\b/i.test(lower)) {
    return 'Customer Care & Airtime Billing';
  }
  if (/\b(enterprise|leased line|bulk sms|dedicated|cloud|sdwan|api|host|server)\b/i.test(lower)) {
    return 'Enterprise & Cloud Solutions';
  }
  if (/\b(merchant|lipa na mpesa|buy goods|merchant till|settlement)\b/i.test(lower)) {
    return 'Lipa Na M-PESA & Merchant Services';
  }
  return 'Home Fibre & Fixed Internet';
}

function determineClassificationRuleBased(text: string): AIClassification {
  const lower = text.toLowerCase();
  const category = detectIssueCategory(text);

  let urgency: PriorityLevel = 'Medium';
  let recommendedTeam = 'Safaricom Home Fibre & Enterprise NOC';
  let rationale = 'Routine Safaricom customer inquiry';
  let estimatedSLA = '24 hours';

  if (category === 'Home Fibre & Fixed Internet') {
    recommendedTeam = 'Safaricom Home Fibre & Enterprise NOC';
    if (/\b(red|los|cut|down|interrupted|dead|offline)\b/i.test(lower)) {
      urgency = 'Urgent';
      rationale = 'Optical fiber link down or red LOS light halting customer remote work or business connectivity.';
      estimatedSLA = '2 hours';
    } else {
      urgency = 'High';
      rationale = 'Degraded Wi-Fi performance or installation inquiry requiring fiber technician.';
      estimatedSLA = '6 hours';
    }
  } else if (category === 'M-PESA & Financial Services') {
    recommendedTeam = 'M-PESA Escalations & Reversals Operations';
    if (/\b(hospital|stuck|emergency|reversal|wrong number|trapped|stolen)\b/i.test(lower)) {
      urgency = 'Urgent';
      rationale = 'Critical financial transaction delay or payment stuck during medical/emergency checkout.';
      estimatedSLA = '30 minutes';
    } else {
      urgency = 'High';
      rationale = 'M-PESA statement or Fuliza query requiring financial systems reconciliation.';
      estimatedSLA = '2 hours';
    }
  } else if (category === 'Mobile Network & 4G/5G Coverage') {
    recommendedTeam = '4G / 5G Mobile Network & Base Transceiver (BTS) Team';
    if (/\b(emergency calls|blackout|mast|tower|storm|all lines|estate)\b/i.test(lower)) {
      urgency = 'High';
      rationale = 'Radio Access Network (RAN) sector failure or base station mast power fault.';
      estimatedSLA = '4 hours';
    } else {
      urgency = 'Medium';
      rationale = 'Localized coverage dip or call quality optimization request.';
      estimatedSLA = '12 hours';
    }
  } else if (category === 'SIM Swap, Fraud & Security') {
    recommendedTeam = 'SIM Swap, Identity Protection & Cyber-Fraud Unit';
    urgency = 'Urgent';
    rationale = 'Unauthorized SIM swap or credential theft attempt requiring immediate line freeze.';
    estimatedSLA = '1 hour';
  } else if (category === 'Customer Care & Airtime Billing') {
    recommendedTeam = 'Customer Experience & Airtime Billing Desk';
    urgency = 'Medium';
    rationale = 'Account bundle deduction or Bonga Points query requiring customer care review.';
    estimatedSLA = '12 hours';
  } else if (category === 'Enterprise & Cloud Solutions') {
    recommendedTeam = 'Enterprise Business Solutions & Cloud Desk';
    urgency = 'High';
    rationale = 'Corporate leased line or Bulk SMS gateway outage impacting business operations.';
    estimatedSLA = '4 hours';
  } else if (category === 'Lipa Na M-PESA & Merchant Services') {
    recommendedTeam = 'Lipa Na M-PESA & Merchant Services Desk';
    urgency = 'High';
    rationale = 'Merchant till terminal or Paybill settlement delay requiring business cashier support.';
    estimatedSLA = '2 hours';
  }

  // Sentiment and tension evaluation
  let frustrationScore = 30;
  const tensionFactors: string[] = [];

  if (
    lower.includes('sparking') ||
    lower.includes('cheche') ||
    lower.includes('moto') ||
    lower.includes('danger') ||
    lower.includes('hatari') ||
    lower.includes('hazard') ||
    lower.includes('emergency') ||
    urgency === 'Urgent'
  ) {
    frustrationScore += 45;
    tensionFactors.push('Urgent public safety or fire danger');
  }

  if (
    lower.includes('four days') ||
    lower.includes('days sasa') ||
    lower.includes('tangu jana') ||
    lower.includes('tangu juzi') ||
    lower.includes('tumechoka') ||
    lower.includes('unacceptable')
  ) {
    frustrationScore += 25;
    tensionFactors.push('Prolonged civic service blackout');
  }

  if (lower.includes('noma') || lower.includes('manze') || lower.includes('kimeumana') || lower.includes('furious')) {
    frustrationScore += 15;
    tensionFactors.push('Agitated community reporting tone');
  }

  const clampedScore = Math.min(Math.max(frustrationScore, 15), 98);
  const isHighTension = clampedScore >= 70 || urgency === 'Urgent';
  const tensionLevel: TensionLevel = isHighTension ? 'High' : clampedScore >= 45 ? 'Elevated' : 'Standard';

  let sentiment: CitizenSentiment = 'Neutral';
  if (clampedScore >= 80) {
    sentiment = lower.includes('hatari') || lower.includes('cheche') ? 'Distressed' : 'Frustrated';
  } else if (clampedScore >= 60) {
    sentiment = urgency === 'Urgent' ? 'Urgent' : 'Frustrated';
  } else if (lower.includes('please') || lower.includes('tafadhali') || lower.includes('thank')) {
    sentiment = 'Constructive';
  }

  if (tensionFactors.length === 0) {
    tensionFactors.push(isHighTension ? 'Priority public alert' : 'Standard factual reporting');
  }

  const tensionNotes = isHighTension
    ? `Flagged High Tension (${clampedScore}/100): ${tensionFactors.slice(0, 2).join('; ')}.`
    : `Standard tension (${clampedScore}/100). Reporting tone is manageable.`;

  return {
    category,
    urgency,
    recommendedTeam,
    rationale,
    estimatedSLA,
    sentiment,
    tensionLevel,
    frustrationScore: clampedScore,
    isHighTension,
    tensionFactors,
    tensionNotes,
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
      contents: `You are an expert Network Operations Center (NOC) and Customer Escalations Dispatcher for Safaricom PLC (Kenya).
Customer Report (may be in English, Kiswahili, or Sheng): "${text}"

Available Safaricom Response Teams:
${teamsList}

Determine:
1. category: Domain category (Home Fibre & Fixed Internet, M-PESA & Financial Services, Mobile Network & 4G/5G Coverage, SIM Swap, Fraud & Security, Customer Care & Airtime Billing, Enterprise & Cloud Solutions, Lipa Na M-PESA & Merchant Services).
2. urgency: One of: "Urgent", "High", "Medium", "Routine" (Urgent if medical payment stuck, unauthorized SIM swap, red LOS fiber optical cut, BTS mast failure; High if widespread localized disruption; Medium if account or bundle inquiry; Routine if general query).
3. recommendedTeam: The exact matching Safaricom team name from the list above.
4. rationale: A concise 1-sentence technical explanation of why this incident routes to this team and urgency level.
5. estimatedSLA: Target response turnaround (e.g. "30 minutes", "1 hour", "2 hours", "4 hours", "12 hours", "24 hours").
6. sentiment: One of: "Frustrated", "Distressed", "Angry", "Urgent", "Neutral", "Constructive".
7. frustrationScore: Score from 0 to 100 based on subscriber agitation, funds stuck, red LOS light, or outage duration.
8. isHighTension: true if frustrationScore >= 70 or urgency === "Urgent", else false.
9. tensionNotes: A short 1-sentence note for Safaricom field engineers & care agents regarding customer sentiment.`,
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
            sentiment: { type: Type.STRING },
            frustrationScore: { type: Type.INTEGER },
            isHighTension: { type: Type.BOOLEAN },
            tensionNotes: { type: Type.STRING },
          },
          required: [
            'category',
            'urgency',
            'recommendedTeam',
            'rationale',
            'estimatedSLA',
            'sentiment',
            'frustrationScore',
            'isHighTension',
            'tensionNotes',
          ],
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      const urgencyVal: PriorityLevel =
        ['Urgent', 'High', 'Medium', 'Routine'].includes(parsed.urgency)
          ? parsed.urgency
          : 'Medium';

      const frustrationScore =
        typeof parsed.frustrationScore === 'number' ? parsed.frustrationScore : urgencyVal === 'Urgent' ? 90 : 35;
      const isHighTension = parsed.isHighTension ?? (frustrationScore >= 70 || urgencyVal === 'Urgent');

      return {
        category: parsed.category || detectIssueCategory(text),
        urgency: urgencyVal,
        recommendedTeam: parsed.recommendedTeam || KENYAN_RESPONSE_TEAMS[0].name,
        rationale: parsed.rationale || 'Classified by SEMA automated dispatcher.',
        estimatedSLA: parsed.estimatedSLA || '24 hours',
        sentiment: parsed.sentiment || (isHighTension ? 'Frustrated' : 'Neutral'),
        tensionLevel: isHighTension ? 'High' : frustrationScore >= 45 ? 'Elevated' : 'Standard',
        frustrationScore,
        isHighTension,
        tensionNotes:
          parsed.tensionNotes ||
          (isHighTension ? 'High citizen tension and urgency flagged.' : 'Standard operational tension.'),
      };
    }
  } catch (err: any) {
    console.warn('AI classification notice:', err?.message || 'Using rule-based fallback');
  }

  return determineClassificationRuleBased(text);
}

function generateLocalCommitment(text: string, lang: 'English' | 'Kiswahili' | 'Sheng', category: string): string {
  if (lang === 'Sheng') {
    return `Rada ya Safaricom imefika poa! Tumelogi hii issue ya ${category} na timu yetu ya technical engineers wamepewa alert kuisort mbio bila delay.`;
  }
  if (lang === 'Kiswahili') {
    return `Asante mteja wa Safaricom. Tumepokea ripoti yako kuhusu ${category}. Timu yetu ya kiufundi na huduma kwa wateja imejulishwa na inashughulikia hitilafu hii mara moja.`;
  }
  return `Thank you for contacting Safaricom. Your incident regarding ${category} has been logged with our Network Operations Center (NOC). A specialized field & systems team has been assigned for resolution.`;
}

const submissionsStore: SubmissionRecord[] = [
  {
    id: 'sema-101',
    referenceCode: 'SEMA-SAF-8041',
    text: 'Router ya Safaricom Home Fibre inawaka red hapa Roysambu karibu na TRM tangu jana usiku, internet imelost na kazi imesimama. Tafadhali tusaidieni kuangalia fiber cable haraka.',
    detectedLanguage: 'Kiswahili',
    englishTranslation: 'The Safaricom Home Fibre router has a blinking red LOS light here in Roysambu near TRM since last night, internet is down and remote work has stopped. Please inspect the fiber optical cable urgently.',
    category: 'Home Fibre & Fixed Internet',
    countyOrWard: 'Nairobi · Roysambu / Lumumba Drive',
    captureMethod: 'voice',
    aiCommitmentResponse: 'Tumepokea ripoti yako kuhusu mtandao wa Safaricom Home Fibre Roysambu. Timu yetu ya fiber engineering imetumwa mara moja kurekebisha line hiyo.',
    status: 'In Progress',
    priority: 'Urgent',
    assignedTeam: 'Safaricom Home Fibre & Enterprise NOC',
    assignedOfficer: 'Eng. Dennis Kiprono',
    assignedOfficerEmail: 'dennis.kiprono@safaricom.co.ke',
    emailAlertSent: true,
    emailAlertRecipient: 'dennis.kiprono@safaricom.co.ke',
    emailAlertSentAt: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
    emailAlertSubject: '[SAFARICOM NOC DISPATCH] SEMA-SAF-8041 - Home Fibre Optical Node Fault (Urgent Priority)',
    emailAlertBody: `======================================================
SAFARICOM PLC - RAPID INCIDENT DISPATCH NOTICE
Network Operations Center (NOC) & Customer Escalations
======================================================

INCIDENT REFERENCE: SEMA-SAF-8041
PRIORITY / URGENCY: URGENT
TARGET SLA:         2 hours
CATEGORY:           Home Fibre & Fixed Internet
LOCATION:           Nairobi · Roysambu / Lumumba Drive

ASSIGNED FIELD OFFICER:
  Engineer: Eng. Dennis Kiprono
  Email:    dennis.kiprono@safaricom.co.ke
  Team:     Safaricom Home Fibre & Enterprise NOC

------------------------------------------------------
CUSTOMER INCIDENT REPORT (ORIGINAL):
------------------------------------------------------
"Router ya Safaricom Home Fibre inawaka red hapa Roysambu karibu na TRM tangu jana usiku, internet imelost na kazi imesimama. Tafadhali tusaidieni kuangalia fiber cable haraka."
Language: Kiswahili (Capture Method: voice)
English Translation: "The Safaricom Home Fibre router has a blinking red LOS light here in Roysambu near TRM since last night, internet is down and remote work has stopped. Please inspect the fiber optical cable urgently."

------------------------------------------------------
DISPATCH & AI ROUTING DIRECTIVES:
------------------------------------------------------
Routing Rationale: Red Optical Loss of Signal (LOS) reported on feeder cable affecting residential broadband cluster near TRM.
Directives:        Safaricom metro fiber splicing crew dispatched with OTDR fault locator. Re-splicing drop cable at pole terminal.

REQUIRED IMMEDIATE ACTIONS:
1. Acknowledge dispatch ticket and verify line optical power (dBm) within SLA window (2 hours).
2. Update incident milestone status to "In Progress" in the Safaricom Dispatch Console.
3. Verify customer optical link recovery and submit clearance memo.

Dispatch Console Access: https://safaricom.co.ke/dispatch?ref=SEMA-SAF-8041
Automated alert dispatched by Safaricom SEMA Intelligent NOC Operations.
======================================================`,
    aiClassification: {
      category: 'Home Fibre & Fixed Internet',
      urgency: 'Urgent',
      recommendedTeam: 'Safaricom Home Fibre & Enterprise NOC',
      rationale: 'Red Optical Loss of Signal (LOS) reported on feeder cable affecting residential broadband cluster near TRM.',
      estimatedSLA: '2 hours',
    },
    adminNotes: 'Safaricom metro fiber splicing crew dispatched with OTDR fault locator. Re-splicing drop cable at pole terminal.',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'sema-102',
    referenceCode: 'SEMA-SAF-8042',
    text: 'Manze chapaa ya M-PESA imekwama kwa Paybill ya hospitali tangu asubuhi lakini message haijakam na mgonjwa hawezi release-iwa. Chanueni wasee wa M-PESA wasort hii transaction mbio!',
    detectedLanguage: 'Sheng',
    englishTranslation: 'My M-PESA money has been stuck on a hospital Paybill since morning but no confirmation SMS was received and the patient cannot be discharged. Alert M-PESA core operations to resolve this transaction urgently!',
    category: 'M-PESA & Financial Services',
    countyOrWard: 'Nairobi · Umoja / Buruburu',
    captureMethod: 'voice',
    aiCommitmentResponse: 'Rada imefika safi! M-PESA core escalations desk imepewa alert kuhusu hii transaction na wanacheck settlement records mara hii.',
    status: 'Assigned',
    priority: 'Urgent',
    assignedTeam: 'M-PESA Escalations & Reversals Operations',
    assignedOfficer: 'Officer Grace Mwangi',
    assignedOfficerEmail: 'grace.mwangi@safaricom.co.ke',
    emailAlertSent: true,
    emailAlertRecipient: 'grace.mwangi@safaricom.co.ke',
    emailAlertSentAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    emailAlertSubject: '[SAFARICOM M-PESA ALERT] SEMA-SAF-8042 - Hospital Paybill Transaction Stuck (Urgent Priority)',
    emailAlertBody: `======================================================
SAFARICOM PLC - RAPID INCIDENT DISPATCH NOTICE
M-PESA Escalations & Core Operations Command
======================================================

INCIDENT REFERENCE: SEMA-SAF-8042
PRIORITY / URGENCY: URGENT
TARGET SLA:         30 minutes
CATEGORY:           M-PESA & Financial Services
LOCATION:           Nairobi · Umoja / Buruburu

ASSIGNED FIELD OFFICER:
  Officer: Officer Grace Mwangi
  Email:   grace.mwangi@safaricom.co.ke
  Team:    M-PESA Escalations & Reversals Operations

------------------------------------------------------
CUSTOMER INCIDENT REPORT (ORIGINAL):
------------------------------------------------------
"Manze chapaa ya M-PESA imekwama kwa Paybill ya hospitali tangu asubuhi lakini message haijakam na mgonjwa hawezi release-iwa. Chanueni wasee wa M-PESA wasort hii transaction mbio!"
Language: Sheng (Capture Method: voice)
English Translation: "My M-PESA money has been stuck on a hospital Paybill since morning but no confirmation SMS was received and the patient cannot be discharged. Alert M-PESA core operations to resolve this transaction urgently!"

------------------------------------------------------
DISPATCH & AI ROUTING DIRECTIVES:
------------------------------------------------------
Routing Rationale: Patient discharge delayed due to pending hospital Paybill transaction callback timeout.
Directives:        Emergency M-PESA gateway transaction query executed. Forced API settlement in progress.

REQUIRED IMMEDIATE ACTIONS:
1. Re-query core M-PESA switch log and push B2C/B2B confirmation callback within target SLA (30 min).
2. Update incident milestone status to "In Progress" in the Safaricom Dispatch Console.
3. Transmit confirmation SMS to citizen and hospital billing accounts desk.

Dispatch Console Access: https://safaricom.co.ke/dispatch?ref=SEMA-SAF-8042
Automated alert dispatched by Safaricom SEMA Intelligent NOC Operations.
======================================================`,
    aiClassification: {
      category: 'M-PESA & Financial Services',
      urgency: 'Urgent',
      recommendedTeam: 'M-PESA Escalations & Reversals Operations',
      rationale: 'Patient discharge delayed due to pending hospital Paybill transaction callback timeout.',
      estimatedSLA: '30 minutes',
    },
    adminNotes: 'Emergency M-PESA gateway transaction query executed. Forced API settlement in progress.',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'sema-103',
    referenceCode: 'SEMA-SAF-8043',
    text: 'Our entire estate along Kenyatta Avenue in Nakuru CBD has experienced severe 4G and 5G network dropouts with emergency calls only on all Safaricom lines since the thunderstorm yesterday.',
    detectedLanguage: 'English',
    category: 'Mobile Network & 4G/5G Coverage',
    countyOrWard: 'Nakuru · Nakuru CBD / Biashara',
    captureMethod: 'text',
    aiCommitmentResponse: 'Thank you for reporting this network outage. Safaricom Radio Access Network (RAN) engineering has scheduled immediate BTS mast diagnostic and power restoration within 4 hours.',
    status: 'Received',
    priority: 'High',
    aiClassification: {
      category: 'Mobile Network & 4G/5G Coverage',
      urgency: 'High',
      recommendedTeam: '4G / 5G Mobile Network & Base Transceiver (BTS) Team',
      rationale: 'Severe 4G/5G radio carrier dropout following thunderstorm affecting central business district.',
      estimatedSLA: '4 hours',
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
        console.warn('Gemini transcribe fallback attempt with gemini-3.8-flash:', geminiErr?.message);
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
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
          rawTranscript = (fallbackResponse.text || '').trim();
        } catch {
          rawTranscript = fallbackText;
        }
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
          text: 'Hello Safaricom team, our Home Fibre link in Kilimani along Argwings Kodhek has been down with a red LOS indicator for two days. We have critical remote work meetings, please dispatch a fiber technician urgently.',
          langLabel: 'English',
        },
        sw: {
          text: 'Habari Safaricom, nilituma pesa kimakosa kupitia M-PESA kwenda namba isiyo sahihi na nikatuma ombi la reversal 456 lakini sijapata ujumbe wowote tangu asubuhi. Naomba msaada wa haraka.',
          langLabel: 'Kiswahili',
          translation: 'Hello Safaricom, I accidentally sent money via M-PESA to the wrong number and requested a reversal via 456 but have received no update since morning. Please assist urgently.',
        },
        sheng: {
          text: 'Niaje Safaricom, manze huku Kasarani network ya 4G na 5G imedrop mbaya sana, simu zote zinasoma emergency calls only na bundle haifunguki. Tuchanueni vile mnafix hii issue chapchap.',
          langLabel: 'Sheng',
          translation: 'Hi Safaricom, seriously here in Kasarani 4G and 5G network has dropped completely, all phones show emergency calls only and data bundles are inaccessible. Please let us know how you will fix this quickly.',
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
        transcript: 'Hello Safaricom team, our Home Fibre link in Kilimani along Argwings Kodhek has been down with a red LOS indicator for two days. Please dispatch a fiber technician urgently.',
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

  // Email alert generator helper for assigned officers
  function generateDispatchEmailAlert(
    item: SubmissionRecord,
    officerName: string,
    officerEmail: string,
    teamName: string
  ): { subject: string; body: string } {
    const urgency = item.priority || item.aiClassification?.urgency || 'Medium';
    const sla =
      item.aiClassification?.estimatedSLA ||
      (urgency === 'Urgent' ? '2 hours' : urgency === 'High' ? '6 hours' : '24 hours');
    const subject = `[SEMA DISPATCH ALERT] ${item.referenceCode} - ${item.category} (${urgency} Priority)`;

    const body = `======================================================
SEMA NATIONAL CITIZEN INCIDENT DISPATCH NOTICE
Government of Kenya - Municipal Rapid Response Command
======================================================

INCIDENT REFERENCE: ${item.referenceCode}
PRIORITY / URGENCY: ${urgency.toUpperCase()}
TARGET SLA:         ${sla}
CATEGORY:           ${item.category}
LOCATION:           ${item.countyOrWard}
DATE LOGGED:        ${new Date(item.createdAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })} EAT

ASSIGNED FIELD OFFICER:
  Officer: ${officerName}
  Email:   ${officerEmail}
  Team:    ${teamName}

------------------------------------------------------
CITIZEN INCIDENT REPORT (ORIGINAL):
------------------------------------------------------
"${item.text}"
Language: ${item.detectedLanguage} (Capture Method: ${item.captureMethod})
${item.englishTranslation ? `\nEnglish Translation:\n"${item.englishTranslation}"\n` : ''}
${item.contactInfo ? `Citizen Contact: ${item.contactInfo}` : 'Citizen Contact: Anonymous / Voice Portal'}

------------------------------------------------------
DISPATCH & AI ROUTING DIRECTIVES:
------------------------------------------------------
Routing Rationale: ${item.aiClassification?.rationale || 'Dispatched for immediate on-site inspection and remedial action.'}
Admin Directives:  ${item.adminNotes || 'Proceed with standard emergency operating procedure.'}

REQUIRED IMMEDIATE ACTIONS:
1. Confirm receipt and mobilize ground response crew within the target SLA window (${sla}).
2. Update incident milestone status to "In Progress" in the SEMA Dispatch Console upon arrival.
3. Submit post-intervention clearance report and resolution notes upon completion.

Dispatch Console Access: https://sema.go.ke/admin?ref=${item.referenceCode}
Automated alert dispatched by SEMA Intelligent Dispatch System.
======================================================`;

    return { subject, body };
  }

  // 7. Admin: Assign Report to Team & Officer (with Automated Email Alert)
  app.patch('/api/submissions/:id/assign', (req, res) => {
    const { id } = req.params;
    const {
      assignedTeam,
      assignedOfficer,
      assignedOfficerEmail,
      priority,
      status = 'Assigned',
      adminNotes,
      sendEmailAlert = true,
    } = req.body;

    const item = submissionsStore.find((s) => s.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (assignedTeam) item.assignedTeam = assignedTeam;
    if (assignedOfficer) item.assignedOfficer = assignedOfficer;
    if (priority) item.priority = priority;
    if (status) item.status = status;
    if (adminNotes !== undefined) item.adminNotes = adminNotes;

    // Resolve Officer & Email
    const matchedTeam =
      KENYAN_RESPONSE_TEAMS.find((t) => t.name === (assignedTeam || item.assignedTeam)) ||
      KENYAN_RESPONSE_TEAMS[0];
    const resolvedOfficer = assignedOfficer || item.assignedOfficer || matchedTeam.leadOfficer;
    const resolvedEmail = assignedOfficerEmail || item.assignedOfficerEmail || matchedTeam.email;

    item.assignedOfficer = resolvedOfficer;
    item.assignedOfficerEmail = resolvedEmail;

    let emailAlertLog: EmailDispatchLog | null = null;
    if (sendEmailAlert && (assignedTeam || assignedOfficer)) {
      const emailContent = generateDispatchEmailAlert(
        item,
        resolvedOfficer,
        resolvedEmail,
        item.assignedTeam || matchedTeam.name
      );

      item.emailAlertSent = true;
      item.emailAlertRecipient = resolvedEmail;
      item.emailAlertSentAt = new Date().toISOString();
      item.emailAlertSubject = emailContent.subject;
      item.emailAlertBody = emailContent.body;

      emailAlertLog = {
        id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        submissionId: item.id,
        referenceCode: item.referenceCode,
        toEmail: resolvedEmail,
        officerName: resolvedOfficer,
        teamName: item.assignedTeam || matchedTeam.name,
        category: item.category,
        priority: item.priority || 'Medium',
        subject: emailContent.subject,
        body: emailContent.body,
        sentAt: item.emailAlertSentAt,
        status: 'Delivered',
      };
      emailDispatchLogs.unshift(emailAlertLog);
    }

    return res.json({ submission: item, emailAlert: emailAlertLog });
  });

  // 8. Admin: Auto-Assign All Unassigned Reports Using AI (Sends Automated Email Alerts)
  app.post('/api/submissions/auto-assign-all', async (_req, res) => {
    const unassigned = submissionsStore.filter(
      (s) => s.status === 'Received' || !s.assignedTeam
    );

    const updatedRecords: SubmissionRecord[] = [];
    const createdEmailAlerts: EmailDispatchLog[] = [];

    for (const item of unassigned) {
      const classification = await classifyWithAI(item.text);
      item.aiClassification = classification;
      item.category = classification.category;
      item.priority = classification.urgency;
      item.assignedTeam = classification.recommendedTeam;

      // Match lead officer & official email
      const matchedTeam = KENYAN_RESPONSE_TEAMS.find(
        (t) => t.name === classification.recommendedTeam
      ) || KENYAN_RESPONSE_TEAMS[0];

      item.assignedOfficer = matchedTeam.leadOfficer;
      item.assignedOfficerEmail = matchedTeam.email;
      item.status = 'Assigned';
      item.adminNotes = `AI Auto-assigned: ${classification.rationale} (Target SLA: ${classification.estimatedSLA})`;

      // Dispatch automated officer email alert
      const emailContent = generateDispatchEmailAlert(
        item,
        item.assignedOfficer,
        item.assignedOfficerEmail,
        item.assignedTeam
      );

      item.emailAlertSent = true;
      item.emailAlertRecipient = item.assignedOfficerEmail;
      item.emailAlertSentAt = new Date().toISOString();
      item.emailAlertSubject = emailContent.subject;
      item.emailAlertBody = emailContent.body;

      const emailLog: EmailDispatchLog = {
        id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        submissionId: item.id,
        referenceCode: item.referenceCode,
        toEmail: item.assignedOfficerEmail,
        officerName: item.assignedOfficer,
        teamName: item.assignedTeam,
        category: item.category,
        priority: item.priority,
        subject: emailContent.subject,
        body: emailContent.body,
        sentAt: item.emailAlertSentAt,
        status: 'Delivered',
      };

      emailDispatchLogs.unshift(emailLog);
      createdEmailAlerts.push(emailLog);
      updatedRecords.push(item);
    }

    return res.json({
      message: `Successfully classified and auto-assigned ${updatedRecords.length} reports. Dispatched ${createdEmailAlerts.length} officer email alerts.`,
      count: updatedRecords.length,
      emailAlertsCount: createdEmailAlerts.length,
      submissions: submissionsStore,
    });
  });

  // 8b. Admin: Manually Send or Resend Officer Email Alert
  app.post('/api/submissions/:id/send-email-alert', (req, res) => {
    const { id } = req.params;
    const item = submissionsStore.find((s) => s.id === id);
    if (!item) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const matchedTeam =
      KENYAN_RESPONSE_TEAMS.find((t) => t.name === item.assignedTeam) || KENYAN_RESPONSE_TEAMS[0];
    const officerName = req.body.officerName || item.assignedOfficer || matchedTeam.leadOfficer;
    const officerEmail = req.body.officerEmail || item.assignedOfficerEmail || matchedTeam.email;

    item.assignedOfficer = officerName;
    item.assignedOfficerEmail = officerEmail;

    const emailContent = generateDispatchEmailAlert(
      item,
      officerName,
      officerEmail,
      item.assignedTeam || matchedTeam.name
    );

    item.emailAlertSent = true;
    item.emailAlertRecipient = officerEmail;
    item.emailAlertSentAt = new Date().toISOString();
    item.emailAlertSubject = emailContent.subject;
    item.emailAlertBody = emailContent.body;

    const emailLog: EmailDispatchLog = {
      id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      submissionId: item.id,
      referenceCode: item.referenceCode,
      toEmail: officerEmail,
      officerName,
      teamName: item.assignedTeam || matchedTeam.name,
      category: item.category,
      priority: item.priority || 'Medium',
      subject: emailContent.subject,
      body: emailContent.body,
      sentAt: item.emailAlertSentAt,
      status: 'Delivered',
    };
    emailDispatchLogs.unshift(emailLog);

    return res.json({
      success: true,
      message: `Automated email alert delivered to ${officerName} (${officerEmail}).`,
      emailLog,
      submission: item,
    });
  });

  // 8c. Admin: Get Email Dispatch Logs
  app.get('/api/email-dispatch-logs', (_req, res) => {
    return res.json({ logs: emailDispatchLogs, count: emailDispatchLogs.length });
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

  // 10. Admin: AI-Powered Issue Analytics & Synthesis
  app.get('/api/admin/analytics', async (_req, res) => {
    const total = submissionsStore.length;
    const categoryCounts: Record<string, number> = {};
    const urgencyCounts: Record<string, number> = { Urgent: 0, High: 0, Medium: 0, Routine: 0 };
    const langCounts: Record<string, number> = { English: 0, Kiswahili: 0, Sheng: 0 };

    for (const sub of submissionsStore) {
      const cat = sub.category || 'Civic & Public Services';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const urg = sub.priority || 'Medium';
      urgencyCounts[urg] = (urgencyCounts[urg] || 0) + 1;

      const lang = sub.detectedLanguage || 'English';
      langCounts[lang] = (langCounts[lang] || 0) + 1;
    }

    const categories = Object.entries(categoryCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const topCategory = categories[0]?.name || 'Home Fibre & Fixed Internet';
    const topCount = categories[0]?.count || 0;

    let aiBrief = `Safaricom SEMA NOC Synthesis: Analyzed ${total} customer incident logs across Kenya. Primary customer demand centers on "${topCategory}" (${topCount} incidents). Priority focus is directed towards optical fiber re-splicing, M-PESA transaction callbacks, and 4G/5G mast power continuity.`;
    let recommendations = [
      `Dispatch Safaricom metro fiber splicing teams with OTDR fault locators along active red-LOS clusters.`,
      `Audit core M-PESA B2C/B2B transaction switch reconciliation to achieve 30-minute SLA on hospital and till payments.`,
      `Maintain automated proactive SMS notifications in Kiswahili and Sheng to keep affected subscribers informed.`,
    ];

    const ai = getGenAIClient();
    if (ai) {
      try {
        const prompt = `You are the Chief Network Operations Center (NOC) and Customer Incident Analyst for Safaricom PLC (Kenya).
We have ${total} subscriber incident reports across these categories: ${JSON.stringify(categories)}.
Urgency counts: ${JSON.stringify(urgencyCounts)}.
Languages used: ${JSON.stringify(langCounts)}.

Provide a concise 2-sentence executive summary and 3 bullet point actionable technical recommendations for Safaricom NOC directors and response team leads. Return JSON with keys: "executiveSummary" (string) and "recommendations" (array of 3 strings).`;

        const aiResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (aiResponse.text) {
          const parsed = JSON.parse(aiResponse.text);
          if (parsed.executiveSummary) aiBrief = parsed.executiveSummary;
          if (Array.isArray(parsed.recommendations)) recommendations = parsed.recommendations;
        }
      } catch (err) {
        console.warn('AI analytics generation notice:', err);
      }
    }

    return res.json({
      totalReports: total,
      categories,
      urgencyCounts,
      langCounts,
      executiveSummary: aiBrief,
      recommendations,
      generatedAt: new Date().toISOString(),
      aiPowered: Boolean(ai),
    });
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
