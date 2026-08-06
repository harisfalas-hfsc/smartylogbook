import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CalendarClock, CheckCircle2, Infinity as InfinityIcon, Loader2, RefreshCw,
  Sparkles, XCircle, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription } from '@/lib/subscription';
import { supabase } from '@/integrations/supabase/client';
import { getStripeEnvironment } from '@/lib/stripe';
import { FREE_BENEFITS, ASSISTANT_BENEFITS } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

const PlanPage = () => {
  const navigate = useNavigate();
  const {
    loading, plan, active, allowance, used, remaining, renewsAt,
    renewNow, cancelAtPeriodEnd, cancelPlan, resumePlan, subscription,
  } = useSubscription();
  const isPaid = subscription?.source === 'paid';
  const [portalBusy, setPortalBusy] = useState(false);

  /** Open Stripe's billing portal (payment method, invoices, cancellation). */
  const openBillingPortal = async () => {
    setPortalBusy(true);
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: { returnUrl: `${window.location.origin}/app/plan`, environment: getStripeEnvironment() },
    });
    setPortalBusy(false);
    const message = (data as { error?: string } | null)?.error ?? error?.message;
    if (message || !(data as { url?: string } | null)?.url) {
      toast.error(message ?? 'Could not open billing');
      return;
    }
    window.open((data as { url: string }).url, '_blank', 'noopener');
  };
  const [busy, setBusy] = useState<'renew' | 'cancel' | 'resume' | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const run = async (kind: 'renew' | 'cancel' | 'resume', fn: () => Promise<{ error: string | null }>, ok: string) => {
    setBusy(kind);
    const { error } = await fn();
    setBusy(null);
    if (error) toast.error(error);
    else toast.success(ok);
  };

  const pct = allowance ? Math.min(100, Math.round((used / allowance) * 100)) : 0;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One membership, €9.99 a month. A free account is only a taste of the logbook.
        </p>
      </header>

      {loading ? (
        <div className="smarty-card flex items-center justify-center p-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : active && plan ? (
        <>
          <section className="animate-fade-up overflow-hidden rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> Active
                </span>
                <p className="mt-2.5 text-xl font-extrabold">{plan.name}</p>
                <p className="text-xs opacity-85">€{plan.price.toFixed(2)} per month</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold leading-none">{remaining}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide opacity-85">conversations left</p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-[11px] opacity-85">
              {used} of {allowance} used this cycle · {cancelAtPeriodEnd ? 'ends' : 'renews'} {fmtDate(renewsAt)}
            </p>
          </section>

          {cancelAtPeriodEnd && (
            <section className="smarty-card animate-fade-up border-warning/40 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                <CalendarClock className="h-4 w-4 text-warning" /> Cancellation scheduled
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                You keep full Smarty Assistant access until {fmtDate(renewsAt)}. After that your logbook stays
                free and everything you captured remains yours.
              </p>
              <button
                onClick={() => run('resume', resumePlan, 'Your plan will continue as normal')}
                disabled={busy !== null}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-[0.99] disabled:opacity-60"
              >
                {busy === 'resume' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Keep my plan
              </button>
            </section>
          )}

          <section className="smarty-card animate-fade-up space-y-3 p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Zap className="h-4 w-4 text-primary" /> Need more conversations now?
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Renew immediately and your billing cycle restarts today with a fresh allowance of {allowance}{' '}
              conversations. Your next renewal date moves to one month from today.
            </p>
            <button
              onClick={() => (isPaid ? void openBillingPortal() : run('renew', renewNow, 'Cycle restarted, your allowance is fresh'))}
              disabled={busy !== null}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-smooth active:scale-[0.99] disabled:opacity-60"
            >
              {busy === 'renew' || portalBusy ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <RefreshCw className="h-4 w-4 text-primary" />}
              {isPaid ? 'Manage billing & renew' : `Renew now, €${plan.price.toFixed(2)}`}
            </button>
          </section>

          {!cancelAtPeriodEnd && (
            <section className="animate-fade-up rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-destructive">
                <XCircle className="h-4 w-4" /> Cancel my plan
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Cancel any time. You keep Smarty Assistant until {fmtDate(renewsAt)}, then you move back to the
                free logbook. Nothing is deleted and no data is lost.
              </p>
              {confirmCancel ? (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground"
                  >
                    Keep plan
                  </button>
                  <button
                    onClick={async () => {
                      await run('cancel', cancelPlan, 'Plan will end at your renewal date');
                      setConfirmCancel(false);
                    }}
                    disabled={busy !== null}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground disabled:opacity-60"
                  >
                    {busy === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Confirm cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="mt-3 w-full rounded-2xl border border-destructive/40 bg-card px-4 py-3 text-sm font-semibold text-destructive transition-smooth active:scale-[0.99]"
                >
                  Cancel subscription
                </button>
              )}
            </section>
          )}
        </>
      ) : (
        <>
          <section className="smarty-card animate-fade-up p-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              <InfinityIcon className="h-3 w-3" /> Your current plan
            </span>
            <p className="mt-2.5 text-xl font-extrabold text-foreground">Free trial, €0</p>
            <p className="mt-1 text-xs text-muted-foreground">
              One capture in each category. No Assistant, and deleting is permanent.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {FREE_BENEFITS.slice(0, 6).map((b) => (

                <li key={b} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {b}
                </li>
              ))}
            </ul>
          </section>

          <section className="animate-fade-up overflow-hidden rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
            <Sparkles className="h-5 w-5" />
            <p className="mt-2 text-lg font-extrabold">Add the premium brain</p>
            <p className="mt-1 text-xs opacity-90">
              Smarty Premium, €9.99 a month, 300 AI conversations (about 10 a day). Cancel any time.
            </p>
            <ul className="mt-3 space-y-1.5">
              {ASSISTANT_BENEFITS.slice(0, 4).map((b) => (
                <li key={b} className="flex items-start gap-2 text-[12px] opacity-95">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {b}
                </li>
              ))}
            </ul>
            <Link
              to="/app/checkout"
              className={cn(
                'mt-4 flex items-center justify-center rounded-2xl bg-white/95 px-4 py-3 text-sm font-bold text-primary',
                'transition-smooth active:scale-[0.99]',
              )}
            >
              Get Premium, €9.99 / month
            </Link>
          </section>
        </>
      )}
    </div>
  );
};

export default PlanPage;
