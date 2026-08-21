/**
 * Single source of truth for connectivity, for the website, the PWA and the
 * native (Capacitor) app.
 *
 * `navigator.onLine` only reports whether the device thinks it has a network
 * interface. Inside a native WebView it can report `true` with no route to the
 * internet, and on a flaky network it reports `true` while the backend is
 * unreachable. This module combines three signals:
 *
 *   1. browser `online` / `offline` events
 *   2. the native Capacitor Network plugin
 *   3. a real reachability probe against our own backend
 *
 * and exposes ONE derived state the whole app reads. Never read
 * `navigator.onLine` directly anywhere else.
 */
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export type ConnectivityState =
  /** Device reports no network at all. */
  | 'offline'
  /** Device has a network, but our backend did not answer. */
  | 'backend-unreachable'
  /** Everything reachable. */
  | 'online';

type Listener = (online: boolean) => void;
type StateListener = (state: ConnectivityState) => void;

const HEALTH_URL = `${import.meta.env.VITE_SUPABASE_URL ?? ''}/rest/v1/profiles?select=id&limit=1`;
const PROBE_TIMEOUT_MS = 6000;
/** How often we re-probe while we believe we are cut off. */
const RECOVERY_INTERVAL_MS = 15000;

let deviceOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
let state: ConnectivityState = deviceOnline ? 'online' : 'offline';
let lastProbeAt = 0;
let lastProbeOk: boolean | null = null;
let probing: Promise<boolean> | null = null;
let recoveryTimer: ReturnType<typeof setInterval> | undefined;
let started = false;

const listeners = new Set<Listener>();
const stateListeners = new Set<StateListener>();

export const isNativeApp = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

function publish(next: ConnectivityState) {
  if (next === state) return;
  const wasOnline = state === 'online';
  state = next;
  const nowOnline = next === 'online';
  for (const listener of stateListeners) {
    try {
      listener(next);
    } catch {
      /* a broken listener must never break connectivity */
    }
  }
  if (wasOnline !== nowOnline) {
    for (const listener of listeners) {
      try {
        listener(nowOnline);
      } catch {
        /* ignore */
      }
    }
  }
  manageRecoveryTimer();
}

function derive() {
  if (!deviceOnline) {
    publish('offline');
    return;
  }
  publish(lastProbeOk === false ? 'backend-unreachable' : 'online');
}

function manageRecoveryTimer() {
  if (typeof window === 'undefined') return;
  const needed = state !== 'online';
  if (needed && !recoveryTimer) {
    recoveryTimer = setInterval(() => void probeBackend(true), RECOVERY_INTERVAL_MS);
  } else if (!needed && recoveryTimer) {
    clearInterval(recoveryTimer);
    recoveryTimer = undefined;
  }
}

/**
 * Asks the backend whether it is actually reachable. Deduplicated and cheap:
 * repeated calls inside 5s reuse the previous answer unless `force` is set.
 */
export async function probeBackend(force = false): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  if (!HEALTH_URL.startsWith('http')) return deviceOnline;
  if (!deviceOnline) {
    lastProbeOk = false;
    derive();
    return false;
  }
  if (!force && Date.now() - lastProbeAt < 5000 && lastProbeOk !== null) return lastProbeOk;
  if (probing) return probing;

  probing = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      // Use the same authenticated client headers as the app. The previous
      // auth-health request omitted the API key and produced a guaranteed 401,
      // which was presented as a connectivity failure even while data requests
      // were succeeding.
      const { data: { session } } = await supabase.auth.getSession();
      const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
      const res = await fetch(HEALTH_URL, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${session?.access_token ?? apiKey}`,
        },
      });
      lastProbeOk = res.status < 500;
    } catch {
      lastProbeOk = false;
    } finally {
      clearTimeout(timer);
      lastProbeAt = Date.now();
      probing = null;
    }
    derive();
    return lastProbeOk === true;
  })();

  return probing;
}

/** Starts listening. Safe to call more than once; call it before rendering. */
export async function initConnectivity(): Promise<void> {
  if (started || typeof window === 'undefined') return;
  started = true;

  deviceOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  state = deviceOnline ? 'online' : 'offline';

  window.addEventListener('online', () => {
    deviceOnline = true;
    lastProbeOk = null;
    derive();
    void probeBackend(true);
  });
  window.addEventListener('offline', () => {
    deviceOnline = false;
    derive();
  });
  window.addEventListener('focus', () => void probeBackend());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void probeBackend();
  });

  if (isNativeApp()) {
    try {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      deviceOnline = Boolean(status.connected);
      derive();
      await Network.addListener('networkStatusChange', (s) => {
        deviceOnline = Boolean(s.connected);
        lastProbeOk = null;
        derive();
        if (deviceOnline) void probeBackend(true);
      });
    } catch {
      /* fall back to the browser events above */
    }
  }

  // Finish the first real reachability check before React/auth starts. This is
  // essential in native WebViews, where navigator.onLine may initially say
  // true during airplane mode and would otherwise start the empty online path.
  await probeBackend(true);
  manageRecoveryTimer();
}

/** Synchronous read used by data helpers and guards. */
export function isOnline(): boolean {
  return state === 'online';
}

/** Full connectivity state, for messages that must not lie to the member. */
export function connectivityState(): ConnectivityState {
  return state;
}

/** Subscribe to online/offline changes. Returns an unsubscribe function. */
export function onConnectivityChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Alias kept in sync with the other Smarty apps. */
export const subscribeConnectivity = onConnectivityChange;

/** Subscribes to the richer connectivity state. */
export function subscribeConnectivityState(listener: StateListener): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

/** Diagnostics — no personal data. */
export function connectivityDiagnostics() {
  return { state, deviceOnline, lastProbeAt, lastProbeOk };
}
