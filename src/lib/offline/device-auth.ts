/**
 * Device sign-in vault.
 *
 * Lets a member sign back in on the SAME device while offline. We never store
 * the password: only a PBKDF2-SHA256 verifier, plus the Supabase session blob
 * that already lives in this browser's storage. Everything stays on the device.
 */

const VAULT_PREFIX = 'smarty:device-auth:';
const ITERATIONS = 150_000;

export type DeviceRecord = {
  email: string;
  salt: string;
  hash: string;
  iterations: number;
  storageKey: string;
  session: string;
  savedAt: number;
};

function keyFor(email: string) {
  return `${VAULT_PREFIX}${email.trim().toLowerCase()}`;
}

function toB64(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function fromB64(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as BufferSource, iterations, hash: 'SHA-256' },
    material,
    256,
  );
  return toB64(bits);
}

/** Finds the Supabase auth entry this browser keeps for the signed-in user. */
export function findSupabaseAuthEntry(): { storageKey: string; value: string } | null {
  if (typeof localStorage === 'undefined') return null;
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (/^sb-.*-auth-token$/.test(k)) {
      const value = localStorage.getItem(k);
      if (value) return { storageKey: k, value };
    }
  }
  return null;
}

/** Called right after a successful online sign-in / sign-up. */
export async function rememberDevice(email: string, password: string): Promise<void> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) return;
    const entry = findSupabaseAuthEntry();
    if (!entry) return;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await derive(password, salt, ITERATIONS);
    const record: DeviceRecord = {
      email: email.trim().toLowerCase(),
      salt: toB64(salt.buffer as ArrayBuffer),
      hash,
      iterations: ITERATIONS,
      storageKey: entry.storageKey,
      session: entry.value,
      savedAt: Date.now(),
    };
    localStorage.setItem(keyFor(email), JSON.stringify(record));
  } catch {
    /* best effort */
  }
}

/** Keeps the stored session fresh so offline restores stay usable. */
export function refreshRememberedSession(email: string | null | undefined): void {
  if (!email) return;
  try {
    const raw = localStorage.getItem(keyFor(email));
    if (!raw) return;
    const record = JSON.parse(raw) as DeviceRecord;
    const entry = findSupabaseAuthEntry();
    if (!entry) return;
    localStorage.setItem(
      keyFor(email),
      JSON.stringify({ ...record, storageKey: entry.storageKey, session: entry.value }),
    );
  } catch {
    /* ignore */
  }
}

export function hasDeviceRecord(email: string): boolean {
  try {
    return Boolean(localStorage.getItem(keyFor(email)));
  } catch {
    return false;
  }
}

/** Every account remembered on this device, for the settings screen. */
export function listDeviceRecords(): { email: string; savedAt: number }[] {
  const out: { email: string; savedAt: number }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(VAULT_PREFIX)) continue;
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const record = JSON.parse(raw) as DeviceRecord;
      out.push({ email: record.email, savedAt: record.savedAt });
    }
  } catch {
    /* ignore */
  }
  return out;
}

export function forgetDevice(email: string | null | undefined): void {
  if (!email) return;
  try {
    localStorage.removeItem(keyFor(email));
  } catch {
    /* ignore */
  }
}

export function forgetAllDevices(): void {
  try {
    for (const record of listDeviceRecords()) forgetDevice(record.email);
  } catch {
    /* ignore */
  }
}

export type OfflineSignInResult = 'ok' | 'no-record' | 'bad-password' | 'unsupported';

/**
 * Restores the saved session for this device when there is no internet.
 * The caller should reload afterwards so the Supabase client picks it up.
 */
export async function offlineSignIn(email: string, password: string): Promise<OfflineSignInResult> {
  try {
    if (typeof crypto === 'undefined' || !crypto.subtle) return 'unsupported';
    const raw = localStorage.getItem(keyFor(email));
    if (!raw) return 'no-record';
    const record = JSON.parse(raw) as DeviceRecord;
    const hash = await derive(password, fromB64(record.salt), record.iterations || ITERATIONS);
    if (hash !== record.hash) return 'bad-password';
    localStorage.setItem(record.storageKey, record.session);
    return 'ok';
  } catch {
    return 'unsupported';
  }
}

/** Marks the current tab as an offline, read-only restored session. */
export const OFFLINE_SESSION_FLAG = 'smarty:offline-session';

/**
 * Reads the user stored in this browser's Supabase auth blob.
 * Offline the access token cannot be refreshed, so the client may hand back no
 * session — we still know who is signed in on this device.
 */
export function readLocalSessionUser(): { id: string; email: string | null } | null {
  try {
    const entry = findSupabaseAuthEntry();
    if (!entry) return null;
    const parsed = JSON.parse(entry.value);
    const user = parsed?.user ?? parsed?.currentSession?.user ?? null;
    if (!user?.id) return null;
    return { id: user.id, email: user.email ?? null };
  } catch {
    return null;
  }
}
