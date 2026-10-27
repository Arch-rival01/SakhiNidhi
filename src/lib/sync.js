/**
 * SakhiNidhi Supabase Cloud Sync Engine (Isolated in one file)
 * Supports full offline capability: if env/storage vars are missing, returns 'unconfigured'.
 * Queues records with synced=false, pushes when online, auto-retries on 'online' event.
 * Supports credentials from .env and in-app localStorage configuration.
 */

import { db } from './db';

export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = typeof localStorage !== 'undefined' ? (localStorage.getItem('sakhinidhi_supabase_url') || '') : '';
  const localKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('sakhinidhi_supabase_key') || '') : '';

  const url = (localUrl || envUrl).trim().replace(/\/+$/, '');
  const key = (localKey || envKey).trim();

  return { url, key };
}

export function saveSupabaseConfig(url, key) {
  if (typeof localStorage !== 'undefined') {
    if (url) localStorage.setItem('sakhinidhi_supabase_url', url.trim());
    else localStorage.removeItem('sakhinidhi_supabase_url');

    if (key) localStorage.setItem('sakhinidhi_supabase_key', key.trim());
    else localStorage.removeItem('sakhinidhi_supabase_key');
  }
  currentSyncState.isConfigured = isSyncConfigured();
  currentSyncState.status = isSyncConfigured() ? 'synced' : 'unconfigured';
  notifySyncState();
}

export function isSyncConfigured() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key && url !== 'YOUR_SUPABASE_URL' && url.startsWith('http'));
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
 * Pushes unsynced local records to remote cloud endpoint & pulls remote updates
 */
export async function syncNow() {
  const { url, key } = getSupabaseConfig();

  if (!isSyncConfigured()) {
    currentSyncState = {
      ...currentSyncState,
      isConfigured: false,
      status: 'unconfigured'
    };
    notifySyncState();
    return { success: false, reason: 'Sync not configured. Please add Supabase URL & Key.' };
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

    const tables = ['groups', 'members', 'meetings', 'attendance', 'savings', 'loans', 'repayments'];
    let syncedTotal = 0;

    // 1. PUSH local unsynced records to Supabase
    for (const table of tables) {
      if (!db[table]) continue;
      const unsynced = await db[table].where('synced').equals(0).or('synced').equals(false).toArray();

      if (unsynced.length > 0) {
        // Strip out local Dexie-only transient fields if any
        const payload = unsynced.map(row => {
          const copy = { ...row };
          delete copy.synced;
          return copy;
        });

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
          console.warn(`Supabase push for ${table} responded with:`, response.status);
        }
      }
    }

    // 2. PULL remote records from Supabase if local database is empty
    const localGroups = await db.groups.count();
    if (localGroups === 0) {
      for (const table of ['groups', 'members', 'meetings', 'savings', 'loans', 'repayments']) {
        try {
          const resp = await fetch(`${url}/rest/v1/${table}?select=*`, {
            headers: {
              'apikey': key,
              'Authorization': `Bearer ${key}`
            }
          });
          if (resp.ok) {
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              for (const row of data) {
                row.synced = true;
                await db[table].put(row);
              }
            }
          }
        } catch (e) {
          console.warn(`Pull failed for ${table}:`, e);
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

