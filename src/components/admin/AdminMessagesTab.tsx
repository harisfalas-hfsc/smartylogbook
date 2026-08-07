import { useEffect, useMemo, useState } from 'react';
import { Bell, Info, Loader2, MailOpen, Megaphone, Pencil, RefreshCw, Save, Search, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { AdminMessage, adminApi, kindInfo } from '@/lib/admin';
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

interface Meta {
  total: number;
  unread: number;
  byKind: { kind: string; count: number }[];
  audience: { all: number; premium: number; free: number };
}

const AdminMessagesTab = () => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [meta, setMeta] = useState<Meta>({
    total: 0,
    unread: 0,
    byKind: [],
    audience: { all: 0, premium: 0, free: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: '', body: '' });
  const [broadcast, setBroadcast] = useState({ title: '', body: '', audience: 'all', level: 'normal' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi<Meta & { messages: AdminMessage[] }>('list_messages');
      setMessages(res.messages ?? []);
      setMeta({
        total: res.total ?? 0,
        unread: res.unread ?? 0,
        byKind: res.byKind ?? [],
        audience: res.audience ?? { all: 0, premium: 0, free: 0 },
      });
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

  const filtered = useMemo(
    () =>
      messages.filter((m) => {
        if (kindFilter && (m.kind ?? 'other') !== kindFilter) return false;
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return `${m.title ?? ''} ${m.body ?? ''} ${m.email} ${m.kind ?? ''}`.toLowerCase().includes(q);
      }),
    [messages, search, kindFilter],
  );

  const recipients =
    broadcast.audience === 'premium'
      ? meta.audience.premium
      : broadcast.audience === 'free'
        ? meta.audience.free
        : meta.audience.all;

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="smarty-card border-primary/40 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Info className="h-4 w-4 text-primary" /> What this tab shows
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
          Every message that landed in a member’s Message Center, newest first, across all accounts. Most of them are
          written automatically by Smarty Assistant through the automations in the <strong className="text-foreground">Jobs</strong>{' '}
          tab. You can also write your own announcement below. Each card says who received it and which automation
          produced it.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="smarty-card p-4">
          <div className="flex items-center gap-2 text-primary">
            <Bell className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Delivered</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{meta.total}</p>
          <p className="text-[11px] text-muted-foreground">most recent 200 messages, all members</p>
        </div>
        <div className="smarty-card p-4">
          <div className="flex items-center gap-2 text-primary">
            <MailOpen className="h-4 w-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Still unread</span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{meta.unread}</p>
          <p className="text-[11px] text-muted-foreground">nobody has opened these yet</p>
        </div>
        <div className="smarty-card p-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Members</span>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{meta.audience.all}</p>
          <p className="text-[11px] text-muted-foreground">
            {meta.audience.premium} premium · {meta.audience.free} free
          </p>
        </div>
        <div className="smarty-card p-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Types in use</span>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{meta.byKind.length}</p>
          <p className="text-[11px] text-muted-foreground">see the breakdown below</p>
        </div>
      </div>

      <div className="smarty-card p-4">
        <p className="text-sm font-bold text-foreground">Breakdown by type</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Tap a type to see only those messages. Each line explains what it is and who sends it.
        </p>
        <div className="mt-3 space-y-2">
          {meta.byKind.map((k) => {
            const info = kindInfo(k.kind);
            const activeFilter = kindFilter === k.kind;
            return (
              <div
                key={k.kind}
                className={cn(
                  'rounded-2xl border p-3 transition-smooth',
                  activeFilter ? 'border-primary bg-primary/5' : 'border-border bg-card',
                )}
              >
                <button
                  onClick={() => setKindFilter(activeFilter ? '' : k.kind)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <span className="text-sm font-bold text-foreground">{info.label}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {k.count}
                  </span>
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {activeFilter ? 'Showing' : 'Filter'}
                  </span>
                </button>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{info.what}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Sent by:</strong> {info.source}
                </p>
                <button
                  disabled={busy !== null}
                  onClick={() => {
                    if (!confirm(`Delete all ${k.count} “${info.label}” messages from every member?`)) return;
                    act(
                      `delk-${k.kind}`,
                      () => adminApi('delete_messages_by_kind', { kind: k.kind }),
                      `All ${info.label} messages deleted`,
                    );
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[10px] font-bold text-destructive disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" /> Delete all of this type
                </button>
              </div>
            );
          })}
          {meta.byKind.length === 0 && <p className="text-sm text-muted-foreground">Nothing sent yet.</p>}
        </div>
      </div>

      <div className="smarty-card p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Megaphone className="h-4 w-4 text-primary" /> Send an announcement to members
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          This writes one message into the Message Center of every member in the audience you pick, and lights up their
          notification bell. It is not an email.
        </p>
        <div className="mt-3 space-y-2">
          <input
            value={broadcast.title}
            onChange={(e) => setBroadcast((p) => ({ ...p, title: e.target.value }))}
            placeholder="Title, e.g. New: photo albums"
            className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
          />
          <textarea
            value={broadcast.body}
            onChange={(e) => setBroadcast((p) => ({ ...p, body: e.target.value }))}
            rows={3}
            placeholder="What you want members to read"
            className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={broadcast.audience}
              onChange={(e) => setBroadcast((p) => ({ ...p, audience: e.target.value }))}
              className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none"
              aria-label="Audience"
            >
              <option value="all">Everyone ({meta.audience.all})</option>
              <option value="premium">Premium members only ({meta.audience.premium})</option>
              <option value="free">Free accounts only ({meta.audience.free})</option>
            </select>
            <select
              value={broadcast.level}
              onChange={(e) => setBroadcast((p) => ({ ...p, level: e.target.value }))}
              className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none"
              aria-label="Importance"
            >
              <option value="normal">Normal</option>
              <option value="warning">Important (red in the Message Center)</option>
            </select>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground">
            This will reach <strong className="text-foreground">{recipients}</strong>{' '}
            {recipients === 1 ? 'member' : 'members'} right now.
          </p>
          <button
            disabled={busy !== null || !broadcast.title.trim() || !broadcast.body.trim()}
            onClick={() => {
              if (!confirm(`Send “${broadcast.title}” to ${recipients} member(s)?`)) return;
              act(
                'broadcast',
                async () => {
                  const res = await adminApi<{ sent: number }>('broadcast_message', broadcast);
                  setBroadcast({ title: '', body: '', audience: 'all', level: 'normal' });
                  return res;
                },
                'Announcement sent',
              );
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-smooth active:scale-[0.99] disabled:opacity-50 sm:w-auto"
          >
            <Send className="h-4 w-4" /> Send to {recipients} {recipients === 1 ? 'member' : 'members'}
          </button>
        </div>
      </div>

      <div className="smarty-card flex items-center gap-2 px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages, type or email"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button onClick={load} aria-label="Refresh messages">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {kindFilter && (
        <button
          onClick={() => setKindFilter('')}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-primary/30 bg-primary/5 px-3.5 py-2 text-[11px] font-bold text-primary"
        >
          <X className="h-3.5 w-3.5" /> Showing only {kindInfo(kindFilter).label}, clear filter
        </button>
      )}

      {filtered.length === 0 && <p className="px-1 text-sm text-muted-foreground">No messages found.</p>}

      <div className="grid gap-3 xl:grid-cols-2">
        {filtered.map((m) => {
          const info = kindInfo(m.kind);
          return (
            <div key={m.id} className="smarty-card space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {info.label}
                </span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                    m.read_at ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/15 text-emerald-600',
                  )}
                >
                  {m.read_at ? 'Read' : 'Unread'}
                </span>
                {m.level === 'high' && (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-destructive">
                    Important
                  </span>
                )}
                {m.archived_at && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Archived
                  </span>
                )}
                <span className="ml-auto text-[11px] text-muted-foreground">{fmtTime(m.created_at)}</span>
              </div>
              <p className="truncate text-[11px] text-muted-foreground">Received by {m.email}</p>

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
                  <p className="rounded-xl bg-secondary/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                    {info.source}
                  </p>
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
                      onClick={() =>
                        act(`del-${m.id}`, () => adminApi('delete_message', { id: m.id }), 'Message deleted')
                      }
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-3.5 py-2 text-[11px] font-bold text-destructive transition-smooth active:scale-95 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminMessagesTab;
