import { useEffect, useState } from 'react';
import { Bell, Loader2, Megaphone, Pencil, RefreshCw, Save, Search, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { AdminMessage, adminApi } from '@/lib/admin';
import { cn } from '@/lib/utils';

const fmtTime = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

const AdminMessagesTab = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [meta, setMeta] = useState<{ total: number; unread: number; byKind: { kind: string; count: number }[] }>({
    total: 0,
    unread: 0,
    byKind: [],
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: '', body: '' });
  const [broadcast, setBroadcast] = useState({ title: '', body: '', audience: 'all', level: 'info' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi<{
        messages: AdminMessage[];
        total: number;
        unread: number;
        byKind: { kind: string; count: number }[];
      }>('list_messages');
      setMessages(res.messages ?? []);
      setMeta({ total: res.total ?? 0, unread: res.unread ?? 0, byKind: res.byKind ?? [] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (key: string, fn: () => Promise<unknown>, msg: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(msg);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const filtered = messages.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${m.title ?? ''} ${m.body ?? ''} ${m.email} ${m.kind ?? ''}`.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="smarty-card p-4">
          <div className="flex items-center gap-2 text-primary">
            <Bell className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Sent</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{meta.total}</p>
          <p className="text-[11px] text-muted-foreground">last 200 messages</p>
        </div>
        <div className="smarty-card p-4">
          <div className="flex items-center gap-2 text-primary">
            <Bell className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Unread</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{meta.unread}</p>
        </div>
        {meta.byKind.slice(0, 2).map((k) => (
          <div key={k.kind} className="smarty-card p-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{k.kind}</span>
            <p className="mt-2 text-2xl font-extrabold text-foreground">{k.count}</p>
          </div>
        ))}
      </div>

      <div className="smarty-card p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Megaphone className="h-4 w-4 text-primary" /> Send a message
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Lands in the Message Center of everyone you pick, and shows on their notification bell.
        </p>
        <div className="mt-3 space-y-2">
          <input
            value={broadcast.title}
            onChange={(e) => setBroadcast((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title"
            className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
          />
          <textarea
            value={broadcast.body}
            onChange={(e) => setBroadcast((p) => ({ ...p, body: e.target.value }))}
            rows={3}
            placeholder="Message"
            className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={broadcast.audience}
              onChange={(e) => setBroadcast((p) => ({ ...p, audience: e.target.value }))}
              className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none"
              aria-label="Audience"
            >
              <option value="all">Everyone</option>
              <option value="premium">Premium members only</option>
              <option value="free">Free members only</option>
            </select>
            <select
              value={broadcast.level}
              onChange={(e) => setBroadcast((p) => ({ ...p, level: e.target.value }))}
              className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none"
              aria-label="Importance"
            >
              <option value="info">Normal</option>
              <option value="warning">Important</option>
              <option value="success">Good news</option>
            </select>
          </div>
          <button
            disabled={busy !== null}
            onClick={() =>
              act(
                'broadcast',
                async () => {
                  const res = await adminApi<{ sent: number }>('broadcast_message', broadcast);
                  setBroadcast({ title: '', body: '', audience: 'all', level: 'info' });
                  return res;
                },
                'Message sent',
              )
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-smooth active:scale-[0.99] disabled:opacity-50 sm:w-auto"
          >
            <Send className="h-4 w-4" /> Send message
          </button>
        </div>
      </div>

      <div className="smarty-card flex items-center gap-2 px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages, kind or email"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button onClick={load} aria-label="Refresh messages">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {filtered.length === 0 && <p className="px-1 text-sm text-muted-foreground">No messages found.</p>}

      <div className="grid gap-3 xl:grid-cols-2">
        {filtered.map((m) => (
          <div key={m.id} className="smarty-card space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                {m.kind ?? 'message'}
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                  m.read_at ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/15 text-emerald-600',
                )}
              >
                {m.read_at ? 'Read' : 'Unread'}
              </span>
              <span className="ml-auto text-[11px] text-muted-foreground">{fmtTime(m.created_at)}</span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">To {m.email}</p>

            {editing === m.id ? (
              <div className="space-y-2">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm font-bold text-foreground outline-none"
                />
                <textarea
                  value={draft.body}
                  onChange={(e) => setDraft((p) => ({ ...p, body: e.target.value }))}
                  rows={3}
                  className="w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none"
                />
                <div className="flex gap-2">
                  <button
                    disabled={busy !== null}
                    onClick={() =>
                      act(
                        `save-${m.id}`,
                        async () => {
                          await adminApi('update_message', { id: m.id, ...draft });
                          setEditing(null);
                        },
                        'Message updated',
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-primary px-3.5 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-3.5 py-2 text-[11px] font-bold text-foreground"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-foreground">{m.title}</p>
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground">{m.body}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setEditing(m.id);
                      setDraft({ title: m.title ?? '', body: m.body ?? '' });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-3.5 py-2 text-[11px] font-bold text-foreground transition-smooth active:scale-95"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    disabled={busy !== null}
                    onClick={() => act(`del-${m.id}`, () => adminApi('delete_message', { id: m.id }), 'Message deleted')}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-3.5 py-2 text-[11px] font-bold text-destructive transition-smooth active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMessagesTab;
