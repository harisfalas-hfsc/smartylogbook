import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, Loader2, Mic, Plus, Sparkles, Wallet, Dumbbell, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMemories, timeOf } from '@/lib/memories';
import LifeScoreRing from '@/components/LifeScoreRing';
import DailyCoachCard from '@/components/DailyCoachCard';
import { usePreferences } from '@/lib/preferences';
import { useCoachCard } from '@/lib/coach';
import MemoryCard from '@/components/MemoryCard';
import { MODULES, kindIcon, getModule } from '@/lib/constants';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard = () => {
  const { profile, user } = useAuth();
  const { memories, loading } = useMemories({ limit: 60 });
  const { prefs } = usePreferences();
  const { card, generating, toggleDone, regenerate } = useCoachCard(memories, prefs, !loading);

  const name = profile?.username ?? user?.email?.split('@')[0] ?? 'there';
  const todayKey = new Date().toDateString();

  const today = useMemo(
    () => memories.filter((m) => new Date(m.occurred_at).toDateString() === todayKey),
    [memories, todayKey]
  );

  const week = useMemo(
    () => memories.filter((m) => Date.now() - new Date(m.occurred_at).getTime() < 7 * 86400000),
    [memories]
  );

  const spend = week
    .filter((m) => m.module === 'finance' && (m.amount ?? 0) > 0)
    .reduce((s, m) => s + (m.amount ?? 0), 0);
  const workouts = week.filter((m) => m.module === 'fitness').length;
  const health = week.filter((m) => m.module === 'health').length;

  const focus = prefs?.focus_modules ?? [];
  const focusToday = today.filter((m) => focus.includes(m.module)).length;
  const score = Math.min(
    100,
    42 +
      today.length * 6 +
      workouts * 4 +
      Math.min(12, memories.length) +
      focusToday * 4 +
      (card?.done ? 8 : 0)
  );

  const orderedModules = focus.length
    ? [...MODULES].sort((a, b) => Number(focus.includes(b.id)) - Number(focus.includes(a.id)))
    : MODULES;


  return (
    <div className="space-y-5">
      <header className="animate-fade-up">
        <p className="text-sm text-muted-foreground">{greeting()}, <span className="font-semibold text-foreground">{name}</span></p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          {today.length ? `${today.length} memories captured today` : 'Your day is a blank page'}
        </h1>
      </header>

      {/* Life score */}
      <section className="smarty-card animate-fade-up overflow-hidden">
        <div className="flex flex-col items-center gap-5 p-6 sm:flex-row sm:items-center">
          <LifeScoreRing score={score} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Life Score</p>
            <p className="mt-1.5 text-base font-bold text-foreground">
              {prefs?.goals?.length ? prefs.goals.slice(0, 2).join(' · ') : 'Tuned to your day'}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {focus.length
                ? `Weighted towards ${focus.slice(0, 3).join(', ')}.`
                : 'Set your goals in onboarding to personalise this.'}
            </p>
          </div>
        </div>
      </section>

      {/* Smarty Coach */}
      <DailyCoachCard card={card} generating={generating} onToggleDone={toggleDone} onRegenerate={regenerate} />

      {/* Quick capture */}
      <section className="animate-fade-up">
        <Link
          to="/app/capture"
          className="flex items-center gap-3 rounded-3xl bg-gradient-primary p-4 text-primary-foreground shadow-glow transition-smooth active:scale-[0.99]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
            <Plus className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Quick Capture</p>
            <p className="text-xs opacity-80">Anything at all — the AI files it for you</p>
          </div>
          <div className="flex gap-2 opacity-90">
            <Mic className="h-5 w-5" />
            <Camera className="h-5 w-5" />
          </div>
        </Link>
      </section>

      {/* Summaries */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { icon: Wallet, label: 'Spent 7d', value: `$${spend.toFixed(0)}`, to: '/app/module/finance' },
          { icon: Dumbbell, label: 'Sessions', value: workouts, to: '/app/module/fitness' },
          { icon: Activity, label: 'Health logs', value: health, to: '/app/module/health' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="smarty-card animate-fade-up p-4 transition-smooth active:scale-95">
            <s.icon className="h-4.5 w-4.5 text-primary" />
            <p className="mt-2 text-xl font-extrabold tabular-nums text-foreground">{s.value}</p>
            <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </section>

      {/* Today's memories */}
      <section className="animate-fade-up">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Today's memories</h2>
          <Link to="/app/timeline" className="flex items-center gap-1 text-xs font-semibold text-primary">
            Timeline <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="smarty-card flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : today.length === 0 ? (
          <div className="smarty-card p-8 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-3 text-sm font-semibold text-foreground">Nothing captured yet today</p>
            <p className="mt-1 text-xs text-muted-foreground">A thought, a meal, a receipt — start anywhere.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {today.slice(0, 5).map((m) => <MemoryCard key={m.id} memory={m} />)}
          </div>
        )}
      </section>

      {/* Modules */}
      <section className="animate-fade-up">
        <h2 className="mb-3 text-sm font-bold text-foreground">Your modules</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {orderedModules.map((m) => (
            <Link key={m.id} to={`/app/module/${m.id}`} className="smarty-card p-4 transition-smooth active:scale-95">
              <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${m.tint}`}>
                <m.icon className={`h-4.5 w-4.5 ${m.color}`} />
              </div>
              <p className="mt-2.5 text-xs font-bold text-foreground">{m.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {memories.filter((x) => x.module === m.id).length} memories
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      {memories.length > 0 && (
        <section className="animate-fade-up">
          <h2 className="mb-3 text-sm font-bold text-foreground">Recent activity</h2>
          <div className="smarty-card divide-y divide-border p-2">
            {memories.slice(0, 6).map((m) => {
              const Icon = kindIcon(m.kind);
              const mod = getModule(m.module);
              return (
                <div key={m.id} className="flex items-center gap-3 px-2 py-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${mod.tint}`}>
                    <Icon className={`h-4 w-4 ${mod.color}`} />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{m.title}</p>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{timeOf(m.occurred_at)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
