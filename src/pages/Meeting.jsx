import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, PiggyBank, HandCoins, FileCheck, Check, ArrowRight, ArrowLeft, Lock, Volume2, Plus, Sparkles } from 'lucide-react';
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
import { triggerHaptic, speak } from '../lib/voice';
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

  // New Loans given this meeting: [{ memberId, principal, purpose, tenureMonths, interestRate }]
  const [newLoansList, setNewLoansList] = useState([]);

  // Active Keypad modal
  const [keypadConfig, setKeypadConfig] = useState(null); // { type: 'saving'|'repay'|'newLoan', member, loan, currentAmount }
  const [keypadAmount, setKeypadAmount] = useState('');

  // Triple confirmation popup
  const [tripleModal, setTripleModal] = useState({ isOpen: false, type: 'success', title: '', spokenMessage: '', amount: null, details: '' });

  // Lock confirmation dialog
  const [showLockDialog, setShowLockDialog] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [allMembers, allLoans] = await Promise.all([
        db.members.toArray(),
        db.loans.where('status').equals('active').or('status').equals('overdue').toArray()
      ]);
      setMembers(allMembers);
      setActiveLoans(allLoans);

      // Default attendance to present for convenience
      const initialAtt = {};
      const initialSav = {};
      allMembers.forEach(m => {
        initialAtt[m.id] = 'present';
        // default weekly saving
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
      triggerHaptic('tap');
      return { ...prev, [memberId]: next };
    });
  };

  const handleMarkAllPresent = () => {
    triggerHaptic('tap');
    const all = {};
    members.forEach(m => { all[m.id] = 'present'; });
    setAttendanceMap(all);
    showToast('सभी सदस्य उपस्थित दर्ज किए गए', 'info');
  };

  // Step 2: Open keypad for saving
  const handleOpenSavingKeypad = (member) => {
    setKeypadConfig({
      type: 'saving',
      member,
      currentAmount: String(savingsMap[member.id] || group?.weeklySaving || 100)
    });
    setKeypadAmount(String(savingsMap[member.id] || group?.weeklySaving || 100));
  };

  const handleConfirmSaving = (amt) => {
    const member = keypadConfig.member;
    setSavingsMap(prev => ({ ...prev, [member.id]: amt }));
    setKeypadConfig(null);

    // Trigger triple confirmation
    setTripleModal({
      isOpen: true,
      type: 'success',
      title: `${member.name}`,
      spokenMessage: `${member.name}, बचत ${amt} रुपये जमा हुए`,
      details: 'साप्ताहिक बचत सफलता से दर्ज हुई',
      amount: amt
    });
  };

  // Step 3: Open keypad for loan repayment
  const handleOpenRepayKeypad = (loan, member) => {
    const monthlyInt = calculateMonthlyInterest(loan.principal, loan.interestRate || 2);
    const suggestedEmi = Math.round(loan.principal / (loan.tenureMonths || 4)) + monthlyInt;

    setKeypadConfig({
      type: 'repay',
      loan,
      member,
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
        ...split
      }
    }));
    setKeypadConfig(null);

    setTripleModal({
      isOpen: true,
      type: 'success',
      title: `${member.name} (किस्त)`,
      spokenMessage: `${member.name}, ऋण किस्त ${amt} रुपये जमा`,
      details: `मूलधन: ₹${split.principalPaid} • ब्याज: ₹${split.interestPaid}`,
      amount: amt
    });
  };

  // Step 5: Finish & Lock Meeting
  const handleLockMeeting = async () => {
    try {
      setShowLockDialog(false);
      triggerHaptic('success');

      const todayStr = new Date().toISOString().split('T')[0];
      const count = await db.meetings.count();
      const meetingNumber = count + 1;

      // 1. Create Meeting
      const meetingId = await db.meetings.add({
        groupId: group?.id || 1,
        meetingNumber,
        meetingDate: todayStr,
        notes: `साप्ताहिक बैठक #${meetingNumber}`,
        locked: true,
        createdAt: new Date().toISOString(),
        synced: false
      });

      // 2. Save Attendance
      for (const [memberId, status] of Object.entries(attendanceMap)) {
        await db.attendance.add({
          meetingId,
          memberId: Number(memberId),
          status,
          synced: false
        });
      }

      // 3. Save Savings (for present members with >0 savings)
      for (const [memberId, amt] of Object.entries(savingsMap)) {
        if (attendanceMap[memberId] === 'present' && Number(amt) > 0) {
          await db.savings.add({
            groupId: group?.id || 1,
            meetingId,
            memberId: Number(memberId),
            amount: Number(amt),
            date: todayStr,
            reversed: false,
            synced: false
          });
        }
      }

      // 4. Save Repayments
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

        // Update loan status if fully paid
        if (repayData.remainingPrincipal <= 0) {
          await db.loans.update(Number(loanId), { status: 'paid' });
        }
      }

      // 5. Audit Log
      await logAudit(group?.id || 1, 'LOCK_MEETING', 'meetings', meetingId, {
        meetingNumber,
        totalSavingsToday: Object.values(savingsMap).reduce((a, b) => a + Number(b), 0),
        totalRepaymentsToday: Object.values(repaymentsMap).reduce((a, b) => a + Number(b.amount), 0)
      });

      // Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast('बैठक सफलता से लॉक हो गई!', 'success');
      speak(`बैठक संख्या ${meetingNumber} सफलतापूर्वक लॉक हो गई है।`);

      setTimeout(() => {
        if (onFinish) onFinish();
      }, 1200);
    } catch (err) {
      console.error(err);
      showToast('बैठक सहेजने में त्रुटि', 'error');
    }
  };

  // Calculations for Step 5
  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length;
  const totalSavingsToday = Object.entries(savingsMap)
    .filter(([mId]) => attendanceMap[mId] === 'present')
    .reduce((sum, [, amt]) => sum + (Number(amt) || 0), 0);

  const totalRepaymentsToday = Object.values(repaymentsMap)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const summarySpeechText = `बैठक सारांश: आज ${presentCount} सदस्य उपस्थित हैं। कुल बचत ${totalSavingsToday} रुपये और ऋण वापसी ${totalRepaymentsToday} रुपये जमा हुई।`;

  return (
    <div className="space-y-4">
      {/* Step Indicator Bar */}
      <StepBar
        currentStep={currentStep}
        onStepClick={(stepId) => setCurrentStep(stepId)}
      />

      {/* STEP 1: ATTENDANCE */}
      {currentStep === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-2xl text-slate-800">
                1. {t('meeting.step_attendance')}
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                उपस्थित सदस्य पर टैप करें (हरा = उपस्थित, लाल = अनुपस्थित)
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="text-xs font-bold text-[#1B6B4A] bg-[#1B6B4A]/10 px-3 py-1.5 rounded-full hover:bg-[#1B6B4A]/20"
            >
              सभी उपस्थित
            </button>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
            <span className="font-bold text-emerald-900 text-sm">कुल उपस्थिति:</span>
            <span className="font-extrabold text-emerald-800 text-lg">
              {presentCount} / {members.length} सदस्य
            </span>
          </div>

          {/* Member Avatars Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {members.map((m) => (
              <MemberAvatar
                key={m.id}
                name={m.name}
                role={m.role}
                avatarColor={m.avatarColor}
                status={attendanceMap[m.id]}
                onClick={() => toggleAttendance(m.id)}
              />
            ))}
          </div>

          <div className="pt-4">
            <BigButton onClick={() => setCurrentStep(2)} icon={ArrowRight}>
              बचत दर्ज करें (Next: Savings)
            </BigButton>
          </div>
        </motion.div>
      )}

      {/* STEP 2: MEMBER SAVINGS */}
      {currentStep === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-2xl text-slate-800">
                2. {t('meeting.step_savings')}
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                बचत राशि बदलने या पुष्टि के लिए सदस्य पर टैप करें
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500">कुल जमा</span>
              <div className="text-xl font-black text-emerald-800">₹{totalSavingsToday}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {members.map((m) => {
              const isPresent = attendanceMap[m.id] === 'present';
              const amt = isPresent ? savingsMap[m.id] : 0;
              return (
                <div key={m.id} className={!isPresent ? 'opacity-40 pointer-events-none' : ''}>
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

          <div className="flex gap-3 pt-4">
            <BigButton onClick={() => setCurrentStep(1)} variant="secondary" fullWidth={false} className="w-1/3" icon={ArrowLeft}>
              {t('common.back')}
            </BigButton>
            <BigButton onClick={() => setCurrentStep(3)} icon={ArrowRight} className="flex-1">
              ऋण किस्त देखें (Next: Repayments)
            </BigButton>
          </div>
        </motion.div>
      )}

      {/* STEP 3: LOAN REPAYMENTS */}
      {currentStep === 3 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-2xl text-slate-800">
                3. {t('meeting.step_repayments')}
              </h3>
              <p className="text-sm font-semibold text-slate-500">
                सक्रिय ऋण धारक सदस्यों की किस्त जमा करें
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500">किस्त जमा</span>
              <div className="text-xl font-black text-[#1B6B4A]">₹{totalRepaymentsToday}</div>
            </div>
          </div>

          {activeLoans.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border-2 border-slate-200">
              <p className="font-bold text-slate-500">समूह में अभी कोई सक्रिय ऋण बकाया नहीं है।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeLoans.map((loan) => {
                const borrower = members.find(m => m.id === loan.memberId) || { name: 'सदस्य' };
                const monthlyInt = calculateMonthlyInterest(loan.principal, loan.interestRate || 2);
                const suggestedEmi = Math.round(loan.principal / (loan.tenureMonths || 4)) + monthlyInt;
                const repaymentDone = Boolean(repaymentsMap[loan.id]);

                return (
                  <div
                    key={loan.id}
                    className={`p-4 rounded-3xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      repaymentDone
                        ? 'bg-emerald-50 border-emerald-400'
                        : loan.status === 'overdue'
                        ? 'bg-red-50 border-red-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-base shadow"
                        style={{ backgroundColor: borrower.avatarColor || '#1B6B4A' }}
                      >
                        {borrower.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-lg text-slate-800">{borrower.name}</div>
                        <div className="text-xs font-bold text-slate-600">
                          बकाया मूलधन: ₹{loan.principal} • मासिक ब्याज: ₹{monthlyInt}
                        </div>
                        {loan.status === 'overdue' && (
                          <span className="text-[11px] font-extrabold text-red-700 bg-red-100 px-2 py-0.5 rounded-md inline-block mt-1">
                            चेतावनी: अतिदेय (Overdue)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      {repaymentDone ? (
                        <div className="flex items-center gap-2 text-emerald-800 font-black">
                          <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                          <span>₹{repaymentsMap[loan.id].amount} जमा</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenRepayKeypad(loan, borrower)}
                          className="min-h-[48px] px-5 rounded-2xl bg-[#1B6B4A] hover:bg-[#155339] text-white font-bold text-sm shadow-sm flex items-center gap-2 active:scale-95"
                        >
                          <span>किस्त लें (₹{suggestedEmi})</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <BigButton onClick={() => setCurrentStep(2)} variant="secondary" fullWidth={false} className="w-1/3" icon={ArrowLeft}>
              {t('common.back')}
            </BigButton>
            <BigButton onClick={() => setCurrentStep(4)} icon={ArrowRight} className="flex-1">
              बैठक सारांश (Next: Summary)
            </BigButton>
          </div>
        </motion.div>
      )}

      {/* STEP 4: MEETING SUMMARY & LOCK */}
      {currentStep === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-2xl text-slate-800">
              4. {t('meeting.step_summary')}
            </h3>
            <button
              type="button"
              onClick={() => speak(summarySpeechText)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#1B6B4A] bg-[#1B6B4A]/10 px-3 py-1.5 rounded-full"
            >
              <Volume2 className="w-4 h-4" />
              <span>आवाज में सुनें</span>
            </button>
          </div>

          {/* Grand Summary Card */}
          <div className="bg-white rounded-3xl p-6 border-2 border-[#1B6B4A]/30 shadow-md space-y-4">
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100">
              <div className="bg-emerald-50 rounded-2xl p-4">
                <span className="text-xs font-bold text-emerald-800 uppercase">उपस्थिति</span>
                <div className="text-2xl font-black text-emerald-900 mt-1">
                  {presentCount} / {members.length}
                </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4">
                <span className="text-xs font-bold text-amber-800 uppercase">कुल बचत आज</span>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  ₹{totalSavingsToday}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-base font-bold text-slate-600">ऋण किस्त वापसी (Repayments):</span>
              <span className="text-xl font-extrabold text-slate-800">₹{totalRepaymentsToday}</span>
            </div>

            <div className="flex items-center justify-between py-2 pt-4 border-t-2 border-dashed border-slate-200">
              <span className="text-lg font-black text-[#1B6B4A]">आज कुल कोष प्राप्ति (Total Inflow):</span>
              <span className="text-3xl font-black text-[#1B6B4A]">
                ₹{totalSavingsToday + totalRepaymentsToday}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <BigButton onClick={() => setCurrentStep(3)} variant="secondary" fullWidth={false} className="w-1/3" icon={ArrowLeft}>
              {t('common.back')}
            </BigButton>
            <BigButton
              onClick={() => setShowLockDialog(true)}
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
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border-t sm:border-2 border-slate-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: keypadConfig.member?.avatarColor || '#1B6B4A' }}
                >
                  {keypadConfig.member?.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-xl text-slate-800">{keypadConfig.member?.name}</h4>
                  <p className="text-xs font-bold text-slate-500">
                    {keypadConfig.type === 'saving' ? 'साप्ताहिक बचत राशि' : 'ऋण किस्त जमा'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setKeypadConfig(null)}
                className="text-sm font-bold text-slate-400 hover:text-slate-700 p-2"
              >
                रद्द करें
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
              confirmLabel="दर्ज करें (Confirm Entry)"
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
        confirmText="हाँ, लॉक करें (Lock)"
        cancelText="नहीं, वापस जाएं"
        onConfirm={handleLockMeeting}
        onCancel={() => setShowLockDialog(false)}
      />
    </div>
  );
}

