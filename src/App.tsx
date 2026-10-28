/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { HeaderWithTypewriter } from './components/HeaderWithTypewriter';
import { VoiceTextCaptureHero } from './components/VoiceTextCaptureHero';
import { FooterContact } from './components/FooterContact';
import { AdminDispatchConsole } from './components/AdminDispatchConsole';
import { TechnicalDocumentationModal } from './components/TechnicalDocumentationModal';
import { DemoWalkthroughVideoModal } from './components/DemoWalkthroughVideoModal';
import { SubmissionRecord } from './types';
import { INITIAL_SUBMISSIONS } from './data/initialSubmissions';

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
  const [isTechDocsOpen, setIsTechDocsOpen] = useState(false);
  const [isDemoVideoOpen, setIsDemoVideoOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Dynamic routing listener for QR code scans and URL navigation
  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      if (
        hash === '#customer-portal' ||
        hash === '#portal' ||
        hash === '#customer' ||
        params.get('view') === 'customer' ||
        params.get('view') === 'portal'
      ) {
        setCurrentView('citizen');
      } else if (hash === '#admin' || params.get('view') === 'admin') {
        setCurrentView('admin');
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

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
      if (hash === '#docs' || hash === '#tech-docs' || params.get('view') === 'docs') {
        setIsTechDocsOpen(true);
      }
      if (hash === '#demo' || hash === '#walkthrough' || params.get('view') === 'demo') {
        setIsDemoVideoOpen(true);
      }
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
          onNewSubmission={handleNewSubmission}
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

      {/* 4. Complete Technical Documentation Modal & PDF Downloader */}
      <TechnicalDocumentationModal
        isOpen={isTechDocsOpen}
        onClose={() => setIsTechDocsOpen(false)}
      />

      {/* 5. 75s Demo Walkthrough Video Modal with AI Voiceover */}
      <DemoWalkthroughVideoModal
        isOpen={isDemoVideoOpen}
        onClose={() => setIsDemoVideoOpen(false)}
      />
    </>
  );
}
