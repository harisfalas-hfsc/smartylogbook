import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { subscribeSyncState, type SyncState } from '@/lib/offline/sync-bus';

/**
 * Small, non-blocking sync indicator. Offline state is already communicated by
 * the global offline banner, and successful syncs need no persistent message.
 */
const OfflineStatus = () => {
  const [sync, setSync] = useState<SyncState>('idle');

  useEffect(() => subscribeSyncState(setSync), []);

  if (sync !== 'syncing' && sync !== 'error') return null;

  const failed = sync === 'error';
  const Icon = failed ? AlertCircle : RefreshCw;

  return (
    <div className="pointer-events-none fixed bottom-28 left-1/2 z-40 -translate-x-1/2 px-3 md:bottom-6">
      <div
        className={`flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border bg-card px-3 text-xs font-semibold shadow-md ${
          failed ? 'border-destructive text-destructive' : 'border-primary text-foreground'
        }`}
      >
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${failed ? 'text-destructive' : 'animate-spin text-primary'}`}
        />
        <span>{failed ? 'Sync failed' : 'Syncing'}</span>
      </div>
    </div>
  );
};

export default OfflineStatus;
