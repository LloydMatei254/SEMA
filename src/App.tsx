/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from 'react';
import { HeaderWithTypewriter } from './components/HeaderWithTypewriter';
import { VoiceTextCaptureHero } from './components/VoiceTextCaptureHero';
import { FooterContact } from './components/FooterContact';

export default function App() {
  const [activePhraseIndex, setActivePhraseIndex] = useState(0);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleFocusVoiceBox = () => {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div id="top" className="min-h-screen flex flex-col justify-between bg-white text-slate-900">
      {/* 1. Header with SEMA Logo and Typewriter Title (English, Kiswahili, Sheng) */}
      <HeaderWithTypewriter
        activePhraseIndex={activePhraseIndex}
        onSelectPhraseIndex={setActivePhraseIndex}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onFocusVoiceBox={handleFocusVoiceBox}
      />

      {/* 2. Hero Section with AI Voice/Text Box & Landing Page QR Code */}
      <div className="flex-1">
        <VoiceTextCaptureHero
          activePhraseIndex={activePhraseIndex}
          textareaRef={textareaRef}
          isQrModalOpen={isQrModalOpen}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          onCloseQrModal={() => setIsQrModalOpen(false)}
        />
      </div>

      {/* 3. Footer with Kenyan Contact Information */}
      <FooterContact />
    </div>
  );
}
