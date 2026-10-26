/**
 * SakhiNidhi Pure Financial Engine
 * Zero side-effects, unit-tested core calculations for SHG micro-accounting.
 */

/**
 * Calculates current cash-in-box (fund balance)
 * Rule: fund balance = total savings + interest collected + fines - loans outstanding - expenses
 * 
 * @param {Object} params
 * @param {Array} params.savings - Array of { amount, reversed }
 * @param {Array} params.repayments - Array of { principalPaid, interestPaid, finePaid, reversed }
 * @param {Array} params.loans - Array of { principal, status }
 * @param {Array} params.fines - Array of { amount }
 * @param {number} [params.expenses=0] - Operational expenses (tea, registers, stamps)
 * @returns {Object} { fundBalance, totalSavings, totalInterest, totalFines, loansOutstanding, totalDisbursed }
 */
export function calculateFundBalance({
  savings = [],
  repayments = [],
  loans = [],
  fines = [],
  expenses = 0
} = {}) {
  // 1. Total valid savings
  const totalSavings = savings
    .filter(s => !s.reversed)
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  // 2. Total interest & fines collected from repayments
  const validRepayments = repayments.filter(r => !r.reversed);
  
  const totalInterest = validRepayments
    .reduce((sum, r) => sum + (Number(r.interestPaid) || 0), 0);

  const finesFromRepayments = validRepayments
    .reduce((sum, r) => sum + (Number(r.finePaid) || 0), 0);

  const directFines = fines
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const totalFines = finesFromRepayments + directFines;

  // 3. Principal disbursed and repaid
  const totalDisbursed = loans
    .filter(l => l.status !== 'cancelled')
    .reduce((sum, l) => sum + (Number(l.principal) || 0), 0);

  const totalPrincipalRepaid = validRepayments
    .reduce((sum, r) => sum + (Number(r.principalPaid) || 0), 0);

  const loansOutstanding = Math.max(0, totalDisbursed - totalPrincipalRepaid);

  // Fund balance in cash box
  const fundBalance = Math.max(0, totalSavings + totalInterest + totalFines - loansOutstanding - (Number(expenses) || 0));

  return {
    fundBalance: Math.round(fundBalance),
    totalSavings: Math.round(totalSavings),
    totalInterest: Math.round(totalInterest),
    totalFines: Math.round(totalFines),
    loansOutstanding: Math.round(loansOutstanding),
    totalDisbursed: Math.round(totalDisbursed),
    totalPrincipalRepaid: Math.round(totalPrincipalRepaid)
  };
}

/**
 * Calculates monthly simple interest on outstanding principal
 * Monthly interest = outstanding principal x (monthlyRatePercent / 100)
 */
export function calculateMonthlyInterest(outstandingPrincipal, monthlyRatePercent = 2) {
  const principal = Math.max(0, Number(outstandingPrincipal) || 0);
  const rate = Math.max(0, Number(monthlyRatePercent) || 0);
  return Math.round(principal * (rate / 100));
}

/**
 * Splits a repayment amount: fines first, interest next, then principal.
 * 
 * @param {number} repaymentAmount - Total cash handed over
 * @param {number} outstandingPrincipal - Remaining loan principal
 * @param {number} monthlyInterestDue - Accrued interest
 * @param {number} [lateFineDue=0] - Any accumulated late fine
 * @returns {Object} { finePaid, interestPaid, principalPaid, remainingPrincipal, excess }
 */
export function splitRepayment(repaymentAmount, outstandingPrincipal, monthlyInterestDue, lateFineDue = 0) {
  let rem = Math.max(0, Number(repaymentAmount) || 0);
  const fineDue = Math.max(0, Number(lateFineDue) || 0);
  const interestDue = Math.max(0, Number(monthlyInterestDue) || 0);
  const principalDue = Math.max(0, Number(outstandingPrincipal) || 0);

  // 1. Pay late fine
  const finePaid = Math.min(rem, fineDue);
  rem -= finePaid;

  // 2. Pay monthly interest
  const interestPaid = Math.min(rem, interestDue);
  rem -= interestPaid;

  // 3. Pay principal
  const principalPaid = Math.min(rem, principalDue);
  rem -= principalPaid;

  // 4. Any excess amount
  const excess = rem;
  const remainingPrincipal = Math.max(0, principalDue - principalPaid);

  return {
    finePaid: Math.round(finePaid),
    interestPaid: Math.round(interestPaid),
    principalPaid: Math.round(principalPaid),
    remainingPrincipal: Math.round(remainingPrincipal),
    excess: Math.round(excess)
  };
}

/**
 * Evaluates whether a member can take a new loan and max amount
 * Rules:
 * - Amount <= member's total savings x maxMultiple (e.g. 3x)
 * - Cannot take loan if member has an overdue loan
 */
export function calculateLoanEligibility(memberSavings, maxMultiple = 3, hasActiveOverdueLoan = false) {
  const savings = Math.max(0, Number(memberSavings) || 0);
  const maxMultipleSafe = Math.max(1, Number(maxMultiple) || 3);

  if (hasActiveOverdueLoan) {
    return {
      isEligible: false,
      maxAmount: 0,
      reason: 'overdue_loan_exists'
    };
  }

  if (savings <= 0) {
    return {
      isEligible: false,
      maxAmount: 0,
      reason: 'zero_savings'
    };
  }

  const maxAmount = Math.floor(savings * maxMultipleSafe);

  return {
    isEligible: true,
    maxAmount,
    reason: 'eligible'
  };
}

/**
 * Calculates late fines based on overdue weeks
 */
export function calculateLateFine(dueDate, currentDate = new Date(), fineAmountPerWeek = 10) {
  const due = new Date(dueDate);
  const now = new Date(currentDate);

  if (now <= due) {
    return { isOverdue: false, overdueWeeks: 0, fineAmount: 0 };
  }

  const diffMs = now.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const overdueWeeks = Math.max(1, Math.ceil(diffDays / 7));
  const fineAmount = overdueWeeks * (Number(fineAmountPerWeek) || 10);

  return {
    isOverdue: true,
    overdueDays: diffDays,
    overdueWeeks,
    fineAmount
  };
}

/**
 * Generates an amortized equal principal repayment schedule
 */
export function generateRepaymentSchedule(principal, monthlyRatePercent = 2, tenureMonths = 5, startDate = new Date()) {
  const p = Number(principal) || 0;
  const rate = Number(monthlyRatePercent) || 2;
  const months = Math.max(1, Number(tenureMonths) || 1);

  const monthlyPrincipal = Math.round(p / months);
  const schedule = [];
  let remaining = p;

  const start = new Date(startDate);

  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(dueDate.getMonth() + i);

    const interest = Math.round(remaining * (rate / 100));
    // For last month adjust rounding
    const principalComp = (i === months) ? remaining : monthlyPrincipal;
    const totalEmi = principalComp + interest;
    remaining = Math.max(0, remaining - principalComp);

    schedule.push({
      monthNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      principalDue: principalComp,
      interestDue: interest,
      totalDue: totalEmi,
      balanceAfter: remaining
    });
  }

  return schedule;
}

