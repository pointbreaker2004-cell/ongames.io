'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { playClickSound } from '@/lib/sounds';

interface QRCodeModalProps {
  url: string;
  code: string;
  onClose: () => void;
}

export function QRCodeModal({ url, code, onClose }: QRCodeModalProps) {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    QRCode.toDataURL(url, { 
      width: 320, 
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }, (err, dataUrl) => {
      if (!err && dataUrl) {
        setQrSrc(dataUrl);
      }
    });
  }, [url]);

  const handleCopy = () => {
    playClickSound();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 text-center text-slate-900">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700 mb-2">
          <QrCode className="h-3.5 w-3.5" />
          <span>Scan to Join</span>
        </div>

        <h3 className="text-4xl font-black text-slate-900 tracking-[0.2em] font-mono my-1">{code}</h3>
        <p className="text-xs text-slate-500 mb-5">Point your phone camera to join instantly</p>

        {qrSrc ? (
          <div className="mx-auto my-2 p-3 bg-white rounded-2xl shadow-sm inline-block border-2 border-slate-100">
            <img src={qrSrc} alt="QR Code" className="w-56 h-56 mx-auto rounded-lg" />
          </div>
        ) : (
          <div className="w-56 h-56 mx-auto bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-xs">
            Generating QR Code...
          </div>
        )}

        <div className="mt-5">
          <button
            onClick={handleCopy}
            className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Direct Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-slate-500" />
                <span>Copy Direct Room Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
