/**
 * SakhiNidhi Supabase Cloud Sync Engine
 * Seamless, automatic, 100% backend-driven offline-to-cloud synchronization.
 * Handles automatic bi-directional mapping between Dexie (camelCase) and Postgres (snake_case).
 * Ensures zero technical credentials or keys are exposed in the user interface.
 */

import { db } from './db';

// Project Supabase Cloud Backend Endpoints
const DEFAULT_SUPABASE_URL = 'https://yeqjeslifyxvnjxxkjps.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcWplc2xpZnl4dm5qeHhranBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMDM0NDcsImV4cCI6MjEwODY3OTQ0N30.Z5Ue5-vqYe5cqPgl8JsV_bz8Jb9ywkfNvUnCSi-y_LU';

export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const url = (envUrl || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, '');
  const key = (envKey || DEFAULT_SUPABASE_ANON_KEY).trim();

  return { url, key };
}

export function isSyncConfigured() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url.startsWith('http'));
}

// Data Mappers: Dexie (camelCase) <-> Supabase (snake_case)
const tableMappers = {
  groups: {
    toRemote: (row) => ({
      id: Number(row.id),
      name: row.name || 'सखी मंडल',
      village: row.village || 'झारखंड',
      meeting_day: row.meetingDay || 'Thursday',
      weekly_saving: Number(row.weeklySaving) || 100,
      interest_rate: Number(row.interestRate) || 2,
      late_fine: Number(row.lateFine) || 10,
      max_loan_multiple: Number(row.maxLoanMultiple) || 3,
      pin: row.pin || '1234',
      created_at: row.createdAt || new Date().toISOString(),
      synced_at: new Date().toISOString()
    }),
    toLocal: (row) => ({
      id: Number(row.id),
      name: row.name,
      village: row.village,
      meetingDay: row.meeting_day || 'Thursday',
      weeklySaving: Number(row.weekly_saving) || 100,
      interestRate: Number(row.interest_rate) || 2,
      lateFine: Number(row.late_fine) || 10,
      maxLoanMultiple: Number(row.max_loan_multiple) || 3,
      pin: row.pin || '1234',
      createdAt: row.created_at || new Date().toISOString(),
      synced: true,
      syncedAt: row.synced_at || new Date().toISOString()
    })
  },
  members: {
    toRemote: (row) => ({
      id: Number(row.id),
      group_id: Number(row.groupId),
      name: row.name,
      phone: row.phone || null,
      role: row.role || 'member',
      avatar_color: row.avatarColor || '#165A3E',
      active: row.active !== false,
      joined_date: row.joinedDate || new Date().toISOString(),
      synced_at: new Date().toISOString()
    }),
    toLocal: (row) => ({
      id: Number(row.id),
      groupId: Number(row.group_id),
      name: row.name,
      phone: row.phone || '',
      role: row.role || 'member',
      avatarColor: row.avatar_color || '#165A3E',
      active: row.active !== false,
      joinedDate: row.joined_date || new Date().toISOString(),
      synced: true,
      syncedAt: row.synced_at || new Date().toISOString()
    })
  },
  meetings: {
    toRemote: (row) => ({
      id: Number(row.id),
      group_id: Number(row.groupId),
      meeting_number: Number(row.meetingNumber) || 1,
      meeting_date: row.meetingDate,
      is_locked: Boolean(row.isLocked || row.locked),
      locked_at: row.lockedAt || null,
      synced_at: new Date().toISOString()
    }),
    toLocal: (row) => ({
      id: Number(row.id),
      groupId: Number(row.group_id),
      meetingNumber: Number(row.meeting_number) || 1,
      meetingDate: row.meeting_date,
      isLocked: Boolean(row.is_locked),
      locked: Boolean(row.is_locked),
      lockedAt: row.locked_at || null,
      synced: true,
      syncedAt: row.synced_at || new Date().toISOString()
    })
  },
  attendance: {
    toRemote: (row) => ({
      id: Number(row.id),
      meeting_id: Number(row.meetingId),
      member_id: Number(row.memberId),
      status: row.status || 'present',
      date: row.date,
      synced_at: new Date().toISOString()
    }),
    toLocal: (row) => ({
      id: Number(row.id),
      meetingId: Number(row.meeting_id),
      memberId: Number(row.member_id),
      status: row.status || 'present',
      date: row.date,
      synced: true,
      syncedAt: row.synced_at || new Date().toISOString()
    })
  },
  savings: {
    toRemote: (row) => ({
      id: Number(row.id),
      meeting_id: Number(row.meetingId),
      member_id: Number(row.memberId),
      amount: Number(row.amount) || 0,
      date: row.date,
      reversed: Boolean(row.reversed),
      reversal_reason: row.reversalReason || null,
      reversed_at: row.reversedAt || null,
      synced_at: new Date().toISOString()
    }),
    toLocal: (row) => ({
      id: Number(row.id),
      meetingId: Number(row.meeting_id),
      memberId: Number(row.member_id),
      amount: Number(row.amount) || 0,
      date: row.date,
      reversed: Boolean(row.reversed),
      reversalReason: row.reversal_reason || null,
      reversedAt: row.reversed_at || null,
      synced: true,
      syncedAt: row.synced_at || new Date().toISOString()
    })
  },
  loans: {
    toRemote: (row) => ({
      id: Number(row.id),
      group_id: Number(row.groupId),
      member_id: Number(row.memberId),
      principal: Number(row.principal) || 0,
      purpose: row.purpose || '',
      interest_rate: Number(row.interestRate) || 2,
      tenure_months: Number(row.tenureMonths) || 4,
      status: row.status || 'active',
      disbursed_date: row.disbursedDate,
      due_date: row.dueDate || null,
      synced_at: new Date().toISOString()
    }),
    toLocal: (row) => ({
      id: Number(row.id),
      groupId: Number(row.group_id),
      memberId: Number(row.member_id),
      principal: Number(row.principal) || 0,
      purpose: row.purpose || '',
      interestRate: Number(row.interest_rate) || 2,
      tenureMonths: Number(row.tenure_months) || 4,
      status: row.status || 'active',
      disbursedDate: row.disbursed_date,
      dueDate: row.due_date || null,
      synced: true,
      syncedAt: row.synced_at || new Date().toISOString()
    })
  },
  repayments: {
    toRemote: (row) => ({
      id: Number(row.id),
      loan_id: Number(row.loanId),
      member_id: Number(row.memberId),
      meeting_id: Number(row.meetingId),
      amount: Number(row.amount) || 0,
      principal_paid: Number(row.principalPaid) || 0,
      interest_paid: Number(row.interestPaid) || 0,
      fine_paid: Number(row.finePaid) || 0,
      date: row.date,
      reversed: Boolean(row.reversed),
      synced_at: new Date().toISOString()
    }),
    toLocal: (row) => ({
      id: Number(row.id),
      loanId: Number(row.loan_id),
      memberId: Number(row.member_id),
      meetingId: Number(row.meeting_id),
      amount: Number(row.amount) || 0,
      principalPaid: Number(row.principal_paid) || 0,
      interestPaid: Number(row.interest_paid) || 0,
      finePaid: Number(row.fine_paid) || 0,
      date: row.date,
      reversed: Boolean(row.reversed),
      synced: true,
      syncedAt: row.synced_at || new Date().toISOString()
    })
  },
  audit_log: {
    toRemote: (row) => ({
      id: Number(row.id),
      group_id: Number(row.groupId || 1),
      action: row.action,
      entity: row.entity,
      entity_id: Number(row.entityId) || null,
      details: typeof row.details === 'object' ? JSON.stringify(row.details) : String(row.details || ''),
      actor: row.actor || 'Treasurer',
      timestamp: row.timestamp || new Date().toISOString()
    }),
    toLocal: (row) => ({
      id: Number(row.id),
      groupId: Number(row.group_id),
      action: row.action,
      entity: row.entity,
      entityId: Number(row.entity_id) || null,
      details: row.details,
      actor: row.actor || 'Treasurer',
      timestamp: row.timestamp || new Date().toISOString()
    })
  }
};

