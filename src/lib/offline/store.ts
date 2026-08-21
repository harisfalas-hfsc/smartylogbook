import { createStore, get, set, del, keys } from 'idb-keyval';

export type Envelope<T> = { data: T; savedAt: number };

const store =
  typeof indexedDB !== 'undefined'
    // Older builds opened `smarty-offline` with several different object-store
    // names at database version 1. On an existing device, whichever opened
    // first permanently won and later `cache` writes failed with NotFoundError.
    // Use one dedicated canonical database so the complete Logbook can always
    // be created and written after an online refresh.
    ? createStore('smarty-offline-cache-v2', 'cache')
    : undefined;

/** Keys are scoped per signed-in user so nothing leaks between accounts. */
export function scopedKey(userId: string | null | undefined, key: string) {
  return `${userId ?? 'anon'}::${key}`;
}

export async function readCache<T>(key: string): Promise<Envelope<T> | null> {
  if (!store) return null;
  try {
    return (await get<Envelope<T>>(key, store)) ?? null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  if (!store) throw new Error('Offline storage is unavailable on this device');
  // A failed IndexedDB write must reach the bootstrap. Otherwise the UI can
  // claim that synchronization completed even though nothing was persisted.
  await set(key, { data, savedAt: Date.now() } satisfies Envelope<T>, store);
}

/** Sign-out clears only the keys that belong to that one account. */
export async function clearCacheForUser(userId: string | null | undefined): Promise<void> {
  if (!store) return;
  try {
    const prefix = `${userId ?? 'anon'}::`;
    const all = (await keys(store)).filter((k) => typeof k === 'string') as string[];
    await Promise.allSettled(
      all.filter((k) => k.startsWith(prefix)).map((k) => del(k, store)),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Keys that must never be evicted — together they *are* the offline app.
 * Growing media caches may never wipe a member's logbook.
 */
const PROTECTED = [
  'logbook:list',
  'logbook:trash',
  'record:',
  'account:access',
  'account:profile',
  'account:preferences',
  'categories:list',
  'library:list',
  'library:filters',
  'inbox:messages',
  'inbox:archived',
  'inbox:threads',
  'thread:',
  'reminders:list',
  'alerts:list',
  'facts:list',
  'progress:',
  'community:',
  'assistant:',
];

function isProtected(key: string) {
  const bare = key.includes('::') ? key.slice(key.indexOf('::') + 2) : key;
  return PROTECTED.some((p) => bare.startsWith(p));
}

/**
 * Keeps the local copy from growing without bound. Only expendable entries
 * (media / detail lookups) are ever evicted, oldest first.
 */
export async function trimCache(max = 800): Promise<void> {
  if (!store) return;
  try {
    const all = (await keys(store)).filter((k) => typeof k === 'string') as string[];
    const expendable = all.filter((k) => !isProtected(k));
    if (expendable.length <= max) return;
    const entries = await Promise.all(
      expendable.map(async (k) => ({
        k,
        savedAt: (await get<Envelope<unknown>>(k, store))?.savedAt ?? 0,
      })),
    );
    entries.sort((a, b) => a.savedAt - b.savedAt);
    await Promise.allSettled(entries.slice(0, entries.length - max).map((e) => del(e.k, store)));
  } catch {
    /* ignore */
  }
}
