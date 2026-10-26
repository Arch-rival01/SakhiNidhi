import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, PiggyBank, HandCoins, FileText, AlertTriangle, Send, ChevronRight, Award, Sparkles, CheckCircle2, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/db';
import { calculateFundBalance } from '../lib/finance';
import { calculateGroupCreditScore } from '../lib/score';
import { sendSmsNotification, formatSmsMessage } from '../lib/sms';
import { showToast } from '../components/Toast';
import { triggerHaptic, speak, playChime } from '../lib/voice';

export default function Home({ onNavigate, group }) {
  const { t, i18n } = useTranslation();
  const [balanceData, setBalanceData] = useState({ fundBalance: 0, totalSavings: 0, loansOutstanding: 0 });
  const [lastMeeting, setLastMeeting] = useState(null);
  const [overdueLoans, setOverdueLoans] = useState([]);
  const [membersMap, setMembersMap] = useState({});
  const [scoreData, setScoreData] = useState(null);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [members, meetings, attendance, savings, loans, repayments, fines] = await Promise.all([
          db.members.toArray(),
          db.meetings.toArray(),
          db.attendance.toArray(),
          db.savings.toArray(),
          db.loans.toArray(),
          db.repayments.toArray(),
          db.fines.toArray()
        ]);

        const mMap = {};
        members.forEach(m => { mMap[m.id] = m; });
        setMembersMap(mMap);

        const fundCalc = calculateFundBalance({ savings, repayments, loans, fines });
        setBalanceData(fundCalc);

        if (meetings.length > 0) {
          const sorted = [...meetings].sort((a, b) => new Date(b.meetingDate) - new Date(a.meetingDate));
          setLastMeeting(sorted[0]);
        }

        const overdue = loans.filter(l => l.status === 'overdue');
        setOverdueLoans(overdue);

        const score = calculateGroupCreditScore({ members, meetings, attendance, savings, loans, repayments });
        setScoreData(score);
      } catch (err) {
        console.error(err);
      }
    }

    loadHomeData();
  }, []);

  const handleSendReminderSms = (loan) => {
    triggerHaptic('tap');
    const member = membersMap[loan.memberId];
    if (!member) return;

    const message = formatSmsMessage({
      type: 'overdue_alert',
      memberName: member.name,
      groupName: group?.name,
      amount: loan.principal,
      language: i18n.language || 'hi'
    });

    sendSmsNotification(member.phone, message);
    showToast(`${t('home.sms_link_ready', 'SMS लिंक तैयार')}: ${member.name}`, 'info');
  };

  const handleSpeakBalance = () => {
    playChime('tap');
    triggerHaptic('tap');
    const lang = i18n.language || 'hi';
    let text = `समूह का कुल जमा कोष ${balanceData.fundBalance} रुपये है। कुल बचत ${balanceData.totalSavings} रुपये और बकाया ऋण ${balanceData.loansOutstanding} रुपये है।`;
    if (lang === 'en') {
      text = `Current group fund balance is ${balanceData.fundBalance} rupees. Total savings ${balanceData.totalSavings} rupees, and outstanding loans ${balanceData.loansOutstanding} rupees.`;
    } else if (lang === 'sat') {
      text = `ᱜᱟᱶᱛᱟ ᱨᱮᱱᱟᱜ ᱡᱚᱛᱚ ᱴᱟᱠᱟ ᱵᱟᱠᱥᱟ ${balanceData.fundBalance} ᱴᱟᱠᱟ ᱢᱮᱱᱟᱜ-ᱟ ᱾ ᱡᱚᱛᱚ ᱵᱟᱪᱟᱣ ${balanceData.totalSavings} ᱴᱟᱠᱟ ᱟᱨ ᱵᱟᱹᱠᱤ ᱨᱤᱬ ${balanceData.loansOutstanding} ᱴᱟᱠᱟ ᱢᱮᱱᱟᱜ-ᱟ ᱾`;
    }
    speak(text, { lang: lang === 'en' ? 'en-IN' : 'hi-IN' });
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* 1. Main Fund Balance Card */}
      <div
        onClick={handleSpeakBalance}
        className="bg-gradient-to-br from-[#165A3E] to-[#0E3D2A] text-white rounded-3xl p-4 sm:p-6 shadow-md border border-emerald-700/50 cursor-pointer select-none active:scale-[0.99] transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            {t('home.group_balance')}
          </span>
          <span className="text-[11px] font-bold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full flex items-center gap-1 transition-all">
            <Volume2 className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('home.listen', 'सुनें')}</span>
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-black tracking-tight text-white my-1 font-sans">
          ₹{balanceData.fundBalance.toLocaleString('en-IN')}
        </div>

        <div className="mt-3 pt-3 border-t border-emerald-600/40 flex items-center justify-between text-xs text-emerald-100 font-medium">
          <span>{t('home.total_savings', 'कुल बचत')}: <strong className="text-white">₹{balanceData.totalSavings.toLocaleString('en-IN')}</strong></span>
          <span>{t('home.loans_outstanding', 'बकाया ऋण')}: <strong className="text-amber-300">₹{balanceData.loansOutstanding.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* 2. 4 Primary Action Tiles Grid */}
      <div>
        <h3 className="font-extrabold text-base text-slate-800 mb-2 px-1">
          {t('home.quick_actions')}
        </h3>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Meeting Tile */}
          <button
            type="button"
            onClick={() => { playChime('tap'); triggerHaptic('tap'); onNavigate('meeting'); }}
            className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#165A3E] text-left transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-[#165A3E] flex items-center justify-center mb-2.5">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">
              {t('home.meeting_tile')}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
              {t('home.weekly_meeting', 'साप्ताहिक बैठक')}
            </div>
          </button>

          {/* Savings Tile */}
          <button
            type="button"
            onClick={() => { playChime('tap'); triggerHaptic('tap'); onNavigate('meeting', { step: 2 }); }}
            className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#E8892B] text-left transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 text-[#E8892B] flex items-center justify-center mb-2.5">
              <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">
              {t('home.savings_tile')}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
              {t('home.record_savings', 'बचत दर्ज करें')}
            </div>
          </button>

          {/* Loans Tile */}
          <button
            type="button"
            onClick={() => { playChime('tap'); triggerHaptic('tap'); onNavigate('loans'); }}
            className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-red-400 text-left transition-all active:scale-[0.97]"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <HandCoins className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </div>
              {overdueLoans.length > 0 && (
                <span className="text-[9px] sm:text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full uppercase">
                  {overdueLoans.length} {t('home.overdue', 'बाकी')}
                </span>
              )}
            </div>
            <div className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">
              {t('home.loans_tile')}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
              {t('home.new_loan_emi', 'नया ऋण व किस्त')}
            </div>
          </button>

          {/* Reports & Score Tile */}
          <button
            type="button"
            onClick={() => { playChime('tap'); triggerHaptic('tap'); onNavigate('reports'); }}
            className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 text-left transition-all active:scale-[0.97]"
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
              </div>
              {scoreData && (
                <span className="text-[9px] sm:text-[10px] font-black bg-[#165A3E] text-white px-2 py-0.5 rounded-full">
                  {scoreData.totalScore}/100
                </span>
              )}
            </div>
            <div className="font-black text-slate-900 text-sm sm:text-base leading-tight truncate">
              {t('home.reports_tile')}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
              {t('home.passbook_score', 'पासबुक व स्कोर')}
            </div>
          </button>
        </div>
      </div>

      {/* 3. Upcoming Dues Alert (if any) */}
      {overdueLoans.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{t('home.upcoming_dues')}</span>
            </div>
            <span className="bg-rose-600 text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
              {t('home.overdue', 'अतिदेय')}
            </span>
          </div>

          <div className="space-y-2">
            {overdueLoans.map((loan) => {
              const borrower = membersMap[loan.memberId] || { name: 'सदस्य' };
              return (
                <div
                  key={loan.id}
                  className="bg-white rounded-xl p-2.5 sm:p-3 border border-rose-200 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                      style={{ backgroundColor: borrower.avatarColor || '#E8892B' }}
                    >
                      {borrower.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs sm:text-sm truncate">{borrower.name}</div>
                      <div className="text-[10px] sm:text-[11px] text-rose-600 font-semibold truncate">
                        ₹{loan.principal} • {t('home.overdue', 'अतिदेय')}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendReminderSms(loan)}
                    className="min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition-all flex-shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    <span>SMS</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Last Meeting & Score Teaser */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Last Meeting Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
              <span>{t('home.last_meeting')}</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                {t('common.done', 'पूर्ण')}
              </span>
            </div>
            <div className="font-extrabold text-base text-slate-800">
              #{lastMeeting?.meetingNumber || 12}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 mb-3">
              {lastMeeting?.meetingDate || '16 अक्टूबर 2026'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => { playChime('tap'); triggerHaptic('tap'); onNavigate('meeting'); }}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#165A3E] font-bold text-xs flex items-center justify-between border border-slate-200"
          >
            <span>{t('home.meeting_tile')}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Credit Score Card */}
        <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-200 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-800 mb-1">
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#E8892B]" />
                <span>{t('score.title')}</span>
              </span>
              <span className="bg-[#165A3E] text-white px-2 py-0.5 rounded-full text-[10px]">
                {scoreData?.band || 'Good'}
              </span>
            </div>
            <div className="text-2xl font-black text-[#165A3E]">
              {scoreData?.totalScore || 78} <span className="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-0.5 mb-3">
              {t('score.band_excellent')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => { playChime('tap'); triggerHaptic('tap'); onNavigate('reports'); }}
            className="w-full py-2 px-3 rounded-xl bg-[#E8892B] hover:bg-[#d97706] text-white font-bold text-xs flex items-center justify-between shadow-2xs"
          >
            <span>{t('home.reports_tile')}</span>
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
