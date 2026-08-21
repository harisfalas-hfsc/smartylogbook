/**
 * Tiny in-app bus so the prefetcher, the queue replay and the status pill all
 * share one notion of "we are synchronising" without a global state library.
 */
export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

type Listener = (state: SyncState) => void;

let state: SyncState = 'idle';
const listeners = new Set<Listener>();
const syncRequests = new Set<() => void>();

export function syncState(): SyncState {
  return state;
}

export function setSyncState(next: SyncState): void {
  if (next === state) return;
  state = next;
  for (const listener of listeners) {
    try {
      listener(next);
    } catch {
      /* ignore */
    }
  }
}

export function subscribeSyncState(listener: Listener): () => void {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

/** Registers a worker that should run when a sync is requested. */
export function onSyncRequested(handler: () => void): () => void {
  syncRequests.add(handler);
  return () => syncRequests.delete(handler);
}

/** Manual "Sync now" / reconnect trigger. */
export function requestSync(): void {
  for (const handler of syncRequests) {
    try {
      handler();
    } catch {
      /* ignore */
    }
  }
}
