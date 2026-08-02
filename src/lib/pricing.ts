import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Pricing / monetisation model.
 *
 * Smarty Logbook is free forever. Smarty Assistant (the intelligence layer)
 * is the paid product and is metered in AI Conversations.
 *
 * Nothing is hardcoded: the whole model lives in `pricing_config` and is
 * editable from the admin panel. The numbers below are only the fallback used
 * before the config loads.
 */

export interface PlanConfig {
  key: string;
  name: string;
  price: number;
  tagline?: string;
  featured?: boolean;
  /** Set to a number to override the margin-derived allowance. */
  allowanceOverride?: number | null;
}

export interface PricingConfig {
  currency: string;
  targetMargin: number;
  usdToEur: number;
  overhead: number;
  inputPricePerMTokensUsd: number;
  outputPricePerMTokensUsd: number;
  avgInputTokensPerConversation: number;
  avgOutputTokensPerConversation: number;
  conversationWindowMinutes: number;
  roundTo: number;
  plans: PlanConfig[];
}

export const DEFAULT_PRICING: PricingConfig = {
  currency: 'EUR',
  targetMargin: 0.5,
  usdToEur: 0.92,
  overhead: 0.3,
  inputPricePerMTokensUsd: 0.3,
  outputPricePerMTokensUsd: 2.5,
  avgInputTokensPerConversation: 25000,
  avgOutputTokensPerConversation: 2000,
  conversationWindowMinutes: 45,
  roundTo: 10,
  plans: [
    {
      key: 'premium',
      name: 'Smarty Premium',
      price: 9.99,
      tagline: 'Your everyday thinking partner — about 10 conversations a day.',
      featured: true,
      allowanceOverride: 300,
    },
  ],
};

/** Blended AI cost of one complete conversation, in euros. */
export const conversationCost = (c: PricingConfig): number => {
  const usd =
    (c.avgInputTokensPerConversation / 1_000_000) * c.inputPricePerMTokensUsd +
    (c.avgOutputTokensPerConversation / 1_000_000) * c.outputPricePerMTokensUsd;
  return usd * c.usdToEur * (1 + c.overhead);
};

/** Conversations a plan can include while keeping the target gross margin. */
export const planAllowance = (c: PricingConfig, plan: PlanConfig): number => {
  if (plan.allowanceOverride != null && plan.allowanceOverride > 0) return Math.round(plan.allowanceOverride);
  const cost = conversationCost(c);
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  const budget = plan.price * (1 - c.targetMargin);
  const step = Math.max(1, c.roundTo || 1);
  return Math.max(step, Math.floor(budget / cost / step) * step);
};

/** Realised margin for a plan at full allowance usage. */
export const planMargin = (c: PricingConfig, plan: PlanConfig): number => {
  if (plan.price <= 0) return 0;
  return 1 - (planAllowance(c, plan) * conversationCost(c)) / plan.price;
};

export const euro = (n: number, digits = 2) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
    Number(n || 0),
  );

const normalise = (raw: unknown): PricingConfig => {
  const c = (raw ?? {}) as Partial<PricingConfig>;
  return {
    ...DEFAULT_PRICING,
    ...c,
    plans: Array.isArray(c.plans) && c.plans.length ? (c.plans as PlanConfig[]) : DEFAULT_PRICING.plans,
  };
};

export const fetchPricing = async (): Promise<PricingConfig> => {
  const { data } = await supabase.from('pricing_config').select('config').eq('id', 1).maybeSingle();
  return normalise((data as { config?: unknown } | null)?.config);
};

export const usePricing = () => {
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchPricing()
      .then((p) => { if (active) setPricing(p); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { pricing, loading };
};

/** What every plan includes, for marketing surfaces. */
export const ASSISTANT_BENEFITS = [
  'Personalised reasoning over your own logbook',
  'Predictions from your real history',
  'Comparisons across documents and periods',
  'Health and lab report analysis',
  'Financial analysis and forecasting',
  'Document, receipt and PDF understanding',
  'Recommendations and decision support',
];

export const FREE_BENEFITS = [
  'Unlimited notes, lists and ideas',
  'Unlimited photos, PDFs and receipts',
  'Medical reports and documents',
  'Workouts, meals and expenses',
  'Reminders and calendar events',
  'Full timeline and manual organisation',
  'Search your own logbook',
  'Export everything, any time',
];
