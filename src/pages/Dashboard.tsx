import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, CalendarDays, ChevronRight, Loader2, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMemories, whenLabel, Memory } from '@/lib/memories';
import { useProactiveAlerts } from '@/lib/alerts';
import { useCategories } from '@/lib/categories';
import { useReminders, reminderIcon } from '@/lib/reminders';
import MemoryDetailSheet from '@/components/MemoryDetailSheet';
import { kindIcon } from '@/lib/constants';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard = () => {
  const { profile, user } = useAuth();
  const { memories, loading, reclassify, update, remove } = useMemories({ limit: 60 });
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const { alerts } = useProactiveAlerts();
  const { categories } = useCategories();
  const { reminders } = useReminders();

  const name = profile?.username ?? user?.email?.split('@')[0] ?? 'there';
  const todayKey = new Date().toDateString();

  const today = useMemo(
    () => memories.filter((m) => new Date(m.occurred_at).toDateString() === todayKey),
    [memories, todayKey]
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    memories.forEach((m) => { map[m.module] = (map[m.module] ?? 0) + 1; });
    return map;
  }, [memories]);

  // Busiest categories first, then the two-row grid keeps the home screen light.
  const ordered = useMemo(
    () => [...categories].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0)),
    [categories, counts]
  );
  const topCategories = ordered.slice(0, 8);

  const upcoming = useMemo(
    () => reminders
      .filter((r) => !r.done && new Date(r.due_at).getTime() >= Date.now() - 12 * 60 * 60 * 1000)
      .slice(0, 2),
    [reminders]
  );

  const dueLabel = (iso: string) => {
    const d = new Date(iso);
    const day = d.toDateString();
    const t = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    if (day === todayKey) return `Today · ${t}`;
    const tomorrow = new Date(Date.now() + 86400000).toDateString();
    if (day === tomorrow) return `Tomorrow · ${t}`;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ` · ${t}`;
  };

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const timelineItems = (today.length ? today : memories).slice(0, 4);

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* Greeting */}
      <header className="animate-fade-up px-0.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{dateLabel}</p>
        <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-foreground">
          {greeting()}, {name}
        </h1>
      </header>

      {/* One alert max, so the screen stays calm */}
      {alerts.length > 0 && (
        <Link
          to="/app/reminders"
          className="smarty-card flex animate-fade-up items-center gap-3 border-warning/40 p-3.5"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{alerts[0].title}</p>
          {alerts.length > 1 && (
            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              +{alerts.length - 1}
            </span>
          )}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {/* 1. Timeline, the hero of the home screen */}
      <section className="animate-fade-up">
        <div className="smarty-card overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-border bg-primary/[0.04] px-4 py-3.5">
            <div className="min-w-0">
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                Timeline
              </h2>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {today.length ? 'Everything you logged today' : 'Your latest records, newest first'}
              </p>
            </div>
            <Link
              to="/app/timeline"
              className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary"
            >
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="grid h-28 place-items-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : timelineItems.length === 0 ? (
            <div className="p-6 text-center">
              <Sparkles className="mx-auto h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">Your logbook is empty</p>
              <p className="mt-0.5 text-xs text-muted-foreground">A thought, a meal, a receipt, start anywhere.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {timelineItems.map((m) => {
                const Icon = kindIcon(m.kind);
                const mod = categories.find((c) => c.id === m.module) ?? categories[categories.length - 1];
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMemory(m)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-smooth active:bg-secondary/60"
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${mod.tint}`}>
                      <Icon className={`h-4.5 w-4.5 ${mod.color}`} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{m.title}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{mod.label}</span>
                    </span>
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{whenLabel(m)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 2. Calendar, second in weight */}
      <section className="animate-fade-up">
        <div className="smarty-card overflow-hidden">
          <Link
            to="/app/calendar"
            className="flex items-center gap-3 border-b border-border bg-primary/[0.04] px-4 py-3.5 transition-smooth active:opacity-80"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDays className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-extrabold tracking-tight text-foreground">Calendar</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                Scheduled and logged days, month by month
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          </Link>
          <div className="divide-y divide-border">
            {upcoming.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">Nothing scheduled. Your days are clear.</p>
            ) : (
              upcoming.map((r) => {
                const Icon = reminderIcon(r.type);
                return (
                  <Link
                    key={r.id}
                    to="/app/reminders"
                    className="flex items-center gap-3 px-4 py-2.5 transition-smooth active:bg-secondary/60"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary text-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{r.title}</span>
                    <span className="shrink-0 text-[10px] font-medium tabular-nums text-muted-foreground">
                      {dueLabel(r.due_at)}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 3. Categories, two rows of the busiest, the rest live on See all */}
      <section className="animate-fade-up">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Categories</h2>
          <Link to="/app/categories" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {topCategories.map((m) => (
            <Link
              key={m.id}
              to={`/app/category/${m.id}`}
              className="smarty-card flex flex-col items-center gap-1.5 px-1 py-3 transition-smooth active:scale-95"
            >
              <span className={`grid h-9 w-9 place-items-center rounded-2xl ${m.tint}`}>
                <m.icon className={`h-4.5 w-4.5 ${m.color}`} />
              </span>
              <span className="w-full truncate text-center text-[10px] font-bold text-foreground">{m.label}</span>
              <span className="text-[9px] font-medium text-muted-foreground">{counts[m.id] ?? 0}</span>
            </Link>
          ))}
        </div>
      </section>

      <MemoryDetailSheet
        memory={selectedMemory}
        open={!!selectedMemory}
        onOpenChange={(o) => !o && setSelectedMemory(null)}
        allMemories={memories}
        onOpenMemory={setSelectedMemory}
        onSave={update}
        onMove={reclassify}
        onDelete={remove}
      />
    </div>
  );
};

export default Dashboard;
