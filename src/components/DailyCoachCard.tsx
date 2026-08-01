import { CheckCircle2, Circle, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoachCard as CoachCardType } from '@/lib/coach';

interface Props {
  card: CoachCardType | null;
  generating: boolean;
  onToggleDone: () => void;
  onRegenerate: () => void;
}

const DailyCoachCard = ({ card, generating, onToggleDone, onRegenerate }: Props) => {
  return (
    <div className="smarty-card animate-fade-up overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Smarty Coach
        </p>
        <button
          onClick={onRegenerate}
          aria-label="Get a new recommendation"
          disabled={generating}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-smooth active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', generating && 'animate-spin')} />
        </button>
      </div>

      {generating && !card ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Planning your day…
        </p>
      ) : card ? (
        <>
          <p className={cn('mt-2 text-base font-bold text-foreground', card.done && 'line-through opacity-60')}>
            {card.headline}
          </p>
          <p className={cn('mt-1.5 text-sm leading-relaxed text-muted-foreground', card.done && 'line-through opacity-60')}>
            {card.action}
          </p>
          {card.reason && <p className="mt-1 text-xs text-muted-foreground/80">{card.reason}</p>}

          <button
            onClick={onToggleDone}
            className={cn(
              'mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-smooth active:scale-[0.98]',
              card.done
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-gradient-primary text-primary-foreground shadow-glow'
            )}
          >
            {card.done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            {card.done ? 'Done today — undo' : 'Mark as done'}
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-base font-bold text-foreground">Capture your first memory</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            The coach needs a little of your life to learn from. Log one thing and it starts thinking.
          </p>
        </>
      )}
    </div>
  );
};

export default DailyCoachCard;
