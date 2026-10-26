import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandCoins, Plus, AlertTriangle, Send, CheckCircle2, Sprout, Store, Scissors, GraduationCap, HelpCircle, Beef, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import MemberAvatar from '../components/MemberAvatar';
import AmountKeypad from '../components/AmountKeypad';
import BigButton from '../components/BigButton';
import TripleConfirmationModal from '../components/TripleConfirmationModal';
import { db, logAudit } from '../lib/db';
import { calculateLoanEligibility, calculateMonthlyInterest, splitRepayment, calculateLateFine } from '../lib/finance';
import { sendSmsNotification, formatSmsMessage } from '../lib/sms';
import { showToast } from '../components/Toast';
import { triggerHaptic } from '../lib/voice';

const PURPOSE_OPTIONS = [
  { id: 'farming', labelKey: 'loans.farming', icon: Sprout, color: 'text-emerald-700 bg-emerald-50' },
  { id: 'livestock', labelKey: 'loans.livestock', icon: Beef, color: 'text-amber-700 bg-amber-50' },
  { id: 'shop', labelKey: 'loans.shop', icon: Store, color: 'text-blue-700 bg-blue-50' },
  { id: 'tools', labelKey: 'loans.tools', icon: Scissors, color: 'text-purple-700 bg-purple-50' },
  { id: 'school', labelKey: 'loans.school', icon: GraduationCap, color: 'text-rose-700 bg-rose-50' },
  { id: 'other', labelKey: 'loans.other', icon: HelpCircle, color: 'text-slate-700 bg-slate-50' },
];

