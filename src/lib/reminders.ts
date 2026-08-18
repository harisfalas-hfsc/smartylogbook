import { useCallback, useEffect, useState } from 'react';
import {
  Bell, CalendarClock, HeartPulse, Receipt, CheckSquare, Dumbbell, Utensils,
  FileText, Briefcase, Gift,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { offlineFirst } from '@/lib/offline/offline-first';
import { useAuth } from '@/contexts/AuthContext';
import type { Preferences } from '@/lib/preferences';

export type ReminderType =
  | 'task' | 'bill' | 'health' | 'event' | 'fitness' | 'nutrition'
  | 'document' | 'work' | 'personal';

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  type: string;
  module: string | null;
  amount: number | null;
  due_at: string;
  repeat_rule: string | null;
  notified_at: string | null;
  done: boolean;
  notes?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  status?: string | null;
  completed_at?: string | null;
}

export const REMINDER_TYPES: { id: ReminderType; label: string; icon: typeof Bell }[] = [
  { id: 'task', label: 'Task', icon: CheckSquare },
  { id: 'event', label: 'Event', icon: CalendarClock },
  { id: 'bill', label: 'Bill', icon: Receipt },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'nutrition', label: 'Nutrition', icon: Utensils },
  { id: 'document', label: 'Document', icon: FileText },
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'personal', label: 'Personal', icon: Gift },
];

export const reminderIcon = (type: string) =>
  REMINDER_TYPES.find((t) => t.id === type)?.icon ?? Bell;

export const useReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }
    try {
      const rows = await offlineFirst<Reminder[]>(
        'reminders:list',
        async () => {
          const { data } = await supabase
            .from('reminders')
            .select('*')
            .order('due_at', { ascending: true });
          return (data ?? []) as Reminder[];
        },
        user.id,
      );
      setReminders(rows);
    } catch {
      setReminders([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (r: {
    title: string;
    type: ReminderType;
    due_at: string;
    amount?: number | null;
    module?: string | null;
    repeat_rule?: string | null;
    notes?: string | null;
    attachment_url?: string | null;
    attachment_name?: string | null;
  }) => {
    if (!user) return { error: new Error('Not signed in') };
    const { error } = await supabase.from('reminders').insert({
      user_id: user.id,
      title: r.title,
      type: r.type,
      due_at: r.due_at,
      amount: r.amount ?? null,
      module: r.module ?? null,
      repeat_rule: r.repeat_rule ?? null,
      notes: r.notes ?? null,
      attachment_url: r.attachment_url ?? null,
      attachment_name: r.attachment_name ?? null,
    } as never);
    if (!error) await load();
    return { error };
  };

  const clearAlert = async (id: string, title?: string) => {
    await Promise.all([
      supabase
        .from('proactive_alerts')
        .update({ dismissed: true, seen: true })
        .like('dedupe_key', `reminder:${id}:%`),
      supabase
        .from('messages')
        .delete()
        .like('dedupe_key', `scan:reminder:${id}:%`),
    ]);

    // Daily insights and assistant briefs summarize calendar items rather than
    // retaining their ids. Remove those snapshots when their source is gone.
    if (title?.trim()) {
      const escaped = title.trim().replace(/[%,]/g, '');
      if (escaped) {
        await supabase
          .from('messages')
          .delete()
          .or(`title.ilike.%${escaped}%,body.ilike.%${escaped}%`);
      }
    }
  };

  const patch = async (id: string, values: Partial<Reminder>) => {
    const previous = reminders.find((r) => r.id === id);
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...values } : r)));
    const { error } = await supabase.from('reminders').update(values as never).eq('id', id);
    if (error && previous) {
      setReminders((prev) => prev.map((r) => (r.id === id ? previous : r)));
    }
    return { error };
  };

  const toggleDone = async (id: string, done: boolean) => {
    const { error } = await patch(id, {
      done,
      status: done ? 'done' : 'open',
      completed_at: done ? new Date().toISOString() : null,
    });
    if (error) return { error };
    if (done) await clearAlert(id);
    return { error: null };
  };

  /** Move a scheduled item to a new date, and mark it postponed. */
  const reschedule = async (id: string, dueAt: string) =>
    patch(id, { due_at: dueAt, status: 'postponed', done: false, completed_at: null, notified_at: null });

  const remove = async (id: string) => {
    const removed = reminders.find((r) => r.id === id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) {
      if (removed) setReminders((prev) => [...prev, removed].sort((a, b) => a.due_at.localeCompare(b.due_at)));
      return { error };
    }
    await clearAlert(id, removed?.title);
    return { error: null };
  };

  return { reminders, loading, reload: load, create, toggleDone, remove, update: patch, reschedule };
};

