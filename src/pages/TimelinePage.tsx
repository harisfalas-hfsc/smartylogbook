import { useMemo, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { groupByDay, useMemories } from '@/lib/memories';
import MemoryCard from '@/components/MemoryCard';
import { MODULES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const RANGES = [
  { id: 'day', label: 'Day', days: 1 },
  { id: 'week', label: 'Week', days: 7 },
  { id: 'month', label: 'Month', days: 31 },
  { id: 'year', label: 'Year', days: 365 },
  { id: 'all', label: 'All', days: 0 },
] as const;

const TimelinePage = () => {
  const { memories, loading, remove } = useMemories();
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('week');
  const [module, setModule] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const days = RANGES.find((r) => r.id === range)?.days ?? 0;
    const cutoff = days ? Date.now() - days * 86400000 : 0;
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

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter memories…"
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-smooth placeholder:text-muted-foreground focus:border-primary/50"
      />

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
                {g.items.map((m) => <MemoryCard key={m.id} memory={m} onDelete={remove} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
