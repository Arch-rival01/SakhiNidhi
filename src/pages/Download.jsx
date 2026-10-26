import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, QrCode, WifiOff, FileDown, FolderOpen, ShieldAlert, CheckCircle2, Volume2, PackageCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { triggerHaptic, speak } from '../lib/voice';
import { showToast } from '../components/Toast';

export default function DownloadPage() {
  const { t } = useTranslation();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://sakhinidhi.vercel.app/download';
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
    triggerHaptic('success');
    showToast('Android APK डाउनलोड शुरू हो रहा है...', 'success');
    window.location.href = 'https://github.com/Arch-rival01/SakhiNidhi/releases/download/latest/SakhiNidhi.apk';
  };

  const handleInstallPwa = async () => {
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
      color: 'bg-amber-50 text-amber-800',
      textKey: 'download.step2'
    },
    {
      num: 3,
      icon: ShieldAlert,
      color: 'bg-blue-50 text-blue-800',
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
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-[#165A3E] text-white rounded-3xl p-6 sm:p-8 shadow-md text-center flex flex-col items-center">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <span className="flex items-center gap-1 bg-emerald-900 text-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-emerald-700/50">
            <WifiOff className="w-3 h-3 text-amber-300" />
            <span>100% Offline PWA</span>
          </span>
          <span className="flex items-center gap-1 bg-[#E8892B] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
            <PackageCheck className="w-3 h-3" />
            <span>Android APK (v1.0.0)</span>
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
            className="w-full min-h-[52px] px-5 py-3 rounded-2xl bg-[#E8892B] hover:bg-[#d97706] text-white font-black text-base flex items-center justify-center gap-2.5 shadow-md active:scale-97 transition-all"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>{t('download.download_button')}</span>
          </button>

          <button
            type="button"
            onClick={handleInstallPwa}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-97"
          >
            <Smartphone className="w-4 h-4 text-amber-300" />
            <span>{t('download.install_pwa_button')}</span>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-emerald-600/40 flex items-center justify-center gap-3 text-[11px] text-emerald-200 font-medium">
          <span>Android 8.0+</span>
          <span>•</span>
          <span>Binary Package</span>
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
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#165A3E] flex items-center gap-1 text-xs font-bold"
            title="आवाज में सुनें"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>सुनें</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="pt-0.5">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    कदम {s.num}
                  </div>
                  <p className="font-bold text-slate-800 text-xs mt-0.5 leading-snug">
                    {t(s.textKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Code Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        {qrCodeUrl && (
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex-shrink-0">
            <img src={qrCodeUrl} alt="Download QR" className="w-28 h-28" />
          </div>
        )}

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#165A3E] bg-emerald-50 px-2 py-0.5 rounded-md">
            <QrCode className="w-3 h-3" />
            <span>Phone Camera Scan</span>
          </div>
          <h4 className="font-bold text-base text-slate-900">
            लैपटॉप से सीधे फोन में खोलें
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            अपने मोबाइल कैमरे से यह QR कोड स्कैन करके सीधे ऐप इंस्टॉल कर सकते हैं।
          </p>
        </div>
      </div>
    </div>
  );
}
