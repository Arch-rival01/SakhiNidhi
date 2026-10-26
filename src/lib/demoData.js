/**
 * SakhiNidhi Demo Data Generator
 * Seeds realistic tribal SHG data from Jharkhand:
 * 1 SHG ("Sakhi Mandal, Jamshedpur block"), 10 members (Santhali/Ho/Mundari),
 * 3 months (12 weeks) of meetings, savings, attendance, and 4 loans (1 overdue).
 */

import { db, logAudit } from './db';

export const DEMO_MEMBERS = [
  { name: 'Sita Hansda', role: 'leader', phone: '+919835123401', avatarColor: '#1B6B4A' },
  { name: 'Parvati Murmu', role: 'treasurer', phone: '+919835123402', avatarColor: '#E8892B' },
  { name: 'Malati Soren', role: 'member', phone: '+919835123403', avatarColor: '#2563EB' },
  { name: 'Sumitra Tudu', role: 'member', phone: '+919835123404', avatarColor: '#7C3AED' },
  { name: 'Birbaha Hembram', role: 'member', phone: '+919835123405', avatarColor: '#DB2777' },
  { name: 'Jasmani Mundu', role: 'member', phone: '+919835123406', avatarColor: '#059669' },
  { name: 'Sukurmani Purty', role: 'member', phone: '+919835123407', avatarColor: '#D97706' },
  { name: 'Salomi Soy', role: 'member', phone: '+919835123408', avatarColor: '#475569' },
  { name: 'Champa Samad', role: 'member', phone: '+919835123409', avatarColor: '#0284C7' },
  { name: 'Mani Gagrai', role: 'member', phone: '+919835123410', avatarColor: '#9333EA' },
];

