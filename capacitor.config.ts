import type { CapacitorConfig } from '@capacitor/cli';

/**
 * True native builds MUST run from the bundled local shell in `dist`.
 *
 * Never add a `server.url` here: it makes the app load the website over the
 * network at startup, so with no internet the WebView shows
 * "net::ERR_INTERNET_DISCONNECTED" instead of the offline-capable app.
 */
const config: CapacitorConfig = {
  appId: 'app.lovable.p5883efe2530d418397842db8829dd49a',
  appName: 'smartylogbook',
  webDir: 'dist',
  android: {
    // The app shell is local; no cleartext network origin is required.
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
