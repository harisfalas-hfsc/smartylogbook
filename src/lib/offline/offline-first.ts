import { readCache, scopedKey, trimCache, writeCache } from './store';
import { isOnline } from './connectivity';

export type OfflineResult<T> = { data: T; fromCache: boolean; savedAt: number | null };

/**
 * The one read path of the app: try the network, save the fresh result on the
 * device, and on any failure return the last saved copy. Throws only when
 * there is nothing fresh and nothing saved.
 */
export async function offlineFirst<T>(
  key: string,
  loader: () => Promise<T>,
  userId?: string | null,
): Promise<T> {
  return (await offlineFirstDetailed(key, loader, userId)).data;
}

/** Same as `offlineFirst`, but also says where the data came from. */
export async function offlineFirstDetailed<T>(
  key: string,
  loader: () => Promise<T>,
  userId?: string | null,
): Promise<OfflineResult<T>> {
  const fullKey = scopedKey(userId ?? null, key);
  try {
    if (!isOnline()) {
      throw new Error('offline');
    }
    const fresh = await loader();
    void writeCache(fullKey, fresh).then(() => trimCache());
    return { data: fresh, fromCache: false, savedAt: Date.now() };
  } catch (error) {
    const cached = await readCache<T>(fullKey);
    if (cached) return { data: cached.data, fromCache: true, savedAt: cached.savedAt };
    throw error;
  }
}

/** Reads only what is already on the device (never touches the network). */
export async function offlineRead<T>(key: string, userId?: string | null): Promise<T | null> {
  const cached = await readCache<T>(scopedKey(userId ?? null, key));
  return cached ? cached.data : null;
}

/** Saves a value on the device under the member's own scope. */
export async function offlineSave<T>(key: string, data: T, userId?: string | null) {
  return writeCache(scopedKey(userId ?? null, key), data);
}