export async function loadDemoData() {
  await db.transaction('rw', [
    db.groups,
    db.members,
    db.meetings,
    db.attendance,
    db.savings,
    db.loans,
    db.repayments,
    db.fines,
    db.audit_log
  ], async () => {
    // Clear existing
    await db.groups.clear();
    await db.members.clear();
    await db.meetings.clear();
    await db.attendance.clear();
    await db.savings.clear();
    await db.loans.clear();
    await db.repayments.clear();
    await db.fines.clear();
    await db.audit_log.clear();

    // 1. Create SHG
    const groupId = await db.groups.add({
      name: 'Sakhi Mandal, Jamshedpur block',
      village: 'Sundarnagar, East Singhbhum',
      meetingDay: 'Thursday',
      weeklySaving: 100,
      interestRate: 2, // 2% per month
      lateFine: 10,
      maxLoanMultiple: 3,
      pin: '1234',
      createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
      synced: false
    });

    // 2. Add 10 tribal members
    const memberIdMap = [];
    for (const m of DEMO_MEMBERS) {
      const id = await db.members.add({
        groupId,
        name: m.name,
        role: m.role,
        phone: m.phone,
        avatarColor: m.avatarColor,
        active: true,
        joinedDate: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
        synced: false
      });
      memberIdMap.push({ id, ...m });
    }

    // 3. Generate 12 weekly meetings (3 months)
    const now = new Date();
    for (let w = 12; w >= 1; w--) {
      const meetDate = new Date(now.getTime() - w * 7 * 24 * 3600 * 1000);
      const dateStr = meetDate.toISOString().split('T')[0];

      const meetingId = await db.meetings.add({
        groupId,
        meetingNumber: 13 - w,
        meetingDate: dateStr,
        notes: `साप्ताहिक बैठक संख्या ${13 - w}`,
        locked: true,
        createdAt: meetDate.toISOString(),
        synced: false
      });

      // Attendance and Savings for each member
      for (const m of memberIdMap) {
        // 90% attendance probability
        const isPresent = Math.random() > 0.1 || (w === 1);
        await db.attendance.add({
          meetingId,
          memberId: m.id,
          status: isPresent ? 'present' : 'absent',
          synced: false
        });

        // Weekly saving of ₹100
        if (isPresent) {
          await db.savings.add({
            groupId,
            meetingId,
            memberId: m.id,
            amount: 100,
            date: dateStr,
            reversed: false,
            synced: false
          });
        }
      }
    }

    // 4. Create 4 specific loans
    // Loan 1: Sita Hansda - Livestock (Dairy) ₹4,000, 5 months, 3 repayments made
    const loan1Date = new Date(now.getTime() - 60 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const loan1Due = new Date(now.getTime() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const loan1Id = await db.loans.add({
      groupId,
      memberId: memberIdMap[0].id,
      principal: 4000,
      interestRate: 2,
      tenureMonths: 5,
      purpose: 'livestock',
      status: 'active',
      issuedDate: loan1Date,
      dueDate: loan1Due,
      synced: false
    });
    // 3 Repayments for Loan 1
    for (let i = 1; i <= 3; i++) {
      await db.repayments.add({
        loanId: loan1Id,
        memberId: memberIdMap[0].id,
        amount: 880,
        principalPaid: 800,
        interestPaid: 80,
        finePaid: 0,
        date: new Date(now.getTime() - (60 - i * 20) * 24 * 3600 * 1000).toISOString().split('T')[0],
        reversed: false,
        synced: false
      });
    }

    // Loan 2: Malati Soren - Farming (Seeds/Fertilizer) ₹2,500, 4 months, 2 repayments
    const loan2Date = new Date(now.getTime() - 45 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const loan2Due = new Date(now.getTime() + 75 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const loan2Id = await db.loans.add({
      groupId,
      memberId: memberIdMap[2].id,
      principal: 2500,
      interestRate: 2,
      tenureMonths: 4,
      purpose: 'farming',
      status: 'active',
      issuedDate: loan2Date,
      dueDate: loan2Due,
      synced: false
    });
    for (let i = 1; i <= 2; i++) {
      await db.repayments.add({
        loanId: loan2Id,
        memberId: memberIdMap[2].id,
        amount: 675,
        principalPaid: 625,
        interestPaid: 50,
        finePaid: 0,
        date: new Date(now.getTime() - (45 - i * 18) * 24 * 3600 * 1000).toISOString().split('T')[0],
        reversed: false,
        synced: false
      });
    }

    // Loan 3: Jasmani Mundu - Small Shop (किराना दुकान) ₹2,000, 3 months, FULLY PAID
    const loan3Date = new Date(now.getTime() - 75 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const loan3Due = new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const loan3Id = await db.loans.add({
      groupId,
      memberId: memberIdMap[5].id,
      principal: 2000,
      interestRate: 2,
      tenureMonths: 3,
      purpose: 'shop',
      status: 'paid',
      issuedDate: loan3Date,
      dueDate: loan3Due,
      synced: false
    });
    // Paid in full
    await db.repayments.add({
      loanId: loan3Id,
      memberId: memberIdMap[5].id,
      amount: 2120,
      principalPaid: 2000,
      interestPaid: 120,
      finePaid: 0,
      date: loan3Due,
      reversed: false,
      synced: false
    });

    // Loan 4: Sukurmani Purty - Sewing Machine (सिलाई मशीन) ₹3,000, 4 months, OVERDUE!
    const loan4Date = new Date(now.getTime() - 60 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const loan4Due = new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0]; // Overdue by 14 days
    const loan4Id = await db.loans.add({
      groupId,
      memberId: memberIdMap[6].id,
      principal: 3000,
      interestRate: 2,
      tenureMonths: 4,
      purpose: 'tools',
      status: 'overdue',
      issuedDate: loan4Date,
      dueDate: loan4Due,
      synced: false
    });
    // Only 1 repayment made, rest overdue
    await db.repayments.add({
      loanId: loan4Id,
      memberId: memberIdMap[6].id,
      amount: 810,
      principalPaid: 750,
      interestPaid: 60,
      finePaid: 0,
      date: new Date(now.getTime() - 35 * 24 * 3600 * 1000).toISOString().split('T')[0],
      reversed: false,
      synced: false
    });
    // Add late fine for Loan 4
    await db.fines.add({
      groupId,
      meetingId: 12,
      memberId: memberIdMap[6].id,
      amount: 20,
      reason: 'Late loan repayment fine (2 weeks)',
      date: new Date().toISOString().split('T')[0],
      synced: false
    });

    // Log initial audit
    await logAudit(groupId, 'SEED_DEMO_DATA', 'groups', groupId, {
      membersCount: 10,
      meetingsCount: 12,
      loansCount: 4
    }, 'System Seeder');
  });

  return true;
}

