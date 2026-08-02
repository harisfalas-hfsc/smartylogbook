import { Link } from 'react-router-dom';
import {
  Brain, Check, FileSearch, HeartPulse, Infinity as InfinityIcon, LineChart, MessageCircle,
  RefreshCw, Scale, Sparkles, Wallet, XCircle,
} from 'lucide-react';
import { PageHeader } from '@/lib/marketing';
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

const GOOD_TO_KNOW = [
  {
    emoji: '💬',
    q: 'What counts as one AI Conversation?',
    a: 'One complete topic with Smarty Assistant — comparing two blood tests, planning a week, analysing spending — including the follow-up questions that belong to it. Capturing, classifying, searching, filtering and reminders never use one.',
  },
  {
    emoji: '⏳',
    q: 'What happens when the 300 run out?',
    a: 'You are told immediately, and nothing breaks: your whole logbook keeps working. You either wait for your renewal date or renew straight away — renewing restarts your cycle from that day with a full allowance.',
  },
  {
    emoji: '🔁',
    q: 'Do unused conversations roll over?',
    a: 'No. The allowance resets at the start of every billing cycle, so each month begins with a full 300.',
  },
  {
    emoji: '🚪',
    q: 'Can I cancel any time?',
    a: 'Yes. Cancel from Settings → My plan. You keep Premium until the end of the cycle you already paid for, then you simply return to the free logbook. Nothing is deleted.',
  },
  {
    emoji: '💾',
    q: 'Do I ever pay for storage?',
    a: 'Never. Notes, photos, PDFs, receipts and reports are unlimited and free forever. You only pay for intelligence.',
  },
  {
    emoji: '💶',
    q: 'How is it billed?',
    a: 'In euros, €9.99 per month, recurring. No setup fee, no tiers, no hidden add-ons — one plan, one price.',
  },
];

const PricingPage = () => {
  const { pricing } = usePricing();
  const premium = pricing.plans[0];
  const allowance = premium ? planAllowance(pricing, premium) : 300;

  return (
    <div className="mx-auto max-w-6xl px-3 py-7 sm:px-5 sm:py-10">
      <PageHeader
        eyebrow="Pricing"
        title="One free logbook. One premium brain."
        subtitle="Keep everything you capture at no cost, forever. Add Smarty Assistant when you want your logbook to think."
      />

      {/* Two cards */}
      <div className="grid gap-3.5 lg:grid-cols-2">
        {/* Free */}
        <div className="smarty-card relative flex flex-col overflow-hidden p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
          <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            <InfinityIcon className="h-3 w-3" /> Free forever
          </span>
          <h2 className="relative mt-3 text-lg font-extrabold tracking-tight text-foreground">Start free</h2>
          <p className="relative mt-4 flex items-baseline gap-1.5">
            <span className="text-5xl font-extrabold tracking-tight text-foreground">€0</span>
            <span className="text-xs font-medium text-muted-foreground">forever</span>
          </p>
          <p className="relative mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Your complete logbook. Capture anything — typed, spoken, photographed or uploaded — and keep it
            organised, searchable and yours. No storage limits, no expiry, no card needed.
          </p>

          <ul className="relative mt-5 space-y-2">
            {FREE_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13px] text-foreground">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check className="h-2.5 w-2.5 text-emerald-600" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div className="relative mt-5 rounded-2xl border border-border bg-secondary/50 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <XCircle className="h-3.5 w-3.5" /> Not included
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              Smarty Assistant — no AI answers, no analysis, no predictions and no daily brief. You organise and
              search everything yourself.
            </p>
          </div>

          <Link
            to="/auth"
            className="relative mt-5 flex items-center justify-center rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-bold text-foreground transition-smooth active:scale-[0.98]"
          >
            Start free
          </Link>
        </div>

        {/* Premium */}
        <div className="smarty-card relative flex flex-col overflow-hidden p-5 ring-2 ring-primary/60 sm:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-halo opacity-90" />
          <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> Smarty Assistant included
          </span>
          <h2 className="relative mt-3 text-lg font-extrabold tracking-tight text-foreground">
            {premium?.name ?? 'Smarty Premium'}
          </h2>
          <p className="relative mt-4 flex items-baseline gap-1.5">
            <span className="text-5xl font-extrabold tracking-tight text-foreground">
              €{(premium?.price ?? 9.99).toFixed(2)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">per month</span>
          </p>
          <p className="relative mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Everything in Free stays unlimited — and your logbook starts thinking. It reads what you capture,
            connects it to your history, answers you in plain language and warns you before things slip.
          </p>

          <div className="relative mt-4 flex items-center gap-3 rounded-2xl bg-primary/8 p-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <p className="text-xl font-extrabold leading-none text-primary">{allowance} conversations</p>
              <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                every month — around 10 a day
              </p>
            </div>
          </div>

          <ul className="relative mt-5 space-y-2">
            <li className="flex items-start gap-2.5 text-[13px] font-bold text-foreground">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Check className="h-2.5 w-2.5 text-primary" />
              </span>
              Everything in Free, always unlimited
            </li>
            {ASSISTANT_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13px] text-foreground">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-2.5 w-2.5 text-primary" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div className="relative mt-5 rounded-2xl border border-primary/25 bg-secondary/50 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              <RefreshCw className="h-3.5 w-3.5" /> Run out early?
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              Wait for your renewal date, or renew instantly — your cycle restarts that day with a full
              allowance. Cancel any time from Settings → My plan.
            </p>
          </div>

          <Link
            to="/auth"
            className="relative mt-5 flex items-center justify-center rounded-2xl bg-gradient-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-smooth active:scale-[0.98]"
          >
            Get Premium — €{(premium?.price ?? 9.99).toFixed(2)}/month
          </Link>
        </div>
      </div>

      {/* Pay for intelligence */}
      <section className="mt-8 sm:mt-12">
        <div className="text-center">
          <h2 className="text-xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Pay for <span className="gradient-text">intelligence</span>, not for storage.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
            Keeping your life in one place should never cost money. Understanding it should be worth it.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {CAPABILITIES.map((c) => (
            <div key={c.label} className="smarty-card p-3">
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-2xl', c.tint)}>
                <c.icon className="h-4.5 w-4.5" />
              </span>
              <p className="mt-2 text-[11.5px] font-semibold leading-snug text-foreground">{c.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Good to know */}
      <section className="mt-8 sm:mt-12">
        <h2 className="mb-3.5 text-lg font-extrabold tracking-tight text-foreground md:text-2xl">Good to know</h2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {GOOD_TO_KNOW.map((f) => (
            <div key={f.q} className="smarty-card border-primary/20 p-4 sm:p-5">
              <div className="flex items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm">
                  {f.emoji}
                </span>
                <p className="text-[13px] font-bold leading-snug text-foreground">{f.q}</p>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11.5px] text-muted-foreground">
          All prices in euros, per month, cancel any time. Your logbook stays free, exportable and yours —
          whatever you decide.
        </p>
      </section>
    </div>
  );
};

export default PricingPage;
