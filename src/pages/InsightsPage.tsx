import { useEffect, useState } from 'react';
import { Brain, Loader2, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMemories } from '@/lib/memories';
import { MODULES, getModule } from '@/lib/constants';
import TrendsSection from '@/components/TrendsSection';
import MoneySection from '@/components/MoneySection';

interface Insights {
  summaries: { module: string; title: string; lines: string[] }[];
  patterns: { title: string; detail: string }[];
  attention: { title: string; detail: string }[];
  overview: string;
}

const InsightsPage = () => {
  const { memories, loading: memLoading } = useMemories({ limit: 200 });
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

  const perModule = MODULES.map((m) => ({
    ...m,
    count: memories.filter((x) => x.module === m.id).length,
  }));
  const max = Math.max(1, ...perModule.map((m) => m.count));

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">Plain-language summaries — no scores, no ratings.</p>
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
          <TrendsSection />
          <MoneySection />
          {insights.overview && (
            <section className="smarty-card animate-fade-up p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Right now</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{insights.overview}</p>
            </section>
          )}

          {insights.summaries?.length > 0 && (
            <section className="animate-fade-up space-y-2.5">
              <h2 className="mb-1 text-sm font-bold text-foreground">Summaries</h2>
              {insights.summaries.map((s) => {
                const mod = getModule(s.module);
                return (
                  <div key={s.title} className="smarty-card p-4">
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
            </section>
          )}

          {insights.attention?.length > 0 && (
            <section className="animate-fade-up">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" /> Needs your attention
              </h2>
              <div className="space-y-2.5">
                {insights.attention.map((p) => (
                  <div key={p.title} className="glass rounded-3xl p-4 shadow-soft">
                    <p className="text-sm font-bold text-foreground">{p.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {insights.patterns?.length > 0 && (
            <section className="animate-fade-up">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <Brain className="h-4 w-4 text-primary" /> Patterns
              </h2>
              <div className="space-y-2.5">
                {insights.patterns.map((p) => (
                  <div key={p.title} className="smarty-card p-4">
                    <p className="text-sm font-bold text-foreground">{p.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}

      <section className="animate-fade-up">
        <h2 className="mb-3 text-sm font-bold text-foreground">Where your life happens</h2>
        <div className="smarty-card space-y-3 p-5">
          {perModule.map((m) => (
            <div key={m.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">{m.label}</span>
                <span className="tabular-nums text-muted-foreground">{m.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-gradient-primary transition-smooth"
                  style={{ width: `${(m.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default InsightsPage;
