/**
 * Google Analytics (GA4) — frontend only.
 * The base gtag.js snippet lives in index.html so the very first page view is
 * recorded before React boots. These helpers only add SPA route changes and
 * custom events on top of it.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const FALLBACK_MEASUREMENT_ID = 'G-2TBQXNH4DH';

const measurementId = (import.meta.env
  .VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY as string | undefined) ||
  FALLBACK_MEASUREMENT_ID;

let initialized = false;
let firstViewSkipped = false;

export const analyticsEnabled = () => Boolean(measurementId);

export function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    (window.gtag as (...a: unknown[]) => void)(...args);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

/** Loads gtag.js only if the index.html snippet is missing (e.g. embedded previews). */
export function initAnalytics() {
  if (initialized || !measurementId || typeof document === 'undefined') return;
  initialized = true;

  if (typeof window.gtag === 'function') return; // already loaded from index.html

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

export function trackPageView(path: string) {
  if (!measurementId) return;
  // The initial page_view is already sent by the gtag config call.
  if (!firstViewSkipped) {
    firstViewSkipped = true;
    return;
  }
  gtag('event', 'page_view', {
    page_path: path,
    page_location: typeof window !== 'undefined' ? window.location.href : path,
    page_title: typeof document !== 'undefined' ? document.title : undefined,
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!measurementId) return;
  gtag('event', name, params);
}
