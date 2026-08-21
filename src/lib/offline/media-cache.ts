const MEDIA_CACHE_NAME = 'smarty-media-v1';

export type MediaCacheEntry = { key: string; url: string };

function stableMediaRequest(key: string): string {
  return new URL(`/__smarty-media-cache__/${encodeURIComponent(key)}`, window.location.origin).toString();
}

/** Downloads private member files into a dedicated device cache. */
export async function cacheMediaUrls(
  items: Array<string | MediaCacheEntry>,
  options: { concurrency?: number; isActive?: () => boolean } = {},
): Promise<{ requested: number; stored: number; failed: number; storedKeys: string[] }> {
  const unique = [...new Map(
    items
      .map((item) => typeof item === 'string' ? { key: item, url: item } : item)
      .filter((item) => Boolean(item.key && item.url))
      .map((item) => [item.key, item]),
  ).values()];
  if (typeof window === 'undefined' || !('caches' in window) || unique.length === 0) {
    return { requested: unique.length, stored: 0, failed: unique.length, storedKeys: [] };
  }
  let mediaCache: Cache;
  try {
    mediaCache = await caches.open(MEDIA_CACHE_NAME);
  } catch {
    return { requested: unique.length, stored: 0, failed: unique.length, storedKeys: [] };
  }

  const concurrency = Math.max(1, options.concurrency ?? 6);
  const isActive = options.isActive ?? (() => true);
  let cursor = 0;
  let stored = 0;
  let failed = 0;
  const storedKeys: string[] = [];
  const worker = async () => {
    for (;;) {
      if (!isActive()) return;
      const index = cursor;
      cursor += 1;
      if (index >= unique.length) return;
      const { key, url } = unique[index];
      const requestKey = stableMediaRequest(key);
      try {
        const existing = await mediaCache.match(requestKey);
          if (existing && existing.type !== 'opaque') {
          stored += 1;
          storedKeys.push(key);
          continue;
        }
          if (existing) await mediaCache.delete(requestKey);
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok && response.type !== 'opaque') {
          await mediaCache.put(requestKey, response.clone());
          stored += 1;
          storedKeys.push(key);
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, worker));
  return { requested: unique.length, stored, failed, storedKeys };
}

/** Returns a local blob URL so cached media also works in native WebViews. */
export async function cachedMediaObjectUrl(key: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    const mediaCache = await caches.open(MEDIA_CACHE_NAME);
    const response = await mediaCache.match(stableMediaRequest(key)) ?? await mediaCache.match(key);
    // Returning the remote URL for an opaque response makes the browser issue
    // a network request and therefore is not an offline retrieval. Browsers
    // that cannot expose the cached body must report the media as unavailable.
    if (!response || response.type === 'opaque') return null;
    return URL.createObjectURL(await response.blob());
  } catch {
    return null;
  }
}