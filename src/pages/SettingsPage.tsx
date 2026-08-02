import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Bell, ChevronRight, FileText, Fingerprint, LogOut, Moon, Shield, ShieldCheck, Sparkles, Target, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/lib/admin';
import { useMemories } from '@/lib/memories';
import { usePreferences } from '@/lib/preferences';
import { requestNotificationPermission } from '@/lib/reminders';
import { cn } from '@/lib/utils';

const NOTIFY_ROWS = [
  { key: 'notify_coach', label: 'Daily assistant brief', sub: 'One morning recommendation' },
  { key: 'notify_tasks', label: 'Tasks & to-dos', sub: 'Context-aware task reminders' },
  { key: 'notify_bills', label: 'Bills & payments', sub: 'Before a payment is due' },
  { key: 'notify_health', label: 'Health check-ins', sub: 'Medication, appointments, symptoms' },
  { key: 'notify_events', label: 'Upcoming events', sub: 'Anything on your calendar list' },
] as const;

const SettingsPage = () => {
  const { user, profile, signOut } = useAuth();
  const { memories } = useMemories();
  const { prefs, update } = usePreferences();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

  const toggleNotify = async (key: string, value: boolean) => {
    if (value) {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        toast.info('Allow browser notifications to receive these nudges');
      }
    }
    await update({ [key]: value });
  };

  const rows = [
    { icon: User, label: 'Account & data', value: user?.email ?? '', to: '/app/account' },
    { icon: Fingerprint, label: 'Biometric lock', value: 'Device', to: '/app/privacy' },
    { icon: Shield, label: 'Privacy & security', value: 'Encrypted', to: '/app/privacy' },
    { icon: Moon, label: 'Appearance', value: 'Light / Dark', to: '/app/appearance' },
  ];

  const legalRows = [
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms & Conditions', to: '/terms-and-conditions' },
    { label: 'Disclaimer', to: '/disclaimer' },
  ];

  return (
    <div className="space-y-5">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account, your data, your rules.</p>
      </header>

      <section className="smarty-card animate-fade-up flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-primary text-xl font-extrabold text-primary-foreground shadow-glow">
          {(profile?.username ?? user?.email ?? 'S').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-foreground">{profile?.username ?? 'Your logbook'}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <p className="mt-1 text-[11px] font-semibold text-primary">{memories.length} memories stored</p>
        </div>
      </section>

      {isAdmin && (
        <Link
          to="/app/admin"
          className="smarty-card animate-fade-up flex items-center gap-3 border-primary/40 px-4 py-3.5 transition-smooth active:scale-[0.99]"
        >
          <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          <span className="flex-1 text-sm font-bold text-foreground">Admin panel</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">Admin</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <section className="smarty-card animate-fade-up divide-y divide-border p-2">
        {rows.map((r) => (
          <Link
            key={r.label}
            to={r.to}
            className="flex w-full items-center gap-3 px-3 py-3.5 text-left transition-smooth active:scale-[0.99]"
          >
            <r.icon className="h-4.5 w-4.5 shrink-0 text-primary" />
            <span className="flex-1 text-sm font-medium text-foreground">{r.label}</span>
            <span className="max-w-[40%] truncate text-xs text-muted-foreground">{r.value}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </section>

      <section className="animate-fade-up">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <Bell className="h-4 w-4 text-primary" /> Push notifications
        </h2>
        <div className="smarty-card divide-y divide-border p-2">
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

          <div className="flex items-center gap-3 px-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Morning brief time</p>
              <p className="text-[11px] text-muted-foreground">When today's recommendation lands</p>
            </div>
            <input
              type="time"
              value={prefs?.coach_time ?? '07:30'}
              onChange={(e) => update({ coach_time: e.target.value })}
              className="bg-transparent text-sm font-semibold text-primary outline-none"
            />
          </div>

          <div className="flex items-center gap-3 px-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Quiet hours</p>
              <p className="text-[11px] text-muted-foreground">No notifications in this window</p>
            </div>
            <input
              type="time"
              value={prefs?.quiet_hours_start ?? '22:00'}
              onChange={(e) => update({ quiet_hours_start: e.target.value })}
              className="bg-transparent text-sm font-semibold text-primary outline-none"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <input
              type="time"
              value={prefs?.quiet_hours_end ?? '07:00'}
              onChange={(e) => update({ quiet_hours_end: e.target.value })}
              className="bg-transparent text-sm font-semibold text-primary outline-none"
            />
          </div>
        </div>

        <Link
          to="/app/trash"
          className="smarty-card mt-2.5 flex items-center gap-3 px-4 py-3.5 transition-smooth active:scale-[0.99]"
        >
          <Trash2 className="h-4.5 w-4.5 text-primary" />
          <span className="flex-1 text-sm font-semibold text-foreground">
            Trash
            <span className="block text-[11px] font-normal text-muted-foreground">
              Restore deleted records within 30 days
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          to="/app/reminders"
          className="smarty-card mt-2.5 flex items-center gap-3 px-4 py-3.5 transition-smooth active:scale-[0.99]"
        >
          <Bell className="h-4.5 w-4.5 text-primary" />
          <span className="flex-1 text-sm font-semibold text-foreground">Manage reminders</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>

      <section className="animate-fade-up">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <Target className="h-4 w-4 text-primary" /> Goals & focus
        </h2>
        <div className="smarty-card p-4">
          <div className="flex flex-wrap gap-2">
            {(prefs?.goals?.length ? prefs.goals : ['No goals set yet']).map((g) => (
              <span key={g} className="rounded-2xl bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
                {g}
              </span>
            ))}
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="mt-3 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-smooth active:scale-[0.99]"
          >
            Update goals & preferences
          </button>
        </div>
      </section>

      <section className="animate-fade-up">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <FileText className="h-4 w-4 text-primary" /> Legal & policies
        </h2>
        <div className="smarty-card divide-y divide-border p-2">
          {legalRows.map((l) => (
            <Link key={l.to} to={l.to} className="flex items-center gap-3 px-3 py-3.5 text-sm font-medium text-foreground">
              <span className="flex-1">{l.label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </section>

      <section className="animate-fade-up rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <Sparkles className="h-5 w-5" />
        <p className="mt-2 text-sm font-bold">Smarty Assistant</p>
        <p className="mt-1 text-xs opacity-85">
          Everything you capture is classified, connected and remembered for you — then turned into
          plain-language answers, reminders and insights.
        </p>
      </section>

      <button
        onClick={async () => { await signOut(); navigate('/'); }}
        className="flex w-full animate-fade-up items-center justify-center gap-2 rounded-3xl border border-border bg-card p-4 text-sm font-semibold text-destructive transition-smooth active:scale-[0.99]"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
};

export default SettingsPage;
