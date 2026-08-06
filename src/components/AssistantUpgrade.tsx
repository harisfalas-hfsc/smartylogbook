import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, CalendarClock, CheckCircle2, FileSearch, HeartPulse, LineChart, Loader2, RotateCw, Scale, Sparkles, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { PlanConfig, PricingConfig, planAllowance } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const CAPABILITIES = [
  { icon: Brain, label: 'Personalised reasoning', tint: 'text-violet-500 bg-violet-500/10' },
  { icon: LineChart, label: 'Predictions from your history', tint: 'text-sky-500 bg-sky-500/10' },
  { icon: Scale, label: 'Comparisons over time', tint: 'text-amber-500 bg-amber-500/10' },
  { icon: HeartPulse, label: 'Health & lab analysis', tint: 'text-rose-500 bg-rose-500/10' },
  { icon: Wallet, label: 'Financial analysis', tint: 'text-emerald-500 bg-emerald-500/10' },
  { icon: FileSearch, label: 'Document understanding', tint: 'text-blue-500 bg-blue-500/10' },
];

interface Props {
  pricing: PricingConfig;
  /** true when the plan is active but the monthly allowance is spent */
  exhausted?: boolean;
  compact?: boolean;
  allowance?: number;
  renewsAt?: string | null;
  onRenew?: () => Promise<{ error: string | null }>;
}

const fmtDay = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' }) : null;

/** Shown when the plan is active but the month's conversations are used up. */
const OutOfConversations = ({ pricing, allowance, renewsAt, onRenew }: Props) => {
  const [busy, setBusy] = useState(false);
  const plan = pricing.plans[0];
  const resets = fmtDay(renewsAt);

  const renew = async () => {
    if (!onRenew) return;
    setBusy(true);
    const { error } = await onRenew();
    setBusy(false);
    if (error) toast.error(error);
    else toast.success('Renewed, your conversations are available again.');
  };

  return (
    <div className="smarty-card overflow-hidden p-0">
      <div className="bg-gradient-primary px-5 py-6 text-primary-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="h-3 w-3" /> Allowance used
        </span>
        <h2 className="mt-3 text-xl font-extrabold tracking-tight">
          Your AI Conversations for this month are used up
        </h2>
        <p className="mt-1.5 max-w-md text-[13px] leading-relaxed opacity-90">
          You have used all {allowance ?? planAllowance(pricing, plan)} conversations included in{' '}
          {plan?.name ?? 'your plan'}. Your logbook keeps working exactly as before, capture, search, filter and
          organise stay free and unlimited.
        </p>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
            <CalendarClock className="h-4 w-4" />
          </span>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            {resets
              ? <>Wait for your renewal on <span className="font-bold text-foreground">{resets}</span>, your conversations reset automatically.</>
              : <>Your conversations reset automatically at your next renewal.</>}
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RotateCw className="h-4 w-4" />
          </span>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Need them now? Renew immediately for €{(plan?.price ?? 9.99).toFixed(2)}, your billing cycle restarts
            today and you get a full new month of conversations from today.
          </p>
        </div>
        <button
          onClick={renew}
          disabled={busy || !onRenew}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-smooth active:scale-95 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          Renew now for €{(plan?.price ?? 9.99).toFixed(2)}
        </button>
      </div>
    </div>
  );
};

export const PlanCard = ({ pricing, plan }: { pricing: PricingConfig; plan: PlanConfig }) => {
  const allowance = planAllowance(pricing, plan);
  return (
    <div
      className={cn(
        'smarty-card relative flex flex-col p-5',
        plan.featured && 'ring-2 ring-primary shadow-elevated',
      )}
    >
      {plan.featured && (
        <span className="absolute -top-3 left-5 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
          Most popular
        </span>
      )}
      <p className="text-sm font-bold text-foreground">{plan.name}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{plan.tagline}</p>
      <p className="mt-3 text-3xl font-extrabold text-foreground">
        €{plan.price.toFixed(2)}
        <span className="ml-1.5 text-xs font-medium text-muted-foreground">per month</span>
      </p>
      <p className="mt-3 rounded-2xl bg-primary/5 px-3 py-2 text-[13px] font-semibold text-primary">
        {allowance} AI Conversations / month
      </p>
      <ul className="mt-4 space-y-1.5">
        {CAPABILITIES.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" /> {c.label}
          </li>
        ))}
      </ul>
      <Link
        to="/app/checkout"
        className={cn(
          'mt-5 flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-smooth active:scale-95',
          plan.featured
            ? 'bg-gradient-primary text-primary-foreground shadow-glow'
            : 'border border-border bg-card text-foreground',
        )}
      >
        Get {plan.name.replace("Smarty ", "")}, €{plan.price.toFixed(2)}
      </Link>
    </div>
  );
};

/** Premium upgrade screen shown when the Assistant is locked. */
const AssistantUpgrade = (props: Props) => {
  const { pricing, exhausted, compact } = props;
  if (exhausted) return <OutOfConversations {...props} />;
  return (
  <div className="space-y-5">
    <div className="smarty-card overflow-hidden p-0">
      <div className="bg-gradient-primary px-5 py-6 text-primary-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="h-3 w-3" /> Premium intelligence
        </span>
        <h2 className="mt-3 text-xl font-extrabold tracking-tight">Unlock Smarty Assistant</h2>
        <p className="mt-1.5 max-w-md text-[13px] leading-relaxed opacity-90">
          One membership unlocks everything. Smarty Assistant turns what you have stored into reasoning,
          predictions and recommendations that are only about you.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
        {CAPABILITIES.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/70 bg-card p-3">
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-xl', c.tint)}>
              <c.icon className="h-4 w-4" />
            </span>
            <p className="mt-2 text-[11px] font-semibold leading-snug text-foreground">{c.label}</p>
          </div>
        ))}
      </div>
    </div>

    {!compact && (
      <div className="mx-auto grid max-w-sm gap-3">
        {pricing.plans.map((p) => (
          <PlanCard key={p.key} pricing={pricing} plan={p} />
        ))}
      </div>
    )}

    {compact && (
      <Link
        to="/app/checkout"
        className="flex items-center justify-center rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-95"
      >
        Get Premium, €9.99 / month
      </Link>
    )}
  </div>
  );
};

export default AssistantUpgrade;
