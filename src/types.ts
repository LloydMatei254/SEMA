export type LanguageCode = 'auto' | 'en' | 'sw' | 'sheng';

export type DetectedLanguageLabel = 'English' | 'Kiswahili' | 'Sheng';

export type PriorityLevel = 'Urgent' | 'High' | 'Medium' | 'Routine';

export type ReportStatus = 'Received' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export interface AIClassification {
  category: string;
  urgency: PriorityLevel;
  recommendedTeam: string;
  rationale: string;
  estimatedSLA: string;
  confidenceScore?: number;
}

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
  status: ReportStatus;
  createdAt: string;
  assignedTeam?: string;
  assignedOfficer?: string;
  priority?: PriorityLevel;
  aiClassification?: AIClassification;
  adminNotes?: string;
  resolvedAt?: string;
}

export interface ResponseTeam {
  id: string;
  name: string;
  shortCode: string;
  department: string;
  leadOfficer: string;
  phone: string;
  activeCount: number;
  color: 'emerald' | 'sky' | 'amber' | 'rose' | 'teal' | 'lime' | 'indigo';
}

export const KENYAN_RESPONSE_TEAMS: ResponseTeam[] = [
  {
    id: 'team-kplc',
    name: 'Kenya Power Emergency & Streetlighting Unit',
    shortCode: 'KPLC-EMG',
    department: 'Power & Street Lighting',
    leadOfficer: 'Eng. Dennis Kiprono',
    phone: '0703 070 707',
    activeCount: 14,
    color: 'emerald',
  },
  {
    id: 'team-water',
    name: 'Nairobi / County Water & Sewerage Rapid Response',
    shortCode: 'NCWSC-OPS',
    department: 'Water & Sanitation',
    leadOfficer: 'Officer Grace Mwangi',
    phone: '0703 080 598',
    activeCount: 9,
    color: 'sky',
  },
  {
    id: 'team-roads',
    name: 'KeRRA & KURA Urban Roads & Drainage Taskforce',
    shortCode: 'KURA-RDS',
    department: 'Roads & Infrastructure',
    leadOfficer: 'Supervisor Brian Otieno',
    phone: '0722 000 111',
    activeCount: 12,
    color: 'amber',
  },
  {
    id: 'team-health',
    name: 'County Public Health & Clinic Inspection Unit',
    shortCode: 'CPH-HLTH',
    department: 'Health & Medical Services',
    leadOfficer: 'Dr. Faith Wanjiku',
    phone: '0711 222 333',
    activeCount: 6,
    color: 'teal',
  },
  {
    id: 'team-waste',
    name: 'National Environment & Waste Clearance Team',
    shortCode: 'NEMA-CLEN',
    department: 'Waste Management',
    leadOfficer: 'Insp. Hassan Ali',
    phone: '0733 444 555',
    activeCount: 8,
    color: 'lime',
  },
  {
    id: 'team-safety',
    name: 'Administration Police & Community Safety Rapid Unit',
    shortCode: 'NPS-SAFE',
    department: 'Public Safety & Security',
    leadOfficer: 'Sgt. John Kimani',
    phone: '0720 999 888',
    activeCount: 16,
    color: 'rose',
  },
  {
    id: 'team-huduma',
    name: 'Huduma Citizen Digital Services & Registry Desk',
    shortCode: 'HUDUMA-REG',
    department: 'Civic & Public Services',
    leadOfficer: 'Coordinator Agnes Muthoni',
    phone: '0800 723 253',
    activeCount: 5,
    color: 'indigo',
  },
];

export interface TypewriterPhrase {
  langCode: 'en' | 'sw' | 'sheng';
  langLabel: DetectedLanguageLabel;
  regionNote: string;
  headline: string;
  placeholder: string;
  ctaLabel: string;
}
