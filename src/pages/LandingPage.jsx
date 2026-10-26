import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  ShieldCheck,
  WifiOff,
  Volume2,
  Users,
  CheckCircle2,
  Award,
  Smartphone,
  Globe,
  Landmark,
  FileText,
  ArrowRight,
  Sparkles,
  QrCode,
  Play,
  Check,
  ExternalLink,
  ChevronRight,
  Heart,
  Calendar,
  HandCoins,
  ShieldAlert
} from 'lucide-react';
import { showToast } from '../components/Toast';
import { playChime, triggerHaptic } from '../lib/voice';

export default function LandingPage({ onDownload, onOpenBankSecret, onPreviewApp }) {
  const [activeTab, setActiveTab] = useState('meeting');

  const handleDirectApkDownload = () => {
    playChime('cash');
    triggerHaptic('success');
    showToast('Android APK डाउनलोड हो रहा है...', 'success');
    const link = document.createElement('a');
    link.href = '/downloads/sakhinidhi.apk';
    link.download = 'SakhiNidhi.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToAbout = () => {
    const el = document.getElementById('about-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('features-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToInstall = () => {
    const el = document.getElementById('install-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-slate-800 font-sans selection:bg-[#165A3E] selection:text-white">
      {/* 1. TOP STICKY NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#165A3E] to-[#0E3D2A] text-white flex items-center justify-center font-black text-xl shadow-xs">
              ₹
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900 block leading-tight">
                सखीनिधि <span className="text-[#165A3E] font-extrabold text-sm sm:text-base">(SakhiNidhi)</span>
              </span>
              <span className="text-[10px] text-emerald-800 font-bold block">
                Tribe 2026 • Women-led Enterprises
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
              <button type="button" onClick={scrollToAbout} className="hover:text-[#165A3E] transition-colors">
                About Project
              </button>
              <button type="button" onClick={scrollToFeatures} className="hover:text-[#165A3E] transition-colors">
                Key Features
              </button>
              <button type="button" onClick={scrollToInstall} className="hover:text-[#165A3E] transition-colors">
                Install Guide
              </button>
            </div>

            <button
              type="button"
              onClick={onPreviewApp}
              className="hidden sm:flex h-9 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#165A3E] font-bold text-xs items-center gap-1.5 border border-emerald-200/80 transition-all active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Launch Web App</span>
            </button>

            <button
              type="button"
              onClick={handleDirectApkDownload}
              className="h-9 sm:h-10 px-4 sm:px-5 rounded-xl bg-[#165A3E] hover:bg-[#124933] text-white font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 stroke-[2.4]" />
              <span>Download APK</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION WITH MODERN PHONE MOCKUP */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Decorative soft glow backgrounds */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-emerald-100/40 via-amber-50/30 to-transparent -z-10 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-5">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200/80 text-[#165A3E] px-4 py-1.5 rounded-full text-xs font-bold shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Tribe 2026 Hackathon • Women-led Enterprises</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15] tracking-tight">
              Digital Financial Swaraj for{' '}
              <span className="bg-gradient-to-r from-[#165A3E] to-[#22865d] bg-clip-text text-transparent">
                Tribal Women SHGs
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-slate-600 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              An offline-first, audio-guided micro-accounting app built for Self-Help Groups in Jharkhand. Distributed as a free, lightweight native Android APK running 100% without internet.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                type="button"
                onClick={handleDirectApkDownload}
                className="min-h-[50px] px-6 py-3.5 rounded-2xl bg-[#E8892B] hover:bg-[#d97706] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-amber-900/10 active:scale-97 transition-all cursor-pointer"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Download Android APK (4.7 MB)</span>
              </button>

              <button
                type="button"
                onClick={onPreviewApp}
                className="min-h-[50px] px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base flex items-center justify-center gap-2 border border-slate-200 shadow-2xs active:scale-97 transition-all"
              >
                <Play className="w-4 h-4 text-[#165A3E] fill-[#165A3E]" />
                <span>Try Demo in Browser</span>
              </button>
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-3 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <WifiOff className="w-4 h-4 text-emerald-600" />
                <span>100% Offline (Zero Network)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <Volume2 className="w-4 h-4 text-[#E8892B]" />
                <span>Voice Audio & Hindi Parser</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Ol Chiki (ᱥᱟᱱᱛᱟᱲᱤ) & Ho</span>
              </span>
            </div>
          </div>

          {/* Right Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[340px] bg-slate-900 p-3 rounded-[42px] shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50">
              {/* Phone Speaker & Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center gap-2">
                <div className="w-10 h-1 bg-slate-800 rounded-full" />
                <div className="w-2 h-2 rounded-full bg-slate-800" />
              </div>

              {/* Phone Screen Container */}
              <div className="relative bg-[#F8F9FA] rounded-[34px] overflow-hidden border border-slate-300/40 text-slate-900 text-left pt-6 pb-4">
                {/* Simulated App Header */}
                <div className="bg-[#165A3E] text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E8892B] flex items-center justify-center font-black text-sm text-white">
                      ₹
                    </div>
                    <div>
                      <div className="font-black text-xs leading-none">सखी मंडल, जमशेदपुर</div>
                      <div className="text-[9px] text-emerald-200 mt-0.5">सुंदरनगर • 12 सदस्य</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>

                {/* Simulated Content */}
                <div className="p-3.5 space-y-3">
                  {/* Balance Card */}
                  <div className="bg-gradient-to-br from-[#165A3E] to-[#0E3D2A] text-white rounded-2xl p-4 shadow-sm">
                    <span className="text-[10px] font-bold text-emerald-200 uppercase">समूह कुल कोष (Balance)</span>
                    <div className="text-2xl font-black mt-0.5">₹48,500</div>
                    <div className="mt-2 pt-2 border-t border-emerald-600/50 flex justify-between text-[10px] text-emerald-100">
                      <span>बचत: ₹36,000</span>
                      <span className="text-amber-300">ऋण बाकी: ₹12,500</span>
                    </div>
                  </div>

                  {/* Member Attendance Simulation */}
                  <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>साप्ताहिक बैठक (Weekly Roll Call)</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-black">
                        11/12 Present
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-300">
                        <div className="w-7 h-7 mx-auto rounded-full bg-[#165A3E] text-white font-black text-[10px] flex items-center justify-center">
                          SH
                        </div>
                        <span className="text-[9px] font-bold text-slate-700 block truncate mt-1">सीता</span>
                        <span className="text-[8px] font-black text-emerald-700">₹100</span>
                      </div>

                      <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-300">
                        <div className="w-7 h-7 mx-auto rounded-full bg-amber-600 text-white font-black text-[10px] flex items-center justify-center">
                          PM
                        </div>
                        <span className="text-[9px] font-bold text-slate-700 block truncate mt-1">पार्वती</span>
                        <span className="text-[8px] font-black text-emerald-700">₹100</span>
                      </div>

                      <div className="p-1.5 bg-emerald-50 rounded-xl border border-emerald-300">
                        <div className="w-7 h-7 mx-auto rounded-full bg-purple-600 text-white font-black text-[10px] flex items-center justify-center">
                          MK
                        </div>
                        <span className="text-[9px] font-bold text-slate-700 block truncate mt-1">मालोती</span>
                        <span className="text-[8px] font-black text-emerald-700">₹100</span>
                      </div>

                      <div className="p-1.5 bg-rose-50 rounded-xl border border-rose-300">
                        <div className="w-7 h-7 mx-auto rounded-full bg-slate-400 text-white font-black text-[10px] flex items-center justify-center">
                          SS
                        </div>
                        <span className="text-[9px] font-bold text-slate-700 block truncate mt-1">सुमित्रा</span>
                        <span className="text-[8px] font-black text-rose-600">बाकी</span>
                      </div>
                    </div>
                  </div>

                  {/* Credit Score Gauge Simulation */}
                  <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-amber-900 uppercase">समूह क्रेडिट स्कोर</span>
                      <div className="text-lg font-black text-[#165A3E]">82 / 100</div>
                      <span className="text-[9px] text-emerald-700 font-bold">बैंक लोन हेतु उत्तम स्थिति</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#165A3E] text-white flex items-center justify-center font-black text-xs">
                      A+
                    </div>
                  </div>
                </div>

                {/* Bottom App Bar Simulation */}
                <div className="mt-2 bg-white border-t border-slate-200 px-3 py-2 flex justify-around text-center text-[9px] font-bold text-slate-400">
                  <div className="text-[#165A3E]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#165A3E] mx-auto mb-0.5" />
                    <span>होम</span>
                  </div>
                  <div><span>बैठक</span></div>
                  <div><span>ऋण</span></div>
                  <div><span>रिपोर्ट</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. IMPACT STATS SECTION */}
      <section id="about-section" className="py-12 px-4 sm:px-6 bg-slate-50 border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Built for Jharkhand's Tribal Livelihoods
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Transforming traditional informal paper registers into verifiable, dispute-free digital books.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-3xl font-black text-[#165A3E] mb-1">3.2 Lakh+</div>
              <div className="text-sm font-bold text-slate-800">Tribal SHGs in Jharkhand</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Operating under JSLPS across 24 districts, with weekly savings in remote village tolas.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-3xl font-black text-[#E8892B] mb-1">35 Lakh+</div>
              <div className="text-sm font-bold text-slate-800">Rural Women Members</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Empowering women through collective micro-savings, internal lending, and micro-enterprises.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-3xl font-black text-blue-700 mb-1">0 Server Cost</div>
              <div className="text-sm font-bold text-slate-800">Client-Side Architecture</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Full offline Dexie IndexedDB storage with zero mandatory server dependencies or monthly API bills.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-3xl font-black text-purple-700 mb-1">100 / 100</div>
              <div className="text-sm font-bold text-slate-800">Audited Credit Score</div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                6-parameter scoring enables commercial banks to evaluate SHGs without cumbersome paper audits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE 4 PILLARS OF LOW-LITERACY DESIGN */}
      <section id="features-section" className="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#165A3E] bg-emerald-50 px-3 py-1 rounded-full uppercase">
            Human-Centered Engineering
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Designed for Low-Literacy & Tribal Languages
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Designed from field observations of weekly Self-Help Group meetings in tribal villages.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#165A3E] flex items-center justify-center mb-4">
                <Users className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-1.5">Avatar-First UI</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No complex dropdowns or small form fields. Every member has a clear face avatar with color-coded initials. Attendance is marked with a single tap.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-800 flex items-center gap-1">
              <span>Single-tap roll call</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#E8892B] flex items-center justify-center mb-4">
                <Volume2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-1.5">Voice & Instant Chime</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every calculation and balance speaks aloud. Spoken Hindi number phrases like <em>"do sau"</em> or <em>"paanch sau"</em> automatically transcribe into ₹200 and ₹500.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-[#E8892B] flex items-center gap-1">
              <span>Zero-lag audio feedback</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-1.5">Triple Confirmation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Financial trust is critical. Every savings entry and loan repayment triggers triple confirmation: an animated green tick mark, audio read-back, and device vibration.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-blue-700 flex items-center gap-1">
              <span>Sight • Sound • Haptic</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900 mb-1.5">Ol Chiki & Indigenous Languages</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full multilingual support for Santhali (Ol Chiki ᱥᱟᱱᱛᱟᱲᱤ), Ho (ᱦᱳ), Mundari (ᱢᱩᱱᱰᱟᱨᱤ), Hindi, and English with Google Noto Sans typography.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-purple-800 flex items-center gap-1">
              <span>5 language engines</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. DOWNLOAD APK & INSTALLATION HUB */}
      <section id="install-section" className="py-14 sm:py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Get the SakhiNidhi Android App
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Free, standalone Android APK designed to run on any smartphone without an internet connection.
            </p>
          </div>

          {/* Main Download Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Verified Release Build • v1.0.0</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  SakhiNidhi Native Android APK
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Includes complete offline database, voice narration, PDF passbooks, and credit score calculator.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDirectApkDownload}
                  className="w-full sm:w-auto min-h-[50px] px-8 py-3.5 rounded-2xl bg-[#165A3E] hover:bg-[#124933] text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-5 h-5 stroke-[2.4]" />
                  <span>Download APK (4.7 MB)</span>
                </button>

                <a
                  href="https://github.com/Arch-rival01/SakhiNidhi/releases/download/latest/SakhiNidhi.apk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-slate-500 hover:text-[#165A3E] underline flex items-center gap-1"
                >
                  <span>Backup: GitHub Releases Mirror</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Quick Install 4 Steps */}
            <div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                How to Install on Android in 4 Steps
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="w-7 h-7 rounded-full bg-[#165A3E] text-white flex items-center justify-center font-black text-xs mb-2">
                    1
                  </div>
                  <div className="font-bold text-xs text-slate-800">Download APK</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Click download button above (4.7 MB).</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="w-7 h-7 rounded-full bg-[#165A3E] text-white flex items-center justify-center font-black text-xs mb-2">
                    2
                  </div>
                  <div className="font-bold text-xs text-slate-800">Open File</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tap on the notification or Downloads folder.</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="w-7 h-7 rounded-full bg-[#165A3E] text-white flex items-center justify-center font-black text-xs mb-2">
                    3
                  </div>
                  <div className="font-bold text-xs text-slate-800">Allow Unknown Apps</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Toggle permission in Android Settings.</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="w-7 h-7 rounded-full bg-[#165A3E] text-white flex items-center justify-center font-black text-xs mb-2">
                    4
                  </div>
                  <div className="font-bold text-xs text-slate-800">Install & Run Offline</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Tap Install. Works 100% without internet!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="py-8 px-4 sm:px-6 border-t border-slate-200 bg-white text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#165A3E] text-white flex items-center justify-center font-black text-xs">
              ₹
            </div>
            <div>
              <span className="font-black text-slate-800">सखीनिधि (SakhiNidhi)</span> • Tribe 2026 Hackathon
            </div>
          </div>

          <div className="flex items-center gap-5 text-[11px]">
            {/* Discreet portal link for Bank Officers */}
            <button
              type="button"
              onClick={onOpenBankSecret}
              className="text-slate-500 hover:text-[#165A3E] transition-colors flex items-center gap-1 font-semibold"
              title="Restricted Access for Commercial Bank Branches"
            >
              <Landmark className="w-3.5 h-3.5 text-slate-400" />
              <span>Bank Officer Portal</span>
            </button>

            {/* In-Browser APK UI Preview */}
            <button
              type="button"
              onClick={onPreviewApp}
              className="text-slate-500 hover:text-[#165A3E] transition-colors flex items-center gap-1 font-semibold"
              title="Test the mobile APK UI in your desktop browser"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              <span>Launch App</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
