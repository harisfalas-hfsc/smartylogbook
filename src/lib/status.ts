/**
 * One shared progress model for everything in the logbook: records (memories)
 * and scheduled items (reminders / calendar entries) use the exact same
 * statuses, so a meeting looks and behaves the same wherever you open it.
 */
export type ItemStatus = 'open' | 'done' | 'postponed';

export const STATUS_META: Record<ItemStatus, { label: string; badge: string; dot: string }> = {
  open: {
    label: 'Open',
    badge: 'bg-secondary text-secondary-foreground',
    dot: 'bg-muted-foreground',
  },
  done: {
    label: 'Completed',
    badge: 'bg-success/10 text-success',
    dot: 'bg-success',
  },
  postponed: {
    label: 'Postponed',
    badge: 'bg-warning/10 text-warning',
    dot: 'bg-warning',
  },
};

export const STATUS_FILTERS: { id: 'all' | ItemStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'done', label: 'Completed' },
  { id: 'postponed', label: 'Postponed' },
];

export const asStatus = (value: unknown): ItemStatus =>
  value === 'done' || value === 'postponed' ? value : 'open';

export const isOverdue = (dueAt: string | null | undefined, status: ItemStatus) =>
  !!dueAt && status !== 'done' && new Date(dueAt).getTime() < Date.now();

/** Shift a date forward, used by the Postpone shortcuts. */
export const shiftDays = (iso: string | null | undefined, days: number) => {
  const base = iso ? new Date(iso) : new Date();
  const from = base.getTime() < Date.now() ? new Date() : base;
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next.toISOString();
};

export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const fromLocalInput = (value: string) => new Date(value).toISOString();
