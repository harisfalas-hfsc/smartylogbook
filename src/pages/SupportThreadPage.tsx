import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, LifeBuoy, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMyTicket, useTicketThread } from '@/lib/support';

const fmt = (d: string) => new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/** The customer's side of a support conversation, inside their message center. */
const SupportThreadPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const ticketId = id ?? null;
  const { ticket, loading } = useMyTicket(ticketId);
  const { replies, loading: repliesLoading, sendAsCustomer } = useTicketThread(ticketId);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    const { error } = await sendAsCustomer(draft);
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setDraft('');
    toast.success('Sent to Smarty Logbook support');
  };

  if (loading) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  if (!ticket) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="smarty-card p-8 text-center text-sm text-muted-foreground">This conversation is no longer available.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="animate-fade-up flex items-start gap-2">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LifeBuoy className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground">{ticket.subject}</h1>
          <p className="text-[12px] text-muted-foreground">Support conversation , {ticket.status}</p>
        </div>
      </header>

      <div className="smarty-card space-y-2 p-4">
        <div className="rounded-2xl bg-secondary p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">You , {fmt(ticket.created_at)}</p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{ticket.message}</p>
        </div>

        {repliesLoading ? (
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
              {r.author === 'customer' ? 'You' : r.author === 'assistant' ? 'Smarty Assistant' : 'Smarty Logbook support'} , {fmt(r.created_at)}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{r.body}</p>
          </div>
        ))}
      </div>

      <div className="smarty-card p-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Write back to support"
          className="w-full resize-none bg-transparent px-2 py-1 text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex justify-end px-1">
          <button
            onClick={send}
            disabled={sending || draft.trim().length < 2}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-[12px] font-bold text-primary-foreground disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportThreadPage;
