import { AlertTriangle, Loader2, MessageCircle, RefreshCw, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DailyBrief } from '@/lib/assistant';

interface Props {
  brief: DailyBrief | null;
  generating: boolean;
  onRegenerate: () => void;
  /** Optional: push the suggestion into the chat composer */
  onAsk?: (text: string) => void;
}

/**
 * One suggestion per day from Smarty Assistant, generated from what the user
 * actually logged. It is a prompt, not a task, no checkboxes, no "setup" chores.
 */
const DailyBriefCard = ({ brief, generating, onRegenerate, onAsk }: Props) => {
  return (
    <div className="animate-fade-up overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card shadow-soft">
      <div className="flex items-center gap-2.5 border-b border-primary/15 bg-primary/10 px-4 py-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
          <Sun className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Today&apos;s prompt</p>
          <p className="truncate text-[10px] text-muted-foreground">One idea a day, from what you logged</p>
        </div>
        <button
          onClick={onRegenerate}
          aria-label="Give me another"
          disabled={generating}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-card text-primary shadow-soft transition-smooth active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', generating && 'animate-spin')} />
        </button>
      </div>

      <div className="p-4">
        {generating && !brief ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading your logbook…
          </p>
        ) : brief ? (
          <>
            <p className="text-base font-bold text-foreground">{brief.headline}</p>
            {brief.action && (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{brief.action}</p>
            )}
            {brief.reason && <p className="mt-1 text-xs text-muted-foreground/80">{brief.reason}</p>}

            {brief.alerts?.length > 0 && (
              <div className="mt-3 space-y-2">
                {brief.alerts.map((a) => (
                  <div key={a.title} className="flex gap-2.5 rounded-2xl border border-warning/30 bg-warning/10 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">{a.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{a.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {onAsk && (
              <button
                onClick={() => onAsk(brief.action || brief.headline)}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" /> Talk about this
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-base font-bold text-foreground">Capture your first entry</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Your assistant needs a little of your life to work with. Log one thing and it starts connecting the dots.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyBriefCard;
