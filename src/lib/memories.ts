import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Memory {
  id: string;
  user_id: string;
  kind: string;
  module: string;
  title: string;
  summary: string | null;
  content: string | null;
  ai_tags: string[];
  mood: number | null;
  amount: number | null;
  currency: string | null;
  location: string | null;
  attachment_url: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export type NewMemory = Partial<Memory> & { title: string };

export const useMemories = (options?: { module?: string; limit?: number }) => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setMemories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let query = supabase
      .from('memories')
      .select('*')
      .order('occurred_at', { ascending: false });
    if (options?.module) query = query.eq('module', options.module);
    if (options?.limit) query = query.limit(options.limit);
    const { data } = await query;
    setMemories((data ?? []) as unknown as Memory[]);
    setLoading(false);
  }, [user, options?.module, options?.limit]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (memory: NewMemory) => {
    if (!user) return { error: new Error('Not signed in') };
    const { error } = await supabase.from('memories').insert({
      user_id: user.id,
      kind: memory.kind ?? 'text',
      module: memory.module ?? 'personal',
      title: memory.title,
      summary: memory.summary ?? null,
      content: memory.content ?? null,
      ai_tags: memory.ai_tags ?? [],
      mood: memory.mood ?? null,
      amount: memory.amount ?? null,
      currency: memory.currency ?? null,
      location: memory.location ?? null,
      attachment_url: memory.attachment_url ?? null,
      metadata: (memory.metadata ?? {}) as never,
      occurred_at: memory.occurred_at ?? new Date().toISOString(),
    });
    if (!error) await load();
    return { error };
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('memories').delete().eq('id', id);
    if (!error) setMemories((prev) => prev.filter((m) => m.id !== id));
    return { error };
  };

  return { memories, loading, reload: load, create, remove };
};

export const groupByDay = (memories: Memory[]) => {
  const groups: { key: string; label: string; items: Memory[] }[] = [];
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  for (const m of memories) {
    const d = new Date(m.occurred_at);
    const key = d.toDateString();
    const label =
      key === today ? 'Today' : key === yesterday ? 'Yesterday'
        : d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
    const existing = groups.find((g) => g.key === key);
    if (existing) existing.items.push(m);
    else groups.push({ key, label, items: [m] });
  }
  return groups;
};

export const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
