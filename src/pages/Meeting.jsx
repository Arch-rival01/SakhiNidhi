import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, PiggyBank, HandCoins, FileCheck, Check, ArrowRight, ArrowLeft, Lock, Volume2, Plus, Sparkles, Mic, MicOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import StepBar from '../components/StepBar';
import MemberAvatar from '../components/MemberAvatar';
import AmountKeypad from '../components/AmountKeypad';
import BigButton from '../components/BigButton';
import ConfirmDialog from '../components/ConfirmDialog';
import TripleConfirmationModal from '../components/TripleConfirmationModal';
import { db, logAudit } from '../lib/db';
import { calculateLoanEligibility, splitRepayment, calculateMonthlyInterest } from '../lib/finance';
import { showToast } from '../components/Toast';
import { triggerHaptic, speak, playChime, startVoiceRecognition, parseMeetingVoiceCommand } from '../lib/voice';
import confetti from 'canvas-confetti';

export default function Meeting({ group, onFinish }) {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);

  const [members, setMembers] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);

  // Attendance state: { memberId: 'present' | 'absent' }
  const [attendanceMap, setAttendanceMap] = useState({});

  // Savings state: { memberId: amount }
  const [savingsMap, setSavingsMap] = useState({});

  // Repayments state: { loanId: amount }
  const [repaymentsMap, setRepaymentsMap] = useState({});

  // Active Keypad modal
  const [keypadConfig, setKeypadConfig] = useState(null);
  const [keypadAmount, setKeypadAmount] = useState('');

  // Triple confirmation popup
  const [tripleModal, setTripleModal] = useState({ isOpen: false, type: 'success', title: '', spokenMessage: '', amount: null, details: '' });

  // Lock confirmation dialog
  const [showLockDialog, setShowLockDialog] = useState(false);

  // Live Speech Command State
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');

  useEffect(() => {
    async function loadData() {
      const [allMembers, allLoans] = await Promise.all([
        db.members.toArray(),
        db.loans.where('status').equals('active').or('status').equals('overdue').toArray()
      ]);
      setMembers(allMembers);
      setActiveLoans(allLoans);

      const initialAtt = {};
      const initialSav = {};
      allMembers.forEach(m => {
        initialAtt[m.id] = 'present';
        initialSav[m.id] = group?.weeklySaving || 100;
      });
      setAttendanceMap(initialAtt);
      setSavingsMap(initialSav);
    }
    loadData();
  }, [group]);

  // Step 1: Attendance toggle
  const toggleAttendance = (memberId) => {
    setAttendanceMap(prev => {
      const current = prev[memberId];
      const next = current === 'present' ? 'absent' : 'present';
      playChime('tap');
      triggerHaptic('tap');
      return { ...prev, [memberId]: next };
    });
  };

  const handleMarkAllPresent = () => {
    playChime('success');
    triggerHaptic('tap');
    const all = {};
    members.forEach(m => { all[m.id] = 'present'; });
    setAttendanceMap(all);
    showToast(t('meeting.mark_all_present'), 'info');
  };

  // Step 2: Open keypad for saving
  const handleOpenSavingKeypad = (member) => {
    playChime('tap');
    setKeypadConfig({
      type: 'saving',
      member,
      currentAmount: String(savingsMap[member.id] || group?.weeklySaving || 100)
    });
    setKeypadAmount(String(savingsMap[member.id] || group?.weeklySaving || 100));
  };

  // Set default saving for all present members
  const handleSetAllDefaultSavings = () => {
    const def = group?.weeklySaving || 100;
    playChime('cash');
    triggerHaptic('success');
    const updated = { ...savingsMap };
    members.forEach(m => {
      if (attendanceMap[m.id] === 'present') {
        updated[m.id] = def;
      }
    });
    setSavingsMap(updated);
    showToast(`सभी उपस्थित सदस्यों की ₹${def} बचत तय की गई`, 'success');
    speak(`सभी उपस्थित सदस्यों की ${def} रुपये बचत तय की गई`);
  };

  // Voice Command Action Processor
  const handleStartVoiceCommand = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setVoiceFeedback('सुन रहे हैं... (Listening)');
    playChime('tap');
    triggerHaptic('tap');

    startVoiceRecognition({
      lang: i18n.language === 'en' ? 'en-IN' : 'hi-IN',
      onResult: ({ transcript }) => {
        setIsListening(false);
        const command = parseMeetingVoiceCommand(transcript, members);

        if (command.type === 'ALL_PRESENT') {
          handleMarkAllPresent();
          setVoiceFeedback(`पहचाना: 'सभी उपस्थित' ✅`);
          speak(command.spokenFeedback || 'सभी सदस्य उपस्थित दर्ज');
        } else if (command.type === 'MEMBER_ATTENDANCE') {
          const m = command.member;
          setAttendanceMap(prev => ({ ...prev, [m.id]: command.status }));
          playChime('tap');
          triggerHaptic('tap');
          setVoiceFeedback(`पहचाना: ${m.name} ${command.status === 'present' ? 'उपस्थित' : 'अनुपस्थित'} ✅`);
          speak(command.spokenFeedback);
        } else if (command.type === 'RECORD_SAVING') {
          const m = command.member;
          const amt = command.amount;
          setAttendanceMap(prev => ({ ...prev, [m.id]: 'present' }));
          setSavingsMap(prev => ({ ...prev, [m.id]: amt }));
          playChime('cash');
          triggerHaptic('success');
          setVoiceFeedback(`पहचाना: ${m.name} ₹${amt} बचत ✅`);
          speak(command.spokenFeedback || `${m.name} की बचत ${amt} रुपये दर्ज`);
          showToast(`${m.name}: ₹${amt} बचत दर्ज`, 'success');
        } else if (command.type === 'NEXT_STEP') {
          setCurrentStep(prev => Math.min(prev + 1, 4));
          playChime('tap');
          setVoiceFeedback('अगला कदम ▶');
        } else if (command.type === 'PREV_STEP') {
          setCurrentStep(prev => Math.max(prev - 1, 1));
          playChime('tap');
          setVoiceFeedback('पिछला कदम ◀');
        } else if (command.type === 'LOCK_MEETING') {
          setShowLockDialog(true);
        } else {
          setVoiceFeedback(`'${transcript}' नहीं समझा। नाम व राशि बोलें जैसे 'सीता 100'`);
          triggerHaptic('error');
          playChime('error');
        }
      },
      onError: () => {
        setIsListening(false);
        setVoiceFeedback('माइक शुरू नहीं हुआ, बटन से दर्ज करें');
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  const handleConfirmSaving = (amt) => {
    const member = keypadConfig.member;
    setSavingsMap(prev => ({ ...prev, [member.id]: amt }));
    setKeypadConfig(null);

    const lang = i18n.language || 'hi';
    const spoken = lang === 'en'
      ? `${member.name}, savings ${amt} rupees recorded`
      : `${member.name}, बचत ${amt} रुपये जमा हुए`;

    setTripleModal({
      isOpen: true,
      type: 'success',
      title: `${member.name}`,
      spokenMessage: spoken,
      details: `${t('meeting.step_savings')}: ₹${amt}`,
      amount: amt
    });
  };

  // Step 3: Open keypad for loan repayment
  const handleOpenRepayKeypad = (loan, member) => {
    playChime('tap');
    const monthlyInt = calculateMonthlyInterest(loan.principal, loan.interestRate || 2);
    const suggestedEmi = Math.round(loan.principal / (loan.tenureMonths || 4)) + monthlyInt;

    setKeypadConfig({
      type: 'repay',
      loan,
      member,
      suggestedEmi,
      currentAmount: String(suggestedEmi)
    });
    setKeypadAmount(String(suggestedEmi));
  };

  const handleConfirmRepayment = (amt) => {
    const { loan, member } = keypadConfig;
    const monthlyInt = calculateMonthlyInterest(loan.principal, loan.interestRate || 2);
    const split = splitRepayment(amt, loan.principal, monthlyInt, loan.status === 'overdue' ? 20 : 0);

    setRepaymentsMap(prev => ({
      ...prev,
      [loan.id]: {
        amount: amt,
        memberId: member.id,
        principalPaid: split.principalPaid,
        interestPaid: split.interestPaid,
        finePaid: split.finePaid,
        remainingPrincipal: split.remainingPrincipal
      }
    }));
    setKeypadConfig(null);

    const lang = i18n.language || 'hi';
    const spoken = lang === 'en'
      ? `${member.name}, loan repayment ${amt} rupees recorded`
      : `${member.name}, किस्त ${amt} रुपये जमा हुई`;

    setTripleModal({
      isOpen: true,
      type: 'success',
      title: `${member.name}`,
      spokenMessage: spoken,
      details: `${t('loans.balance_principal')}: ₹${split.principalPaid} • ${t('loans.monthly_interest')}: ₹${split.interestPaid}`,
      amount: amt
    });
  };

  // Final Action: End & Lock Meeting
  const handleLockMeeting = async () => {
    setShowLockDialog(false);
    triggerHaptic('success');
    playChime('success');

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const existingMeetings = await db.meetings.toArray();
      const meetingNumber = existingMeetings.length + 1;

      // 1. Create meeting entry
      const meetingId = await db.meetings.add({
        groupId: group?.id || 1,
        meetingNumber,
        meetingDate: todayStr,
        isLocked: true,
        lockedAt: new Date().toISOString(),
        synced: false
      });

      // 2. Save Attendance
      const attPromises = Object.entries(attendanceMap).map(([mId, status]) =>
        db.attendance.add({
          meetingId,
          memberId: Number(mId),
          status,
          date: todayStr,
          synced: false
        })
      );
      await Promise.all(attPromises);

      // 3. Save Savings
      const savPromises = Object.entries(savingsMap)
        .filter(([mId]) => attendanceMap[mId] === 'present')
        .map(([mId, amt]) =>
          db.savings.add({
            meetingId,
            memberId: Number(mId),
            amount: Number(amt),
            date: todayStr,
            reversed: false,
            synced: false
          })
        );
      await Promise.all(savPromises);

      // 4. Save Repayments & update active loans
      for (const [loanId, repayData] of Object.entries(repaymentsMap)) {
        await db.repayments.add({
          loanId: Number(loanId),
          memberId: repayData.memberId,
          meetingId,
          amount: repayData.amount,
          principalPaid: repayData.principalPaid,
          interestPaid: repayData.interestPaid,
          finePaid: repayData.finePaid || 0,
          date: todayStr,
          reversed: false,
          synced: false
        });

        if (repayData.remainingPrincipal <= 0) {
          await db.loans.update(Number(loanId), { status: 'paid' });
        }
      }

      await logAudit(group?.id || 1, 'LOCK_MEETING', 'meetings', meetingId, {
        meetingNumber,
        totalSavingsToday: Object.values(savingsMap).reduce((a, b) => a + Number(b), 0),
        totalRepaymentsToday: Object.values(repaymentsMap).reduce((a, b) => a + Number(b.amount), 0)
      });

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      showToast(t('meeting.meeting_completed'), 'success');

      setTimeout(() => {
        if (onFinish) onFinish();
      }, 1200);
    } catch (err) {
      console.error(err);
      showToast('Error saving meeting', 'error');
    }
  };

  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length;
  const totalSavingsToday = Object.entries(savingsMap)
    .filter(([mId]) => attendanceMap[mId] === 'present')
    .reduce((sum, [, amt]) => sum + (Number(amt) || 0), 0);

  const totalRepaymentsToday = Object.values(repaymentsMap)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const goToStep = (step) => {
    playChime('tap');
    triggerHaptic('tap');
    setCurrentStep(step);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Step Indicator Bar */}
      <StepBar
        currentStep={currentStep}
        onStepClick={(stepId) => goToStep(stepId)}
      />

      {/* Voice Action Bar (Universal voice command input for Meeting) */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300/80 rounded-2xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handleStartVoiceCommand}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs flex-shrink-0 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-200'
                : 'bg-[#165A3E] hover:bg-[#124933] text-white active:scale-95'
            }`}
          >
            {isListening ? (
              <>
                <Mic className="w-4 h-4 animate-bounce text-white" />
                <span>सुन रहे हैं... (Listening)</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 text-amber-300" />
                <span>बोलकर काम करें (Voice Action)</span>
              </>
            )}
          </button>

          <div className="text-[11px] sm:text-xs text-slate-700 font-bold truncate">
            {voiceFeedback ? (
              <span className="text-emerald-800 font-extrabold">{voiceFeedback}</span>
            ) : currentStep === 1 ? (
              <span className="text-slate-600">बोलें: <span className="text-emerald-800 font-extrabold">"सब उपस्थित"</span> या <span className="text-emerald-800 font-extrabold">"सीता उपस्थित"</span></span>
            ) : (
              <span className="text-slate-600">बोलें: <span className="text-emerald-800 font-extrabold">"सीता 100"</span> या <span className="text-emerald-800 font-extrabold">"पार्वती 50"</span></span>
            )}
          </div>
        </div>

        {isListening && (
          <span className="text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse self-start sm:self-auto">
            LIVE MIC
          </span>
        )}
      </div>

      {/* STEP 1: ATTENDANCE */}
      {currentStep === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-xl sm:text-2xl text-slate-800">
                1. {t('meeting.step_attendance')}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                {t('meeting.attendance_hint')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="text-xs font-bold text-[#165A3E] bg-[#165A3E]/10 hover:bg-[#165A3E]/20 px-3.5 py-2 rounded-xl transition-all flex-shrink-0 active:scale-95 border border-emerald-300/40"
            >
              {t('meeting.mark_all_present')}
            </button>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
            <span className="font-bold text-emerald-900 text-xs sm:text-sm">{t('meeting.total_attendance')}:</span>
            <span className="font-extrabold text-emerald-800 text-base sm:text-lg">
              {presentCount} / {members.length} {t('meeting.members_count')}
            </span>
          </div>

          {/* Member Avatars Grid - Optimized Responsive Media Queries */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {members.map((m) => (
              <div key={m.id} className="w-full flex">
                <MemberAvatar
                  name={m.name}
                  role={m.role}
                  avatarColor={m.avatarColor}
                  status={attendanceMap[m.id]}
                  onClick={() => toggleAttendance(m.id)}
                />
              </div>
            ))}
          </div>

          <div className="pt-2">
            <BigButton onClick={() => goToStep(2)} icon={ArrowRight}>
              {t('meeting.next_savings')}
            </BigButton>
          </div>
        </motion.div>
      )}

      {/* STEP 2: MEMBER SAVINGS */}
      {currentStep === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-xl sm:text-2xl text-slate-800">
                2. {t('meeting.step_savings')}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                {t('meeting.savings_hint')}
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={handleSetAllDefaultSavings}
                className="text-xs font-bold text-[#165A3E] bg-[#165A3E]/10 hover:bg-[#165A3E]/20 px-3 py-1.5 rounded-xl border border-emerald-300/40 active:scale-95 transition-all"
              >
                सबका ₹{group?.weeklySaving || 100} तय करें
              </button>
              <div className="text-right flex-shrink-0 pl-2 border-l border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{t('meeting.total_saved')}</span>
                <div className="text-lg sm:text-xl font-black text-emerald-800 leading-none">₹{totalSavingsToday}</div>
              </div>
            </div>
          </div>

          {/* Member Savings Cards Grid - Optimized Media Queries */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {members.map((m) => {
              const isPresent = attendanceMap[m.id] === 'present';
              const amt = isPresent ? savingsMap[m.id] : 0;
              return (
                <div key={m.id} className={`w-full flex ${!isPresent ? 'opacity-40 pointer-events-none' : ''}`}>
                  <MemberAvatar
                    name={m.name}
                    role={m.role}
                    avatarColor={m.avatarColor}
                    status={isPresent ? 'present' : 'absent'}
                    amountDisplay={isPresent ? amt : null}
                    onClick={() => isPresent && handleOpenSavingKeypad(m)}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex gap-2.5 pt-2">
            <BigButton onClick={() => goToStep(1)} variant="secondary" fullWidth={false} className="w-1/3" icon={ArrowLeft}>
              {t('common.back')}
            </BigButton>
            <BigButton onClick={() => goToStep(3)} icon={ArrowRight} className="flex-1">
              {t('meeting.next_repayments')}
            </BigButton>
          </div>
        </motion.div>
      )}

      {/* STEP 3: LOAN REPAYMENTS */}
      {currentStep === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-xl sm:text-2xl text-slate-800">
                3. {t('meeting.step_repayments')}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                {t('meeting.repayments_hint')}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xs font-bold text-slate-500">{t('loans.loan_repayment')}</span>
              <div className="text-xl font-black text-[#165A3E]">₹{totalRepaymentsToday}</div>
            </div>
          </div>

          {activeLoans.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              <p className="font-bold text-slate-500 text-sm">{t('meeting.no_active_loans')}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeLoans.map((loan) => {
                const borrower = members.find(m => m.id === loan.memberId) || { name: 'सदस्य' };
                const monthlyInt = calculateMonthlyInterest(loan.principal, loan.interestRate || 2);
                const suggestedEmi = Math.round(loan.principal / (loan.tenureMonths || 4)) + monthlyInt;
                const repaymentDone = Boolean(repaymentsMap[loan.id]);

                return (
                  <div
                    key={loan.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      repaymentDone
                        ? 'bg-emerald-50 border-emerald-400'
                        : loan.status === 'overdue'
                        ? 'bg-red-50 border-red-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-white text-sm shadow-xs flex-shrink-0"
                        style={{ backgroundColor: borrower.avatarColor || '#165A3E' }}
                      >
                        {borrower.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-base text-slate-800">{borrower.name}</div>
                        <div className="text-xs font-semibold text-slate-600">
                          {t('loans.balance_principal')}: ₹{loan.principal} • {t('loans.monthly_interest')}: ₹{monthlyInt}
                        </div>
                        {loan.status === 'overdue' && (
                          <span className="text-[10px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-md inline-block mt-1">
                            {t('loans.overdue_badge')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      {repaymentDone ? (
                        <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                          <span>₹{repaymentsMap[loan.id].amount} {t('common.done')}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenRepayKeypad(loan, borrower)}
                          className="min-h-[42px] px-4 rounded-xl bg-[#165A3E] hover:bg-[#124933] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 active:scale-95"
                        >
                          <span>{t('meeting.take_emi')} (₹{suggestedEmi})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <BigButton onClick={() => goToStep(2)} variant="secondary" fullWidth={false} className="w-1/3" icon={ArrowLeft}>
              {t('common.back')}
            </BigButton>
            <BigButton onClick={() => goToStep(4)} icon={ArrowRight} className="flex-1">
              {t('meeting.next_summary')}
            </BigButton>
          </div>
        </motion.div>
      )}

      {/* STEP 4: MEETING SUMMARY & LOCK */}
      {currentStep === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xl sm:text-2xl text-slate-800">
              4. {t('meeting.step_summary')}
            </h3>
            <button
              type="button"
              onClick={() => {
                const lang = i18n.language || 'hi';
                const text = lang === 'en'
                  ? `Meeting summary: ${presentCount} members present. Total savings ${totalSavingsToday} rupees, loan repayment ${totalRepaymentsToday} rupees.`
                  : `बैठक सारांश: आज ${presentCount} सदस्य उपस्थित हैं। कुल बचत ${totalSavingsToday} रुपये और ऋण वापसी ${totalRepaymentsToday} रुपये जमा हुई।`;
                speak(text, { lang: lang === 'en' ? 'en-IN' : 'hi-IN' });
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#165A3E] bg-[#165A3E]/10 px-3 py-1.5 rounded-full"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{t('common.speak')}</span>
            </button>
          </div>

          {/* Grand Summary Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#165A3E]/30 shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100">
              <div className="bg-emerald-50 rounded-2xl p-3.5">
                <span className="text-xs font-bold text-emerald-800 uppercase">{t('meeting.step_attendance')}</span>
                <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
                  {presentCount} / {members.length}
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-3.5">
                <span className="text-xs font-bold text-amber-800 uppercase">{t('meeting.step_savings')}</span>
                <div className="text-xl sm:text-2xl font-black text-amber-900 mt-1">
                  ₹{totalSavingsToday}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 text-sm sm:text-base">
              <span className="font-bold text-slate-600">{t('meeting.step_repayments')}:</span>
              <span className="font-extrabold text-slate-800 text-lg">₹{totalRepaymentsToday}</span>
            </div>

            <div className="flex items-center justify-between py-2 pt-3 border-t border-dashed border-slate-200">
              <span className="text-base sm:text-lg font-black text-[#165A3E]">{t('home.total_savings')}:</span>
              <span className="text-2xl sm:text-3xl font-black text-[#165A3E]">
                ₹{totalSavingsToday + totalRepaymentsToday}
              </span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <BigButton onClick={() => goToStep(3)} variant="secondary" fullWidth={false} className="w-1/3" icon={ArrowLeft}>
              {t('common.back')}
            </BigButton>
            <BigButton
              onClick={() => { playChime('tap'); setShowLockDialog(true); }}
              variant="turmeric"
              icon={Lock}
              className="flex-1"
            >
              {t('meeting.end_and_lock')}
            </BigButton>
          </div>
        </motion.div>
      )}

      {/* Keypad Modal */}
      {keypadConfig && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 pb-8 safe-bottom-inset shadow-2xl border-t sm:border-2 border-slate-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                  style={{ backgroundColor: keypadConfig.member?.avatarColor || '#165A3E' }}
                >
                  {keypadConfig.member?.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-lg text-slate-800">{keypadConfig.member?.name}</h4>
                  <p className="text-xs font-bold text-slate-500">
                    {keypadConfig.type === 'saving' ? t('meeting.saving_amount') : t('loans.loan_repayment')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setKeypadConfig(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1.5"
              >
                {t('common.cancel')}
              </button>
            </div>

            <AmountKeypad
              value={keypadAmount}
              onChange={setKeypadAmount}
              onConfirm={(amt) => {
                if (keypadConfig.type === 'saving') {
                  handleConfirmSaving(amt);
                } else {
                  handleConfirmRepayment(amt);
                }
              }}
              confirmLabel={t('common.confirm')}
            />
          </motion.div>
        </div>
      )}

      {/* Triple Confirmation Modal */}
      <TripleConfirmationModal
        isOpen={tripleModal.isOpen}
        type={tripleModal.type}
        title={tripleModal.title}
        spokenMessage={tripleModal.spokenMessage}
        details={tripleModal.details}
        amount={tripleModal.amount}
        onClose={() => setTripleModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Confirm Lock Dialog */}
      <ConfirmDialog
        isOpen={showLockDialog}
        title={t('meeting.confirm_lock_title')}
        description={t('meeting.confirm_lock_desc')}
        voicePrompt="क्या आप बैठक समाप्त करके सभी हिसाब लॉक करना चाहती हैं?"
        confirmText={t('meeting.end_and_lock')}
        cancelText={t('common.cancel')}
        onConfirm={handleLockMeeting}
        onCancel={() => setShowLockDialog(false)}
      />
    </div>
  );
}
