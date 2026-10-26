import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, QrCode, WifiOff, FileDown, FolderOpen, ShieldAlert, CheckCircle2, Volume2, PackageCheck, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { triggerHaptic, speak, playChime } from '../lib/voice';
import { showToast } from '../components/Toast';

export default function DownloadPage() {
  const { t } = useTranslation();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://sakhi-nidhi.vercel.app/download';
    QRCode.toDataURL(currentUrl, { width: 170, margin: 1 })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleDownloadApk = () => {
    playChime('cash');
    triggerHaptic('success');
    showToast('Android APK (4.7 MB) डाउनलोड शुरू हो रहा है...', 'success');

    // Primary download from Vercel static asset
    const link = document.createElement('a');
    link.href = '/downloads/SakhiNidhi.apk';
    link.download = 'SakhiNidhi.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInstallPwa = async () => {
    playChime('tap');
    triggerHaptic('tap');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('ऐप सफलतापूर्वक इंस्टॉल हो गया!', 'success');
      }
      setDeferredPrompt(null);
    } else {
      showToast('ब्राउज़र मेनू से "Add to Home Screen" चुनें या APK डाउनलोड करें।', 'info');
    }
  };

  const installStepsText = `सखीनिधि ऐप इंस्टॉल करने के 4 आसान चरण: पहला, डाउनलोड एपीके बटन दबाएं। दूसरा, डाउनलोड की गई फाइल खोलें। तीसरा, फोन सेटिंग में अननोन ऐप्स को अनुमति दें। चौथा, इंस्टॉल पर टैप करें। यह ऐप बिना इंटरनेट के भी सुरक्षित चलेगा।`;

  const steps = [
    {
      num: 1,
      icon: FileDown,
      color: 'bg-emerald-50 text-emerald-800',
      textKey: 'download.step1'
    },
    {
      num: 2,
      icon: FolderOpen,
      color: 'bg-blue-50 text-blue-800',
      textKey: 'download.step2'
    },
    {
      num: 3,
      icon: ShieldAlert,
      color: 'bg-amber-50 text-amber-800',
      textKey: 'download.step3'
    },
    {
      num: 4,
      icon: CheckCircle2,
      color: 'bg-purple-50 text-purple-800',
      textKey: 'download.step4'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="bg-[#165A3E] text-white rounded-3xl p-6 sm:p-8 shadow-md text-center flex flex-col items-center">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <span className="flex items-center gap-1 bg-emerald-900 text-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-emerald-700/50">
            <WifiOff className="w-3 h-3 text-amber-300" />
            <span>100% Offline PWA</span>
          </span>
          <span className="flex items-center gap-1 bg-[#E8892B] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
            <PackageCheck className="w-3 h-3" />
            <span>Android APK (4.7 MB)</span>
          </span>
        </div>

        <h2 className="font-black text-2xl sm:text-3xl tracking-tight mb-2 text-white">
          {t('download.heading')}
        </h2>
        <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-md mb-6 leading-relaxed">
          {t('download.subheading')}
        </p>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-2.5">
          <button
            type="button"
            onClick={handleDownloadApk}
            className="w-full min-h-[52px] px-5 py-3 rounded-2xl bg-[#E8892B] hover:bg-[#d97706] text-white font-black text-base flex items-center justify-center gap-2.5 shadow-md active:scale-97 transition-all cursor-pointer"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>{t('download.download_button')} (4.7 MB)</span>
          </button>

          <button
            type="button"
            onClick={handleInstallPwa}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-97 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-amber-300" />
            <span>{t('download.install_pwa_button')}</span>
          </button>

          {/* GitHub Direct Link Fallback */}
          <div className="pt-1 text-center">
            <a
              href="https://github.com/Arch-rival01/SakhiNidhi/releases/download/latest/SakhiNidhi.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-200 hover:text-white underline decoration-emerald-400"
            >
              <span>वैकल्पिक: GitHub Direct Release से डाउनलोड करें</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-emerald-600/40 flex items-center justify-center gap-3 text-[11px] text-emerald-200 font-medium">
          <span>Android 8.0+</span>
          <span>•</span>
          <span>Full Native Build</span>
          <span>•</span>
          <span>Rs. 0 Free</span>
        </div>
      </div>

      {/* 4 Step Installation Guide */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              इंस्टॉल करने के 4 आसान चरण (Install Steps)
            </h3>
            <p className="text-[11px] text-slate-500">
              फोन में एक बार इंस्टॉल करें और हमेशा बिना इंटरनेट चलाएं
            </p>
          </div>
          <button
            type="button"
            onClick={() => speak(installStepsText)}
            className="h-8 px-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#165A3E] font-bold text-xs flex items-center gap-1 border border-emerald-200"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>सुनें</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {steps.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.num} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-xs text-slate-800">
                    चरण {s.num}
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    {t(s.textKey)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Code Card for Other Phones */}
      {qrCodeUrl && (
        <div className="bg-amber-50/80 rounded-2xl p-5 border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-xs flex-shrink-0">
            <img src={qrCodeUrl} alt="Download QR" className="w-28 h-28" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md uppercase">
              <QrCode className="w-3 h-3" />
              <span>सखी मंडल शेयर</span>
            </div>
            <h4 className="font-bold text-sm text-slate-900">
              अन्य दीदी के फोन से QR कोड स्कैन करें
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              यह QR कोड किसी भी मोबाइल कैमरे से स्कैन करने पर सीधे ऐप डाउनलोड पेज खुल जाता है।
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
