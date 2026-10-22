/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { HeaderWithTypewriter } from './components/HeaderWithTypewriter';
import { VoiceTextCaptureHero } from './components/VoiceTextCaptureHero';
import { FooterContact } from './components/FooterContact';
import { AdminDispatchConsole } from './components/AdminDispatchConsole';
import { SubmissionRecord } from './types';

const INITIAL_SUBMISSIONS: SubmissionRecord[] = [
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
      sentiment: 'Distressed',
      tensionLevel: 'High',
      frustrationScore: 92,
      isHighTension: true,
      tensionFactors: ['Home Fibre red LOS blinking', 'Remote work completely interrupted', 'Extended overnight outage'],
      tensionNotes: 'Flagged High Tension (92/100): Customer in Roysambu expresses severe distress over lost working hours due to optical fiber line failure.',
    },
    sentiment: 'Distressed',
    tensionLevel: 'High',
    frustrationScore: 92,
    isHighTension: true,
    tensionFactors: ['Home Fibre red LOS blinking', 'Remote work completely interrupted', 'Extended overnight outage'],
    tensionNotes: 'Flagged High Tension (92/100): Customer in Roysambu expresses severe distress over lost working hours due to optical fiber line failure.',
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
      sentiment: 'Frustrated',
      tensionLevel: 'High',
      frustrationScore: 88,
      isHighTension: true,
      tensionFactors: ['Hospital discharge blocked by payment delay', 'High agitation over trapped funds', 'Unreceived M-PESA confirmation SMS'],
      tensionNotes: 'Flagged High Tension (88/100): Critical medical payment impasse caused by pending transaction callback in Umoja.',
    },
    sentiment: 'Frustrated',
    tensionLevel: 'High',
    frustrationScore: 88,
    isHighTension: true,
    tensionFactors: ['Hospital discharge blocked by payment delay', 'High agitation over trapped funds', 'Unreceived M-PESA confirmation SMS'],
    tensionNotes: 'Flagged High Tension (88/100): Critical medical payment impasse caused by pending transaction callback in Umoja.',
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
      sentiment: 'Neutral',
      tensionLevel: 'Standard',
      frustrationScore: 40,
      isHighTension: false,
      tensionFactors: ['Widespread commercial BTS sector degradation'],
      tensionNotes: 'Standard network outage ticket (40/100): Clear technical description of Nakuru CBD 4G/5G coverage degradation.',
    },
    sentiment: 'Neutral',
    tensionLevel: 'Standard',
    frustrationScore: 40,
    isHighTension: false,
    tensionFactors: ['Widespread commercial BTS sector degradation'],
    tensionNotes: 'Standard network outage ticket (40/100): Clear technical description of Nakuru CBD 4G/5G coverage degradation.',
    createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
];

