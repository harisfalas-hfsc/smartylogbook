import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck, Inbox, Loader2, X } from 'lucide-react';
import { useMessages, messageStyle } from '@/lib/messages';
import { useSubscription } from '@/lib/subscription';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const when = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.round(diff)} min ago`;
  if (diff < 60 * 24) return `${Math.round(diff / 60)} h ago`;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

const MessagesPage = () => {
  const { user } = useAuth();
  const { messages, loading, unread, markRead, markAllRead, archive, reload } = useMessages();
  const { canUseAssistant, plan, renewsAt, isAdmin, loading: planLoading } = useSubscription();

  /* First visit: greet the user so the inbox is never empty. */
  useEffect(() => {
    if (loading || !user || messages.length) return;
    void (async () => {
      await supabase.from('messages').insert([{
        user_id: user.id,
        kind: 'welcome',
        title: 'Welcome to your Message Center',
        body:
          'This is where Smarty Assistant talks to you: what is coming up in your calendar, bills to pay, health check-ins to book, plan and renewal notices, and your daily briefing. Everything you log feeds it.',
        action_label: 'Open your calendar',
        action_url: '/app/calendar',
        dedupe_key: 'welcome',
      }]);
      await reload();
    })();
  }, [loading, user?.id, messages.length]);

  return (
    <div className="space-y-5 pb-4">
      <header className="animate-fade-up flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Message <span className="gradient-text">Center</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything Smarty Assistant wants you to know, reminders, bills, health, calendar and your plan.
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground active:scale-95"
          >
            <CheckCheck className="h-4 w-4" /> Mark all
          </button>
        )}
      </header>

      {!planLoading && !canUseAssistant && (
        <div className="smarty-card p-4">
          <p className="text-sm font-semibold text-foreground">You are on the free Logbook</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You still get calendar, bill and document messages from what you log yourself. Daily briefings, pattern
            alerts and conversations with Smarty Assistant are part of Smarty Premium.
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
      ) : messages.length === 0 ? (
        <div className="smarty-card flex flex-col items-center gap-2 p-8 text-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground">Log something and your assistant will start talking to you here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {messages.map((m) => {
            const style = messageStyle(m.kind);
            const Icon = style.icon;
            return (
              <li
                key={m.id}
                className={cn(
                  'smarty-card flex gap-3 p-3.5 transition-smooth',
                  !m.read_at && 'border-primary/40 bg-primary/[0.03]',
                )}
              >
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-2xl', style.tint)}>
                  <Icon className={cn('h-4.5 w-4.5', style.color)} />
                </span>
                <div className="min-w-0 flex-1" onClick={() => !m.read_at && markRead(m.id)}>
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 text-sm font-bold text-foreground">{m.title}</p>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{when(m.created_at)}</span>
                  </div>
                  {m.body && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{m.body}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                      {style.label}
                    </span>
                    {m.level === 'high' && (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                        Needs attention
                      </span>
                    )}
                    {m.related_at && (
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {new Date(m.related_at).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {m.action_url && (
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
                <button
                  onClick={() => archive(m.id)}
                  aria-label="Dismiss message"
                  className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:bg-secondary"
                >
                  <X className="mx-auto h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MessagesPage;
