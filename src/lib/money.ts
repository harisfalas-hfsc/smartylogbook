import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Financial brain: recurring money facts (income, bills, subscriptions, debts)
 * extracted automatically from captures, so the Assistant can answer money
 * questions with real figures instead of guessing.
 */

export type MoneyType = 'income' | 'expense' | 'subscription' | 'debt' | 'saving';
export type Cadence = 'once' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface MoneyItem {
  id: string;
  user_id: string;
  memory_id: string | null;
  type: MoneyType;
  label: string;
  amount: number;
  currency: string;
  cadence: Cadence;
  next_due: string | null;
  category: string | null;
  notes: string | null;
  active: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

/** Shape the AI returns inside classify / extract results. */
export interface AiMoneyItem {
  type?: string | null;
  label?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  cadence?: string | null;
  next_due?: string | null;
  category?: string | null;
  notes?: string | null;
}

const TYPES: MoneyType[] = ['income', 'expense', 'subscription', 'debt', 'saving'];
const CADENCES: Cadence[] = ['once', 'weekly', 'monthly', 'quarterly', 'yearly'];

const PER_MONTH: Record<Cadence, number> = {
  once: 0,
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12,
};

const toNumber = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.,-]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const isoDate = (v?: string | null) => {
  if (!v) return null;
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

/** Persist the recurring money items the AI found in one capture. Best-effort. */
export const saveMoneyItems = async (
  userId: string,
  memoryId: string,
  items: AiMoneyItem[] | undefined,
) => {
  if (!Array.isArray(items) || !items.length) return;
  const rows = items
    .filter((i) => i?.label && String(i.label).trim())
    .slice(0, 10)
    .map((i) => {
      const amount = toNumber(i.amount) ?? 0;
      const type = TYPES.includes(String(i.type) as MoneyType) ? (String(i.type) as MoneyType) : 'expense';
      const cadence = CADENCES.includes(String(i.cadence) as Cadence)
        ? (String(i.cadence) as Cadence)
        : 'monthly';
      return {
        user_id: userId,
        memory_id: memoryId,
        type,
        label: String(i.label).trim().slice(0, 80),
        amount: Math.abs(amount),
        currency: (i.currency ? String(i.currency) : 'EUR').toUpperCase().slice(0, 3),
        cadence,
        next_due: isoDate(i.next_due),
        category: i.category ? String(i.category).slice(0, 60) : null,
        notes: i.notes ? String(i.notes).slice(0, 300) : null,
        source: 'ai',
      };
    })
    .filter((r) => r.amount > 0);

  if (!rows.length) return;
  for (const row of rows) {
    const { data: existing } = await supabase
      .from('money_items')
      .select('id')
      .eq('user_id', userId)
      .eq('type', row.type)
      .ilike('label', row.label)
      .maybeSingle();
    if (existing?.id) {
      await supabase.from('money_items').update({ ...row, active: true }).eq('id', existing.id);
    } else {
      await supabase.from('money_items').insert(row);
    }
  }
};

export const monthlyAmount = (item: Pick<MoneyItem, 'amount' | 'cadence'>) =>
  item.amount * PER_MONTH[item.cadence];

export interface MoneySummary {
  income: number;
  outgoings: number;
  subscriptions: number;
  debt: number;
  saving: number;
  net: number;
  currency: string;
  upcoming: MoneyItem[];
}

export const summarise = (items: MoneyItem[]): MoneySummary => {
  const active = items.filter((i) => i.active);
  const sum = (type: MoneyType) =>
    active.filter((i) => i.type === type).reduce((t, i) => t + monthlyAmount(i), 0);
  const income = sum('income');
  const expense = sum('expense');
  const subscriptions = sum('subscription');
  const debt = sum('debt');
  const saving = sum('saving');
  const outgoings = expense + subscriptions + debt;
  const today = new Date().toISOString().slice(0, 10);
  return {
    income,
    outgoings,
    subscriptions,
    debt,
    saving,
    net: income - outgoings - saving,
    currency: active[0]?.currency ?? 'EUR',
    upcoming: active
      .filter((i) => i.next_due && i.next_due >= today)
      .sort((a, b) => (a.next_due! < b.next_due! ? -1 : 1))
      .slice(0, 5),
  };
};

export const useMoney = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MoneyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('money_items')
      .select('*')
      .eq('user_id', user.id)
      .order('amount', { ascending: false });
    setItems((data ?? []) as MoneyItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = useCallback(
    async (id: string) => {
      await supabase.from('money_items').delete().eq('id', id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [],
  );

  const summary = useMemo(() => summarise(items), [items]);

  return { items, summary, loading, reload: load, remove };
};

export const formatMoney = (n: number, currency = 'EUR') => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    }).format(n);
  } catch {
    return `${n.toFixed(0)} ${currency}`;
  }
};
