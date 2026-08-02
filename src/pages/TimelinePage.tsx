import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarRange, Loader2, Search, Sparkles, Trash2, X } from 'lucide-react';
import { groupByDay, useMemories, Memory } from '@/lib/memories';
import MemoryCard from '@/components/MemoryCard';
import MemoryDetailSheet from '@/components/MemoryDetailSheet';
import { Input } from '@/components/ui/input';
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
  const { memories, loading, remove, reclassify, update } = useMemories();
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('week');
  const [module, setModule] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [ask, setAsk] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showDates, setShowDates] = useState(false);
  const [selected, setSelected] = useState<Memory | null>(null);

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
    const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : 0;
    const toTs = to ? new Date(`${to}T23:59:59`).getTime() : 0;
    if (fromTs || toTs) cutoff = 0;
    return memories.filter((m) => {
      const ts = new Date(m.occurred_at).getTime();
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      if (cutoff && ts < cutoff) return false;
      if (module && m.module !== module) return false;
      if (query) {
        const hay = `${m.title} ${m.summary ?? ''} ${m.content ?? ''} ${m.ai_tags.join(' ')}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [memories, range, module, query, from, to]);

  const groups = groupByDay(filtered);

  return (
    <div className="space-y-5">
      <header className="animate-fade-up flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap a record to open or edit it · tap its category chip to move it.
          </p>
        </div>
        <Link
          to="/app/trash"
          aria-label="Trash"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition-smooth active:scale-95"
        >
          <Trash2 className="h-4 w-4" />
        </Link>
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

      <div className="animate-fade-up space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 focus-within:border-primary/50">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword…"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query ? (
              <button onClick={() => setQuery('')} aria-label="Clear keyword"><X className="h-4 w-4 text-muted-foreground" /></button>
            ) : null}
          </div>
          <button
            onClick={() => setShowDates((v) => !v)}
            aria-label="Filter by date"
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-smooth active:scale-95',
              showDates || from || to ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
            )}
          >
            <CalendarRange className="h-4 w-4" />
          </button>
        </div>
        {showDates && (
          <div className="smarty-card flex items-end gap-2 p-3">
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-9 text-xs" />
            </div>
            <div className="min-w-0 flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-9 text-xs" />
            </div>
            <button
              onClick={() => { setFrom(''); setTo(''); }}
              className="h-9 shrink-0 rounded-xl bg-secondary px-3 text-[11px] font-semibold text-secondary-foreground"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => { setRange(r.id); setFrom(''); setTo(''); }}
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
                {g.items.map((m) => <MemoryCard key={m.id} memory={m} onDelete={remove} onMove={reclassify} onOpen={setSelected} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? 'record' : 'records'} — tap any record to open, edit or move it.
      </p>

      <MemoryDetailSheet
        memory={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        allMemories={memories}
        onOpenMemory={setSelected}
        onSave={update}
        onMove={reclassify}
        onDelete={remove}
      />
    </div>
  );
};

export default TimelinePage;
