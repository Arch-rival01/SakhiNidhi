/**
 * SakhiNidhi Group Credit Score Engine (0 - 100)
 * Transparent, rule-based scoring for rural tribal SHGs.
 * 
 * Weights:
 * - Savings Regularity: 25 pts
 * - Repayment Discipline: 30 pts
 * - Meeting Attendance: 15 pts
 * - Record Consistency: 10 pts
 * - Fund Growth: 10 pts
 * - Loan Utilisation / No Default: 10 pts
 */

export function calculateGroupCreditScore({
  members = [],
  meetings = [],
  attendance = [],
  savings = [],
  loans = [],
  repayments = []
} = {}) {
  const totalMembers = Math.max(1, members.length);
  const totalMeetings = meetings.length;

  // 1. Savings Regularity (Max 25)
  // Expected savings entries = totalMeetings * totalMembers
  let savingsRegularityScore = 20; // fallback if no meetings yet
  if (totalMeetings > 0) {
    const validSavings = savings.filter(s => !s.reversed);
    const expectedSavingsCount = totalMeetings * totalMembers;
    const actualRatio = Math.min(1, validSavings.length / expectedSavingsCount);
    savingsRegularityScore = Math.round(actualRatio * 25);
  }

  // 2. Repayment Discipline (Max 30)
  let repaymentScore = 25;
  const activeOrPaidLoans = loans.filter(l => l.status !== 'cancelled');
  if (activeOrPaidLoans.length > 0) {
    const overdueLoans = loans.filter(l => l.status === 'overdue');
    const overdueRatio = overdueLoans.length / activeOrPaidLoans.length;
    // Base 30, deducted by overdue percentage
    repaymentScore = Math.max(5, Math.round(30 * (1 - (overdueRatio * 1.5))));
  }

  // 3. Meeting Attendance (Max 15)
  let attendanceScore = 12;
  if (totalMeetings > 0 && attendance.length > 0) {
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const totalExpected = attendance.length;
    const ratio = totalExpected > 0 ? presentCount / totalExpected : 0.8;
    attendanceScore = Math.round(ratio * 15);
  }

  // 4. Record Consistency (Max 10)
  // Locked meetings and low reversals indicate disciplined bookkeeping
  const lockedMeetings = meetings.filter(m => m.locked).length;
  const reversedSavings = savings.filter(s => s.reversed).length;
  let recordConsistency = 10;
  if (totalMeetings > 0) {
    if (lockedMeetings < totalMeetings * 0.7) recordConsistency -= 3;
    if (reversedSavings > 5) recordConsistency -= 2;
  }
  recordConsistency = Math.max(2, recordConsistency);

  // 5. Fund Growth (Max 10)
  // Checks if total fund is actively expanding through consistent weekly contributions
  const totalSavingsAmount = savings.filter(s => !s.reversed).reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
  let fundGrowthScore = 8;
  if (totalSavingsAmount > 15000) fundGrowthScore = 10;
  else if (totalSavingsAmount > 8000) fundGrowthScore = 9;
  else if (totalSavingsAmount > 3000) fundGrowthScore = 7;
  else fundGrowthScore = 6;

  // 6. Loan Utilisation & Zero Chronic Default (Max 10)
  let utilisationScore = 8;
  const overdueCount = loans.filter(l => l.status === 'overdue').length;
  if (overdueCount === 0 && activeOrPaidLoans.length >= 2) {
    utilisationScore = 10;
  } else if (overdueCount === 1) {
    utilisationScore = 6;
  } else if (overdueCount > 1) {
    utilisationScore = 4;
  }

  const totalScore = Math.min(100, Math.max(0, 
    savingsRegularityScore +
    repaymentScore +
    attendanceScore +
    recordConsistency +
    fundGrowthScore +
    utilisationScore
  ));

  let band = 'Fair';
  let bandColor = '#F59E0B'; // Orange
  if (totalScore >= 80) {
    band = 'Excellent';
    bandColor = '#1B6B4A'; // Forest Green
  } else if (totalScore >= 60) {
    band = 'Good';
    bandColor = '#10B981'; // Green
  } else if (totalScore < 40) {
    band = 'Weak';
    bandColor = '#EF4444'; // Red
  }

  return {
    totalScore,
    band,
    bandColor,
    breakdown: {
      savingsRegularity: { score: savingsRegularityScore, max: 25, labelKey: 'score.savings_regularity' },
      repaymentDiscipline: { score: repaymentScore, max: 30, labelKey: 'score.repayment_discipline' },
      attendance: { score: attendanceScore, max: 15, labelKey: 'score.attendance' },
      recordConsistency: { score: recordConsistency, max: 10, labelKey: 'score.record_consistency' },
      fundGrowth: { score: fundGrowthScore, max: 10, labelKey: 'score.fund_growth' },
      loanUtilisation: { score: utilisationScore, max: 10, labelKey: 'score.loan_utilisation' }
    }
  };
}

