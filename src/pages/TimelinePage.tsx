import { useMemo, useState } from 'react';
import { Loader2, Search, Sparkles, X } from 'lucide-react';
import { groupByDay, useMemories } from '@/lib/memories';
import MemoryCard from '@/components/MemoryCard';
import { MODULES } from '@/lib/constants';
import { describeQuery, parsePlainLanguage } from '@/lib/nlSearch';
import { cn } from '@/lib/utils';

const RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: 'week', label: 'Week', days: 7 },
  { id: 'month', label: 'Month', days: 31 },
  { id: 'year', label: 'Year', days: 365 },
  { id: 'all', label: 'All', days: 0 },
] as const;

const EXAMPLES = [
  'show me my expenses last month',
  'show me workouts this week',
  'show me health notes this year',
];

const TimelinePage = () => {
  const { memories, loading, remove, reclassify } = useMemories();
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('week');
  const [module, setModule] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [ask, setAsk] = useState('');
  const [applied, setApplied] = useState<string | null>(null);

  const runPlainLanguage = (raw: string) => {
    const parsed = parsePlainLanguage(raw);
    if (!parsed.matched) {
      setApplied(null);
      return;
    }
    if (parsed.range) setRange(parsed.range === 'today' ? 'today' : parsed.range);
    setModule(parsed.module);
    setQuery(parsed.keywords);
    setApplied(describeQuery(parsed));
  };

  const clearPlainLanguage = () => {
    setAsk('');
    setApplied(null);
    setQuery('');
    setModule(null);
    setRange('week');
  };

  const filtered = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days ?? 0;
    let cutoff = days ? Date.now() - days * 86400000 : 0;
    if (range === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      cutoff = start.getTime();
    }
    return memories.filter((m) => {
      if (cutoff && new Date(m.occurred_at).getTime() < cutoff) return false;
      if (module && m.module !== module) return false;
      if (query) {
        const hay = `${m.title} ${m.summary ?? ''} ${m.content ?? ''} ${m.ai_tags.join(' ')}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [memories, range, module, query]);

  const groups = groupByDay(filtered);

  return (
    <div className="space-y-5">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Timeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything you've lived, in order.</p>
      </header>

      <div className="animate-fade-up space-y-2">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 focus-within:border-primary/50">
          <Search className="h-4 w-4 shrink-0 text-primary" />
          <input
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runPlainLanguage(ask)}
            placeholder="Show me my expenses last month…"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {ask ? (
            <button onClick={clearPlainLanguage} aria-label="Clear search" className="text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <button
            onClick={() => runPlainLanguage(ask)}
            className="shrink-0 rounded-xl bg-gradient-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
          >
            Show
          </button>
        </div>
        {applied ? (
          <p className="px-1 text-[11px] font-semibold text-primary">{applied}</p>
        ) : (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide">
            {EXAMPLES.map((e) => (
              <button
                key={e}
                onClick={() => { setAsk(e); runPlainLanguage(e); }}
                className="shrink-0 rounded-2xl border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground transition-smooth active:scale-95"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={cn(
              'shrink-0 rounded-2xl px-4 py-2 text-xs font-semibold transition-smooth active:scale-95',
              range === r.id ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'bg-secondary text-secondary-foreground'
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        <button
          onClick={() => setModule(null)}
          className={cn(
            'shrink-0 rounded-2xl border px-3 py-1.5 text-[11px] font-semibold transition-smooth',
            !module ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
          )}
        >
          All
        </button>
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => setModule(module === m.id ? null : m.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-[11px] font-semibold transition-smooth',
              module === m.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
            )}
          >
            <m.icon className="h-3.5 w-3.5" /> {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="smarty-card flex items-center justify-center p-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <div className="smarty-card p-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">No memories here yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Widen the range or capture something new.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key}>
              <div className="sticky top-16 z-10 -mx-4 mb-2.5 bg-background/85 px-4 py-1.5 backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{g.label}</p>
              </div>
              <div className="space-y-2.5">
                {g.items.map((m) => <MemoryCard key={m.id} memory={m} onDelete={remove} onMove={reclassify} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
