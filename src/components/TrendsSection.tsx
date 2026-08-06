import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useFacts } from '@/lib/facts';
import { cn } from '@/lib/utils';

const fmt = (n: number) =>
  Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : String(Number(n.toFixed(2)));

/**
 * Compact list of the numbers the Assistant pulled out of your entries.
 * Renders content only — the parent page wraps it in a card.
 */
const TrendsSection = () => {
  const { trends, loading } = useFacts({ limit: 300 });
  if (loading || trends.length === 0) return null;

  return (
    <div className="grid gap-x-6 gap-y-0 sm:grid-cols-2 xl:grid-cols-3">
      {trends.slice(0, 6).map((t) => {
        const Icon = t.direction === 'up' ? ArrowUpRight : t.direction === 'down' ? ArrowDownRight : ArrowRight;
        return (
          <div
            key={t.name}
            className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-0"
          >
            <p className="min-w-0 truncate text-xs font-semibold text-muted-foreground">{t.label}</p>
            <p className="flex shrink-0 items-baseline gap-1.5">
              <span className="text-sm font-extrabold text-foreground">
                {fmt(t.latest)}
                {t.unit && <span className="ml-0.5 text-[11px] font-semibold text-muted-foreground">{t.unit}</span>}
              </span>
              {t.change != null && (
                <span
                  className={cn(
                    'inline-flex items-center text-[11px] font-semibold',
                    t.direction === 'flat' ? 'text-muted-foreground' : 'text-primary',
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {t.change > 0 ? '+' : ''}
                  {fmt(t.change)}
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default TrendsSection;
