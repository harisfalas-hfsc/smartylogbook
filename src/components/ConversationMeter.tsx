import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  used: number;
  allowance: number;
  planName?: string | null;
  renewsAt?: string | null;
  className?: string;
}

/** Simple monthly indicator: "12 of 40 AI Conversations remaining". */
const ConversationMeter = ({ used, allowance, planName, renewsAt, className }: Props) => {
  const remaining = Math.max(0, allowance - used);
  const pct = allowance > 0 ? Math.min(100, (used / allowance) * 100) : 100;
  const low = allowance > 0 && remaining <= Math.max(3, allowance * 0.1);

  return (
    <div className={cn('smarty-card p-3', className)}>
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-foreground">
          {remaining} of {allowance} AI Conversations remaining
        </p>
        {planName ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            {planName.replace('Smarty ', '')}
          </span>
        ) : null}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', low ? 'bg-destructive' : 'bg-gradient-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {renewsAt ? (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Resets on {new Date(renewsAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
        </p>
      ) : null}
    </div>
  );
};

export default ConversationMeter;
