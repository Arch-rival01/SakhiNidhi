import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import LandingPage from './pages/LandingPage';
import DownloadPage from './pages/Download';
import BankDashboard from './pages/BankDashboard';
import AppShell from './layouts/AppShell';
import Home from './pages/Home';
import Meeting from './pages/Meeting';
import Loans from './pages/Loans';
import Reports from './pages/Reports';
import { db } from './lib/db';
import { loadDemoData } from './lib/demoData';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('landing'); // 'landing' | 'download' | 'bank' | 'app'
  const [appTab, setAppTab] = useState('home');
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detect standalone APK / WebView mode or specific route
  useEffect(() => {
    const isStandalone = typeof window !== 'undefined' && (
      Capacitor.isNativePlatform() ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );

    const path = window.location.pathname;
    const search = window.location.search;

    if (path.startsWith('/bank')) {
      setCurrentRoute('bank');
    } else if (path === '/download') {
      setCurrentRoute('download');
    } else if (path === '/app' || search.includes('mode=apk') || isStandalone) {
      setCurrentRoute('app');
    } else {
      setCurrentRoute('landing');
    }

    const handlePopState = () => {
      const p = window.location.pathname;
      const s = window.location.search;
      if (p.startsWith('/bank')) setCurrentRoute('bank');
      else if (p === '/download') setCurrentRoute('download');
      else if (p === '/app' || s.includes('mode=apk') || isStandalone) setCurrentRoute('app');
      else setCurrentRoute('landing');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize DB
  useEffect(() => {
    async function initDb() {
      try {
        let groups = await db.groups.toArray();
        if (groups.length === 0) {
          await loadDemoData();
          groups = await db.groups.toArray();
        }
        if (groups.length > 0) {
          setGroup(groups[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    initDb();
  }, []);

  const navigateTo = (route) => {
    setCurrentRoute(route);
    if (route === 'bank') {
      window.history.pushState({}, '', `/bank/${group?.id || 1}`);
    } else if (route === 'download') {
      window.history.pushState({}, '', '/download');
    } else if (route === 'app') {
      window.history.pushState({}, '', '/app');
    } else {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#165A3E] text-white flex items-center justify-center font-black text-2xl shadow-md animate-pulse mb-3">
          ₹
        </div>
        <h2 className="font-bold text-lg text-[#165A3E]">सखीनिधि (SakhiNidhi)</h2>
      </div>
    );
  }

  // 1. HIDDEN BANK OFFICER DASHBOARD (Direct link /bank/:groupId only)
  if (currentRoute === 'bank') {
    return (
      <BankDashboard
        groupId={group?.id || 1}
        onBack={() => navigateTo('landing')}
      />
    );
  }

  // 2. DOWNLOAD PAGE
  if (currentRoute === 'download') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <header className="bg-white border-b border-slate-200 py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateTo('landing')}
              className="font-bold text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              ← Back to Project Website
            </button>
            <span className="font-bold text-xs text-[#165A3E]">SakhiNidhi APK</span>
          </div>
        </header>

        <main className="flex-1 px-4 py-8">
          <DownloadPage />
        </main>

        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
          SakhiNidhi • Tribe 2026 Hackathon
        </footer>
      </div>
    );
  }

  // 3. ANDROID APK APP UI (Loaded when user installs/opens APK or visits /app)
  if (currentRoute === 'app') {
    return (
      <AppShell
        currentTab={appTab}
        onTabChange={setAppTab}
        group={group}
        screenNarration="सखीनिधि मोबाइल ऐप।"
      >
        {appTab === 'home' && <Home group={group} onNavigate={setAppTab} />}
        {appTab === 'meeting' && <Meeting group={group} onFinish={() => setAppTab('home')} />}
        {appTab === 'loans' && <Loans group={group} />}
        {appTab === 'reports' && <Reports group={group} onNavigate={setAppTab} />}
        {appTab === 'download' && <DownloadPage />}
      </AppShell>
    );
  }

  // 4. PUBLIC WEBSITE (LANDING PAGE WITH ABOUT & DOWNLOAD SECTION - DEFAULT)
  return (
    <LandingPage
      onDownload={() => navigateTo('download')}
      onOpenBankSecret={() => navigateTo('bank')}
      onPreviewApp={() => navigateTo('app')}
    />
  );
}
