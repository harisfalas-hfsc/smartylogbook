import { CalendarClock, Repeat, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { formatMoney, monthlyAmount, useMoney } from '@/lib/money';

const LABELS: Record<string, string> = {
  income: 'Income',
  expense: 'Bill',
  subscription: 'Subscription',
  debt: 'Debt',
  saving: 'Saving',
};

/**
 * The financial brain: what comes in, what goes out, what repeats.
 * Renders sub-cards only — the parent page wraps it in a card.
 */
const MoneySection = () => {
  const { items, summary, loading } = useMoney();
  if (loading || items.length === 0) return null;

  const cur = summary.currency;
  const stats = [
    { label: 'In / month', value: summary.income, icon: TrendingUp },
    { label: 'Out / month', value: summary.outgoings, icon: TrendingDown },
    { label: 'Subscriptions', value: summary.subscriptions, icon: Repeat },
    { label: 'Left over', value: summary.net, icon: Wallet },
  ];

  const repeating = items.filter((i) => i.active && i.cadence !== 'once').slice(0, 5);

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="smarty-sub rounded-2xl border-2 border-primary/25 bg-secondary/40 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              <s.icon className="h-3.5 w-3.5" />
              <span className="truncate">{s.label}</span>
            </p>
            <p className="mt-1 text-base font-extrabold text-foreground">{formatMoney(s.value, cur)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
        {repeating.length > 0 && (
          <div className="smarty-sub rounded-2xl border-2 border-primary/25 bg-secondary/40 p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              <Repeat className="h-3.5 w-3.5" /> What repeats
            </p>
            <ul className="space-y-1.5">
              {repeating.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="min-w-0 truncate text-foreground">
                    {i.label}
                    <span className="ml-1.5 text-[11px] text-muted-foreground">{LABELS[i.type] ?? i.type}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-foreground">
                    {formatMoney(monthlyAmount(i), i.currency)}
                    <span className="text-[11px] font-normal text-muted-foreground">/mo</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.upcoming.length > 0 && (
          <div className="smarty-sub rounded-2xl border-2 border-primary/25 bg-secondary/40 p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Coming up
            </p>
            <ul className="space-y-1.5">
              {summary.upcoming.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="min-w-0 truncate text-foreground">{i.label}</span>
                  <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                    {formatMoney(i.amount, i.currency)} · {i.next_due}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneySection;
