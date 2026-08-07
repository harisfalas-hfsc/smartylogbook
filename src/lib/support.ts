import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { hasPremium } from '@/lib/subscription';


export const SUPPORT_EMAIL = 'smartylogbook@outlook.com';

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

export interface SupportReply {
  id: string;
  ticket_id: string;
  author: 'customer' | 'assistant' | 'admin';
  body: string;
  created_at: string;
}

export const AUTHOR_LABEL: Record<SupportReply['author'], string> = {
  customer: 'You',
  assistant: 'Smarty Assistant',
  admin: 'Smarty Logbook support',
};

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

  // Support conversations are a Smarty Premium benefit.
  if (!userId) return { error: new Error('Please sign in to write to support') };
  if (!(await hasPremium(userId))) {
    return { error: new Error('Support conversations are part of Smarty Premium') };
  }


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

  const ticketId = crypto.randomUUID();
  const { error } = await supabase.from('support_tickets').insert({
    id: ticketId,
    user_id: userId,
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    attachment_url,
    attachment_name,
  });
  if (error) return { error };

  // Smarty Assistant answers the very first message straight away.
  supabase.functions
    .invoke('support-assistant', { body: { ticketId } })
    .catch((e) => console.error('Support assistant reply failed', e));

  // Email the ticket to support, and confirm receipt to the customer.
  let attachmentLink: string | undefined;
  if (attachment_url) {
    const { data: signed } = await supabase.storage
      .from('support')
      .createSignedUrl(attachment_url, 60 * 60 * 24 * 7);
    attachmentLink = signed?.signedUrl ?? undefined;
  }

  try {
    await Promise.all([
      supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'support-ticket-notification',
          idempotencyKey: `support-notify-${ticketId}`,
          templateData: {
            name: parsed.data.name,
            email: parsed.data.email,
            subject: parsed.data.subject,
            message: parsed.data.message,
            attachmentName: attachment_name ?? undefined,
            attachmentUrl: attachmentLink,
          },
        },
      }),
      supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'support-ticket-confirmation',
          recipientEmail: parsed.data.email,
          idempotencyKey: `support-confirm-${ticketId}`,
          templateData: {
            name: parsed.data.name,
            subject: parsed.data.subject,
            message: parsed.data.message,
          },
        },
      }),
    ]);
  } catch (e) {
    console.error('Support ticket email failed', e);
  }

  return { error: null };
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


/** The full back and forth on one ticket, shared by the customer and the admin. */
export const useTicketThread = (ticketId: string | null) => {
  const [replies, setReplies] = useState<SupportReply[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!ticketId) { setReplies([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('support_replies')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setReplies((data ?? []) as SupportReply[]);
    setLoading(false);
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  /** Customer follow-up, written from their own message center. */
  const sendAsCustomer = async (body: string) => {
    if (!ticketId) return { error: new Error('No conversation') };
    const text = body.trim();
    if (text.length < 2) return { error: new Error('Write a short message first') };
    const { data, error } = await supabase
      .from('support_replies')
      .insert({ ticket_id: ticketId, author: 'customer', body: text.slice(0, 4000) })
      .select('*')
      .single();
    if (!error && data) {
      setReplies((prev) => [...prev, data as SupportReply]);
      notifyAdminOfFollowUp(ticketId, text.slice(0, 4000), (data as SupportReply).id);
    }
    return { error };
  };


  /** Admin answer, delivered to the customer's message center. */
  const sendAsAdmin = async (body: string) => {
    if (!ticketId) return { error: new Error('No conversation') };
    const text = body.trim();
    if (text.length < 2) return { error: new Error('Write a short reply first') };
    const { error } = await supabase.functions.invoke('admin-api', {
      body: { action: 'support_reply', ticketId, body: text.slice(0, 4000) },
    });
    if (!error) await load();
    return { error };
  };

  /** Asks Smarty Assistant to write the first-line answer on this ticket. */
  const askAssistant = async () => {
    if (!ticketId) return { error: new Error('No conversation') };
    const { error } = await supabase.functions.invoke('support-assistant', { body: { ticketId } });
    if (!error) await load();
    return { error };
  };

  return { replies, loading, reload: load, sendAsCustomer, sendAsAdmin, askAssistant };

};

/** One ticket the signed-in customer owns, with its conversation. */
export const useMyTicket = (ticketId: string | null) => {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!ticketId) { setTicket(null); setLoading(false); return; }
      const { data } = await supabase.from('support_tickets').select('*').eq('id', ticketId).maybeSingle();
      if (!alive) return;
      setTicket((data as SupportTicket) ?? null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [ticketId]);

  return { ticket, loading };
};
