import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initAnalytics, trackPageView } from '@/lib/analytics';

/** Fires a GA4 page_view on first load and on every SPA route change. */
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
};

export default AnalyticsTracker;
