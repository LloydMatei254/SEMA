export type LanguageCode = 'auto' | 'en' | 'sw' | 'sheng';

export type DetectedLanguageLabel = 'English' | 'Kiswahili' | 'Sheng';

export interface SubmissionRecord {
  id: string;
  referenceCode: string;
  text: string;
  detectedLanguage: DetectedLanguageLabel;
  englishTranslation?: string;
  category: string;
  countyOrWard: string;
  contactInfo?: string;
  captureMethod: 'voice' | 'text' | 'hybrid';
  aiCommitmentResponse: string;
  status: 'Received' | 'Assigned' | 'In Resolution';
  createdAt: string;
}

export interface TypewriterPhrase {
  langCode: 'en' | 'sw' | 'sheng';
  langLabel: DetectedLanguageLabel;
  regionNote: string;
  headline: string;
  placeholder: string;
  ctaLabel: string;
}