export default function App() {
  const [currentView, setCurrentView] = useState<'citizen' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      if (
        hash === '#customer-portal' ||
        hash === '#portal' ||
        hash === '#customer' ||
        params.get('view') === 'customer' ||
        params.get('view') === 'portal'
      ) {
        return 'citizen';
      }
      if (hash === '#admin' || params.get('view') === 'admin') {
        return 'admin';
      }
    }
    return 'citizen';
  });

  const [activePhraseIndex, setActivePhraseIndex] = useState(0);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Centralized Submissions State
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(() => {
    try {
      const stored = localStorage.getItem('sema_submissions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_SUBMISSIONS;
  });

  const fetchSubmissionsFromApi = useCallback(async () => {
    try {
      const res = await fetch('/api/submissions');
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && Array.isArray(data.submissions) && data.submissions.length > 0) {
          setSubmissions(data.submissions);
          try {
            localStorage.setItem('sema_submissions', JSON.stringify(data.submissions));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // safe fallback
    }
  }, []);

  useEffect(() => {
    fetchSubmissionsFromApi();
  }, [fetchSubmissionsFromApi]);

  // Handle Hash Changes for URL deep linking & Customer Portal direct access
  useEffect(() => {
    const handleNavigation = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      if (
        hash === '#customer-portal' ||
        hash === '#portal' ||
        hash === '#customer' ||
        hash === '#top' ||
        params.get('view') === 'customer' ||
        params.get('view') === 'portal'
      ) {
        setCurrentView('citizen');
        setTimeout(() => {
          const el =
            document.getElementById('customer-portal') ||
            document.getElementById('voice-capture') ||
            document.getElementById('top');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else if (hash === '#admin' || params.get('view') === 'admin') {
        setCurrentView('admin');
      }
    };

    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);

    // Initial check on mount: if opened directly with customer-portal hash/param, scroll smoothly to the box
    if (typeof window !== 'undefined') {
      const initialHash = window.location.hash;
      const initialParams = new URLSearchParams(window.location.search);
      if (
        initialHash === '#customer-portal' ||
        initialHash === '#portal' ||
        initialHash === '#customer' ||
        initialParams.get('view') === 'customer' ||
        initialParams.get('view') === 'portal'
      ) {
        setTimeout(() => {
          const el =
            document.getElementById('customer-portal') ||
            document.getElementById('voice-capture') ||
            document.getElementById('top');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }

    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);

  const handleSwitchToAdmin = () => {
    setCurrentView('admin');
    window.location.hash = 'admin';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToCitizen = () => {
    setCurrentView('citizen');
    window.location.hash = 'customer-portal';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFocusVoiceBox = () => {
    if (currentView !== 'citizen') {
      setCurrentView('citizen');
    }
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleNewSubmission = (newSub: SubmissionRecord) => {
    setSubmissions((prev) => {
      const exists = prev.some((s) => s.id === newSub.id);
      const updated = exists ? prev.map((s) => (s.id === newSub.id ? newSub : s)) : [newSub, ...prev];
      try {
        localStorage.setItem('sema_submissions', JSON.stringify(updated.slice(0, 30)));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleUpdateSubmission = (updatedSub: SubmissionRecord) => {
    setSubmissions((prev) => {
      const updated = prev.map((s) => (s.id === updatedSub.id ? updatedSub : s));
      try {
        localStorage.setItem('sema_submissions', JSON.stringify(updated.slice(0, 30)));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const unassignedCount = submissions.filter(
    (s) => s.status === 'Received' || !s.assignedTeam
  ).length;

  return (
    <>
      {currentView === 'admin' ? (
        <AdminDispatchConsole
          submissions={submissions}
          onUpdateSubmission={handleUpdateSubmission}
          onRefreshSubmissions={fetchSubmissionsFromApi}
          onSwitchToCitizenView={handleSwitchToCitizen}
        />
      ) : (
        <div id="top" className="min-h-screen flex flex-col justify-between bg-white text-slate-900">
          {/* 1. Header with SEMA Logo, Typewriter Title & Admin Dispatch Shortcut */}
          <HeaderWithTypewriter
            activePhraseIndex={activePhraseIndex}
            onSelectPhraseIndex={setActivePhraseIndex}
            onOpenQrModal={() => setIsQrModalOpen(true)}
            onFocusVoiceBox={handleFocusVoiceBox}
            onOpenAdminView={handleSwitchToAdmin}
            unassignedCount={unassignedCount}
          />

          {/* 2. Hero Section with AI Voice/Text Box & Landing Page QR Code */}
          <div className="flex-1">
            <VoiceTextCaptureHero
              activePhraseIndex={activePhraseIndex}
              textareaRef={textareaRef}
              isQrModalOpen={isQrModalOpen}
              onOpenQrModal={() => setIsQrModalOpen(true)}
              onCloseQrModal={() => setIsQrModalOpen(false)}
              externalSubmissions={submissions}
              onNewSubmission={handleNewSubmission}
              onOpenAdminConsole={handleSwitchToAdmin}
            />
          </div>

          {/* 3. Footer with Kenyan Contact Information */}
          <FooterContact />
        </div>
      )}
    </>
  );
}
