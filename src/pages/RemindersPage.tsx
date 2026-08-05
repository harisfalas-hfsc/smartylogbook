import { useMemo, useState } from 'react';
import { Bell, CalendarClock, Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { REMINDER_TYPES, ReminderType, reminderIcon, requestNotificationPermission, useReminders } from '@/lib/reminders';
import { cn } from '@/lib/utils';

const defaultDue = () => {
  const d = new Date(Date.now() + 3600000);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const RemindersPage = () => {
  const { reminders, loading, create, toggleDone, remove } = useReminders();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderType>('task');
  const [dueAt, setDueAt] = useState(defaultDue);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const { upcoming, overdue, completed } = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: reminders.filter((r) => !r.done && new Date(r.due_at).getTime() >= now),
      overdue: reminders.filter((r) => !r.done && new Date(r.due_at).getTime() < now),
      completed: reminders.filter((r) => r.done),
    };
  }, [reminders]);

  const add = async () => {
    if (!title.trim()) {
      toast.error('Give your reminder a name');
      return;
    }
    setSaving(true);
    const permission = await requestNotificationPermission();
    const { error } = await create({
      title: title.trim(),
      type,
      due_at: new Date(dueAt).toISOString(),
      amount: amount ? Number(amount) : null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle('');
    setAmount('');
    toast.success(
      permission === 'granted' ? 'Reminder scheduled' : 'Reminder saved, allow notifications to be nudged'
    );
  };

  const row = (r: (typeof reminders)[number]) => {
    const Icon = reminderIcon(r.type);
    return (
      <div key={r.id} className="flex items-center gap-3 px-3 py-3">
        <button
          onClick={() => toggleDone(r.id, !r.done)}
          aria-label={r.done ? 'Mark as pending' : 'Mark as done'}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-smooth active:scale-95',
            r.done ? 'bg-gradient-primary text-primary-foreground' : 'bg-secondary text-primary'
          )}
        >
          {r.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-semibold text-foreground', r.done && 'line-through opacity-60')}>
            {r.title}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {new Date(r.due_at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            {r.amount ? ` · ${r.amount}` : ''}
          </p>
        </div>
        <button
          onClick={() => remove(r.id)}
          aria-label="Delete reminder"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-smooth active:scale-95"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Reminders</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bills, health check-ins and events, nudged at the right time.</p>
      </header>

      <section className="smarty-card animate-fade-up space-y-3 p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Electricity bill"
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50"
        />
        <div className="flex flex-wrap gap-2">
          {REMINDER_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-semibold transition-smooth active:scale-95',
                type === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
              )}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50"
          />
          {type === 'bill' && (
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="Amount"
              className="w-28 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary/50"
            />
          )}
        </div>
        <button
          onClick={add}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-95 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Schedule reminder
        </button>
      </section>

      {loading ? (
        <div className="smarty-card flex items-center justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <section className="animate-fade-up">
            <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-bold text-foreground">
              <CalendarClock className="h-4 w-4 text-primary" /> Upcoming
            </h2>
            {upcoming.length ? (
              <div className="smarty-card divide-y divide-border p-1">{upcoming.map(row)}</div>
            ) : (
              <div className="smarty-card p-6 text-center">
                <Bell className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-xs text-muted-foreground">Nothing scheduled yet.</p>
              </div>
            )}
          </section>

          {overdue.length > 0 && (
            <section className="animate-fade-up">
              <h2 className="mb-2.5 text-sm font-bold text-destructive">Overdue</h2>
              <div className="smarty-card divide-y divide-border border-destructive/30 p-1">{overdue.map(row)}</div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="animate-fade-up">
              <h2 className="mb-2.5 text-sm font-bold text-foreground">Completed</h2>
              <div className="smarty-card divide-y divide-border p-1">{completed.slice(0, 20).map(row)}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default RemindersPage;
