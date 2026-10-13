import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, CheckCircle2, Send } from 'lucide-react';

export const FooterContact: React.FC = () => {
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackName, setCallbackName] = useState('');
  const [callbackSubmitted, setCallbackSubmitted] = useState(false);
  const [callbackError, setCallbackError] = useState('');

  const handleRequestCallback = (e: React.FormEvent) => {
    e.preventDefault();
    setCallbackError('');
    const cleaned = callbackPhone.trim();
    if (!cleaned || cleaned.length < 9) {
      setCallbackError('Please enter a valid Kenyan phone number (e.g., 0712 345 678).');
      return;
    }
    setCallbackSubmitted(true);
    setCallbackPhone('');
    setCallbackName('');
  };

  return (
    <footer
      id="footer-contact"
      className="w-full bg-emerald-950 text-white border-t border-emerald-900 mt-14"
    >
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-emerald-800/70">
          {/* Column 1: Brand & Mission (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                S
              </span>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                SEMA KENYA
              </span>
            </div>
            <p className="text-sm text-emerald-100/80 leading-relaxed max-w-sm">
              Capturing citizens&apos; voices and texts across all 47 counties in English,
              Kiswahili, and Sheng. Tell us the problem and our rapid response teams will fix it.
            </p>
            <div className="text-xs text-emerald-300/90 flex items-center gap-2">
              <span>English</span>
              <span aria-hidden="true">·</span>
              <span>Kiswahili</span>
              <span aria-hidden="true">·</span>
              <span>Sheng</span>
              <span aria-hidden="true">·</span>
              <span>47 Counties</span>
            </div>
          </div>

          {/* Column 2: Direct Contact Details (4 cols) */}
          <div className="md:col-span-4 space-y-3.5">
            <h3 className="text-sm font-semibold text-emerald-300 tracking-wide">
              Contact Information & Support Desk
            </h3>
            <ul className="space-y-3 text-sm text-emerald-50/90">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-white">
                    <a href="tel:+254800723253" className="hover:underline">
                      0800 723 253 (Toll-Free Kenya)
                    </a>
                  </p>
                  <p className="text-xs text-emerald-200/75">
                    WhatsApp & SMS Desk:{' '}
                    <a href="tel:+254700736200" className="hover:underline">
                      +254 700 736 200
                    </a>
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <a
                    href="mailto:huduma@sema.co.ke"
                    className="font-medium text-white hover:underline block"
                  >
                    huduma@sema.co.ke
                  </a>
                  <a
                    href="mailto:support@sema.co.ke"
                    className="text-xs text-emerald-200/75 hover:underline block"
                  >
                    support@sema.co.ke
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-white">Sema House, 4th Floor, Waiyaki Way</p>
                  <p className="text-xs text-emerald-200/75">
                    P.O. Box 41820-00100, Westlands, Nairobi, Kenya
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <p className="text-xs text-emerald-200/90">
                    24/7 AI Voice & Text Portal · Live Agents 07:00–20:00 EAT
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Request Instant Callback Form (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-emerald-300 tracking-wide">
              Request a Free Field Desk Callback
            </h3>
            <p className="text-xs text-emerald-100/75 leading-relaxed">
              Prefer a phone call in Kiswahili, Sheng, or English? Leave your Kenyan mobile number
              and our resolution officer will call you back.
            </p>

            {callbackSubmitted ? (
              <div className="bg-emerald-900/70 border border-emerald-700 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Callback Request Logged</span>
                </div>
                <p className="text-xs text-emerald-100">
                  Asante! Our Nairobi dispatch desk will call your number within 15 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => setCallbackSubmitted(false)}
                  className="text-xs text-emerald-300 underline hover:text-white cursor-pointer"
                >
                  Request another callback
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestCallback} className="space-y-2.5" noValidate>
                <input
                  type="text"
                  value={callbackName}
                  onChange={(e) => setCallbackName(e.target.value)}
                  placeholder="Your Name / Jina Lako (Optional)"
                  className="w-full px-3 py-2 text-xs bg-emerald-900/60 border border-emerald-800 rounded-lg text-white placeholder:text-emerald-300/50 focus:outline-none focus:border-emerald-400"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    value={callbackPhone}
                    onChange={(e) => setCallbackPhone(e.target.value)}
                    placeholder="Phone e.g. 0712 345 678"
                    required
                    className="w-full px-3 py-2 text-xs bg-emerald-900/60 border border-emerald-800 rounded-lg text-white placeholder:text-emerald-300/50 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Call Me</span>
                  </button>
                </div>
                {callbackError && (
                  <p className="text-xs text-amber-300">{callbackError}</p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Bottom Copyright & Navigation Mirror */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200/70">
          <p>© {new Date().getFullYear()} SEMA Kenya Civic & Community Resolution Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#voice-capture" className="hover:text-white transition-colors">
              Voice Capture
            </a>
            <a href="#qr-section" className="hover:text-white transition-colors">
              QR Code
            </a>
            <a href="#recent-reports" className="hover:text-white transition-colors">
              Submitted Reports
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