export default function Loans({ group }) {
  const { t, i18n } = useTranslation();
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [savings, setSavings] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [membersMap, setMembersMap] = useState({});

  const [activeView, setActiveView] = useState('list');
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [selectedPurpose, setSelectedPurpose] = useState('farming');
  const [loanAmount, setLoanAmount] = useState('3000');
  const [tenureMonths, setTenureMonths] = useState(5);

  const [repayModal, setRepayModal] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [tripleModal, setTripleModal] = useState({ isOpen: false, type: 'success', title: '', spokenMessage: '', amount: null, details: '' });

  useEffect(() => {
    loadAllLoanData();
  }, []);

  async function loadAllLoanData() {
    try {
      const [allLoans, allMembers, allSavings, allRepayments] = await Promise.all([
        db.loans.toArray(),
        db.members.toArray(),
        db.savings.toArray(),
        db.repayments.toArray()
      ]);

      const mMap = {};
      allMembers.forEach(m => { mMap[m.id] = m; });

      setLoans(allLoans);
      setMembers(allMembers);
      setSavings(allSavings);
      setRepayments(allRepayments);
      setMembersMap(mMap);
    } catch (err) {
      console.error(err);
    }
  }

  const getMemberTotalSavings = (memberId) => {
    return savings
      .filter(s => s.memberId === memberId && !s.reversed)
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  };

  const hasMemberOverdueLoan = (memberId) => {
    return loans.some(l => l.memberId === memberId && l.status === 'overdue');
  };

  const eligibility = selectedBorrower
    ? calculateLoanEligibility(
        getMemberTotalSavings(selectedBorrower.id),
        group?.maxLoanMultiple || 3,
        hasMemberOverdueLoan(selectedBorrower.id)
      )
    : null;

  const handleDisburseLoan = async () => {
    if (!selectedBorrower || !eligibility?.isEligible) {
      triggerHaptic('error');
      setTripleModal({
        isOpen: true,
        type: 'error',
        title: 'ऋण अपात्र',
        spokenMessage: 'यह सदस्य ऋण के लिए पात्र नहीं हैं।',
        details: 'पुरानी किस्त बाकी है अथवा बचत पर्याप्त नहीं है।'
      });
      return;
    }

    const principal = Number(loanAmount) || 0;
    if (principal > eligibility.maxAmount) {
      triggerHaptic('error');
      showToast(`अधिकतम ऋण सीमा ₹${eligibility.maxAmount} है`, 'error');
      return;
    }

    try {
      triggerHaptic('success');
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + tenureMonths);

      const loanId = await db.loans.add({
        groupId: group?.id || 1,
        memberId: selectedBorrower.id,
        principal,
        interestRate: group?.interestRate || 2,
        tenureMonths,
        purpose: selectedPurpose,
        status: 'active',
        issuedDate: now.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        synced: false
      });

      await logAudit(group?.id || 1, 'DISBURSE_LOAN', 'loans', loanId, {
        memberId: selectedBorrower.id,
        borrowerName: selectedBorrower.name,
        principal,
        tenureMonths,
        purpose: selectedPurpose
      });

      setTripleModal({
        isOpen: true,
        type: 'success',
        title: `${selectedBorrower.name}`,
        spokenMessage: `${selectedBorrower.name} को ₹${principal} रुपये का ऋण स्वीकृत हुआ`,
        details: `${tenureMonths} माह अवधि`,
        amount: principal
      });

      await loadAllLoanData();
      setActiveView('list');
      setSelectedBorrower(null);
    } catch (err) {
      console.error(err);
      showToast('ऋण दर्ज करने में त्रुटि', 'error');
    }
  };

  const handleConfirmRepayment = async (amountPaid) => {
    if (!repayModal) return;
    const { loan, borrower } = repayModal;

    const monthlyInt = calculateMonthlyInterest(loan.principal, loan.interestRate || 2);
    const split = splitRepayment(amountPaid, loan.principal, monthlyInt, loan.status === 'overdue' ? 20 : 0);

    try {
      triggerHaptic('success');
      await db.repayments.add({
        loanId: loan.id,
        memberId: borrower.id,
        amount: amountPaid,
        principalPaid: split.principalPaid,
        interestPaid: split.interestPaid,
        finePaid: split.finePaid,
        date: new Date().toISOString().split('T')[0],
        reversed: false,
        synced: false
      });

      const newPrincipal = split.remainingPrincipal;
      if (newPrincipal <= 0) {
        await db.loans.update(loan.id, { status: 'paid', principal: 0 });
      } else {
        await db.loans.update(loan.id, { principal: newPrincipal });
      }

      await logAudit(group?.id || 1, 'LOAN_REPAYMENT', 'repayments', loan.id, {
        borrowerName: borrower.name,
        amount: amountPaid,
        principalPaid: split.principalPaid,
        interestPaid: split.interestPaid
      });

      setTripleModal({
        isOpen: true,
        type: 'success',
        title: `${borrower.name}`,
        spokenMessage: `${borrower.name}, किस्त ₹${amountPaid} रुपये जमा`,
        details: `मूलधन: ₹${split.principalPaid} • ब्याज: ₹${split.interestPaid}`,
        amount: amountPaid
      });

      setRepayModal(null);
      await loadAllLoanData();
    } catch (err) {
      console.error(err);
      showToast('किस्त दर्ज करने में त्रुटि', 'error');
    }
  };

  const handleSendSms = (loan) => {
    triggerHaptic('tap');
    const borrower = membersMap[loan.memberId];
    if (!borrower) return;

    const msg = formatSmsMessage({
      type: loan.status === 'overdue' ? 'overdue_alert' : 'due_reminder',
      memberName: borrower.name,
      groupName: group?.name,
      amount: loan.principal,
      dueDate: loan.dueDate,
      language: i18n.language || 'hi'
    });

    sendSmsNotification(borrower.phone, msg);
    showToast(`SMS लिंक तैयार: ${borrower.name}`, 'info');
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Top Toggle Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex bg-slate-200/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveView('list')}
            className={`min-h-[38px] px-3.5 rounded-lg font-bold text-xs transition-all ${
              activeView === 'list' ? 'bg-[#165A3E] text-white shadow-2xs' : 'text-slate-600'
            }`}
          >
            सक्रिय ऋण ({loans.filter(l => l.status !== 'paid').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('new_loan')}
            className={`min-h-[38px] px-3.5 rounded-lg font-bold text-xs transition-all ${
              activeView === 'new_loan' ? 'bg-[#165A3E] text-white shadow-2xs' : 'text-slate-600'
            }`}
          >
            + नया ऋण दें
          </button>
        </div>
      </div>

      {/* VIEW 1: ACTIVE LOANS LIST */}
      {activeView === 'list' && (
        <div className="space-y-2.5">
          {loans.filter(l => l.status !== 'paid').map((loan) => {
            const borrower = membersMap[loan.memberId] || { name: 'सदस्य' };
            const isOverdue = loan.status === 'overdue';
            const monthlyInt = calculateMonthlyInterest(loan.principal, loan.interestRate || 2);
            const suggestedEmi = Math.round(loan.principal / (loan.tenureMonths || 4)) + monthlyInt;
            const purposeOpt = PURPOSE_OPTIONS.find(p => p.id === loan.purpose) || PURPOSE_OPTIONS[0];
            const PurposeIcon = purposeOpt.icon;

            return (
              <div
                key={loan.id}
                className={`bg-white rounded-2xl p-4 border transition-all ${
                  isOverdue ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-black text-white text-sm shadow-xs"
                      style={{ backgroundColor: borrower.avatarColor || '#165A3E' }}
                    >
                      {borrower.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-800 leading-tight">
                        {borrower.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${purposeOpt.color}`}>
                          <PurposeIcon className="w-3 h-3" />
                          <span>{t(purposeOpt.labelKey)}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {loan.tenureMonths} माह
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      isOverdue ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isOverdue ? t('loans.overdue_badge') : t('loans.active_badge')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 my-2.5 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">बकाया मूलधन</span>
                    <span className="text-sm font-black text-slate-900">₹{loan.principal}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">मासिक ब्याज</span>
                    <span className="text-sm font-black text-emerald-800">₹{monthlyInt}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">अंतिम तिथि</span>
                    <span className="text-xs font-bold text-slate-600">{loan.dueDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRepayModal({ loan, borrower, emi: suggestedEmi });
                      setRepayAmount(String(suggestedEmi));
                    }}
                    className="flex-1 min-h-[42px] rounded-xl bg-[#165A3E] hover:bg-[#124933] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                  >
                    <HandCoins className="w-4 h-4" />
                    <span>किस्त लें (₹{suggestedEmi})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendSms(loan)}
                    className="min-h-[42px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1"
                    title="SMS"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-600" />
                    <span>SMS</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: NEW LOAN */}
      {activeView === 'new_loan' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
              1. {t('loans.select_borrower')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {members.map((m) => {
                const isSelected = selectedBorrower?.id === m.id;
                const hasOverdue = hasMemberOverdueLoan(m.id);
                return (
                  <MemberAvatar
                    key={m.id}
                    name={m.name}
                    role={m.role}
                    avatarColor={m.avatarColor}
                    selected={isSelected}
                    status={hasOverdue ? 'overdue' : null}
                    onClick={() => setSelectedBorrower(m)}
                  />
                );
              })}
            </div>
          </div>

          {selectedBorrower && eligibility && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                eligibility.isEligible
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {eligibility.isEligible ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>
                {eligibility.isEligible ? t('loans.eligibility_ok') : t('loans.eligibility_error')} (अधिकतम: ₹{eligibility.maxAmount})
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
              2. {t('loans.purpose')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PURPOSE_OPTIONS.map((opt) => {
                const isSel = selectedPurpose === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedPurpose(opt.id)}
                    className={`min-h-[46px] p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                      isSel ? 'border-[#165A3E] bg-emerald-50 text-[#165A3E] font-bold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold">{t(opt.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                3. {t('loans.tenure_months')}
              </label>
              <select
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 font-bold text-sm bg-white"
              >
                {[3, 4, 5, 6, 12].map(m => (
                  <option key={m} value={m}>{m} महीने ({m} mos)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. {t('loans.loan_amount')} (₹)
              </label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                className="w-full min-h-[46px] px-3 rounded-xl border border-slate-300 font-black text-base bg-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <BigButton
              onClick={handleDisburseLoan}
              disabled={!selectedBorrower || !eligibility?.isEligible}
              icon={HandCoins}
            >
              ऋण स्वीकृत करें (Disburse)
            </BigButton>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {repayModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-base text-slate-800">{repayModal.borrower?.name}</h4>
                <p className="text-xs text-slate-500 font-semibold">सुझाई गई किस्त: ₹{repayModal.emi}</p>
              </div>
              <button
                type="button"
                onClick={() => setRepayModal(null)}
                className="text-xs font-bold text-slate-400 p-2"
              >
                रद्द करें
              </button>
            </div>

            <AmountKeypad
              value={repayAmount}
              onChange={setRepayAmount}
              onConfirm={handleConfirmRepayment}
              confirmLabel="किस्त जमा करें"
            />
          </div>
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
    </div>
  );
}
