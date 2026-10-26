import React, { useState, useEffect } from 'react';
import { WifiOff, CloudCheck, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { subscribeSyncStatus } from '../lib/sync';

/**
 * OfflineBanner: Calm orange banner showing offline safety status.
 */
export default function OfflineBanner() {
  const { t } = useTranslation();
  const [syncState, setSyncState] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isConfigured: false,
    status: 'unconfigured'
  });

  useEffect(() => {
    return subscribeSyncStatus(setSyncState);
  }, []);

  // Show if offline
  if (!syncState.isOnline) {
    return (
      <div className="w-full bg-[#E8892B] text-white px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 shadow-inner">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span>{t('common.offline_notice')}</span>
      </div>
    );
  }

  // If sync is unconfigured, show subtle info pill in dev/demo mode
  if (!syncState.isConfigured) {
    return (
      <div className="w-full bg-emerald-900/90 text-emerald-100 px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b border-emerald-800">
        <Info className="w-3.5 h-3.5 text-emerald-300" />
        <span>{t('common.sync_not_configured')}</span>
      </div>
    );
  }

  return null;
}

