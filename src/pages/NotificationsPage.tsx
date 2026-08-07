import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/lib/preferences';
import { requestNotificationPermission } from '@/lib/reminders';
import { cn } from '@/lib/utils';

const NOTIFY_ROWS = [
  { key: 'notify_coach', label: 'Daily assistant brief', sub: 'One morning recommendation' },
  { key: 'notify_daily_tip', label: 'Daily tip from Smarty Assistant', sub: 'One hint every day at 6 a.m. your local time' },
  { key: 'notify_tasks', label: 'Tasks & to-dos', sub: 'Context-aware task reminders' },
  { key: 'notify_bills', label: 'Bills & payments', sub: 'Before a payment is due' },
  { key: 'notify_health', label: 'Health check-ins', sub: 'Medication, appointments, symptoms' },
  { key: 'notify_events', label: 'Upcoming events', sub: 'Anything on your calendar list' },
] as const;

const NotificationsPage = () => {
  const { prefs, update } = usePreferences();
  const [permission, setPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );

  const toggleNotify = async (key: string, value: boolean) => {
    if (value) {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      if (perm !== 'granted') toast.info('Allow browser notifications to receive these nudges');
    }
    await update({ [key]: value });
  };

  const testNotification = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
    if (perm !== 'granted') {
      toast.error(
        perm === 'unsupported'
          ? 'This browser cannot show notifications'
          : 'Notifications are blocked, enable them in your browser settings',
      );
      return;
    }
    new Notification('Smarty Logbook', { body: 'Notifications are working. This is a test nudge.' });
    toast.success('Test notification sent');
  };

  return (
    <div className="space-y-5">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Push notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose what reaches you, and when.</p>
      </header>

      <section className="smarty-card animate-fade-up divide-y divide-border p-2">
        {NOTIFY_ROWS.map((r) => {
          const on = prefs ? Boolean(prefs[r.key]) : false;
          return (
            <button
              key={r.key}
              onClick={() => toggleNotify(r.key, !on)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{r.label}</p>
                <p className="text-[11px] text-muted-foreground">{r.sub}</p>
              </div>
              <span className={cn('h-6 w-11 shrink-0 rounded-full p-0.5 transition-smooth', on ? 'bg-primary' : 'bg-muted')}>
                <span className={cn('block h-5 w-5 rounded-full bg-white transition-smooth', on && 'translate-x-5')} />
              </span>
            </button>
          );
        })}

        <div className="px-3 py-3">
          <p className="text-sm font-semibold text-foreground">Morning brief time</p>
          <p className="text-[11px] text-muted-foreground">When today's recommendation lands</p>
          <input
            type="time"
            value={prefs?.coach_time ?? '07:30'}
            onChange={(e) => update({ coach_time: e.target.value })}
            className="mt-2 w-full max-w-full rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-primary outline-none sm:w-40"
          />
        </div>

        <div className="px-3 py-3">
          <p className="text-sm font-semibold text-foreground">Quiet hours</p>
          <p className="text-[11px] text-muted-foreground">No notifications in this window</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:w-[21rem]">
            <input
              type="time"
              value={prefs?.quiet_hours_start ?? '22:00'}
              onChange={(e) => update({ quiet_hours_start: e.target.value })}
              className="w-full min-w-0 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-primary outline-none"
            />
            <input
              type="time"
              value={prefs?.quiet_hours_end ?? '07:00'}
              onChange={(e) => update({ quiet_hours_end: e.target.value })}
              className="w-full min-w-0 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-primary outline-none"
            />
          </div>
        </div>

        <div className="px-3 py-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm font-semibold text-foreground">Browser permission</p>
            <span
              className={cn(
                'ml-auto rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                permission === 'granted' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              {permission === 'granted' ? 'Allowed' : permission === 'denied' ? 'Blocked' : 'Not set'}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            Nudges are delivered by your browser while Smarty Logbook is open, and every alert is
            always waiting for you in Messages.
          </p>
          <button
            onClick={testNotification}
            className="mt-2 w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition-smooth active:scale-[0.98] sm:w-auto sm:px-4"
          >
            Send a test notification
          </button>
        </div>
      </section>

      <Link
        to="/app/reminders"
        className="smarty-card flex animate-fade-up items-center gap-3 px-4 py-3.5 transition-smooth active:scale-[0.99]"
      >
        <Bell className="h-4.5 w-4.5 text-primary" />
        <span className="flex-1 text-sm font-semibold text-foreground">Manage reminders</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
};

export default NotificationsPage;
