import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive, ArchiveRestore, CheckCheck, ChevronDown, Inbox, Loader2, Mail, MailOpen,
  MoreVertical, Trash2, X,
} from 'lucide-react';
import { useMessages, messageStyle, groupMessages, bucketOf, type MessageRow } from '@/lib/messages';
import { useSubscription } from '@/lib/subscription';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const when = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.round(diff)} min ago`;
  if (diff < 60 * 24) return `${Math.round(diff / 60)} h ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

type Filter = 'all' | 'missed' | 'today' | 'upcoming' | 'insights';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'missed', label: 'Missed' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Soon' },
  { id: 'insights', label: 'Insights' },
];

const matches = (m: MessageRow, filter: Filter) => {
  if (filter === 'all') return true;
  if (filter === 'insights') return ['insight', 'recap', 'brief', 'assistant'].includes(m.kind);
  const b = bucketOf(m);
  if (filter === 'missed') return b === 'missed';
  if (filter === 'today') return b === 'today';
  return b === 'tomorrow' || b === 'week';
};

const MessagesPage = () => {
  const { user } = useAuth();
  const [showArchived, setShowArchived] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ ids: string[]; all?: boolean } | null>(null);
  const {
    messages, loading, unread, markRead, markAllRead, setRead, archive, unarchive, setArchived,
    remove, removeMany, reload,
  } = useMessages(showArchived);
  const { canUseAssistant, plan, renewsAt, isAdmin, loading: planLoading } = useSubscription();

  /* First visit: greet the user so the inbox is never empty. */
  useEffect(() => {
    if (loading || !user || messages.length || showArchived) return;
    const key = `smarty-welcome-msg-${user.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    void (async () => {
      await supabase.from('messages').insert([{
        user_id: user.id,
        kind: 'welcome',
        title: 'Welcome to your Message Center',
        body:
          'This is where Smarty Assistant talks to you: what is coming up in your calendar, bills to pay, health check-ins to book, plan and renewal notices, and your daily insight. Everything you log feeds it. You can archive a message to keep it, or delete it for good.',
        action_label: 'Open your calendar',
        action_url: '/app/calendar',
        dedupe_key: 'welcome',
      }]);
      await reload();
    })();
  }, [loading, user?.id, messages.length, showArchived]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: messages.length, missed: 0, today: 0, upcoming: 0, insights: 0 };
    for (const m of messages) {
      for (const f of FILTERS) if (f.id !== 'all' && matches(m, f.id)) c[f.id] += 1;
    }
    return c;
  }, [messages]);

  const visible = useMemo(
    () => messages.filter((m) => matches(m, filter) && (!unreadOnly || !m.read_at)),
    [messages, filter, unreadOnly],
  );
  const groups = useMemo(() => groupMessages(visible), [visible]);

  const visibleIds = useMemo(() => visible.map((m) => m.id), [visible]);
  const picked = useMemo(() => visibleIds.filter((id) => selected.has(id)), [visibleIds, selected]);
  const allPicked = visibleIds.length > 0 && picked.length === visibleIds.length;

  const exitSelect = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => setSelected(allPicked ? new Set() : new Set(visibleIds));

  const bulkRead = async (read: boolean) => {
    await setRead(picked, read);
    toast.success(`${picked.length} marked as ${read ? 'read' : 'unread'}`);
    exitSelect();
  };

  const bulkArchive = async () => {
    await setArchived(picked, !showArchived);
    toast.success(`${picked.length} ${showArchived ? 'restored' : 'archived'}`);
    exitSelect();
  };

  const doDelete = async () => {
    if (!confirm) return;
    await removeMany(confirm.ids);
    toast.success(`${confirm.ids.length} message${confirm.ids.length === 1 ? '' : 's'} deleted`);
    setConfirm(null);
    exitSelect();
  };

  const renderMessage = (m: MessageRow) => {
    const style = messageStyle(m.kind);
    const Icon = style.icon;
    const missed = bucketOf(m) === 'missed';
    const isPicked = selected.has(m.id);
    return (
      <li
        key={m.id}
        onClick={() => selecting && toggleOne(m.id)}
        className={cn(
          'smarty-card flex gap-3 p-3.5 transition-smooth',
          !m.read_at && 'border-primary/40 bg-primary/[0.03]',
          missed && 'border-destructive/40 bg-destructive/[0.03]',
          selecting && 'cursor-pointer',
          isPicked && 'border-primary bg-primary/[0.07]',
        )}
      >
        {selecting ? (
          <div className="grid h-9 w-9 shrink-0 place-items-center">
            <Checkbox checked={isPicked} onCheckedChange={() => toggleOne(m.id)} aria-label="Select message" />
          </div>
        ) : (
          <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-2xl', style.tint)}>
            <Icon className={cn('h-4.5 w-4.5', style.color)} />
          </span>
        )}
        <div className="min-w-0 flex-1" onClick={() => !selecting && !m.read_at && markRead(m.id)}>
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 text-sm font-bold text-foreground">{m.title}</p>
            <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{when(m.created_at)}</span>
          </div>
          {m.body && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.body}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
              {style.label}
            </span>
            {missed ? (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                Missed
              </span>
            ) : m.level === 'high' ? (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                Needs attention
              </span>
            ) : null}
            {m.related_at && (
              <span className="text-[10px] font-medium text-muted-foreground">
                {new Date(m.related_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {m.action_url && !selecting && (
              <Link
                to={m.action_url}
                onClick={() => markRead(m.id)}
                className="ml-auto rounded-2xl bg-gradient-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
              >
                {m.action_label ?? 'Open'}
              </Link>
            )}
          </div>
        </div>
        {!selecting && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Message options"
                className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-full text-muted-foreground hover:bg-secondary"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setRead([m.id], !m.read_at)}>
                {m.read_at ? <Mail className="mr-2 h-4 w-4" /> : <MailOpen className="mr-2 h-4 w-4" />}
                Mark as {m.read_at ? 'unread' : 'read'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => (showArchived ? unarchive(m.id) : archive(m.id))}>
                {showArchived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                {showArchived ? 'Restore to inbox' : 'Archive'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelecting(true); setSelected(new Set([m.id])); }}>
                <CheckCheck className="mr-2 h-4 w-4" /> Select messages
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => remove(m.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-4 pb-4">
      <header className="animate-fade-up space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-2xl font-extrabold tracking-tight text-foreground">
            Message <span className="gradient-text">Center</span>
          </h1>
          <div className="flex shrink-0 items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 items-center gap-1 rounded-2xl bg-secondary px-3 text-xs font-semibold text-secondary-foreground active:scale-95">
                  {showArchived ? 'Archive' : unreadOnly ? 'Unread' : 'Inbox'}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => { setShowArchived(false); setUnreadOnly(false); exitSelect(); }}>
                  <Inbox className="mr-2 h-4 w-4" /> Inbox
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setShowArchived(false); setUnreadOnly(true); exitSelect(); }}>
                  <Mail className="mr-2 h-4 w-4" /> Unread only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setShowArchived(true); setUnreadOnly(false); exitSelect(); }}>
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Inbox options"
                  className="grid h-9 w-9 place-items-center rounded-2xl bg-secondary text-secondary-foreground active:scale-95"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => { setSelecting(true); setSelected(new Set(visibleIds)); }}>
                  <CheckCheck className="mr-2 h-4 w-4" /> Select all
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelecting(true)}>
                  <CheckCheck className="mr-2 h-4 w-4" /> Select messages
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={unread === 0} onClick={() => markAllRead()}>
                  <MailOpen className="mr-2 h-4 w-4" /> Mark all as read
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!visibleIds.length}
                  onClick={() => setArchived(visibleIds, !showArchived)}
                >
                  {showArchived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                  {showArchived ? 'Restore all' : 'Archive all'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!visibleIds.length}
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirm({ ids: visibleIds, all: true })}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete all shown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {showArchived
            ? 'Your archived messages, restore or delete them.'
            : 'Everything Smarty Assistant wants you to know, reminders, bills, health, calendar and your plan.'}
        </p>
      </header>

      <div className="grid grid-cols-5 gap-1 rounded-2xl bg-secondary/60 p-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'flex min-w-0 items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold leading-none transition-smooth active:scale-95',
              filter === f.id
                ? 'bg-gradient-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              f.id === 'missed' && counts.missed > 0 && filter !== f.id && 'text-destructive',
            )}
          >
            <span className="truncate">{f.label}</span>
            {counts[f.id] > 0 && <span className="shrink-0 opacity-70">{counts[f.id]}</span>}
          </button>
        ))}
      </div>

      {selecting && (
        <div className="sticky top-12 z-20 flex items-center gap-2 rounded-2xl border border-border bg-background/95 p-2 shadow-sm backdrop-blur lg:top-16">
          <button
            onClick={toggleAll}
            className="flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
          >
            <Checkbox checked={allPicked} aria-label="Select all" />
            <span className="whitespace-nowrap">{picked.length ? `${picked.length}` : 'All'}</span>
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              disabled={!picked.length}
              onClick={() => bulkRead(true)}
              aria-label="Mark selected as read"
              title="Mark as read"
              className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-secondary-foreground disabled:opacity-40"
            >
              <MailOpen className="h-4 w-4" />
            </button>
            <button
              disabled={!picked.length}
              onClick={() => bulkRead(false)}
              aria-label="Mark selected as unread"
              title="Mark as unread"
              className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-secondary-foreground disabled:opacity-40"
            >
              <Mail className="h-4 w-4" />
            </button>
            <button
              disabled={!picked.length}
              onClick={bulkArchive}
              aria-label={showArchived ? 'Restore selected' : 'Archive selected'}
              title={showArchived ? 'Restore' : 'Archive'}
              className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-secondary-foreground disabled:opacity-40"
            >
              {showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            </button>
            <button
              disabled={!picked.length}
              onClick={() => setConfirm({ ids: picked })}
              aria-label="Delete selected"
              title="Delete"
              className="grid h-9 w-9 place-items-center rounded-xl bg-destructive/10 text-destructive disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={exitSelect}
              aria-label="Cancel selection"
              title="Cancel"
              className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {!planLoading && !canUseAssistant && (
        <div className="smarty-card p-4">
          <p className="text-sm font-semibold text-foreground">You are on the free Logbook</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You still get calendar, bill and document messages from what you log yourself. Daily insights, weekly
            recaps and conversations with Smarty Assistant are part of Smarty Premium.
          </p>
          <Link to="/app/plan" className="mt-3 inline-flex rounded-2xl bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
            See Smarty Premium
          </Link>
        </div>
      )}

      {canUseAssistant && plan && (
        <p className="text-xs text-muted-foreground">
          {isAdmin ? 'Administrator, full access' : plan.name}
          {!isAdmin && renewsAt ? `, renews ${new Date(renewsAt).toLocaleDateString()}` : ''}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your messages…
        </p>
      ) : visible.length === 0 ? (
        <div className="smarty-card flex flex-col items-center gap-2 p-8 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            {messages.length ? 'Nothing in this view' : 'No messages yet'}
          </p>
          <p className="text-xs text-muted-foreground">
            {messages.length
              ? 'Try another filter to see the rest of your messages.'
              : 'Log something and your assistant will start talking to you here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <h2
                  className={cn(
                    'text-[11px] font-bold uppercase tracking-widest',
                    g.id === 'missed' ? 'text-destructive' : g.id === 'today' ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {g.label}
                </h2>
                <span className="text-[11px] font-semibold text-muted-foreground">{g.items.length}</span>
              </div>
              <ul className="space-y-2">{g.items.map(renderMessage)}</ul>
            </section>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {confirm?.ids.length} message{confirm?.ids.length === 1 ? '' : 's'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {confirm?.all ? 'every message shown in this view' : 'the selected messages'}.
              This cannot be undone. Archive instead if you want to keep them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessagesPage;
