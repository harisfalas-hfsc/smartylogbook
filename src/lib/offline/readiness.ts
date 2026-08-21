import { readCache, writeCache } from './store';

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

export async function readOfflineReadiness(): Promise<OfflineReadiness> {
  return (await readCache<OfflineReadiness>(KEY))?.data ?? EMPTY;
}

export async function markOfflineReady(
  value: Omit<OfflineReadiness, 'ready' | 'preparedAt'>,
): Promise<void> {
  await writeCache(KEY, {
    ...value,
    ready: true,
    preparedAt: Date.now(),
  } satisfies OfflineReadiness);
}
