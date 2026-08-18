import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { registerAppServiceWorker } from '@/lib/offline/register-sw';

/** Registers the app-shell worker and offers a refresh when a new build waits. */
const UpdatePrompt = () => {
  const [apply, setApply] = useState<(() => void) | null>(null);

  useEffect(() => {
    registerAppServiceWorker((run) => setApply(() => run));
  }, []);

  if (!apply) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded-3xl border-2 border-primary bg-card p-3 shadow-card">
      <RefreshCw className="h-4 w-4 shrink-0 text-primary" />
      <p className="flex-1 text-xs font-semibold text-foreground">A new version is available.</p>
      <button
        onClick={() => apply()}
        className="rounded-2xl bg-gradient-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
      >
        Refresh
      </button>
    </div>
  );
};

export default UpdatePrompt;
