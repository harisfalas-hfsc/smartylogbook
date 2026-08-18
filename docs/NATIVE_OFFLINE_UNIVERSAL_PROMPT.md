# Smarty — Universal Offline Mode (web, PWA, desktop, true native)

Portable spec for making an app fully usable with zero internet, everywhere.

## The 4 root causes of a native offline failure

1. **`server.url` in `capacitor.config.ts`** — the native app loads the website
   over the network at startup, so with no internet the WebView shows
   `net::ERR_INTERNET_DISCONNECTED`. The app must load the bundled `dist` shell.
2. **`navigator.onLine` inside a WebView** — unreliable on iOS/Android; it can
   report `true` in airplane mode. Use the Capacitor Network plugin.
3. **Auth boot** — offline the access token cannot be refreshed, so the client
   returns no session and the user is bounced to the login screen.
4. **Data layer reading network-first with no fallback** — every read must fall
   back to the on-device copy.

## Single connectivity source

`src/lib/offline/connectivity.ts` — `initConnectivity()`, `isOnline()`,
`onConnectivityChange()`, `isNativeApp()`. Native uses `@capacitor/network`,
web uses the browser `online`/`offline` events. Nothing else in the codebase may
read `navigator.onLine`.

## Boot order (`src/main.tsx`)

1. `initTheme()`
2. `initConnectivity()` — before the first render
3. render `<App />`

## Offline auth / session restore

- `device-auth.ts` stores a PBKDF2-SHA256 verifier plus the Supabase session
  blob on the device (never the password).
- `AuthContext` restores the local session user when `isOnline()` is false.
- `ProtectedRoute` keeps a remembered device inside the app while offline.

## Data layer

- `offline-first.ts`: network → write cache → on failure read cache.
- `store.ts`: IndexedDB, user-scoped keys, PROTECTED list, `trimCache`.
- `OfflineBootstrap.tsx`: downloads the member's whole world after sign-in.
- Writes are blocked or queued (`queue.ts`) with one calm message.

## capacitor.config.ts rule

`webDir: 'dist'`, **no `server.url`**, no `cleartext`. Hot reload against a
sandbox URL is a development-only convenience and must never ship.

## PWA config

`vite-plugin-pwa` `generateSW`, `injectRegister: null`, guarded registrar,
`NetworkFirst` navigations, `CacheFirst` hashed assets and media. The registrar
also refuses to register inside a native app.

## Build + sync + verify

```bash
npm install
npx cap add ios      # and/or
npx cap add android
npm run build
npx cap sync
npx cap run android  # or ios
```

Verification: open the app once online (so data downloads), force-quit, enable
airplane mode, cold start. Expected: app shell loads, member stays signed in,
dashboard/timeline/categories/calendar/messages all render from the device, and
write actions show the offline notice.

> Store binaries already submitted keep their old startup behavior; they require
> a new build with this configuration.
