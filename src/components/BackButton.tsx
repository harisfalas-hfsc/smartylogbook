import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Desktop-only back button. Tracks how deep the user has navigated *inside*
 * this app so we never walk back out of the site into the browser's previous
 * page. Hidden on home routes ("/" and "/app") — there is no back past home.
 */
const HOME_ROUTES = ['/', '/app'];

let depth = 0;
const listeners = new Set<(d: number) => void>();
const setDepth = (d: number) => {
  depth = Math.max(0, d);
  listeners.forEach((l) => l(depth));
};

export const resetNavDepth = () => setDepth(0);

const useNavDepth = () => {
  const location = useLocation();
  const [value, setValue] = useState(depth);

  useEffect(() => {
    listeners.add(setValue);
    return () => {
      listeners.delete(setValue);
    };
  }, []);

  useEffect(() => {
    if (HOME_ROUTES.includes(location.pathname)) {
      setDepth(0);
      return;
    }
    const type = (window.history.state as { idx?: number } | null)?.idx;
    setDepth(typeof type === 'number' ? Math.min(depth + 1, type + 1) : depth + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return value;
};

export const useCanGoBack = () => useNavDepth() > 0;

const BackButton = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const depthValue = useNavDepth();

  if (HOME_ROUTES.includes(location.pathname) || depthValue <= 0) return null;

  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={() => {
        setDepth(depth - 1);
        navigate(-1);
      }}
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
