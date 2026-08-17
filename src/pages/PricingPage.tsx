import { Link } from 'react-router-dom';
import { Check, Infinity as InfinityIcon, MessageCircle, Sparkles } from 'lucide-react';
import { PageHeader } from '@/lib/marketing';
import { ASSISTANT_BENEFITS, FREE_BENEFITS, planAllowance, usePricing } from '@/lib/pricing';
import { useAuth } from '@/contexts/AuthContext';


const GOOD_TO_KNOW = [
  {
    emoji: '💬',
    q: 'What is one AI Conversation?',
    a: 'One logbook topic with the Assistant, follow-ups included. Capturing, searching and reminders never use one, and questions outside your logbook are not counted.',
  },
  {
    emoji: '⏳',
    q: 'When the 300 run out?',
    a: 'Nothing breaks, your logbook keeps working. Wait for renewal, or renew instantly for a full allowance.',
  },
  {
    emoji: '🚪',
    q: 'Cancel any time?',
    a: 'Yes, from Settings → My plan. You keep Premium until the cycle ends. Nothing is deleted.',
  },
];

const PricingPage = () => {
  const { pricing } = usePricing();
  const { user } = useAuth();
  const premiumHref = user ? '/app/checkout' : '/auth?next=/app/checkout';

  const premium = pricing.plans[0];
  const allowance = premium ? planAllowance(pricing, premium) : 300;

  return (
    <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-10">
      <PageHeader
        eyebrow="Pricing"
        title="One membership. One brain."
        subtitle="Open an account and try one capture in each category. To keep using your logbook, you go Premium."
      />

      <div className="grid gap-3.5 lg:grid-cols-2">
        {/* Free trial */}
        <div className="smarty-card relative flex flex-col overflow-hidden p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
          <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            <InfinityIcon className="h-3 w-3" /> Free trial
          </span>
          <p className="relative mt-4 flex items-baseline gap-1.5">
            <span className="text-5xl font-extrabold tracking-tight text-foreground">€0</span>
            <span className="text-xs font-medium text-muted-foreground">to try</span>
          </p>
          <p className="relative mt-2 text-[13px] leading-relaxed text-muted-foreground">
            One capture in each category, so you can see how it feels. No Assistant, no Trash.
          </p>

          <ul className="relative mt-5 flex-1 space-y-2">
            {FREE_BENEFITS.slice(0, 5).map((b) => (

              <li key={b} className="flex items-start gap-2.5 text-[13px] text-foreground">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <Check className="h-2.5 w-2.5 text-emerald-600" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <Link
            to="/auth"
            className="relative mt-6 flex items-center justify-center rounded-2xl bg-gradient-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-smooth active:scale-[0.98]"
          >
            Create an account
          </Link>
        </div>

        {/* Premium */}
        <div className="smarty-card relative flex flex-col overflow-hidden p-5 ring-2 ring-primary/60 sm:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-halo opacity-90" />
          <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> {premium?.name ?? 'Smarty Premium'}
          </span>
          <p className="relative mt-4 flex items-baseline gap-1.5">
            <span className="text-5xl font-extrabold tracking-tight text-foreground">
              €{(premium?.price ?? 9.99).toFixed(2)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">per month</span>
          </p>
          <p className="relative mt-2 text-[13px] leading-relaxed text-muted-foreground">
            The full membership: unlimited capture, Trash, and your logbook starts thinking.
          </p>


          <div className="relative mt-4 flex items-center gap-3 rounded-2xl bg-primary/8 p-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </span>
            <div>
              <p className="text-xl font-extrabold leading-none text-primary">{allowance} conversations</p>
              <p className="mt-1 text-[11px] font-semibold text-muted-foreground">every month, around 10 a day</p>
            </div>
          </div>

          <ul className="relative mt-5 flex-1 space-y-2">
            <li className="flex items-start gap-2.5 text-[13px] font-bold text-foreground">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Check className="h-2.5 w-2.5 text-primary" />
              </span>
              Unlimited captures in every category, plus 30 day Trash
            </li>
            {ASSISTANT_BENEFITS.slice(0, 4).map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13px] text-foreground">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-2.5 w-2.5 text-primary" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <Link
            to={premiumHref}

            className="relative mt-6 flex items-center justify-center rounded-2xl bg-gradient-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-glow transition-smooth active:scale-[0.98]"
          >
            Get Premium
          </Link>
        </div>
      </div>

      <section className="mt-8 sm:mt-12">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {GOOD_TO_KNOW.map((f) => (
            <div key={f.q} className="smarty-card border-primary/20 p-4">
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
          All prices in euros, per month, cancel any time.
        </p>
      </section>
    </div>
  );
};

export default PricingPage;
