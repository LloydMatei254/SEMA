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

export default function App() {
  const [currentView, setCurrentView] = useState<'citizen' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
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

  // Handle Hash Changes for URL deep linking
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setCurrentView('admin');
      } else if (hash === '#portal' || hash === '#top') {
        setCurrentView('citizen');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSwitchToAdmin = () => {
    setCurrentView('admin');
    window.location.hash = 'admin';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToCitizen = () => {
    setCurrentView('citizen');
    window.location.hash = 'portal';
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
