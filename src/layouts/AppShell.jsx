import React, { useState, useEffect } from 'react';
import { Home, Calendar, HandCoins, FileText, Download, Landmark, Globe, Volume2, WifiOff, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../i18n/i18n';
import SpeakButton from '../components/SpeakButton';
import Toast from '../components/Toast';
import { subscribeSyncStatus } from '../lib/sync';
import { db } from '../lib/db';
import { calculateFundBalance } from '../lib/finance';
import { triggerHaptic } from '../lib/voice';

const LANGUAGES = [
  { code: 'hi', label: 'हिन्दी' },
  { code: 'sat', label: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'ho', label: 'ᱦᱳ (Ho)' },
  { code: 'mun', label: 'ᱢᱩᱱᱰᱟᱨᱤ' },
  { code: 'en', label: 'EN' }
];

export default function AppShell({
  currentTab,
  onTabChange,
  group,
  screenNarration = '',
  children
}) {
  const { t, i18n } = useTranslation();
  const [fundBalance, setFundBalance] = useState(0);
  const [syncState, setSyncState] = useState({ isOnline: true, status: 'unconfigured' });
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentLangCode = i18n.language || 'hi';
  const currentLangLabel = LANGUAGES.find(l => l.code === currentLangCode)?.label || 'हिन्दी';

  useEffect(() => {
    return subscribeSyncStatus(setSyncState);
  }, []);

  useEffect(() => {
    async function loadBalance() {
      try {
        const [savings, repayments, loans, fines] = await Promise.all([
          db.savings.toArray(),
          db.repayments.toArray(),
          db.loans.toArray(),
          db.fines.toArray()
        ]);
        const calc = calculateFundBalance({ savings, repayments, loans, fines });
        setFundBalance(calc.fundBalance);
      } catch (err) {
        console.error('Balance error:', err);
      }
    }
    loadBalance();
    const interval = setInterval(loadBalance, 3000);
    return () => clearInterval(interval);
  }, [currentTab]);

  const navItems = [
    { id: 'home', labelKey: 'nav.home', icon: Home },
    { id: 'meeting', labelKey: 'nav.meeting', icon: Calendar },
    { id: 'loans', labelKey: 'nav.loans', icon: HandCoins },
    { id: 'reports', labelKey: 'nav.reports', icon: FileText },
    { id: 'download', labelKey: 'nav.download', icon: Download },
  ];

  const handleNavClick = (tabId) => {
    triggerHaptic('tap');
    onTabChange(tabId);
  };

  const handleSelectLanguage = (code) => {
    triggerHaptic('tap');
    changeAppLanguage(code);
    setShowLangMenu(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#F8F9FA] text-[#0F172A]">
      {/* Desktop Left Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-[#165A3E] text-white p-6 shadow-xl flex-shrink-0 sticky top-0 h-[100dvh]">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-[#E8892B] flex items-center justify-center font-black text-2xl text-white shadow-md">
            ₹
          </div>
          <div>
            <h1 className="font-black text-2xl leading-none tracking-tight">सखीनिधि</h1>
            <p className="text-[11px] text-emerald-200 mt-0.5 font-medium">SakhiNidhi • Tribe 2026</p>
          </div>
        </div>

        {/* Group Summary Box */}
        <div className="bg-[#0E3D2A] rounded-2xl p-4 mb-6 border border-emerald-700/50">
          <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
            समूह (SHG)
          </div>
          <div className="text-base font-black truncate text-white mt-0.5">
            {group?.name || 'सखी मंडल, जमशेदपुर'}
          </div>
          <div className="text-xs text-emerald-200 font-medium">
            {group?.village || 'सुंदरनगर, पूर्वी सिंहभूम'}
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-800 flex items-center justify-between">
            <span className="text-xs text-emerald-300">कोष (Balance):</span>
            <span className="font-black text-amber-300 text-base">₹{fundBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Language Select */}
        <div className="mb-6">
          <div className="text-[11px] font-black text-emerald-200 uppercase tracking-wider mb-2">
            भाषा (Language)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelectLanguage(l.code)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center ${
                  currentLangCode === l.code
                    ? 'bg-[#E8892B] text-white shadow-xs'
                    : 'bg-emerald-900/50 hover:bg-emerald-800 text-emerald-100'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-base transition-all text-left ${
                  active
                    ? 'bg-white text-[#165A3E] shadow-sm font-black'
                    : 'text-emerald-100 hover:bg-emerald-800/40'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5] text-[#165A3E]' : 'stroke-[2]'}`} />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}

          {/* Bank Dashboard Link */}
          <button
            type="button"
            onClick={() => handleNavClick('bank')}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-base transition-all text-left mt-3 border ${
              currentTab === 'bank'
                ? 'bg-amber-400 text-slate-900 border-amber-300 shadow-sm font-black'
                : 'text-amber-300 border-amber-400/40 hover:bg-amber-400/10'
            }`}
          >
            <Landmark className="w-5 h-5 stroke-[2]" />
            <span>{t('nav.bank')}</span>
          </button>

          {/* Project Website Landing Page Link */}
          <button
            type="button"
            onClick={() => handleNavClick('about')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left mt-2 ${
              currentTab === 'about'
                ? 'bg-[#0E3D2A] text-white shadow-xs'
                : 'text-emerald-200 hover:bg-emerald-900/40'
            }`}
          >
            <Globe className="w-4 h-4 text-amber-300" />
            <span>Project Website</span>
          </button>
        </nav>

        {/* Footer Info */}
        <div className="pt-4 border-t border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${syncState.isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            <span>{syncState.isOnline ? 'Online' : 'Offline Safe'}</span>
          </div>
          <span className="font-mono text-[11px] opacity-75">v1.0.0</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 sm:pb-28 lg:pb-8">
        {/* Mobile / Tablet Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs safe-top-inset">
          <div className="px-4 py-2.5 flex items-center justify-between gap-3 max-w-4xl mx-auto">
            {/* Left: Group Brand */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#165A3E] flex items-center justify-center font-black text-lg text-white shadow-xs flex-shrink-0">
                ₹
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-black text-sm sm:text-base leading-tight truncate text-slate-900">
                    {group?.name || 'सखी मंडल, जमशेदपुर'}
                  </h2>
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      syncState.isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`}
                    title={syncState.isOnline ? 'Online' : 'Offline Safe'}
                  />
                </div>
                <div className="text-[11px] font-semibold text-slate-500 truncate">
                  {group?.village || 'सुंदरनगर, पूर्वी सिंहभूम'}
                </div>
              </div>
            </div>

            {/* Right: Language Pill Dropdown + About + Speaker */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Compact Language Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="h-8 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200 transition-all"
                >
                  <Globe className="w-3.5 h-3.5 text-[#165A3E]" />
                  <span>{currentLangLabel}</span>
                  <span className="text-[9px] text-slate-400">▼</span>
                </button>

                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                    <div className="absolute right-0 top-10 w-36 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50">
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => handleSelectLanguage(l.code)}
                          className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 ${
                            currentLangCode === l.code ? 'text-[#165A3E] bg-emerald-50' : 'text-slate-700'
                          }`}
                        >
                          <span>{l.label}</span>
                          {currentLangCode === l.code && <Check className="w-3.5 h-3.5 text-[#165A3E]" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Quick Website pill on mobile (hidden on ultra-small screens to avoid crowding) */}
              <button
                type="button"
                onClick={() => handleNavClick('about')}
                className="hidden sm:flex h-8 px-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#165A3E] font-bold text-xs border border-emerald-200 transition-all items-center gap-1"
                title="Project Website"
              >
                <span>About</span>
              </button>

              <SpeakButton text={screenNarration} />
            </div>
          </div>

          {/* Show offline banner ONLY when actually offline */}
          {!syncState.isOnline && (
            <div className="bg-[#E8892B] text-white px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5" />
              <span>{t('common.offline_notice')}</span>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 sm:py-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] px-2 pt-1 pb-2 safe-bottom-inset">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`min-h-[52px] py-1 px-1 rounded-xl flex flex-col items-center justify-center transition-all select-none touch-manipulation focus:outline-none ${
                  active
                    ? 'text-[#165A3E] font-black'
                    : 'text-slate-400 hover:text-slate-600 font-semibold'
                }`}
              >
                <div className={`p-1 rounded-lg transition-colors ${active ? 'bg-emerald-100/70' : 'bg-transparent'}`}>
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5] text-[#165A3E]' : 'stroke-[1.8]'}`} />
                </div>
                <span className="text-[10px] leading-tight text-center truncate max-w-[60px] mt-0.5">
                  {t(item.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Global Toast */}
      <Toast />
    </div>
  );
}
