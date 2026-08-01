import { useEffect, useState } from 'react';
import { Brain, Loader2, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMemories } from '@/lib/memories';
import LifeScoreRing from '@/components/LifeScoreRing';
import { MODULES, SCORE_DIMENSIONS } from '@/lib/constants';

interface Insights {
  patterns: { title: string; detail: string; confidence: string }[];
  predictions: { title: string; detail: string }[];
  score: { value: number; reason: string };
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
          <p className="mt-1 text-sm text-muted-foreground">What your life has been quietly telling you.</p>
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

      <section className="smarty-card animate-fade-up flex flex-col items-center gap-5 p-6 sm:flex-row">
        <LifeScoreRing score={insights?.score.value ?? Math.min(100, 40 + memories.length * 2)} />
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Life Score</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {insights?.score.reason ?? 'Balanced across sleep, movement, nutrition, recovery, productivity, learning, mental wellbeing, relationships and financial discipline.'}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {SCORE_DIMENSIONS.map((d) => (
              <span key={d.key} className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {memories.length === 0 ? (
        <div className="smarty-card p-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">Nothing to analyse yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Capture a week of life and patterns start appearing.</p>
        </div>
      ) : loading && !insights ? (
        <div className="smarty-card flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Analysing your behaviour…
        </div>
      ) : error ? (
        <div className="smarty-card p-6 text-center text-sm text-muted-foreground">{error}</div>
      ) : insights ? (
        <>
          <section className="animate-fade-up">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Brain className="h-4 w-4 text-primary" /> Behaviour patterns
            </h2>
            <div className="space-y-2.5">
              {insights.patterns?.map((p) => (
                <div key={p.title} className="smarty-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold text-foreground">{p.title}</p>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                      {p.confidence}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="animate-fade-up">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Zap className="h-4 w-4 text-warning" /> Predictive intelligence
            </h2>
            <div className="space-y-2.5">
              {insights.predictions?.map((p) => (
                <div key={p.title} className="glass rounded-3xl p-4 shadow-soft">
                  <p className="text-sm font-bold text-foreground">{p.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
                </div>
              ))}
            </div>
          </section>
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
