import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PlanConfig, PricingConfig, planAllowance, usePricing } from '@/lib/pricing';

export interface SubscriptionRow {
  plan: string;
  plan_key: string | null;
  status: string;
  source: string;
  current_period_start: string | null;
  current_period_end: string | null;
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
  pricing.plans.find((p) => p.key === key) ?? null;

export const useSubscription = () => {
  const { user } = useAuth();
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
      .select('plan, plan_key, status, source, current_period_start, current_period_end')
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

  const active = isActive(sub);
  const plan = findPlan(pricing, sub?.plan_key ?? (sub?.plan === 'premium' ? 'intelligence' : null));
  const allowance = active && plan ? planAllowance(pricing, plan) : 0;
  const remaining = Math.max(0, allowance - used);

  return {
    loading: loading || pricingLoading,
    pricing,
    subscription: sub,
    plan,
    active,
    allowance,
    used,
    remaining,
    canUseAssistant: active && remaining > 0,
    renewsAt: sub?.current_period_end ?? null,
    reload: load,
  };
};
