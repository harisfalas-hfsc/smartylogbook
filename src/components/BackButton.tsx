import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

/**
 * Desktop-only back button. Mirrors the Smarty Wellness family pattern:
 * an icon appears to the left of the logo as soon as there is navigation
 * history to go back to, and it walks the real browser history stack.
 * Hidden on mobile — native gestures/buttons handle back there.
 */
export const useCanGoBack = () => {
  const location = useLocation();
  const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
  return idx > 0 || Boolean(location.key && location.key !== 'default');
};

const BackButton = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  if (!canGoBack) return null;

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
