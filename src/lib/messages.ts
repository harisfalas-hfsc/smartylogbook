import { useCallback, useEffect, useState } from 'react';
import {
  Bell, BrainCog, CalendarClock, CreditCard, FileText, HeartPulse, Lightbulb, Megaphone, Receipt, Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { offlineFirst } from '@/lib/offline/offline-first';
import { useAuth } from '@/contexts/AuthContext';

export interface MessageRow {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  level: string;
  module: string | null;
  action_label: string | null;
  action_url: string | null;
  related_at: string | null;
  metadata: Record<string, unknown> | null;
  dedupe_key: string | null;
  read_at: string | null;
  archived_at: string | null;
  created_at: string;
}

export const MESSAGE_KINDS: Record<string, { label: string; icon: typeof Bell; tint: string; color: string }> = {
  welcome: { label: 'Welcome', icon: Sparkles, tint: 'bg-primary/10', color: 'text-primary' },
  brief: { label: 'Daily brief', icon: BrainCog, tint: 'bg-primary/10', color: 'text-primary' },
  insight: { label: 'Daily insight', icon: Sparkles, tint: 'bg-primary/10', color: 'text-primary' },
  recap: { label: 'Weekly recap', icon: BrainCog, tint: 'bg-primary/10', color: 'text-primary' },
  tip: { label: 'Daily tip', icon: Lightbulb, tint: 'bg-primary/10', color: 'text-primary' },
  assistant: { label: 'Assistant', icon: BrainCog, tint: 'bg-primary/10', color: 'text-primary' },
  announcement: { label: 'Announcement', icon: Megaphone, tint: 'bg-primary/10', color: 'text-primary' },
  calendar: { label: 'Calendar', icon: CalendarClock, tint: 'bg-mod-business/10', color: 'text-mod-business' },
  event: { label: 'Event', icon: CalendarClock, tint: 'bg-mod-business/10', color: 'text-mod-business' },
  task: { label: 'Task', icon: Bell, tint: 'bg-mod-personal/10', color: 'text-mod-personal' },
  bill: { label: 'Bill', icon: Receipt, tint: 'bg-mod-finance/10', color: 'text-mod-finance' },
  health: { label: 'Health', icon: HeartPulse, tint: 'bg-mod-health/10', color: 'text-mod-health' },
  document: { label: 'Document', icon: FileText, tint: 'bg-mod-documents/10', color: 'text-mod-documents' },
  plan: { label: 'Your plan', icon: CreditCard, tint: 'bg-mod-finance/10', color: 'text-mod-finance' },
  info: { label: 'Update', icon: Bell, tint: 'bg-secondary', color: 'text-foreground' },
};

export const messageStyle = (kind: string) => MESSAGE_KINDS[kind] ?? MESSAGE_KINDS.info;

export type MessageBucket = 'missed' | 'today' | 'tomorrow' | 'week' | 'earlier';

export const BUCKETS: { id: MessageBucket; label: string }[] = [
  { id: 'missed', label: 'Missed' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'This week' },
  { id: 'earlier', label: 'Earlier' },
];

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-CA');

/** Where a message belongs in the notification center, based on when it is relevant. */
export const bucketOf = (m: MessageRow, now = new Date()): MessageBucket => {
  const ref = m.related_at ?? m.created_at;
  const key = dayKey(ref);
  const today = now.toLocaleDateString('en-CA');
  const tomorrow = new Date(now.getTime() + 86400000).toLocaleDateString('en-CA');
  const weekEnd = new Date(now.getTime() + 7 * 86400000).toLocaleDateString('en-CA');
  if (key === today) return 'today';
  if (key === tomorrow) return 'tomorrow';
  if (key > tomorrow && key <= weekEnd) return 'week';
  if (key < today) return m.level === 'high' && m.related_at ? 'missed' : 'earlier';
  return 'earlier';
};

/** Groups messages into the notification center sections, missed first. */
export const groupMessages = (messages: MessageRow[], now = new Date()) => {
  const groups = new Map<MessageBucket, MessageRow[]>();
  for (const b of BUCKETS) groups.set(b.id, []);
  for (const m of messages) groups.get(bucketOf(m, now))!.push(m);
  return BUCKETS.map((b) => ({ ...b, items: groups.get(b.id)! })).filter((g) => g.items.length > 0);
};


/** Everything Smarty Assistant wants to tell the user, in one inbox. */
export const useMessages = (archived = false) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }
    try {
      const rows = await offlineFirst<MessageRow[]>(
        archived ? 'inbox:archived' : 'inbox:messages',
        async () => {
          let query = supabase.from('messages').select('*');
          query = archived ? query.not('archived_at', 'is', null) : query.is('archived_at', null);
          const { data, error } = await query.order('created_at', { ascending: false }).limit(120);
          if (error) throw new Error(error.message);
          return (data ?? []) as MessageRow[];
        },
        user.id,
      );
      setMessages(rows);
    } catch {
      setMessages([]);
    }
    setLoading(false);
  }, [user?.id, archived]);

  useEffect(() => { void load(); }, [load]);

  const markRead = async (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read_at: new Date().toISOString() } : m)));
    await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', id);
  };

  const markAllRead = async () => {
    const now = new Date().toISOString();
    setMessages((prev) => prev.map((m) => (m.read_at ? m : { ...m, read_at: now })));
    await supabase.from('messages').update({ read_at: now }).is('read_at', null);
  };

  /** Marks a batch of messages read or unread. */
  const setRead = async (ids: string[], read: boolean) => {
    if (!ids.length) return;
    const value = read ? new Date().toISOString() : null;
    setMessages((prev) => prev.map((m) => (ids.includes(m.id) ? { ...m, read_at: value } : m)));
    await supabase.from('messages').update({ read_at: value }).in('id', ids);
  };

  const archive = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('messages').update({ archived_at: new Date().toISOString() }).eq('id', id);
  };

  const unarchive = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('messages').update({ archived_at: null }).eq('id', id);
  };

  /** Archives or restores a batch of messages. */
  const setArchived = async (ids: string[], archivedState: boolean) => {
    if (!ids.length) return;
    setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
    await supabase
      .from('messages')
      .update({ archived_at: archivedState ? new Date().toISOString() : null })
      .in('id', ids);
  };

  const remove = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('messages').delete().eq('id', id);
  };

  /** Permanently deletes a batch of messages. */
  const removeMany = async (ids: string[]) => {
    if (!ids.length) return;
    setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
    await supabase.from('messages').delete().in('id', ids);
  };

  const unread = messages.filter((m) => !m.read_at).length;

  return {
    messages, loading, unread, reload: load,
    markRead, markAllRead, setRead, archive, unarchive, setArchived, remove, removeMany,
  };
};


/** Lightweight unread counter for the header bell. */
export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    if (!user) { setUnread(0); return; }
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
      .is('archived_at', null);
    setUnread(count ?? 0);
  }, [user?.id]);

  useEffect(() => {
    void load();
    if (!user) return;
    const channel = supabase
      .channel('messages-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [load, user?.id]);

  return unread;
};

/** Posts a message into the user's inbox (no duplicates when a key is given). */
export const postMessage = async (
  userId: string,
  msg: {
    kind: string;
    title: string;
    body?: string | null;
    level?: string;
    module?: string | null;
    action_label?: string | null;
    action_url?: string | null;
    related_at?: string | null;
    dedupe_key?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  const { error } = await supabase.from('messages').insert([{
    user_id: userId,
    kind: msg.kind,
    title: msg.title,
    body: msg.body ?? null,
    level: msg.level ?? 'normal',
    module: msg.module ?? null,
    action_label: msg.action_label ?? null,
    action_url: msg.action_url ?? null,
    related_at: msg.related_at ?? null,
    dedupe_key: msg.dedupe_key ?? null,
    metadata: (msg.metadata ?? {}) as never,
  }]);
  return { error };
};
