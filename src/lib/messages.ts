import { useCallback, useEffect, useState } from 'react';
import {
  Bell, BrainCog, CalendarClock, CreditCard, FileText, HeartPulse, Receipt, Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
  assistant: { label: 'Assistant', icon: BrainCog, tint: 'bg-primary/10', color: 'text-primary' },
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
    let query = supabase.from('messages').select('*');
    query = archived ? query.not('archived_at', 'is', null) : query.is('archived_at', null);
    const { data } = await query.order('created_at', { ascending: false }).limit(120);
    setMessages((data ?? []) as MessageRow[]);
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

  const archive = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('messages').update({ archived_at: new Date().toISOString() }).eq('id', id);
  };

  const unarchive = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('messages').update({ archived_at: null }).eq('id', id);
  };

  const remove = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('messages').delete().eq('id', id);
  };

  const unread = messages.filter((m) => !m.read_at).length;

  return { messages, loading, unread, reload: load, markRead, markAllRead, archive, unarchive, remove };
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
