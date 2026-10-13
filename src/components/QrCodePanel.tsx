import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Download, Maximize2, X, Smartphone, ExternalLink } from 'lucide-react';

interface QrCodePanelProps {
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
}

const DEFAULT_SHARED_URL =
  'https://ais-pre-zbdvqt3qamccte56qebtm2-576766090545.europe-west3.run.app';

export const QrCodePanel: React.FC<QrCodePanelProps> = ({
  isModalOpen,
  onOpenModal,
  onCloseModal,
}) => {
  const liveOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : DEFAULT_SHARED_URL;

  const [targetUrl, setTargetUrl] = useState<string>(liveOrigin);
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback copy
      const input = document.createElement('input');
      input.value = targetUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadSvg = () => {
    const svgElement = document.getElementById('sema-landing-qr-svg');
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SEMA-Kenya-Landing-Page-QR.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <aside
        id="qr-section"
        className="bg-white border border-emerald-950/12 rounded-xl p-6 flex flex-col justify-between gap-6"
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-emerald-800">Mobile Instant Access · Kenya</p>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Scan QR to Open SEMA
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Expand QR Poster"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Enlarge</span>
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Scan with any smartphone camera to open this SEMA landing page and record your voice in
            English, Kiswahili, or Sheng on the go.
          </p>

          {/* QR Code Frame */}
          <div className="bg-emerald-50/60 border border-emerald-900/10 rounded-lg p-5 flex flex-col items-center justify-center gap-3">
            <div className="bg-white p-3.5 rounded-lg border border-slate-200/80 shadow-2xs">
              <QRCodeSVG
                id="sema-landing-qr-svg"
                value={targetUrl}
                size={168}
                bgColor="#ffffff"
                fgColor="#064e3b"
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-xs font-semibold text-emerald-950">
                SEMA · Sauti ya Mwananchi
              </p>
              <p className="text-[11px] text-slate-500 font-mono truncate max-w-[220px]">
                {targetUrl}
              </p>
            </div>
          </div>

          {/* URL Switcher for Current Page vs Public Share URL */}
          <div className="space-y-1.5">
            <label
              htmlFor="qr-url-input"
              className="block text-xs font-medium text-slate-700"
            >
              Landing Page Destination URL
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="qr-url-input"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                aria-label="QR Code Destination URL"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="text-emerald-800">Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save QR SVG</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="inline-flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Works on Android & iOS</span>
            </span>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-800 hover:underline font-medium"
            >
              <span>Open URL</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </aside>

      {/* Enlarged Printable QR Code Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold text-emerald-700">
                  SEMA Kenya · Direct Landing Page QR
                </p>
                <h3 id="qr-modal-title" className="text-xl font-bold text-slate-900 mt-0.5">
                  Scan to Speak or Type Your Issue
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseModal}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close QR Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-900/10 rounded-xl p-6 flex flex-col items-center gap-4">
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

              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-900">
                  English · Kiswahili · Sheng
                </p>
                <p className="text-xs text-slate-600">
                  &ldquo;Tell us the problem and we will fix it.&rdquo;
                </p>
                <p className="text-[11px] font-mono text-emerald-900 bg-white px-2.5 py-1 rounded border border-emerald-200 break-all mt-2">
                  {targetUrl}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? 'Copied URL!' : 'Copy Page Link'}
              </button>
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Download QR SVG
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
