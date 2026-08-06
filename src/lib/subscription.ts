import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/lib/admin';
import { PlanConfig, PricingConfig, planAllowance, usePricing } from '@/lib/pricing';

export interface SubscriptionRow {
  plan: string;
  plan_key: string | null;
  status: string;
  source: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end?: boolean | null;
}

/** Start of the current billing cycle (falls back to the calendar month). */
export const periodStart = (sub: SubscriptionRow | null): Date => {
  if (sub?.current_period_start) return new Date(sub.current_period_start);
  if (sub?.current_period_end) {
    const end = new Date(sub.current_period_end);
    const start = new Date(end);
    while (start > new Date()) start.setMonth(start.getMonth() - 1);
    return start;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

export const isActive = (sub: SubscriptionRow | null) =>
  Boolean(
    sub &&
      sub.status === 'active' &&
      sub.plan !== 'free' &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date()),
  );

export const findPlan = (pricing: PricingConfig, key?: string | null): PlanConfig | null =>
  pricing.plans.find((p) => p.key === key) ?? pricing.plans[0] ?? null;

/**
 * One-off premium check, for places that must not carry the whole hook
 * (capture limits, delete behaviour). Administrators always count as premium.
 */
export const hasPremium = async (userId: string): Promise<boolean> => {
  const [{ data: sub }, { data: role }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('plan, plan_key, status, source, current_period_start, current_period_end, cancel_at_period_end')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle(),
  ]);
  if (role) return true;
  return isActive((sub as SubscriptionRow | null) ?? null);
};


export const useSubscription = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { pricing, loading: pricingLoading } = usePricing();
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setSub(null);
      setUsed(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('subscriptions')
      .select('plan, plan_key, status, source, current_period_start, current_period_end, cancel_at_period_end')
      .eq('user_id', user.id)
      .maybeSingle();
    const row = (data as SubscriptionRow | null) ?? null;
    setSub(row);

    const { count } = await supabase
      .from('ai_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('started_at', periodStart(row).toISOString());
    setUsed(count ?? 0);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  /* Administrators always have full Premium access, never show them upsells. */
  const active = isAdmin || isActive(sub);
  const plan = active ? findPlan(pricing, sub?.plan_key) : null;
  const allowance = active && plan ? planAllowance(pricing, plan) : 0;
  const remaining = isAdmin ? Math.max(allowance, 1) : Math.max(0, allowance - used);

  /**
   * Immediate renewal / top-up: the user pays for another month right away and
   * the billing cycle (and the conversation allowance) restarts from today.
   */
  const renewNow = async () => {
    const { data, error } = await supabase.functions.invoke('account', { body: { action: 'renew' } });
    await load();
    if (error) return { error: error.message };
    if (data && typeof data === 'object' && 'error' in data) return { error: String((data as { error: unknown }).error) };
    return { error: null };
  };

  const setCancellation = async (cancel: boolean) => {
    const { data, error } = await supabase.functions.invoke('account', {
      body: { action: cancel ? 'cancel' : 'resume' },
    });
    await load();
    if (error) return { error: error.message };
    if (data && typeof data === 'object' && 'error' in data) return { error: String((data as { error: unknown }).error) };
    return { error: null };
  };

  return {
    loading: loading || pricingLoading || adminLoading,
    pricing,
    subscription: sub,
    plan,
    active,
    isAdmin,
    allowance,
    used,
    remaining,
    canUseAssistant: active && remaining > 0,
    renewsAt: sub?.current_period_end ?? null,
    renewNow,
    cancelAtPeriodEnd: Boolean(sub?.cancel_at_period_end),
    cancelPlan: () => setCancellation(true),
    resumePlan: () => setCancellation(false),
    reload: load,
  };
};
