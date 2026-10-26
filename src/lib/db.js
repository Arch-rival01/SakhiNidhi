import Dexie from 'dexie';

export const db = new Dexie('SakhiNidhiDB');

db.version(1).stores({
  groups: '++id, name, village, pin, synced',
  members: '++id, groupId, name, phone, role, active, synced',
  meetings: '++id, groupId, meetingDate, meetingNumber, locked, synced',
  attendance: '++id, meetingId, memberId, status, synced',
  savings: '++id, meetingId, memberId, date, synced, reversed',
  loans: '++id, groupId, memberId, status, dueDate, synced',
  repayments: '++id, loanId, memberId, meetingId, date, synced, reversed',
  fines: '++id, meetingId, memberId, date, synced',
  audit_log: '++id, groupId, action, entity, timestamp',
  sync_queue: '++id, table, recordId, action, payload, createdAt'
});

/**
 * Log an action to the immutable audit trail
 */
export async function logAudit(groupId, action, entity, entityId, details, actor = 'Treasurer') {
  try {
    return await db.audit_log.add({
      groupId: groupId || 1,
      action,
      entity,
      entityId: entityId || null,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      timestamp: new Date().toISOString(),
      actor
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

/**
 * Reversal entry for correcting mistakes without deletion
 */
export async function reverseSaving(savingId, reason, actor = 'Treasurer') {
  const saving = await db.savings.get(savingId);
  if (!saving || saving.reversed) return false;

  await db.transaction('rw', db.savings, db.audit_log, async () => {
    await db.savings.update(savingId, {
      reversed: true,
      reversalReason: reason,
      reversedAt: new Date().toISOString()
    });

    await logAudit(
      saving.groupId || 1,
      'REVERSE_SAVING',
      'savings',
      savingId,
      { originalAmount: saving.amount, reason },
      actor
    );
  });

  return true;
}

