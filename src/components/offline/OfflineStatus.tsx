import { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, ServerCrash, X } from 'lucide-react';
import { useConnectivityState } from '@/lib/offline/useOnlineStatus';
import { pendingActionCount } from '@/lib/offline/queue';
import { subscribeSyncState, type SyncState } from '@/lib/offline/sync-bus';
import { readOfflineReadiness, type OfflineReadiness } from '@/lib/offline/readiness';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Small, non-blocking status pill: "Syncing…", pending changes, or an honest
 * offline note. It never covers navigation and never blocks a tap.
 */
const OfflineStatus = () => {
  const state = useConnectivityState();
  const { user } = useAuth();
  const [sync, setSync] = useState<SyncState>('idle');
  const [pending, setPending] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [readiness, setReadiness] = useState<OfflineReadiness | null>(null);

  useEffect(() => subscribeSyncState(setSync), []);

  useEffect(() => {
    let active = true;
    void readOfflineReadiness(user?.id).then((value) => active && setReadiness(value));
    return () => {
      active = false;
    };
  }, [state, sync, user?.id]);

  useEffect(() => {
    let active = true;
    const read = () => void pendingActionCount().then((n) => active && setPending(n));
    read();
    const timer = setInterval(read, 20000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [state, sync]);

  useEffect(() => {
    if (state !== 'online') setDismissed(false);
  }, [state]);

  const offline = state === 'offline';
  const backendDown = state === 'backend-unreachable';
  const show = offline || backendDown || sync !== 'idle' || pending > 0;
  if (!show || dismissed) return null;

  const prepared = Boolean(readiness?.ready && readiness.userId === (user?.id ?? null));
  const savedRecords = prepared ? readiness?.records ?? 0 : 0;
  const label = offline
    ? prepared
      ? savedRecords > 0
        ? `Offline. ${savedRecords} saved Logbook record${savedRecords === 1 ? '' : 's'} ready`
        : 'Offline. No Logbook records are saved on this device'
      : 'Offline. Some content may not be saved on this device yet'
    : backendDown
      ? "Can't reach Smarty Logbook right now"
      : sync === 'syncing'
        ? 'Syncing…'
        : sync === 'synced'
          ? 'Synced. Offline copy is ready'
          : sync === 'error'
            ? 'Sync incomplete. Retrying automatically'
            : `${pending} change${pending === 1 ? '' : 's'} waiting to sync`;

  const Icon = offline ? CloudOff : backendDown ? ServerCrash : RefreshCw;

  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-40 -translate-x-1/2 px-3 md:bottom-6">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-primary bg-card/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg backdrop-blur">
        <Icon
          className={`h-3.5 w-3.5 shrink-0 text-primary ${sync === 'syncing' ? 'animate-spin' : ''}`}
        />
        <span className="max-w-[60vw] truncate">{label}</span>
        <button
          type="button"
          aria-label="Hide status"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default OfflineStatus;
