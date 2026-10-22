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
                SAFARICOM SEMA
              </span>
            </div>
            <p className="text-sm text-emerald-100/80 leading-relaxed max-w-sm">
              Safaricom PLC Customer &amp; Network Rapid Response Portal. Capturing subscriber feedback across all 47 Kenyan counties in English,
              Kiswahili, and Sheng. Tell us the issue and our specialized response teams will fix it.
            </p>
            <div className="text-xs text-emerald-300/90 flex items-center gap-2">
              <span>English</span>
              <span aria-hidden="true">·</span>
              <span>Kiswahili</span>
              <span aria-hidden="true">·</span>
              <span>Sheng</span>
              <span aria-hidden="true">·</span>
              <span>Home Fibre · M-PESA · 5G</span>
            </div>
          </div>

          {/* Column 2: Direct Contact Details (4 cols) */}
          <div className="md:col-span-4 space-y-3.5">
            <h3 className="text-sm font-semibold text-emerald-300 tracking-wide">
              Safaricom Support Hotlines &amp; NOC
            </h3>
            <ul className="space-y-3 text-sm text-emerald-50/90">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-white">
                    <a href="tel:100" className="hover:underline">
                      PrePay / General: 100 (Toll-Free)
                    </a>{' '}
                    ·{' '}
                    <a href="tel:400" className="hover:underline">
                      Fibre: 400
                    </a>
                  </p>
                  <p className="text-xs text-emerald-200/75">
                    M-PESA Care: <a href="tel:234" className="hover:underline">234</a> · Enterprise: <a href="tel:200" className="hover:underline">200</a> · Int: +254 722 002 100
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <a
                    href="mailto:customercare@safaricom.co.ke"
                    className="font-medium text-white hover:underline block"
                  >
                    customercare@safaricom.co.ke
                  </a>
                  <a
                    href="mailto:fibreops@safaricom.co.ke"
                    className="text-xs text-emerald-200/75 hover:underline block"
                  >
                    fibreops@safaricom.co.ke
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-white">Safaricom HQ1 &amp; HQ2, Waiyaki Way</p>
                  <p className="text-xs text-emerald-200/75">
                    P.O. Box 66827-00800, Westlands, Nairobi, Kenya
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <p className="text-xs text-emerald-200/90">
                    24/7 Safaricom Network Operations Center (NOC) &amp; M-PESA Command
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Request Instant Callback Form (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-sm font-semibold text-emerald-300 tracking-wide">
              Request a Safaricom Technical Callback
            </h3>
            <p className="text-xs text-emerald-100/75 leading-relaxed">
              Prefer a phone call in Kiswahili, Sheng, or English? Leave your Safaricom mobile number
              and our technical resolution officer will call you back.
            </p>

            {callbackSubmitted ? (
              <div className="bg-emerald-900/70 border border-emerald-700 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Callback Request Logged</span>
                </div>
                <p className="text-xs text-emerald-100">
                  Asante! Our Safaricom dispatch desk will call your number within 15 minutes.
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
                    placeholder="Safaricom Line e.g. 0722 123 456"
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
          <p>© {new Date().getFullYear()} Safaricom PLC. SEMA Customer &amp; Network Operations. All rights reserved.</p>
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
