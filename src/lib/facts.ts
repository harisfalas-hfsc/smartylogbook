import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineFirst } from '@/lib/offline/offline-first';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Structured facts: every number the AI extracts (cholesterol, weight, rent,
 * an invoice total, blood pressure...) is stored as its own row so the
 * Assistant can trend it over time instead of re-reading the raw text.
 */

export type FactCategory = 'health' | 'money' | 'fitness' | 'nutrition' | 'other';

export interface Fact {
  id: string;
  user_id: string;
  memory_id: string | null;
  name: string;
  label: string | null;
  value: number | null;
  text_value: string | null;
  unit: string | null;
  category: string;
  observed_at: string;
  created_at: string;
}

/** Shape the AI returns inside classify / extract results. */
export interface AiFact {
  name?: string;
  label?: string;
  value?: number | string | null;
  text_value?: string | null;
  unit?: string | null;
  category?: string | null;
  date?: string | null;
}

const CATEGORIES: FactCategory[] = ['health', 'money', 'fitness', 'nutrition', 'other'];

const slug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);

const toNumber = (v: unknown): number | null => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.,-]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

/** Persist the facts the AI extracted from one capture. Best-effort. */
export const saveFacts = async (
  userId: string,
  memoryId: string,
  facts: AiFact[] | undefined,
  occurredAt?: string,
) => {
  if (!Array.isArray(facts) || !facts.length) return;
  const when = occurredAt ?? new Date().toISOString();
  const rows = facts
    .filter((f) => f?.name && String(f.name).trim())
    .slice(0, 25)
    .map((f) => {
      const value = toNumber(f.value);
      const dated = f.date ? new Date(`${f.date}T12:00:00`) : null;
      return {
        user_id: userId,
        memory_id: memoryId,
        name: slug(String(f.name)),
        label: String(f.label ?? f.name).slice(0, 80),
        value,
        text_value: value == null ? String(f.text_value ?? f.value ?? '').slice(0, 200) || null : null,
        unit: f.unit ? String(f.unit).slice(0, 20) : null,
        category: CATEGORIES.includes(String(f.category) as FactCategory) ? String(f.category) : 'other',
        observed_at: dated && !Number.isNaN(dated.getTime()) ? dated.toISOString() : when,
      };
    })
    .filter((r) => r.value != null || r.text_value);

  if (!rows.length) return;
  await supabase.from('facts').upsert(rows, {
    onConflict: 'user_id,memory_id,name,observed_at',
    ignoreDuplicates: true,
  });
};

export interface Trend {
  name: string;
  label: string;
  unit: string | null;
  category: string;
  points: { value: number; at: string }[];
  latest: number;
  previous: number | null;
  change: number | null;
  direction: 'up' | 'down' | 'flat' | null;
}

const buildTrends = (facts: Fact[]): Trend[] => {
  const groups = new Map<string, Fact[]>();
  for (const f of facts) {
    if (f.value == null) continue;
    const list = groups.get(f.name) ?? [];
    list.push(f);
    groups.set(f.name, list);
  }
  const trends: Trend[] = [];
  for (const [name, list] of groups) {
    const sorted = [...list].sort((a, b) => +new Date(a.observed_at) - +new Date(b.observed_at));
    const points = sorted.map((f) => ({ value: f.value as number, at: f.observed_at }));
    const latest = points[points.length - 1].value;
    const previous = points.length > 1 ? points[points.length - 2].value : null;
    const change = previous == null ? null : latest - previous;
    trends.push({
      name,
      label: sorted[sorted.length - 1].label ?? name,
      unit: sorted[sorted.length - 1].unit,
      category: sorted[sorted.length - 1].category,
      points,
      latest,
      previous,
      change,
      direction: change == null ? null : change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    });
  }
  return trends.sort((a, b) => {
    if (a.points.length !== b.points.length) return b.points.length - a.points.length;
    return +new Date(b.points[b.points.length - 1].at) - +new Date(a.points[a.points.length - 1].at);
  });
};

export const useFacts = (options?: { category?: string; limit?: number }) => {
  const { user } = useAuth();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setFacts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const rows = await offlineFirst<Fact[]>(
      options?.category ? `facts:list:${options.category}` : 'facts:list',
      async () => {
        let query = supabase
          .from('facts')
          .select('*')
          .order('observed_at', { ascending: false })
          .limit(options?.limit ?? 300);
        if (options?.category) query = query.eq('category', options.category);
        const { data } = await query;
        return (data ?? []) as unknown as Fact[];
      },
      user.id,
    ).catch(() => [] as Fact[]);
    setFacts(rows);
    setLoading(false);
  }, [user, options?.category, options?.limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { facts, trends: buildTrends(facts), loading, reload: load };
};
