/**
 * SakhiNidhi Supabase Cloud Sync Engine (Isolated in one file)
 * Supports full offline capability: if env vars are missing, returns 'unconfigured'.
 * Queues records with synced=false, pushes when online, auto-retries on 'online' event.
 */

import { db } from './db';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function isSyncConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL !== 'YOUR_SUPABASE_URL');
}

let syncStatusListeners = [];
let currentSyncState = {
  isConfigured: isSyncConfigured(),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  status: !isSyncConfigured() ? 'unconfigured' : (typeof navigator !== 'undefined' && navigator.onLine ? 'synced' : 'offline'),
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
 * Pushes unsynced local records to remote cloud endpoint if configured.
 */
export async function syncNow() {
  if (!isSyncConfigured()) {
    currentSyncState = {
      ...currentSyncState,
      isConfigured: false,
      status: 'unconfigured'
    };
    notifySyncState();
    return { success: false, reason: 'Sync not configured' };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    currentSyncState = {
      ...currentSyncState,
      isOnline: false,
      status: 'offline'
    };
    notifySyncState();
    return { success: false, reason: 'Device is offline' };
  }

  try {
    currentSyncState = { ...currentSyncState, status: 'syncing' };
    notifySyncState();

    // Check tables for unsynced items
    const tables = ['groups', 'members', 'meetings', 'savings', 'loans', 'repayments'];
    let syncedTotal = 0;

    for (const table of tables) {
      if (!db[table]) continue;
      const unsynced = await db[table].where('synced').equals(0).or('synced').equals(false).toArray();
      
      if (unsynced.length > 0) {
        // Post in batch to Supabase REST endpoint
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(unsynced)
        });

        if (response.ok) {
          // Mark as synced locally
          for (const item of unsynced) {
            await db[table].update(item.id, { synced: true, syncedAt: new Date().toISOString() });
          }
          syncedTotal += unsynced.length;
        }
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

// Auto-register online / offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    currentSyncState.isOnline = true;
    if (isSyncConfigured()) {
      syncNow();
    } else {
      currentSyncState.status = 'unconfigured';
      notifySyncState();
    }
  });

  window.addEventListener('offline', () => {
    currentSyncState.isOnline = false;
    currentSyncState.status = 'offline';
    notifySyncState();
  });
}

