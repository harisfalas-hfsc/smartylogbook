import { readCache, scopedKey, writeCache } from './store';

/** What this device has actually stored for the signed-in member. */
export type OfflineReadiness = {
  ready: boolean;
  userId: string | null;
  preparedAt: number | null;
  records: number;
  messages: number;
  reminders: number;
};

const KEY = 'offline:readiness';

const EMPTY: OfflineReadiness = {
  ready: false,
  userId: null,
  preparedAt: null,
  records: 0,
  messages: 0,
  reminders: 0,
};

export async function readOfflineReadiness(userId?: string | null): Promise<OfflineReadiness> {
  return (await readCache<OfflineReadiness>(scopedKey(userId ?? null, KEY)))?.data ?? EMPTY;
}

export async function markOfflineReady(
  value: Omit<OfflineReadiness, 'ready' | 'preparedAt'>,
): Promise<void> {
  await writeCache(scopedKey(value.userId, KEY), {
    ...value,
    ready: true,
    preparedAt: Date.now(),
  } satisfies OfflineReadiness);
}
