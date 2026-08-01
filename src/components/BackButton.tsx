import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Desktop-only back button. Depth is measured against the history index of the
 * first page of this app the user landed on (and re-baselined whenever they
 * reach a home route), so back never walks out of the site into the browser's
 * previous page. Hidden on home routes — there is no back past home.
 */
const HOME_ROUTES = ['/', '/app'];

const currentIdx = () => (window.history.state as { idx?: number } | null)?.idx ?? 0;

let baseline = currentIdx();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const resetNavDepth = () => {
  baseline = currentIdx();
  notify();
};

const useNavDepth = () => {
  const location = useLocation();
  const [, force] = useState(0);

  useEffect(() => {
    const cb = () => force((n) => n + 1);
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);

  useEffect(() => {
    const idx = currentIdx();
    if (HOME_ROUTES.includes(location.pathname) || idx < baseline) {
      baseline = idx;
      notify();
    }
  }, [location.key, location.pathname]);

  if (HOME_ROUTES.includes(location.pathname)) return 0;
  return Math.max(0, currentIdx() - baseline);
};

export const useCanGoBack = () => useNavDepth() > 0;

const BackButton = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const depth = useNavDepth();

  if (depth <= 0) return null;

  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={() => navigate(-1)}
      className={cn(
        'hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 md:inline-flex',
        className
      )}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
};

export default BackButton;
