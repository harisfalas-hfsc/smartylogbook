import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Paperclip,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Memory, useMemories, whenLabel } from '@/lib/memories';
import { REMINDER_TYPES, Reminder, ReminderType, reminderIcon, requestNotificationPermission, useReminders } from '@/lib/reminders';
import { getModule, kindIcon } from '@/lib/constants';
import { asStatus, isOverdue, STATUS_FILTERS, STATUS_META } from '@/lib/status';
import MemoryDetailSheet from '@/components/MemoryDetailSheet';
import ReminderDetailSheet from '@/components/ReminderDetailSheet';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';


const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const dayKey = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const monthLabel = (d: Date) => d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const longDay = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** Monday-first grid of 42 cells covering the visible month. */
const buildGrid = (cursor: Date) => {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const CalendarPage = () => {
  const { memories, loading, remove: removeMemory, reclassify, update: updateMemory } = useMemories();
  const {
    reminders, create, toggleDone, remove, update: updateReminder, reschedule,
  } = useReminders();

  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderType>('event');
  const [time, setTime] = useState('09:00');
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done' | 'postponed'>('all');
  const [openReminder, setOpenReminder] = useState<Reminder | null>(null);
  const [openMemory, setOpenMemory] = useState<Memory | null>(null);


  const byDay = useMemo(() => {
    const map = new Map<string, { logged: typeof memories; scheduled: typeof reminders }>();
    const bucket = (k: string) => {
      if (!map.has(k)) map.set(k, { logged: [], scheduled: [] });
      return map.get(k)!;
    };
    memories.forEach((m) => bucket(dayKey(m.occurred_at)).logged.push(m));
    reminders.forEach((r) => bucket(dayKey(r.due_at)).scheduled.push(r));
    return map;
  }, [memories, reminders]);

  const grid = useMemo(() => buildGrid(cursor), [cursor]);
  const todayKey = dayKey(new Date());
  const selectedKey = selected ? dayKey(selected) : null;
  const dayData = selectedKey ? byDay.get(selectedKey) : undefined;
  const dayScheduled = (dayData?.scheduled ?? []).filter(
    (r) => statusFilter === 'all' || asStatus(r.status ?? (r.done ? 'done' : 'open')) === statusFilter
  );
  const dayLogged = (dayData?.logged ?? []).filter(
    (m) => statusFilter === 'all' || asStatus(m.status) === statusFilter
  );
  const activeReminder = openReminder ? reminders.find((r) => r.id === openReminder.id) ?? openReminder : null;
  const activeMemory = openMemory ? memories.find((m) => m.id === openMemory.id) ?? openMemory : null;


  const shift = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  const upcoming = useMemo(
    () =>
      reminders
        .filter((r) => !r.done && new Date(r.due_at).getTime() >= Date.now())
        .slice(0, 4),
    [reminders]
  );

  const addForDay = async () => {
    if (!selected) return;
    if (!title.trim()) {
      toast.error('Give it a name');
      return;
    }
    const [h, m] = time.split(':').map(Number);
    const due = new Date(selected);
    due.setHours(h || 0, m || 0, 0, 0);
    setSaving(true);
    const permission = await requestNotificationPermission();
    const { error } = await create({ title: title.trim(), type, due_at: due.toISOString() });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle('');
    toast.success(
      permission === 'granted' ? 'Added to your calendar' : 'Saved, allow notifications to be nudged'
    );
  };

  return (
    <div className="space-y-4 pb-28">

      <header className="flex items-center justify-between px-0.5">
        <div>
          <h1 className="text-lg font-bold text-foreground">Calendar</h1>
          <p className="text-xs text-muted-foreground">What you logged, and what is coming.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            setSelected(now);
          }}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-smooth active:scale-95"
        >
          Today
        </button>
      </header>

      <section className="smarty-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shift(-1)}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-foreground transition-smooth active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-bold text-foreground">{monthLabel(cursor)}</p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shift(1)}
            className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-foreground transition-smooth active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 pb-1">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {d}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="grid h-52 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {grid.map((d) => {
              const k = dayKey(d);
              const data = byDay.get(k);
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = k === todayKey;
              const isSelected = k === selectedKey;
              const logged = data?.logged.length ?? 0;
              const scheduled = data?.scheduled.filter((r) => !r.done).length ?? 0;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected(d)}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl text-xs font-semibold transition-smooth active:scale-95',
                    inMonth ? 'text-foreground' : 'text-muted-foreground/40',
                    isSelected ? 'bg-primary text-primary-foreground' : isToday ? 'bg-primary/10 text-primary' : 'bg-transparent'
                  )}
                >
                  <span>{d.getDate()}</span>
                  <span className="flex h-1.5 items-center gap-0.5">
                    {logged > 0 && (
                      <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-primary-foreground' : 'bg-primary')} />
                    )}
                    {scheduled > 0 && (
                      <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-primary-foreground/70' : 'bg-warning')} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-2 flex items-center justify-center gap-4 border-t border-border/60 pt-2 text-[10px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Logged</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-warning" /> Scheduled</span>
        </div>
      </section>

      <section className="animate-fade-up">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Coming up</h2>
          <Link to="/app/reminders" className="text-xs font-semibold text-primary">All reminders</Link>
        </div>
        <div className="smarty-card divide-y divide-border/60">
          {upcoming.length === 0 ? (
            <p className="px-3 py-5 text-center text-xs text-muted-foreground">
              Nothing scheduled. Pick a day above to add something.
            </p>
          ) : (
            upcoming.map((r) => {
              const Icon = reminderIcon(r.type);
              return (
                <div key={r.id} className="flex items-center gap-3 px-3 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(r.due_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} · {timeOf(r.due_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              {selected ? longDay(selected) : ''}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-3 space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-smooth active:scale-95',
                    statusFilter === f.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Scheduled</p>
              <div className="smarty-card divide-y divide-border/60">
                {dayScheduled.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground">Nothing scheduled this day.</p>
                ) : (
                  dayScheduled.map((r) => {
                    const Icon = reminderIcon(r.type);
                    const st = asStatus(r.status ?? (r.done ? 'done' : 'open'));
                    const meta = STATUS_META[st];
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setOpenReminder(r)}
                        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-smooth active:scale-[0.99]"
                      >
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={r.done ? 'Mark as pending' : 'Mark as done'}
                          onClick={(e) => { e.stopPropagation(); toggleDone(r.id, !r.done); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); toggleDone(r.id, !r.done); } }}
                          className={cn(
                            'grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-smooth active:scale-95',
                            r.done ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'
                          )}
                        >
                          {r.done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn('truncate text-sm font-semibold text-foreground', r.done && 'line-through opacity-60')}>
                            {r.title}
                          </p>
                          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            {timeOf(r.due_at)}
                            {isOverdue(r.due_at, st) && <span className="font-semibold text-destructive">Overdue</span>}
                            {r.attachment_url && <Paperclip className="h-3 w-3" />}
                          </p>
                        </div>
                        {st !== 'open' && (
                          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', meta.badge)}>
                            {meta.label}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Logged</p>
              <div className="smarty-card divide-y divide-border/60">
                {dayLogged.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-muted-foreground">Nothing logged this day.</p>
                ) : (
                  dayLogged.map((m) => {
                    const mod = getModule(m.module);
                    const Icon = kindIcon(m.kind);
                    const st = asStatus(m.status);
                    const meta = STATUS_META[st];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setOpenMemory(m)}
                        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-smooth active:scale-[0.99]"
                      >
                        <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-2xl', mod.tint)}>
                          <Icon className={cn('h-4 w-4', mod.color)} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn('truncate text-sm font-semibold text-foreground', st === 'done' && 'line-through opacity-60')}>
                            {m.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{mod.label} · {whenLabel(m)}</p>
                        </div>
                        {st !== 'open' && (
                          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', meta.badge)}>
                            {meta.label}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>


            <div className="smarty-card space-y-2.5 p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Add to this day
              </p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Doctor appointment"
                className="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
              />
              <div className="flex flex-wrap gap-1.5">
                {REMINDER_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-smooth active:scale-95',
                      type === t.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'
                    )}
                  >
                    <t.icon className="h-3.5 w-3.5" /> {t.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-2xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={addForDay}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary px-3 py-2.5 text-sm font-bold text-primary-foreground transition-smooth active:scale-95 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Schedule
                </button>
              </div>
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Bell className="h-3 w-3" /> Smarty Assistant sees everything you schedule here.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CalendarPage;
