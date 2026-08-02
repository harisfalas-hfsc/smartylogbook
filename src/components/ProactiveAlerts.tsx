import { AlertTriangle, Bell, X } from 'lucide-react';
import { useProactiveAlerts } from '@/lib/alerts';
import { cn } from '@/lib/utils';

/** Things the Assistant noticed on its own, in the background. */
const ProactiveAlerts = () => {
  const { alerts, loading, dismiss } = useProactiveAlerts();
  if (loading || alerts.length === 0) return null;

  return (
    <section className="animate-fade-up">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-foreground">
        <Bell className="h-4 w-4 text-primary" /> Needs your attention
      </h2>
      <ul className="space-y-2">
        {alerts.slice(0, 5).map((a) => (
          <li
            key={a.id}
            className={cn(
              'smarty-card flex items-start gap-3 p-4',
              a.severity === 'high' && 'border-destructive/40',
            )}
          >
            <AlertTriangle
              className={cn('mt-0.5 h-4 w-4 shrink-0', a.severity === 'high' ? 'text-destructive' : 'text-primary')}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{a.title}</p>
              {a.detail && <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(a.id)}
              aria-label={`Dismiss ${a.title}`}
              className="shrink-0 rounded-full p-1 text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ProactiveAlerts;
