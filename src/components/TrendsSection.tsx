import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useFacts, type Trend } from '@/lib/facts';
import { cn } from '@/lib/utils';

const fmt = (n: number) =>
  Math.abs(n) >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : String(Number(n.toFixed(2)));

const Sparkline = ({ points }: { points: Trend['points'] }) => {
  const values = points.slice(-8).map((p) => p.value);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const d = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-20 text-primary" aria-hidden="true">
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

/** Real numbers the AI pulled out of your entries, trended over time. */
const TrendsSection = () => {
  const { trends, loading } = useFacts({ limit: 300 });
  if (loading || trends.length === 0) return null;

  const shown = trends.slice(0, 8);

  return (
    <section className="animate-fade-up">
      <h2 className="mb-1 text-sm font-bold text-foreground">Your numbers</h2>
      <p className="mb-2.5 text-xs text-muted-foreground">
        Values the Assistant pulled out of your entries, tracked over time.
      </p>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((t) => {
          const Icon = t.direction === 'up' ? ArrowUpRight : t.direction === 'down' ? ArrowDownRight : ArrowRight;
          return (
            <div key={t.name} className="smarty-card flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {t.label}
                </p>
                <p className="mt-1 text-lg font-extrabold text-foreground">
                  {fmt(t.latest)}
                  {t.unit && <span className="ml-1 text-xs font-semibold text-muted-foreground">{t.unit}</span>}
                </p>
                {t.change != null && t.previous != null && (
                  <p
                    className={cn(
                      'mt-0.5 flex items-center gap-1 text-[11px] font-semibold',
                      t.direction === 'flat' ? 'text-muted-foreground' : 'text-primary',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {t.change > 0 ? '+' : ''}
                    {fmt(t.change)} from {fmt(t.previous)}
                  </p>
                )}
                {t.points.length === 1 && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">First reading</p>
                )}
              </div>
              <Sparkline points={t.points} />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TrendsSection;
