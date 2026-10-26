import React from 'react';
import { motion } from 'framer-motion';
import { Download, ShieldCheck, WifiOff, Volume2, Users, CheckCircle2, Award, Smartphone, Globe, Landmark, FileText, ArrowRight, Sparkles, QrCode } from 'lucide-react';
import { showToast } from '../components/Toast';

export default function LandingPage({ onDownload, onOpenBankSecret, onPreviewApp }) {
  const handleDirectApkDownload = () => {
    showToast('Android APK पैकेज डाउनलोड हो रहा है...', 'success');
    const link = document.createElement('a');
    link.href = '/downloads/sakhinidhi.apk';
    link.setAttribute('download', 'sakhinidhi.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToAbout = () => {
    const el = document.getElementById('about-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToInstall = () => {
    const el = document.getElementById('install-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#165A3E] selection:text-white">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#165A3E] text-white flex items-center justify-center font-black text-lg shadow-xs">
              ₹
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900">सखीनिधि (SakhiNidhi)</span>
              <span className="text-[10px] text-slate-500 block font-medium">Tribe 2026 • Women-led Enterprises</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-5 text-xs font-bold text-slate-600">
              <button type="button" onClick={scrollToAbout} className="hover:text-[#165A3E]">
                About
              </button>
              <button type="button" onClick={scrollToInstall} className="hover:text-[#165A3E]">
                Installation
              </button>
            </div>

            <button
              type="button"
              onClick={handleDirectApkDownload}
              className="px-4 py-2 rounded-xl bg-[#165A3E] hover:bg-[#124933] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download APK</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-12 pb-14 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-[#165A3E] px-3.5 py-1 rounded-full text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#E8892B]" />
          <span>Tribe 2026 Hackathon • Theme: Women-led Enterprises</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 leading-[1.2] tracking-tight max-w-2xl mx-auto">
          Digital Financial Swaraj for <span className="text-[#165A3E]">Tribal Women SHGs</span> in Jharkhand
        </h1>

        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto leading-relaxed">
          An offline-first, voice-enabled micro-accounting Android application designed specifically for tribal Self-Help Groups. Distributed as a free, downloadable Android APK for rural smartphones.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            type="button"
            onClick={handleDirectApkDownload}
            className="px-6 py-3.5 rounded-xl bg-[#165A3E] hover:bg-[#124933] text-white font-black text-sm sm:text-base flex items-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-5 h-5 stroke-[2.4]" />
            <span>Download Android APK (Free)</span>
          </button>

          <button
            type="button"
            onClick={scrollToAbout}
            className="px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center gap-1.5 border border-slate-200 active:scale-95 transition-all"
          >
            <span>Learn More</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Technical Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <WifiOff className="w-3.5 h-3.5 text-emerald-700" />
            100% Offline (Dexie IndexedDB)
          </span>
          <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Volume2 className="w-3.5 h-3.5 text-[#E8892B]" />
            Voice-Enabled & Hindi Parser
          </span>
          <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            Ol Chiki (ᱥᱟᱱᱛᱟᱲᱤ) & Devanagari
          </span>
          <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Rs. 0 Operating Cost
          </span>
        </div>
      </section>

      {/* About Section */}
      <section id="about-section" className="py-12 px-4 sm:px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              About SakhiNidhi
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Empowering tribal women-led self-help enterprises with verifiable financial autonomy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-2xl font-black text-[#165A3E] mb-1">3.2 Lakh+</div>
              <div className="text-sm font-bold text-slate-800">Tribal SHGs in Jharkhand</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Under the Jharkhand State Livelihood Promotion Society (JSLPS), over 35 lakh rural women save weekly, often in remote forest blocks with spotty network coverage.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-2xl font-black text-[#E8892B] mb-1">Zero Paperwork</div>
              <div className="text-sm font-bold text-slate-800">Audit-Ready Ledger</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Replaces easily damaged physical paper registers with immutable, non-destructive IndexedDB logs, preventing disputes and mathematical accounting errors.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-2xl font-black text-[#165A3E] mb-1">100 / 100</div>
              <div className="text-sm font-bold text-slate-800">Rule-Based Credit Score</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Automated 6-parameter scoring (regularity, repayment discipline, attendance) empowers commercial banks to disburse low-interest livelihood loans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars of Low-Literacy Rural UX */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-900">
            Low-Literacy, Rural-First Design
          </h2>
          <p className="text-xs text-slate-500">
            Built from the ground up for women with minimal digital experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#165A3E] flex items-center justify-center mb-2.5">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Avatar-First UI (No Dropdowns)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every member is represented by a large circular avatar with color-coded initials and status badges. Attendance is marked with a single tap.
            </p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#E8892B] flex items-center justify-center mb-2.5">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Speech Synthesis & Hindi Parsing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every screen reads aloud. Spoken Hindi number words like *"do sau"* or *"paanch sau"* automatically parse into ₹200 and ₹500.
            </p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Triple Confirmation Feedback</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every financial transaction triggers triple confirmation: an animated green tick mark, a spoken read-back, and device vibration.
            </p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Santhali (Ol Chiki), Ho & Mundari</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete support for Jharkhand indigenous scripts and languages rendered seamlessly using Google Noto Sans Ol Chiki fonts.
            </p>
          </div>
        </div>
      </section>

      {/* Installation & Download Section */}
      <section id="install-section" className="py-12 px-4 sm:px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-slate-900">
              Download the Android APK
            </h2>
            <p className="text-xs text-slate-500">
              Direct download package for any Android smartphone. 100% free.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                <Smartphone className="w-3.5 h-3.5" />
                <span>SakhiNidhi Release v1.0.0</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Install Once, Use Anywhere Offline
              </h3>
              <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                When downloaded on an Android phone, the APK loads the full SHG micro-accounting workspace, weekly meeting registers, and audio-guided passbook engine.
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDirectApkDownload}
                  className="px-6 py-3 rounded-xl bg-[#165A3E] hover:bg-[#124933] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all w-full md:w-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Download APK (sakhinidhi.apk)</span>
                </button>
              </div>
            </div>

            {/* Quick 4 Install Steps */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 space-y-2 max-w-xs w-full">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
                Quick Install Guide
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#165A3E] text-white flex items-center justify-center text-[10px] font-black">1</span>
                <span>Download APK file</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#165A3E] text-white flex items-center justify-center text-[10px] font-black">2</span>
                <span>Open downloaded file</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#165A3E] text-white flex items-center justify-center text-[10px] font-black">3</span>
                <span>Allow "Install unknown apps"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#165A3E] text-white flex items-center justify-center text-[10px] font-black">4</span>
                <span>Tap Install and open offline</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Discreet/Hidden Bank Officer Access */}
      <footer className="py-8 px-4 sm:px-6 border-t border-slate-200 bg-white text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-700">SakhiNidhi</span> • Tribe 2026 Hackathon (Women-led Enterprises)
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            {/* Discreet / Hidden link for Bank Officers */}
            <button
              type="button"
              onClick={onOpenBankSecret}
              className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
              title="Restricted / Authorized Bank Access"
            >
              <Landmark className="w-3.5 h-3.5 text-slate-400" />
              <span>Bank Officer Portal</span>
            </button>

            {/* Discreet shortcut for judges to test APK UI in browser */}
            <button
              type="button"
              onClick={onPreviewApp}
              className="text-slate-400 hover:text-[#165A3E] transition-colors flex items-center gap-1"
              title="Test APK UI in browser"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              <span>Preview APK UI in Browser</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
