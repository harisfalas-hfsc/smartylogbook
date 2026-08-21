import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { indexMemories } from '@/lib/semantic';
import { hasPremium } from '@/lib/subscription';
import type { ItemStatus } from '@/lib/status';
import { offlineFirstDetailed, offlineSave } from '@/lib/offline/offline-first';
import { enqueueAction } from '@/lib/offline/queue';
import { OFFLINE_NOTICE } from '@/lib/offline/useOnlineStatus';
import { isOnline } from '@/lib/offline/connectivity';


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
  related_ids: string[];
  relation_note: string | null;
  deleted_at?: string | null;
  status?: string | null;
  completed_at?: string | null;
  due_at?: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

export type NewMemory = Partial<Memory> & { title: string };

export const useMemories = (options?: { module?: string; limit?: number }) => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [noCopy, setNoCopy] = useState(false);


  const load = useCallback(async () => {
    if (!user) {
      setMemories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const cacheKey = options?.module ? `logbook:list:${options.module}` : 'logbook:list';
    try {
      const result = await offlineFirstDetailed<Memory[]>(
        cacheKey,
        async () => {
          let query = supabase
            .from('memories')
            .select('*')
            .is('deleted_at', null)
            .order('occurred_at', { ascending: false });
          if (options?.module) query = query.eq('module', options.module);
          if (options?.limit) query = query.limit(options.limit);
          const { data, error } = await query;
          if (error) throw new Error(error.message);
          return (data ?? []) as unknown as Memory[];
        },
        user.id,
      );
      const rows = options?.limit ? result.data.slice(0, options.limit) : result.data;
      setMemories(rows);
      setFromCache(result.fromCache);
      setNoCopy(false);
    } catch {
      setMemories([]);
      setNoCopy(!isOnline());
    }
    setLoading(false);
  }, [user, options?.module, options?.limit]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (memory: NewMemory) => {
    if (!user) return { error: new Error('Not signed in') };
    if (!isOnline()) {
      return { error: new Error(OFFLINE_NOTICE), id: null };
    }
    const { data: inserted, error } = await supabase.from('memories').insert({
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
      related_ids: memory.related_ids ?? [],
      relation_note: memory.relation_note ?? null,
      occurred_at: memory.occurred_at ?? new Date().toISOString(),
    }).select('id').maybeSingle();
    if (!error) {
      await load();
      if (inserted?.id) void indexMemories([inserted.id]);
    }
    return { error, id: inserted?.id ?? null };
  };

  /** Manual edit of a record by the user. Queued and replayed when offline. */
  const update = async (id: string, patch: Partial<Memory>) => {
    const allowed: Record<string, unknown> = {};
    for (const key of ['title', 'summary', 'content', 'module', 'kind', 'ai_tags', 'amount', 'currency', 'location', 'occurred_at', 'metadata', 'status', 'completed_at', 'due_at', 'attachment_url'] as const) {
      if (key in patch) allowed[key] = patch[key] ?? null;
    }
    if (!Object.keys(allowed).length) return { error: null };

    const applyLocally = () =>
      setMemories((prev) => {
        const next = prev.map((m) => (m.id === id ? { ...m, ...(allowed as Partial<Memory>) } : m));
        void offlineSave(options?.module ? `logbook:list:${options.module}` : 'logbook:list', next, user?.id);
        return next;
      });

    if (!isOnline()) {
      await enqueueAction('memory-update', { id, patch: allowed }, user?.id);
      applyLocally();
      return { error: null };
    }

    const { error } = await supabase.from('memories').update(allowed).eq('id', id);
    if (!error) {
      applyLocally();
      void indexMemories([id]);
    }
    return { error };
  };

  /** Same progress model everywhere: open, completed or postponed. */
  const setStatus = async (id: string, status: ItemStatus, dueAt?: string | null) =>
    update(id, {
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null,
      ...(dueAt !== undefined ? { due_at: dueAt } : {}),
    });

  /** Postpone / reschedule a record to a new date. */
  const reschedule = async (id: string, dueAt: string) =>
    update(id, { status: 'postponed', due_at: dueAt, completed_at: null });



  /** User moves an entry to another category, and the assistant learns from it. */
  const reclassify = async (memory: Memory, toModule: string, note?: string) => {
    if (!user) return { error: new Error('Not signed in') };
    if (memory.module === toModule) return { error: null };
    const { error } = await supabase
      .from('memories')
      .update({ module: toModule })
      .eq('id', memory.id);
    if (error) return { error };
    setMemories((prev) => options?.module && options.module !== toModule
      ? prev.filter((m) => m.id !== memory.id)
      : prev.map((m) => (m.id === memory.id ? { ...m, module: toModule } : m)));
    await supabase.from('classification_corrections').insert({
      user_id: user.id,
      memory_id: memory.id,
      title: memory.title,
      summary: memory.summary,
      ai_tags: memory.ai_tags ?? [],
      kind: memory.kind,
      from_module: memory.module,
      to_module: toModule,
      note: note ?? null,
    });
    void indexMemories([memory.id]);
    return { error: null };
  };

  /** Bulk move used when a category is deleted, records are kept, not trashed. */
  const moveAll = async (fromModule: string, toModule: string) => {
    if (!user) return { error: new Error('Not signed in') };
    const { error } = await supabase
      .from('memories')
      .update({ module: toModule })
      .eq('user_id', user.id)
      .eq('module', fromModule);
    if (!error) {
      setMemories((prev) => prev.map((m) => (m.module === fromModule ? { ...m, module: toModule } : m)));
    }
    return { error };
  };

  /**
   * Premium: soft delete, the record moves to Trash for 30 days.
   * Free: deleting is permanent, there is no Trash to park records in.
   */
  const remove = async (id: string) => {
    if (!user) return { error: new Error('Not signed in') };
    const premium = await hasPremium(user.id);
    const { error } = premium
      ? await supabase.from('memories').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      : await supabase.from('memories').delete().eq('id', id);
    if (!error) setMemories((prev) => prev.filter((m) => m.id !== id));
    return { error };
  };


  return { memories, loading, fromCache, noCopy, reload: load, create, remove, reclassify, update, moveAll, setStatus, reschedule };
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

/** Times are always rendered in the device's own timezone. */
export const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** A record is stamped with the moment it was captured, so we always show that time. */
export const whenLabel = (m: Pick<Memory, 'occurred_at'>) => timeOf(m.occurred_at);

/** Never show a blank row: fall back to the file name, then a neutral label. */
export const titleOf = (m: Pick<Memory, 'title' | 'metadata'>) => {
  const t = (m.title ?? '').trim();
  if (t) return t;
  const file = (m.metadata as { file_name?: string } | null)?.file_name;
  if (typeof file === 'string' && file.trim()) return file.trim();
  return 'Untitled record';
};




export const TRASH_RETENTION_DAYS = 30;

export const daysLeftInTrash = (deletedAt: string) => {
  const gone = new Date(deletedAt).getTime() + TRASH_RETENTION_DAYS * 86400000;
  return Math.max(0, Math.ceil((gone - Date.now()) / 86400000));
};

/** Trash bin: soft-deleted records, kept 30 days then removed for good. */
export const useTrash = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const rows = await offlineFirstDetailed<Memory[]>(
        'logbook:trash',
        async () => {
          const { data, error } = await supabase
            .from('memories')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false });
          if (error) throw new Error(error.message);
          return (data ?? []) as unknown as Memory[];
        },
        user.id,
      );
      setItems(rows.data);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const restore = async (id: string) => {
    const { error } = await supabase.from('memories').update({ deleted_at: null }).eq('id', id);
    if (!error) {
      setItems((prev) => prev.filter((m) => m.id !== id));
      void indexMemories([id]);
    }
    return { error };
  };

  const deleteForever = async (id: string) => {
    const { error } = await supabase.from('memories').delete().eq('id', id);
    if (!error) setItems((prev) => prev.filter((m) => m.id !== id));
    return { error };
  };

  const restoreMany = async (ids: string[]) => {
    if (!ids.length) return { error: null };
    const { error } = await supabase.from('memories').update({ deleted_at: null }).in('id', ids);
    if (!error) {
      setItems((prev) => prev.filter((m) => !ids.includes(m.id)));
      void indexMemories(ids);
    }
    return { error };
  };

  const deleteMany = async (ids: string[]) => {
    if (!ids.length) return { error: null };
    const { error } = await supabase.from('memories').delete().in('id', ids);
    if (!error) setItems((prev) => prev.filter((m) => !ids.includes(m.id)));
    return { error };
  };

  const emptyTrash = async () => deleteMany(items.map((m) => m.id));

  return { items, loading, reload: load, restore, deleteForever, restoreMany, deleteMany, emptyTrash };
};

