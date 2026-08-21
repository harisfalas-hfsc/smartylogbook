const MEDIA_CACHE_NAME = 'smarty-media-v1';

/** Downloads private member files into a dedicated device cache. */
export async function cacheMediaUrls(
  urls: string[],
  options: { concurrency?: number; isActive?: () => boolean } = {},
): Promise<{ requested: number; stored: number; failed: number }> {
  const unique = [...new Set(urls.filter(Boolean))];
  if (typeof window === 'undefined' || !('caches' in window) || unique.length === 0) {
    return { requested: unique.length, stored: 0, failed: unique.length };
  }
  let mediaCache: Cache;
  try {
    mediaCache = await caches.open(MEDIA_CACHE_NAME);
  } catch {
    return { requested: unique.length, stored: 0, failed: unique.length };
  }

  const concurrency = Math.max(1, options.concurrency ?? 6);
  const isActive = options.isActive ?? (() => true);
  let cursor = 0;
  let stored = 0;
  let failed = 0;
  const worker = async () => {
    for (;;) {
      if (!isActive()) return;
      const index = cursor;
      cursor += 1;
      if (index >= unique.length) return;
      const url = unique[index];
      try {
        const existing = await mediaCache.match(url);
        if (existing) {
          stored += 1;
          continue;
        }
        const response = await fetch(url, { mode: 'cors' }).catch(() =>
          fetch(url, { mode: 'no-cors' }),
        );
        if (response.ok || response.type === 'opaque') {
          await mediaCache.put(url, response.clone());
          stored += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, worker));
  return { requested: unique.length, stored, failed };
}

/** Returns a local blob URL so cached media also works in native WebViews. */
export async function cachedMediaObjectUrl(url: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;
  try {
    const response = await (await caches.open(MEDIA_CACHE_NAME)).match(url);
    if (!response || response.type === 'opaque') return url;
    return URL.createObjectURL(await response.blob());
  } catch {
    return null;
  }
}