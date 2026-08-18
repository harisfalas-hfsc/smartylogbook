/**
 * Single, guarded registrar for the app-shell service worker.
 * Never registers in dev, iframes or Lovable preview hosts, and supports a
 * `?sw=off` kill switch that unregisters an already-installed worker.
 */
import { isNativeApp } from './connectivity';

const SW_URL = '/sw.js';

function isBlockedContext(): boolean {
  if (typeof window === 'undefined') return true;
  if (!import.meta.env.PROD) return true;
  // A native app already ships its whole shell locally; no worker needed.
  if (isNativeApp()) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith('id-preview--') || host.startsWith('preview--')) return true;
  if (host === 'lovableproject.com' || host.endsWith('.lovableproject.com')) return true;
  if (host === 'lovableproject-dev.com' || host.endsWith('.lovableproject-dev.com')) return true;
  if (host === 'beta.lovable.dev' || host.endsWith('.beta.lovable.dev')) return true;
  if (new URLSearchParams(window.location.search).get('sw') === 'off') return true;
  return false;
}

async function unregisterAppWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
  await Promise.allSettled(
    regs
      .filter((r) => {
        const url = r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? '';
        return url.endsWith(SW_URL);
      })
      .map((r) => r.unregister()),
  );
}

/**
 * Registers the worker and calls `onUpdateReady` when a newer build is waiting,
 * with a callback that activates it.
 */
export function registerAppServiceWorker(onUpdateReady?: (apply: () => void) => void) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  if (isBlockedContext()) {
    void unregisterAppWorker();
    return;
  }

  void navigator.serviceWorker
    .register(SW_URL, { scope: '/' })
    .then((registration) => {
      const notify = (worker: ServiceWorker | null) => {
        if (!worker || !navigator.serviceWorker.controller) return;
        onUpdateReady?.(() => {
          worker.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        });
      };

      if (registration.waiting) notify(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') notify(installing);
        });
      });
    })
    .catch(() => {
      /* offline support is best effort */
    });
}
