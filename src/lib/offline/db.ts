import { createStore, get, set } from 'idb-keyval';

/** Persistent synchronization metadata shared by web, PWA and native WebViews. */
export const LOCAL_DB_VERSION = 1;

type OfflineMeta = {
  dbVersion: number;
  userId: string | null;
  lastSyncStartedAt: number | null;
  lastSyncFinishedAt: number | null;
  lastSyncError: string | null;
  checkpoints: Record<string, number>;
};

const EMPTY: OfflineMeta = {
  dbVersion: LOCAL_DB_VERSION,
  userId: null,
  lastSyncStartedAt: null,
  lastSyncFinishedAt: null,
  lastSyncError: null,
  checkpoints: {},
};

const metaStore = typeof indexedDB !== 'undefined'
  ? createStore('smarty-offline-meta', 'meta')
  : undefined;

export async function readOfflineMeta(): Promise<OfflineMeta> {
  if (!metaStore) return { ...EMPTY };
  try {
    return { ...EMPTY, ...((await get<Partial<OfflineMeta>>('meta', metaStore)) ?? {}) };
  } catch {
    return { ...EMPTY };
  }
}

async function writeOfflineMeta(patch: Partial<OfflineMeta>): Promise<void> {
  if (!metaStore) return;
  const current = await readOfflineMeta();
  await set('meta', { ...current, ...patch }, metaStore);
}

export async function bindOfflineUser(userId: string): Promise<void> {
  const current = await readOfflineMeta();
  if (current.userId !== userId) {
    await writeOfflineMeta({ userId, checkpoints: {} });
  }
}

export async function markSyncStarted(): Promise<void> {
  await writeOfflineMeta({ lastSyncStartedAt: Date.now(), lastSyncError: null });
}

export async function markSyncFinished(error?: unknown): Promise<void> {
  await writeOfflineMeta({
    lastSyncFinishedAt: Date.now(),
    lastSyncError: error ? String((error as Error)?.message ?? error) : null,
  });
}

export async function isSyncPhaseFresh(phase: string, maxAgeMs: number): Promise<boolean> {
  const at = (await readOfflineMeta()).checkpoints[phase];
  return typeof at === 'number' && Date.now() - at < maxAgeMs;
}

export async function markSyncPhaseDone(phase: string): Promise<void> {
  const current = await readOfflineMeta();
  await writeOfflineMeta({ checkpoints: { ...current.checkpoints, [phase]: Date.now() } });
}