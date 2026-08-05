import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import StripeEmbeddedCheckout from '@/components/StripeEmbeddedCheckout';
import PaymentTestModeBanner from '@/components/PaymentTestModeBanner';
import { PREMIUM_PRICE_ID, paymentsConfigured } from '@/lib/stripe';
import { useSubscription } from '@/lib/subscription';
import { ASSISTANT_BENEFITS } from '@/lib/pricing';

/** Buy Smarty Premium, embedded card form, and the post-payment confirmation. */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const complete = params.get('status') === 'complete';
  const { reload, active } = useSubscription();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (!complete) return;
    // The subscription lands via webhook, poll briefly so the UI catches up.
    const timers = [1500, 4000, 8000].map((ms) => window.setTimeout(() => void reload(), ms));
    const done = window.setTimeout(() => setWaited(true), 9000);
    return () => { timers.forEach(window.clearTimeout); window.clearTimeout(done); };
  }, [complete, reload]);

  if (complete) {
    return (
      <div className="space-y-5">
        <section className="smarty-card animate-fade-up p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-foreground">Payment received</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {active
              ? 'Smarty Premium is active. Your Assistant is unlocked with 300 conversations this cycle.'
              : waited
                ? 'Your payment went through. Premium usually activates within a few seconds, refresh your plan page if it is still catching up.'
                : 'Activating your Smarty Premium access…'}
          </p>
          {!active && !waited && <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-primary" />}
          <div className="mt-5 grid gap-2">
            <Link
              to="/app/assistant"
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-glow"
            >
              <Sparkles className="h-4 w-4" /> Open Smarty Assistant
            </Link>
            <Link
              to="/app/plan"
              className="flex items-center justify-center rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
            >
              View my plan
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Get Smarty Premium</h1>
        <p className="mt-1 text-sm text-muted-foreground">€9.99 per month · 300 AI conversations · cancel any time.</p>
      </header>

      <PaymentTestModeBanner />

      <section className="smarty-card animate-fade-up p-4">
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {ASSISTANT_BENEFITS.slice(0, 6).map((b) => (
            <li key={b} className="flex items-start gap-2 text-[12px] text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {b}
            </li>
          ))}
        </ul>
      </section>

      {paymentsConfigured ? (
        <StripeEmbeddedCheckout priceId={PREMIUM_PRICE_ID} />
      ) : (
        <section className="smarty-card p-5 text-sm text-muted-foreground">
          Checkout is not available yet. Please try again shortly.
        </section>
      )}

      <p className="flex items-center justify-center gap-1.5 pb-4 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Payments are processed securely. Card details never
        reach Smarty Logbook.
      </p>
    </div>
  );
};

export default CheckoutPage;
