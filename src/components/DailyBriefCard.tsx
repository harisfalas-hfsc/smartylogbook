import { AlertTriangle, CheckCircle2, Circle, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyBrief } from '@/lib/assistant';

interface Props {
  brief: DailyBrief | null;
  generating: boolean;
  onToggleDone: () => void;
  onRegenerate: () => void;
}

const DailyBriefCard = ({ brief, generating, onToggleDone, onRegenerate }: Props) => {
  return (
    <div className="smarty-card animate-fade-up overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Smarty Assistant
        </p>
        <button
          onClick={onRegenerate}
          aria-label="Refresh today's brief"
          disabled={generating}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-smooth active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', generating && 'animate-spin')} />
        </button>
      </div>

      {generating && !brief ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading your logbook…
        </p>
      ) : brief ? (
        <>
          <p className={cn('mt-2 text-base font-bold text-foreground', brief.done && 'line-through opacity-60')}>
            {brief.headline}
          </p>
          <p className={cn('mt-1.5 text-sm leading-relaxed text-muted-foreground', brief.done && 'line-through opacity-60')}>
            {brief.action}
          </p>
          {brief.reason && <p className="mt-1 text-xs text-muted-foreground/80">{brief.reason}</p>}

          {brief.alerts?.length > 0 && (
            <div className="mt-4 space-y-2">
              {brief.alerts.map((a) => (
                <div key={a.title} className="flex gap-2.5 rounded-2xl bg-secondary/70 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground">{a.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onToggleDone}
            className={cn(
              'mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-smooth active:scale-[0.98]',
              brief.done
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-gradient-primary text-primary-foreground shadow-glow'
            )}
          >
            {brief.done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            {brief.done ? 'Done today — undo' : 'Mark as done'}
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-base font-bold text-foreground">Capture your first entry</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Your assistant needs a little of your life to work with. Log one thing and it starts connecting the dots.
          </p>
        </>
      )}
    </div>
  );
};

export default DailyBriefCard;
