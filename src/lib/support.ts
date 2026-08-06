import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export const SUPPORT_EMAIL = 'support@smartylogbook.com';

export interface SupportTicket {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  attachment_url: string | null;
  attachment_name: string | null;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export const ticketSchema = z.object({
  name: z.string().trim().min(2, 'Please tell us your name').max(80),
  email: z.string().trim().email('Enter a valid email address').max(255),
  subject: z.string().trim().min(3, 'Add a short subject').max(140),
  message: z.string().trim().min(10, 'Tell us a bit more so we can help').max(4000),
});

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Sends a support ticket, with an optional screenshot or file. */
export const submitTicket = async (
  input: z.infer<typeof ticketSchema> & { file?: File | null },
) => {
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) {
    return { error: new Error(parsed.error.issues[0]?.message ?? 'Please check the form') };
  }

  const { data: session } = await supabase.auth.getUser();
  const userId = session.user?.id ?? null;

  let attachment_url: string | null = null;
  let attachment_name: string | null = null;
  if (input.file) {
    if (input.file.size > MAX_ATTACHMENT_BYTES) {
      return { error: new Error('That file is larger than 10 MB') };
    }
    const safe = input.file.name.replace(/[^\w.\-]+/g, '_').slice(-80);
    const path = `${userId ?? 'guest'}/${crypto.randomUUID()}-${safe}`;
    const { error: upErr } = await supabase.storage.from('support').upload(path, input.file, {
      contentType: input.file.type || 'application/octet-stream',
    });
    if (upErr) return { error: upErr };
    attachment_url = path;
    attachment_name = input.file.name;
  }

  const { error } = await supabase.from('support_tickets').insert({
    user_id: userId,
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    attachment_url,
    attachment_name,
  });
  return { error };
};

/** Admin view of every ticket that came in. */
export const useSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setTickets((data ?? []) as SupportTicket[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', id);
    if (!error) setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    return { error };
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('support_tickets').delete().eq('id', id);
    if (!error) setTickets((prev) => prev.filter((t) => t.id !== id));
    return { error };
  };

  const attachmentUrl = async (path: string | null) => {
    if (!path) return null;
    const { data } = await supabase.storage.from('support').createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  return { tickets, loading, reload: load, setStatus, remove, attachmentUrl };
};