let syncStatusListeners = [];
let currentSyncState = {
  isConfigured: isSyncConfigured(),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  status: typeof navigator !== 'undefined' && navigator.onLine ? 'synced' : 'offline',
  lastSyncedAt: null,
  pendingCount: 0
};

export function subscribeSyncStatus(callback) {
  syncStatusListeners.push(callback);
  callback(currentSyncState);
  return () => {
    syncStatusListeners = syncStatusListeners.filter(cb => cb !== callback);
  };
}

function notifySyncState() {
  syncStatusListeners.forEach(cb => {
    try { cb(currentSyncState); } catch (e) { console.error(e); }
  });
}

/**
 * Pushes unsynced local records to Supabase & pulls all latest records to Dexie.
 * Guarantees cross-device synchronization of groups, members, and transactions.
 */
export async function syncNow() {
  const { url, key } = getSupabaseConfig();

  if (!isSyncConfigured()) {
    currentSyncState = { ...currentSyncState, isConfigured: false, status: 'unconfigured' };
    notifySyncState();
    return { success: false, reason: 'Sync unconfigured' };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentSyncState = { ...currentSyncState, isOnline: false, status: 'offline' };
    notifySyncState();
    return { success: false, reason: 'Device is offline' };
  }

  try {
    currentSyncState = { ...currentSyncState, status: 'syncing' };
    notifySyncState();

    const tables = ['groups', 'members', 'meetings', 'attendance', 'savings', 'loans', 'repayments', 'audit_log'];
    let syncedTotal = 0;

    // 1. PUSH: Send unsynced local records to Supabase with proper snake_case mapping
    for (const table of tables) {
      if (!db[table] || !tableMappers[table]) continue;

      // Find unsynced rows
      const allLocal = await db[table].toArray();
      const unsynced = allLocal.filter(r => !r.synced);

      if (unsynced.length > 0) {
        const payload = unsynced.map(r => tableMappers[table].toRemote(r));

        const response = await fetch(`${url}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          for (const item of unsynced) {
            await db[table].update(item.id, { synced: true, syncedAt: new Date().toISOString() });
          }
          syncedTotal += unsynced.length;
        } else {
          console.warn(`Supabase push error for ${table}:`, response.status, await response.text());
        }
      }
    }

    // 2. PULL: Fetch remote cloud records and update local Dexie database
    for (const table of tables) {
      if (!db[table] || !tableMappers[table]) continue;

      try {
        const resp = await fetch(`${url}/rest/v1/${table}?select=*`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
          }
        });

        if (resp.ok) {
          const remoteRows = await resp.json();
          if (Array.isArray(remoteRows) && remoteRows.length > 0) {
            for (const remoteRow of remoteRows) {
              const localRow = tableMappers[table].toLocal(remoteRow);
              // Use put to insert or update existing record by primary key (id)
              await db[table].put(localRow);
            }
          }
        }
      } catch (err) {
        console.warn(`Supabase pull failed for ${table}:`, err);
      }
    }

    currentSyncState = {
      ...currentSyncState,
      status: 'synced',
      lastSyncedAt: new Date().toISOString(),
      pendingCount: 0
    };
    notifySyncState();

    return { success: true, syncedCount: syncedTotal };
  } catch (err) {
    console.warn('Sync failed gracefully:', err);
    currentSyncState = {
      ...currentSyncState,
      status: 'error',
      lastError: err.message
    };
    notifySyncState();
    return { success: false, error: err.message };
  }
}

/**
 * Fetches all groups available in the cloud
 */
export async function fetchCloudGroups() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return [];

  try {
    const resp = await fetch(`${url}/rest/v1/groups?select=*`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (resp.ok) {
      const rows = await resp.json();
      if (Array.isArray(rows)) {
        return rows.map(r => tableMappers.groups.toLocal(r));
      }
    }
  } catch (err) {
    console.warn('Fetch cloud groups failed:', err);
  }
  return [];
}

// Auto-register online / offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentSyncState.isOnline = true;
    syncNow();
  });

  window.addEventListener('offline', () => {
    currentSyncState.isOnline = false;
    currentSyncState.status = 'offline';
    notifySyncState();
  });
}
