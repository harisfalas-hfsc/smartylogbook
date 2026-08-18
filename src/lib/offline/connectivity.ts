/**
 * The single source of truth for "is there internet right now?".
 *
 * On the web (browser, PWA, desktop) it uses the browser's online/offline
 * events. Inside a true native app (Capacitor / iOS / Android) `navigator.onLine`
 * is unreliable — the WebView often reports `true` with airplane mode on — so we
 * listen to the native Network plugin instead. Every part of the app must read
 * connectivity through this module, never `navigator.onLine` directly.
 */
import { Capacitor } from '@capacitor/core';

type Listener = (online: boolean) => void;

let current = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
let started = false;
const listeners = new Set<Listener>();

export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

function set(online: boolean) {
  if (online === current) return;
  current = online;
  for (const listener of listeners) {
    try {
      listener(online);
    } catch {
      /* a bad listener must never break connectivity */
    }
  }
}

/** Starts listening. Safe to call more than once; call it before rendering. */
export async function initConnectivity(): Promise<void> {
  if (started || typeof window === 'undefined') return;
  started = true;

  window.addEventListener('online', () => set(true));
  window.addEventListener('offline', () => set(false));

  if (!isNativeApp()) return;

  try {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    set(status.connected);
    await Network.addListener('networkStatusChange', (s) => set(s.connected));
  } catch {
    /* fall back to the browser events above */
  }
}

/** Synchronous read used by data helpers and guards. */
export function isOnline(): boolean {
  return current;
}

/** Subscribe to changes. Returns an unsubscribe function. */
export function onConnectivityChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
