import { useState } from 'react';
import { Check, ExternalLink, Loader2, Mail, RefreshCw, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AUTHOR_LABEL, SupportTicket, useSupportTickets, useTicketThread } from '@/lib/support';

const fmt = (d: string) => new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** The whole conversation on one ticket, plus the in-app reply box. */
const Thread = ({ ticket }: { ticket: SupportTicket }) => {
  const { replies, loading, sendAsAdmin } = useTicketThread(ticket.id);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    const { error } = await sendAsAdmin(draft);
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setDraft('');
    toast.success(ticket.user_id ? 'Reply sent to their message center' : 'Reply saved');
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="rounded-2xl bg-secondary p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {ticket.name} , {fmt(ticket.created_at)}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{ticket.message}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
        ) : replies.map((r) => (
          <div
            key={r.id}
            className={cn(
              'rounded-2xl p-3',
              r.author === 'customer' ? 'bg-secondary' : 'border border-primary/25 bg-primary/5',
            )}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {r.author === 'customer' ? ticket.name : r.author === 'assistant' ? 'Smarty Assistant' : 'You'} , {fmt(r.created_at)}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{r.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border p-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder={`Reply to ${ticket.name} inside the app`}
          className="w-full resize-none bg-transparent px-2 py-1 text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-[11px] text-muted-foreground">
            {ticket.user_id ? 'They get it in their message center.' : 'This customer has no account, use email.'}
          </p>
          <button
            onClick={send}
            disabled={sending || draft.trim().length < 2}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminSupportTab = () => {
  const { tickets, loading, reload, setStatus, remove, attachmentUrl } = useSupportTickets();
  const [open, setOpen] = useState<string | null>(null);

  const openAttachment = async (t: SupportTicket) => {
    const url = await attachmentUrl(t.attachment_url);
    if (!url) { toast.error('Attachment not available'); return; }
    window.open(url, '_blank', 'noopener');
  };

  if (loading) {
    return <div className="flex min-h-[20vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tickets.length} message{tickets.length === 1 ? '' : 's'}</p>
        <button onClick={reload} className="inline-flex items-center gap-1.5 rounded-2xl bg-secondary px-3 py-1.5 text-[12px] font-bold text-secondary-foreground">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="smarty-card p-8 text-center text-sm text-muted-foreground">No support messages yet.</div>
      ) : tickets.map((t) => (
        <div key={t.id} className="smarty-card p-4">
          <button className="w-full text-left" onClick={() => setOpen(open === t.id ? null : t.id)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-foreground">{t.subject}</p>
                <p className="truncate text-[12px] text-muted-foreground">{t.name} , {t.email} , {fmt(t.created_at)}</p>
              </div>
              <span className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase',
                t.status === 'open' ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600',
              )}>{t.status}</span>
            </div>
          </button>

          {open === t.id && (
            <div className="mt-3 space-y-3 border-t border-border pt-3">
              <Thread ticket={t} />

              {t.attachment_url && (
                <button onClick={() => openAttachment(t)} className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-3 py-1.5 text-[12px] font-semibold text-foreground">
                  <ExternalLink className="h-3.5 w-3.5" /> {t.attachment_name ?? 'Attachment'}
                </button>
              )}

              {/* One row on every screen size. */}
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${t.email}?subject=${encodeURIComponent(`Re: ${t.subject}`)}`}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary px-2 py-2 text-[11px] font-bold text-primary-foreground"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Reply by email</span>
                </a>
                <button
                  onClick={async () => {
                    const next = t.status === 'open' ? 'closed' : 'open';
                    const { error } = await setStatus(t.id, next);
                    if (error) toast.error(error.message); else toast.success(`Marked ${next}`);
                  }}
                  className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-border px-2 py-2 text-[11px] font-bold text-foreground"
                >
                  <Check className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t.status === 'open' ? 'Mark closed' : 'Reopen'}</span>
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm('Delete this message?')) return;
                    const { error } = await remove(t.id);
                    if (error) toast.error(error.message); else toast.success('Deleted');
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-border px-3 py-2 text-[11px] font-bold text-destructive"
                  aria-label="Delete message"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminSupportTab;
