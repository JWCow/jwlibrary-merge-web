import React, { useState } from 'react';
import { X, Copy, Check, Smartphone } from 'lucide-react';

interface QRCodeModalProps {
  url?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  url = 'https://jwlibrary-merge.mastern8n.cc',
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Google Chart API / QR Server fallback for instant, crisp QR code
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=25537a&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-theocratic-100 dark:bg-theocratic-950/80 text-theocratic-600 dark:text-theocratic-300 flex items-center justify-center shadow-md shadow-theocratic-500/10">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
            Open on iPad or Phone
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Scan with your camera to open this merger directly on your mobile device.
          </p>
        </div>

        {/* QR Code Image */}
        <div className="flex justify-center p-4 rounded-2xl bg-white border border-slate-100 shadow-inner">
          <img
            src={qrImageUrl}
            alt="Scan QR Code to open on mobile"
            className="w-48 h-48 rounded-xl"
            loading="lazy"
          />
        </div>

        {/* URL Link and Copy Button */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
            <span className="truncate flex-1 pl-1">{url}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-1"
              title="Copy URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-center text-slate-400">
            Tip: On Safari or Chrome, tap <strong>Share &rarr; Add to Home Screen</strong> to use like an app!
          </p>
        </div>

      </div>
    </div>
  );
};
