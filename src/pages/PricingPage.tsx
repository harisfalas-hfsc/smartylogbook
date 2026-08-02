import { Link } from 'react-router-dom';
import {
  Brain, CheckCircle2, FileSearch, HeartPulse, Infinity as InfinityIcon, LineChart, Scale, Sparkles, Wallet,
} from 'lucide-react';
import { PageHeader, faqs } from '@/lib/marketing';
import { ASSISTANT_BENEFITS, FREE_BENEFITS, planAllowance, usePricing } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const CAPABILITIES = [
  { icon: Brain, label: 'Personalised reasoning', tint: 'text-violet-500 bg-violet-500/10' },
  { icon: LineChart, label: 'Predictions', tint: 'text-sky-500 bg-sky-500/10' },
  { icon: Scale, label: 'Comparisons', tint: 'text-amber-500 bg-amber-500/10' },
  { icon: HeartPulse, label: 'Health analysis', tint: 'text-rose-500 bg-rose-500/10' },
  { icon: Wallet, label: 'Financial analysis', tint: 'text-emerald-500 bg-emerald-500/10' },
  { icon: FileSearch, label: 'Document understanding', tint: 'text-blue-500 bg-blue-500/10' },
];

const PricingPage = () => {
  const { pricing } = usePricing();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
      <PageHeader
        eyebrow="Pricing"
        title="One free logbook. One premium brain."
        subtitle="Keep everything at no cost, forever. Add Smarty Assistant for €9.99 a month — around 10 AI conversations every day."
      />

      {/* Free plan — the hero of the page */}
      <div className="smarty-card relative overflow-hidden p-5 sm:p-7">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              <InfinityIcon className="h-3 w-3" /> Free forever
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
              Smarty Logbook — €0
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Unlimited notes, lists, documents, photos, PDFs, receipts, medical reports, reminders, workouts,
              meals and expenses. No limits, no storage tiers, no pressure.
            </p>
          </div>
          <Link
            to="/auth"
            className="rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-smooth active:scale-95"
          >
            Start free
          </Link>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {FREE_BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-[12px] text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Assistant */}
      <section className="mt-10">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> Smarty Assistant
          </span>
          <h2 className="mt-3 text-xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Pay for intelligence, not for storage.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            Smarty Assistant is measured in AI Conversations. One conversation is one complete topic — including the
            natural follow-up questions that belong to it. Searching, filtering, categorising and calculating never use
            one. When the month's conversations run out you are told immediately, and you can either wait for your
            renewal date or renew straight away — renewing restarts your cycle from that day.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {CAPABILITIES.map((c) => (
            <div key={c.label} className="smarty-card p-3">
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', c.tint)}>
                <c.icon className="h-4 w-4" />
              </span>
              <p className="mt-2 text-[11px] font-semibold leading-snug text-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 grid max-w-md gap-4">
          {pricing.plans.map((p) => {
            const allowance = planAllowance(pricing, p);
            return (
              <div
                key={p.key}
                className={cn(
                  'smarty-card relative flex flex-col p-5 sm:p-6',
                  p.featured && 'ring-2 ring-primary shadow-elevated',
                )}
              >
                {p.featured && (
                  <span className="absolute -top-3 left-5 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    Most popular
                  </span>
                )}
                <p className="text-sm font-bold text-foreground">{p.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.tagline}</p>
                <p className="mt-4 text-4xl font-extrabold text-foreground">
                  €{p.price.toFixed(2)}
                  <span className="ml-1.5 text-xs font-medium text-muted-foreground">per month</span>
                </p>
                <div className="mt-4 rounded-2xl bg-primary/5 p-3 text-center">
                  <p className="text-2xl font-extrabold text-primary">{allowance}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    AI Conversations / month · about 10 a day
                  </p>
                </div>
                <ul className="mt-5 space-y-2">
                  <li className="flex items-start gap-2 text-[13px] font-semibold text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Everything in Free, unlimited
                  </li>
                  {ASSISTANT_BENEFITS.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {b}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth"
                  className={cn(
                    'mt-6 flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-smooth active:scale-95',
                    p.featured
                      ? 'bg-gradient-primary text-primary-foreground shadow-glow'
                      : 'border border-border bg-card text-foreground',
                  )}
                >
                  Get {p.name.replace('Smarty ', '')} — €{p.price.toFixed(2)}/month
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          All prices in euros, per month, cancel any time. Unused conversations reset at the start of each billing cycle.
          Your logbook always stays free and exportable.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-extrabold tracking-tight text-foreground md:text-2xl">Good to know</h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {faqs.slice(2, 6).map((f) => (
            <div key={f.q} className="smarty-card p-4 sm:p-5">
              <p className="text-sm font-bold text-foreground">{f.q}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
