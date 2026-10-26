import { describe, it, expect } from 'vitest';
import {
  calculateFundBalance,
  calculateMonthlyInterest,
  splitRepayment,
  calculateLoanEligibility,
  calculateLateFine,
  generateRepaymentSchedule
} from './finance';

describe('SakhiNidhi Pure Financial Engine', () => {
  it('calculates fund balance correctly with savings, interest, fines and outstanding loans', () => {
    const savings = [
      { amount: 500, reversed: false },
      { amount: 1000, reversed: false },
      { amount: 200, reversed: true } // reversed saving ignored
    ];
    const repayments = [
      { principalPaid: 1000, interestPaid: 100, finePaid: 20, reversed: false },
      { principalPaid: 500, interestPaid: 50, finePaid: 0, reversed: false }
    ];
    const loans = [
      { principal: 3000, status: 'active' }
    ];
    const fines = [
      { amount: 30 }
    ];

    // Total savings = 1500
    // Total interest = 150
    // Total fines = 20 + 30 = 50
    // Total loans disbursed = 3000, principal repaid = 1500 => outstanding = 1500
    // Expenses = 50
    // Fund balance = 1500 + 150 + 50 - 1500 - 50 = 150
    const result = calculateFundBalance({
      savings,
      repayments,
      loans,
      fines,
      expenses: 50
    });

    expect(result.totalSavings).toBe(1500);
    expect(result.totalInterest).toBe(150);
    expect(result.totalFines).toBe(50);
    expect(result.loansOutstanding).toBe(1500);
    expect(result.fundBalance).toBe(150);
  });

  it('calculates monthly interest accurately at given rate', () => {
    // 5000 principal at 2% monthly interest = 100
    expect(calculateMonthlyInterest(5000, 2)).toBe(100);
    // 3500 principal at 1.5% monthly interest = 53 (rounded)
    expect(calculateMonthlyInterest(3500, 1.5)).toBe(53);
    // 0 principal = 0
    expect(calculateMonthlyInterest(0, 2)).toBe(0);
  });

  it('splits repayment: fine first, then interest, then principal', () => {
    // Repayment: 600, Principal due: 2000, Interest due: 80, Fine due: 20
    // Step 1: Fine 20 -> 580 left
    // Step 2: Interest 80 -> 500 left
    // Step 3: Principal 500 -> remaining principal = 1500, excess = 0
    const split = splitRepayment(600, 2000, 80, 20);
    expect(split.finePaid).toBe(20);
    expect(split.interestPaid).toBe(80);
    expect(split.principalPaid).toBe(500);
    expect(split.remainingPrincipal).toBe(1500);
    expect(split.excess).toBe(0);

    // Partial payment covering only interest
    const partial = splitRepayment(50, 1000, 100, 0);
    expect(partial.interestPaid).toBe(50);
    expect(partial.principalPaid).toBe(0);
    expect(partial.remainingPrincipal).toBe(1000);
  });

  it('validates loan eligibility against member savings and overdue status', () => {
    // 1000 savings with 3x multiple -> max 3000
    const res1 = calculateLoanEligibility(1000, 3, false);
    expect(res1.isEligible).toBe(true);
    expect(res1.maxAmount).toBe(3000);

    // Overdue loan disqualifies immediately
    const res2 = calculateLoanEligibility(2000, 3, true);
    expect(res2.isEligible).toBe(false);
    expect(res2.maxAmount).toBe(0);
    expect(res2.reason).toBe('overdue_loan_exists');

    // 0 savings disqualifies
    const res3 = calculateLoanEligibility(0, 3, false);
    expect(res3.isEligible).toBe(false);
    expect(res3.reason).toBe('zero_savings');
  });

  it('calculates late fine on overdue dates', () => {
    const due = '2026-03-01';
    const now = '2026-03-16'; // 15 days overdue -> 3 weeks
    const fineResult = calculateLateFine(due, now, 10);
    expect(fineResult.isOverdue).toBe(true);
    expect(fineResult.overdueWeeks).toBe(3);
    expect(fineResult.fineAmount).toBe(30);

    // Not overdue
    const notDue = calculateLateFine('2026-04-01', '2026-03-16', 10);
    expect(notDue.isOverdue).toBe(false);
    expect(fineResult.fineAmount).toBeGreaterThan(0);
  });

  it('generates an amortized repayment schedule', () => {
    const schedule = generateRepaymentSchedule(5000, 2, 5, '2026-01-01');
    expect(schedule.length).toBe(5);
    expect(schedule[0].principalDue).toBe(1000);
    expect(schedule[0].interestDue).toBe(100);
    expect(schedule[schedule.length - 1].balanceAfter).toBe(0);
  });
});