const typeEnabled = (prefs: Preferences, type: string) => {
  if (type === 'bill') return prefs.notify_bills;
  if (type === 'health' || type === 'fitness' || type === 'nutrition') return prefs.notify_health;
  if (type === 'event') return prefs.notify_events;
  return prefs.notify_tasks;
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const inQuietHours = (prefs: Preferences, at = new Date()) => {
  const now = at.getHours() * 60 + at.getMinutes();
  const start = toMinutes(prefs.quiet_hours_start);
  const end = toMinutes(prefs.quiet_hours_end);
  return start <= end ? now >= start && now < end : now >= start || now < end;
};

export const requestNotificationPermission = async () => {
  if (typeof Notification === 'undefined') return 'unsupported' as const;
  if (Notification.permission === 'granted') return 'granted' as const;
  return (await Notification.requestPermission()) as NotificationPermission;
};

/**
 * Context-aware local notifications: checks every minute for due reminders and
 * the daily assistant brief, respecting the user's per-type toggles and quiet hours.
 */
export const useNotificationEngine = (prefs: Preferences | null) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !prefs) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    let stopped = false;

    const fire = (title: string, body: string) => {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch {
        /* notification blocked */
      }
    };

    const tick = async () => {
      if (stopped || inQuietHours(prefs)) return;
      const now = new Date();

      // Assistant brief at the chosen morning time
      if (prefs.notify_coach) {
        const key = `smarty-coach-notified-${now.toDateString()}`;
        const [h, m] = prefs.coach_time.split(':').map(Number);
        const scheduled = new Date(now);
        scheduled.setHours(h || 7, m || 30, 0, 0);
        if (now >= scheduled && !localStorage.getItem(key)) {
          localStorage.setItem(key, '1');
          fire('Your daily focus is ready', 'Open Smarty Logbook to see today’s recommendation.');
        }
      }

      // Proactive alerts written by the nightly background scan
      const { data: openAlerts } = await supabase
        .from('proactive_alerts')
        .select('id,kind,title,detail,severity')
        .eq('dismissed', false)
        .is('notified_at', null)
        .limit(5);

      for (const a of openAlerts ?? []) {
        if (!typeEnabled(prefs, String(a.kind))) continue;
        fire(String(a.title), String(a.detail ?? 'Open Smarty Logbook for details.'));
        await supabase
          .from('proactive_alerts')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', a.id);
      }

      const { data } = await supabase
        .from('reminders')
        .select('*')
        .eq('done', false)
        .is('notified_at', null)
        .lte('due_at', now.toISOString());

      for (const r of (data ?? []) as Reminder[]) {
        if (!typeEnabled(prefs, r.type)) continue;
        const label = REMINDER_TYPES.find((t) => t.id === r.type)?.label ?? 'Reminder';
        fire(`${label}: ${r.title}`, r.amount ? `Amount: ${r.amount}` : 'Tap to open your logbook.');
        await supabase
          .from('reminders')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', r.id);
      }
    };

    tick();
    const interval = window.setInterval(tick, 60000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [user, prefs]);
};
