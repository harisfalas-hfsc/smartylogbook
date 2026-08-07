import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronRight,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMemories } from '@/lib/memories';
import { useFacts } from '@/lib/facts';
import { useMoney } from '@/lib/money';
import { MODULES, getModule } from '@/lib/constants';
import TrendsSection from '@/components/TrendsSection';
import MoneySection from '@/components/MoneySection';

interface Insights {
  summaries: { module: string; title: string; lines: string[] }[];
  patterns: { title: string; detail: string }[];
  attention: { title: string; detail: string }[];
  overview: string;
}

/** Big card shell — every block on this page lives inside one, for consistency. */
const Card = ({
  title,
  icon: Icon,
  lead,
  children,
}: {
  title: string;
  icon: LucideIcon;
  lead?: string;
  children: React.ReactNode;
}) => (
  <section className="smarty-card animate-fade-up p-4 sm:p-5">
    <div className="mb-3 flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        {lead && <p className="text-[11px] leading-snug text-muted-foreground">{lead}</p>}
      </div>
    </div>
    {children}
  </section>
);

const subCard = 'smarty-sub rounded-2xl border-2 border-primary/25 bg-secondary/40 p-3.5';

const InsightsPage = () => {
  const { memories, loading: memLoading } = useMemories({ limit: 200 });
  const { trends } = useFacts({ limit: 300 });
  const { items: moneyItems } = useMoney();
  const hasNumbers = trends.length > 0;
  const hasMoney = moneyItems.length > 0;
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyse = async () => {
    if (memories.length === 0) return;
    setLoading(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke('ai-brain', {
      body: {
        mode: 'insights',
        memories: memories.map((m) => ({
          title: m.title, summary: m.summary, module: m.module, kind: m.kind,
          amount: m.amount, mood: m.mood, tags: m.ai_tags, occurred_at: m.occurred_at,
        })),
      },
    });
    setLoading(false);
    if (fnError || data?.error) {
      setError(data?.error ?? 'Could not analyse right now. Please try again.');
      return;
    }
    setInsights(data as Insights);
  };

  useEffect(() => {
    if (!memLoading && memories.length > 0 && !insights) analyse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memLoading, memories.length]);

  const total = MODULES.reduce((n, m) => n + memories.filter((x) => x.module === m.id).length, 0);

  return (
    <div className="space-y-3">
      <header className="flex items-start justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What it all means. For the raw records, open your{' '}
            <Link to="/app/timeline" className="font-semibold text-primary">timeline</Link>.
          </p>
        </div>
        <button
          onClick={analyse}
          disabled={loading || memories.length === 0}
          aria-label="Re-analyse"
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-smooth active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {memories.length === 0 ? (
        <div className="smarty-card p-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">Nothing to analyse yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Capture a week of life and the picture starts forming.</p>
        </div>
      ) : loading && !insights ? (
        <div className="smarty-card flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading your logbook…
        </div>
      ) : error ? (
        <div className="smarty-card p-6 text-center text-sm text-muted-foreground">{error}</div>
      ) : insights ? (
        <>
          {insights.overview && (
            <section className="smarty-card animate-fade-up p-4 sm:p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Right now</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{insights.overview}</p>
            </section>
          )}

          {hasNumbers && (
            <Card title="Your numbers" icon={BarChart3} lead="Values the Assistant pulled out of your entries.">
              <TrendsSection />
            </Card>
          )}

          {hasMoney && (
            <Card title="Your money" icon={Wallet} lead="Built from the bills, receipts and notes you captured.">
              <MoneySection />
            </Card>
          )}

          {insights.summaries?.length > 0 && (
            <Card title="Summaries" icon={Sparkles}>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {insights.summaries.map((s) => {
                  const mod = getModule(s.module);
                  return (
                    <div key={s.title} className={subCard}>
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${mod.tint}`}>
                          <mod.icon className={`h-4 w-4 ${mod.color}`} />
                        </div>
                        <p className="text-sm font-bold text-foreground">{s.title}</p>
                      </div>
                      <ul className="mt-2.5 space-y-1.5">
                        {s.lines?.map((l) => (
                          <li key={l} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {insights.attention?.length > 0 && (
            <Card title="Needs your attention" icon={AlertTriangle}>
              <div className="space-y-2.5">
                {insights.attention.map((p) => (
                  <div key={p.title} className="flex gap-3 rounded-2xl border-2 border-warning/30 bg-warning/10 p-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-warning/20">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{p.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {insights.patterns?.length > 0 && (
            <Card title="Patterns" icon={Brain}>
              <div className="space-y-2.5">
                {insights.patterns.map((p) => (
                  <div key={p.title} className={`flex gap-3 ${subCard}`}>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{p.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : null}

      <Card title="Where your life happens" icon={LayoutGrid} lead="Every entry, grouped by category.">
        <Link
          to="/app/categories"
          className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-[0.99]"
        >
          <span>
            Open your categories
            <span className="ml-1.5 font-normal opacity-80">· {total} entries</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </Link>
      </Card>
    </div>
  );
};

export default InsightsPage;
