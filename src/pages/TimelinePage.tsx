import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search, SlidersHorizontal, Sparkles, Trash2, TrendingUp, X } from 'lucide-react';
import { groupByDay, useMemories, Memory } from '@/lib/memories';
import MemoryCard from '@/components/MemoryCard';
import AssistantAskBar from '@/components/AssistantAskBar';

import MemoryDetailSheet from '@/components/MemoryDetailSheet';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useCategories } from '@/lib/categories';
import { describeQuery, parsePlainLanguage } from '@/lib/nlSearch';
import { asStatus, ItemStatus, STATUS_FILTERS } from '@/lib/status';

import { cn } from '@/lib/utils';

const RANGES = [
  { id: 'today', label: 'Today', days: 1 },
  { id: 'week', label: 'Week', days: 7 },
  { id: 'month', label: 'Month', days: 31 },
  { id: 'all', label: 'All', days: 0 },
] as const;

const EXAMPLES = ['show me my expenses last month', 'show me workouts this week', 'show me health notes this year'];

const PAGE = 25;

const TimelinePage = () => {
  const { memories, loading, remove, reclassify, update } = useMemories();
  const { categories } = useCategories();
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('all');
  const [module, setModule] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [ask, setAsk] = useState('');
  const [applied, setApplied] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useState<'all' | ItemStatus>('all');
  const [visible, setVisible] = useState(PAGE);
  const [selected, setSelected] = useState<Memory | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);


  const runPlainLanguage = (raw: string) => {
    const parsed = parsePlainLanguage(raw);
    if (!parsed.matched) {
      setApplied(null);
      return false;
    }
    if (parsed.range) setRange(parsed.range === 'today' ? 'today' : (parsed.range as typeof range));
    setModule(parsed.module);
    setQuery(parsed.keywords);
    setApplied(describeQuery(parsed));
    return true;
  };


  const clearAll = () => {
    setAsk('');
    setApplied(null);
    setQuery('');
    setModule(null);
    setRange('all');
    setFrom('');
    setTo('');
    setStatus('all');
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
      if (status !== 'all' && asStatus(m.status) !== status) return false;
      if (query) {
        const label = categories.find((c) => c.id === m.module)?.label ?? '';
        const hay =
          `${m.title} ${m.summary ?? ''} ${m.content ?? ''} ${m.ai_tags.join(' ')} ${m.module} ${label} ${m.kind ?? ''}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [memories, range, module, query, from, to, status, categories]);


  useEffect(() => {
    setVisible(PAGE);
  }, [range, module, query, from, to, status]);


  // Infinite scroll
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisible((v) => v + PAGE);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length]);

  const shown = filtered.slice(0, visible);
  const groups = groupByDay(shown);
  const selectedMemory = selected ? memories.find((m) => m.id === selected.id) ?? selected : null;

  const activeFilters = (module ? 1 : 0) + (from || to ? 1 : 0) + (query ? 1 : 0);
  const anyFilter = activeFilters > 0 || status !== 'all' || range !== 'all' || !!applied || !!ask;


  const weekCount = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    return memories.filter((m) => new Date(m.occurred_at).getTime() >= cutoff).length;
  }, [memories]);

  const topCategory = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000;
    const counts = new Map<string, number>();
    memories
      .filter((m) => new Date(m.occurred_at).getTime() >= cutoff)
      .forEach((m) => counts.set(m.module, (counts.get(m.module) ?? 0) + 1));
    const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return best ? categories.find((c) => c.id === best[0])?.label ?? null : null;
  }, [memories, categories]);

  return (
    <div className="space-y-4">
      <header className="animate-fade-up flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">What happened, newest first. Tap a record to open it.</p>
        </div>
        <Link
          to="/app/trash"
          aria-label="Trash"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition-smooth active:scale-95"
        >
          <Trash2 className="h-4 w-4" />
        </Link>
      </header>

      {/* One Smarty Assistant bar — filters here, or hands the question to the Assistant */}
      <div className="space-y-2">
        <AssistantAskBar
          value={ask}
          onChange={setAsk}
          onSubmit={(q) => runPlainLanguage(q)}
          placeholder="Ask Smarty Assistant, e.g. my expenses last month…"
          hint={applied ? undefined : 'Anything your timeline cannot filter goes straight to Smarty Assistant.'}
        />
        {applied ? (
          <p className="px-1 text-[11px] font-semibold text-primary">{applied}</p>
        ) : (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide">
            {EXAMPLES.map((e) => (
              <button
                key={e}
                onClick={() => {
                  setAsk(e);
                  runPlainLanguage(e);
                }}
                className="shrink-0 rounded-2xl border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground transition-smooth active:scale-95"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>


      {/* Row 1 — date range + filters */}
      <div className="animate-fade-up flex items-center gap-2">
        <div className="flex h-10 min-w-0 flex-1 rounded-2xl bg-secondary p-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setRange(r.id);
                setFrom('');
                setTo('');
              }}
              className={cn(
                'min-w-0 flex-1 rounded-xl px-2 text-xs font-semibold transition-smooth',
                range === r.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFiltersOpen(true)}
          aria-label="Filters"
          className={cn(
            'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-smooth active:scale-95',
            activeFilters ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilters > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Row 2 — status, identical bar; right slot clears everything */}
      <div className="animate-fade-up flex items-center gap-2">
        <div className="flex h-10 min-w-0 flex-1 rounded-2xl bg-secondary p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={cn(
                'min-w-0 flex-1 truncate rounded-xl px-2 text-xs font-semibold transition-smooth',
                status === f.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={clearAll}
          disabled={!anyFilter}
          aria-label="Clear all filters"
          title="Clear all filters"
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-smooth active:scale-95',
            anyFilter
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground opacity-50',
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Row 3 — same rhythm: what it means → Insights */}
      {memories.length > 0 && (
        <Link
          to="/app/insights"
          className="animate-fade-up flex items-center gap-2 transition-smooth active:scale-[0.99]"
        >
          <span className="flex h-10 min-w-0 flex-1 items-center rounded-2xl bg-secondary px-3">
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted-foreground">
              <span className="text-foreground">
                {weekCount} {weekCount === 1 ? 'record' : 'records'} this week
              </span>
              {topCategory ? ` · mostly ${topCategory}` : ''} — see Insights
            </span>
          </span>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
          </span>
        </Link>
      )}


      {loading ? (
        <div className="smarty-card flex items-center justify-center p-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 && noCopy ? (
        <OfflineNotice />
      ) : groups.length === 0 ? (
        <div className="smarty-card p-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">Nothing matches these filters</p>
          <p className="mt-1 text-xs text-muted-foreground">Clear the filters or capture something new.</p>
          <button
            onClick={clearAll}
            className="mt-3 rounded-2xl bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.key}>
              <div className="sticky top-16 z-10 -mx-4 mb-2.5 flex items-center gap-2 bg-background/85 px-4 py-1.5 backdrop-blur-xl">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{g.label}</p>
                <span className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-semibold text-muted-foreground">{g.items.length}</span>
              </div>
              <div className="space-y-2.5">
                {g.items.map((m) => (
                  <MemoryCard key={m.id} memory={m} onDelete={remove} onMove={reclassify} onOpen={setSelected} />
                ))}
              </div>
            </section>
          ))}
          <div ref={sentinel} className="h-6" />
        </div>
      )}

      <p className="pb-2 text-center text-[11px] text-muted-foreground">
        Showing {shown.length} of {filtered.length} {filtered.length === 1 ? 'record' : 'records'}.
      </p>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="text-left text-base">Filters</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-5">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Keyword</p>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 focus-within:border-primary/50">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by keyword…"
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                {query ? (
                  <button onClick={() => setQuery('')} aria-label="Clear keyword">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                ) : null}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Category</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setModule(null)}
                  className={cn(
                    'rounded-2xl border px-3 py-1.5 text-[11px] font-semibold transition-smooth',
                    !module ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground',
                  )}
                >
                  All
                </button>
                {categories.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModule(module === m.id ? null : m.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-[11px] font-semibold transition-smooth',
                      module === m.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    <m.icon className="h-3.5 w-3.5" /> {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Custom dates</p>
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">From</label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-9 text-xs" />
                </div>
                <div className="min-w-0 flex-1">
                  <label className="text-[10px] font-semibold text-muted-foreground">To</label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-9 text-xs" />
                </div>
                <button
                  onClick={() => {
                    setFrom('');
                    setTo('');
                  }}
                  className="h-9 shrink-0 rounded-xl bg-secondary px-3 text-[11px] font-semibold text-secondary-foreground"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex gap-2 pb-2">
              <button
                onClick={clearAll}
                className="flex-1 rounded-2xl bg-secondary py-3 text-xs font-bold text-secondary-foreground"
              >
                Reset all
              </button>
              <button
                onClick={() => setFiltersOpen(false)}
                className="flex-1 rounded-2xl bg-gradient-primary py-3 text-xs font-bold text-primary-foreground"
              >
                Show {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <MemoryDetailSheet
        memory={selectedMemory}
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
