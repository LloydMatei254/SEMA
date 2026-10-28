import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

interface QrCodePanelProps {
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

export const LIVE_PUBLIC_WEB_URL =
  'https://ais-pre-decct4xo24zpdexmzoadxh-175842636990.europe-west1.run.app';

export function getScannableWebUrl(): string {
  let base = LIVE_PUBLIC_WEB_URL;
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, origin } = window.location;
    // If the browser origin is a real HTTPS URL (e.g. Cloud Run, custom domain), use it
    if (origin && origin.startsWith('https://') && !origin.includes('internal')) {
      base = origin;
    } else if (hostname && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
      base = `https://${hostname}`;
    }
  }
  const cleanBase = base.replace(/\/+$/, '');
  return `${cleanBase}/?view=customer#customer-portal`;
}

export const QrCodePanel: React.FC<QrCodePanelProps> = ({
  isModalOpen,
  onCloseModal,
}) => {
  const targetUrl = getScannableWebUrl();

  return (
    <>
      <aside
        id="qr-section"
        className="bg-white border border-emerald-950/12 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-5"
      >
        <div className="space-y-1 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/80 text-emerald-900 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Customer Portal Direct Access
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Scan to Open Customer Portal
          </h2>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Scan with any smartphone camera to open Safaricom SEMA directly.
          </p>
        </div>

        {/* Clean QR Code Display */}
        <div className="bg-emerald-50/60 border border-emerald-900/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-2xs w-full max-w-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <QRCodeSVG
              id="sema-landing-qr-svg"
              value={targetUrl}
              size={210}
              bgColor="#ffffff"
              fgColor="#064e3b"
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="flex flex-col items-center gap-1.5 w-full">
            <a
              href={targetUrl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2 break-all text-center"
              title="Open Customer Portal URL"
            >
              <span>Direct Link: Customer Portal</span>
            </a>
            <span className="text-[10px] text-slate-500 font-mono break-all text-center">
              {targetUrl}
            </span>
          </div>
        </div>
      </aside>

      {/* Enlarged QR Code Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="qr-modal-title" className="text-base font-bold text-slate-900">
                Scan with Phone Camera
              </h3>
              <button
                type="button"
                onClick={onCloseModal}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close QR Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-900/10 rounded-xl p-6 flex flex-col items-center justify-center">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <QRCodeSVG
                  value={targetUrl}
                  size={240}
                  bgColor="#ffffff"
                  fgColor="#064e3b"
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
