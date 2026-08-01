import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, Check, Loader2, Sparkles, Target } from 'lucide-react';
import { toast } from 'sonner';
import { GOAL_OPTIONS, usePreferences } from '@/lib/preferences';
import { requestNotificationPermission } from '@/lib/reminders';
import { MODULES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const TONES = [
  { id: 'friendly', label: 'Warm & encouraging' },
  { id: 'direct', label: 'Short & direct' },
  { id: 'coach', label: 'Tough-love coach' },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { prefs, loading, update } = usePreferences();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [focus, setFocus] = useState<string[]>([]);
  const [tone, setTone] = useState('friendly');
  const [coachTime, setCoachTime] = useState('07:30');
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const finish = async () => {
    setSaving(true);
    if (notify) await requestNotificationPermission();
    const { error } = await update({
      goals,
      focus_modules: focus.length ? focus : MODULES.slice(0, 3).map((m) => m.id),
      tone,
      coach_time: coachTime,
      notify_coach: notify,
      onboarding_completed: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Your logbook is tuned to you');
    navigate('/app', { replace: true });
  };

  if (loading && !prefs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const steps = [
    {
      icon: Target,
      title: 'What matters most right now?',
      sub: 'Pick as many as you like. Your Life Score and recommendations follow these.',
      body: (
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g}
              onClick={() => toggle(goals, setGoals, g)}
              className={cn(
                'rounded-2xl border px-3.5 py-2.5 text-xs font-semibold transition-smooth active:scale-95',
                goals.includes(g)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground'
              )}
            >
              {g}
            </button>
          ))}
        </div>
      ),
      valid: goals.length > 0,
    },
    {
      icon: Sparkles,
      title: 'Which parts of life do you track?',
      sub: 'These modules move to the top of your dashboard.',
      body: (
        <div className="grid grid-cols-2 gap-2.5">
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => toggle(focus, setFocus, m.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-2xl border p-3.5 text-left transition-smooth active:scale-95',
                focus.includes(m.id) ? 'border-primary bg-primary/10' : 'border-border bg-card'
              )}
            >
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', m.tint)}>
                <m.icon className={cn('h-4 w-4', m.color)} />
              </span>
              <span className="text-xs font-bold text-foreground">{m.label}</span>
            </button>
          ))}
        </div>
      ),
      valid: focus.length > 0,
    },
    {
      icon: Bell,
      title: 'How should your coach talk to you?',
      sub: 'And when should the daily recommendation land?',
      body: (
        <div className="space-y-4">
          <div className="space-y-2">
            {TONES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-smooth active:scale-[0.99]',
                  tone === t.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
                )}
              >
                {t.label}
                {tone === t.id && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <label className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Morning coach time</span>
            <input
              type="time"
              value={coachTime}
              onChange={(e) => setCoachTime(e.target.value)}
              className="bg-transparent text-sm font-semibold text-primary outline-none"
            />
          </label>
          <button
            onClick={() => setNotify(!notify)}
            className={cn(
              'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-smooth',
              notify ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
            )}
          >
            Send me reminders & nudges
            <span className={cn('h-5 w-9 rounded-full p-0.5 transition-smooth', notify ? 'bg-primary' : 'bg-muted')}>
              <span className={cn('block h-4 w-4 rounded-full bg-white transition-smooth', notify && 'translate-x-4')} />
            </span>
          </button>
        </div>
      ),
      valid: true,
    },
  ];

  const current = steps[step];

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-8">
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn('h-1.5 flex-1 rounded-full transition-smooth', i <= step ? 'bg-gradient-primary' : 'bg-muted')}
          />
        ))}
      </div>

      <header className="mt-8 animate-fade-up">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
          <current.icon className="h-5 w-5 text-primary-foreground" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">{current.title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{current.sub}</p>
      </header>

      <div className="mt-6 flex-1 animate-fade-up">{current.body}</div>

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-foreground transition-smooth active:scale-95"
          >
            Back
          </button>
        )}
        <button
          onClick={() => (step === steps.length - 1 ? finish() : setStep(step + 1))}
          disabled={!current.valid || saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {step === steps.length - 1 ? 'Start my logbook' : 'Continue'}
          {!saving && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

export default OnboardingPage;
