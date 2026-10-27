import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Share2, QrCode, Award, Landmark, User, BookOpen, Calendar, Database, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import CreditGauge from '../components/CreditGauge';
import { db } from '../lib/db';
import { calculateFundBalance } from '../lib/finance';
import { calculateGroupCreditScore } from '../lib/score';
import { generateMemberPassbookPdf, generateCashBookPdf, generateLoanRegisterPdf, generateAttendanceRegisterPdf } from '../lib/pdf';
import { showToast } from '../components/Toast';
import { triggerHaptic, playChime } from '../lib/voice';
import { loadDemoData } from '../lib/demoData';
import { syncNow } from '../lib/sync';

export default function Reports({ group, onNavigate, onResetGroup }) {
  const { t } = useTranslation();
  const [scoreData, setScoreData] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [allData, setAllData] = useState({ meetings: [], savings: [], loans: [], repayments: [], fines: [], attendance: [] });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function loadReportsData() {
      try {
        const [mList, meetings, attendance, savings, loans, repayments, fines] = await Promise.all([
          db.members.toArray(),
          db.meetings.toArray(),
          db.attendance.toArray(),
          db.savings.toArray(),
          db.loans.toArray(),
          db.repayments.toArray(),
          db.fines.toArray()
        ]);

        setMembers(mList);
        if (mList.length > 0) setSelectedMemberId(mList[0].id);

        setAllData({ meetings, savings, loans, repayments, fines, attendance });

        const score = calculateGroupCreditScore({
          members: mList,
          meetings,
          attendance,
          savings,
          loans,
          repayments
        });
        setScoreData(score);

        const bankUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/bank/${group?.id || 1}`
          : `https://sakhinidhi.app/bank/${group?.id || 1}`;

        const qr = await QRCode.toDataURL(bankUrl, { width: 150, margin: 1 });
        setQrDataUrl(qr);
      } catch (err) {
        console.error(err);
      }
    }
    loadReportsData();
  }, [group]);

  const handleDownloadPassbook = () => {
    playChime('cash');
    triggerHaptic('success');
    const member = members.find(m => m.id === Number(selectedMemberId));
    const mSavings = allData.savings.filter(s => s.memberId === Number(selectedMemberId));
    const mRepayments = allData.repayments.filter(r => r.memberId === Number(selectedMemberId));

    generateMemberPassbookPdf({
      group,
      member,
      savings: mSavings,
      repayments: mRepayments
    });
    showToast(`${t('reports.passbook')} PDF ${t('common.done')}`, 'success');
  };

  const handleDownloadCashBook = () => {
    playChime('cash');
    triggerHaptic('success');
    const summary = calculateFundBalance(allData);
    generateCashBookPdf({
      group,
      savings: allData.savings,
      repayments: allData.repayments,
      loans: allData.loans,
      summary
    });
    showToast(`${t('reports.cash_book_name')} PDF ${t('common.done')}`, 'success');
  };

  const handleDownloadLoanRegister = () => {
    playChime('cash');
    triggerHaptic('success');
    generateLoanRegisterPdf({
      group,
      loans: allData.loans,
      members
    });
    showToast(`${t('reports.loan_reg_name')} PDF ${t('common.done')}`, 'success');
  };

  const handleDownloadAttendance = () => {
    playChime('cash');
    triggerHaptic('success');
    generateAttendanceRegisterPdf({
      group,
      members,
      meetings: allData.meetings,
      attendance: allData.attendance
    });
    showToast(`${t('reports.att_reg_name')} PDF ${t('common.done')}`, 'success');
  };

  const handleExportBackup = async () => {
    try {
      playChime('tap');
      triggerHaptic('tap');
      const backupData = {
        exportedAt: new Date().toISOString(),
        groups: await db.groups.toArray(),
        members: await db.members.toArray(),
        meetings: await db.meetings.toArray(),
        attendance: await db.attendance.toArray(),
        savings: await db.savings.toArray(),
        loans: await db.loans.toArray(),
        repayments: await db.repayments.toArray(),
        fines: await db.fines.toArray()
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sakhinidhi_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('डेटा बैकअप डाउनलोड हो गया (Backup Downloaded)', 'success');
      playChime('success');
    } catch (err) {
      showToast('बैकअप निर्यात में त्रुटि', 'error');
    }
  };

  const handleResetData = async () => {
    const confirmed = window.confirm('क्या आप समूह का डेटा साफ करके नया समूह बनाना चाहते हैं? (Reset all local data?)');
    if (!confirmed) return;

    try {
      await Promise.all([
        db.groups.clear(),
        db.members.clear(),
        db.meetings.clear(),
        db.attendance.clear(),
        db.savings.clear(),
        db.loans.clear(),
        db.repayments.clear(),
        db.fines.clear(),
        db.audit_log.clear()
      ]);
      playChime('success');
      showToast('डेटा साफ कर दिया गया। नया खाता शुरू करें।', 'info');
      if (onResetGroup) onResetGroup();
    } catch (err) {
      showToast('डेटा हटाने में त्रुटि', 'error');
    }
  };

  const handleLoadDemoForTesting = async () => {
    try {
      await loadDemoData();
      playChime('success');
      showToast('डेमो डेटा लोड हो गया!', 'success');
      window.location.reload();
    } catch (err) {
      showToast('डेमो लोड करने में त्रुटि', 'error');
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    playChime('tap');
    try {
      const res = await syncNow();
      if (res && res.success) {
        showToast('क्लाउड सिंक पूरा हुआ! (Cloud Synced)', 'success');
        playChime('success');
      } else {
        showToast('ऑफ़लाइन सुरक्षित (डेटा डिवाइस पर सुरक्षित है)', 'info');
      }
    } catch (e) {
      showToast('सिंक नोटिस: ऑफ़लाइन सुरक्षित', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* 1. Credit Score Gauge */}
      {scoreData && <CreditGauge scoreData={scoreData} />}

      {/* 2. PDF Reports */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#165A3E]" />
          <h3 className="font-extrabold text-base text-slate-800">
            {t('reports.title')}
          </h3>
        </div>

        {/* Member Passbook */}
        <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
            <User className="w-4 h-4 text-emerald-700" />
            <span>{t('reports.passbook')}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedMemberId || ''}
              onChange={(e) => setSelectedMemberId(Number(e.target.value))}
              className="flex-1 min-h-[42px] px-3 rounded-lg border border-emerald-300 font-bold text-xs sm:text-sm text-slate-800 bg-white"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleDownloadPassbook}
              className="min-h-[42px] px-4 rounded-lg bg-[#165A3E] hover:bg-[#124933] text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('reports.download')}</span>
            </button>
          </div>
        </div>

        {/* 3 Other Registers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Cash Book */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="mb-2">
              <FileText className="w-5 h-5 text-[#165A3E] mb-1" />
              <div className="font-bold text-xs text-slate-800 leading-snug">{t('reports.cash_book_name')}</div>
              <div className="text-[10px] text-slate-500">{t('reports.cash_book_desc')}</div>
            </div>
            <button
              type="button"
              onClick={handleDownloadCashBook}
              className="w-full py-2 rounded-lg bg-white hover:bg-slate-100 text-[#165A3E] border border-slate-200 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>

          {/* Loan Register */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="mb-2">
              <Landmark className="w-5 h-5 text-[#E8892B] mb-1" />
              <div className="font-bold text-xs text-slate-800 leading-snug">{t('reports.loan_reg_name')}</div>
              <div className="text-[10px] text-slate-500">{t('reports.loan_reg_desc')}</div>
            </div>
            <button
              type="button"
              onClick={handleDownloadLoanRegister}
              className="w-full py-2 rounded-lg bg-white hover:bg-slate-100 text-[#E8892B] border border-slate-200 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>

          {/* Attendance Register */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="mb-2">
              <Calendar className="w-5 h-5 text-blue-600 mb-1" />
              <div className="font-bold text-xs text-slate-800 leading-snug">{t('reports.att_reg_name')}</div>
              <div className="text-[10px] text-slate-500">{t('reports.att_reg_desc')}</div>
            </div>
            <button
              type="button"
              onClick={handleDownloadAttendance}
              className="w-full py-2 rounded-lg bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bank QR Code Card */}
      <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 shadow-2xs flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        {qrDataUrl && (
          <div className="bg-white p-2 rounded-xl border border-amber-200 shadow-2xs flex-shrink-0">
            <img src={qrDataUrl} alt="Bank QR" className="w-24 h-24" />
          </div>
        )}

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md uppercase">
            <QrCode className="w-3 h-3" />
            <span>Bank Officer Scan</span>
          </div>
          <h4 className="font-bold text-sm text-slate-800">
            {t('reports.bank_officer_title')}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {t('reports.bank_officer_desc')}
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => { playChime('tap'); if (onNavigate) onNavigate('bank'); }}
              className="px-3.5 py-1.5 rounded-lg bg-[#165A3E] hover:bg-[#124933] text-white font-bold text-xs inline-flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>{t('reports.open_dashboard')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Group & Database Management Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#165A3E]" />
            <h3 className="font-extrabold text-base text-slate-800">
              समूह व डेटा प्रबंधन (Group & Data Management)
            </h3>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            Offline IndexedDB
          </span>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          वास्तविक समूह के लिए नया खाता बनाएं, बैकअप सुरक्षित करें या टेस्ट के लिए डेमो डेटा लोड करें।
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Export JSON Backup */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-between transition-all active:scale-95"
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-700" />
              <span>बैकअप डाउनलोड (Export Backup)</span>
            </div>
            <span className="text-[10px] text-slate-400">JSON</span>
          </button>

          {/* Cloud Sync */}
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-between transition-all active:scale-95"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'सिंक हो रहा है...' : 'क्लाउड सिंक (Cloud Sync)'}</span>
            </div>
            <span className="text-[10px] text-slate-400">Supabase</span>
          </button>

          {/* Reset / Create Real New Group */}
          <button
            type="button"
            onClick={handleResetData}
            className="p-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-between transition-all active:scale-95"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>नया समूह बनाएं / डेटा साफ करें</span>
            </div>
            <span className="text-[10px] text-rose-500">Reset</span>
          </button>

          {/* Load Demo Data for Hackathon Test */}
          <button
            type="button"
            onClick={handleLoadDemoForTesting}
            className="p-3 rounded-xl border border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 text-amber-900 font-bold text-xs flex items-center justify-between transition-all active:scale-95"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>टेस्ट के लिए डेमो डेटा लोड करें</span>
            </div>
            <span className="text-[10px] text-amber-700 font-black">Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
