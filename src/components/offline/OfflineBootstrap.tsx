import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { offlineSave } from '@/lib/offline/offline-first';
import { trimCache } from '@/lib/offline/store';
import { signedUrl } from '@/lib/media';
import { fetchPricing } from '@/lib/pricing';

/**
 * Downloads the member's entire world in the background the moment they sign
 * in (and again whenever the connection returns), so every page works with no
 * internet without having to be visited first.
 */
const OfflineBootstrap = () => {
  const { user } = useAuth();
  const running = useRef(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const userId = user.id;
    const save = (key: string, value: unknown) => offlineSave(key, value, userId);

    const prefetch = async () => {
      if (!navigator.onLine || running.current) return;
      running.current = true;
      try {
        const [
          profile,
          preferences,
          subscription,
          roles,
          memories,
          trash,
          messages,
          archived,
          reminders,
          alerts,
          facts,
          tickets,
          conversations,
        ] = await Promise.allSettled([
          supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
          supabase
            .from('subscriptions')
            .select(
              'plan, plan_key, status, source, current_period_start, current_period_end, cancel_at_period_end',
            )
            .eq('user_id', userId)
            .maybeSingle(),
          supabase.from('user_roles').select('role').eq('user_id', userId),
          supabase
            .from('memories')
            .select('*')
            .is('deleted_at', null)
            .order('occurred_at', { ascending: false })
            .limit(2000),
          supabase
            .from('memories')
            .select('*')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false }),
          supabase
            .from('messages')
            .select('*')
            .is('archived_at', null)
            .order('created_at', { ascending: false })
            .limit(120),
          supabase
            .from('messages')
            .select('*')
            .not('archived_at', 'is', null)
            .order('created_at', { ascending: false })
            .limit(120),
          supabase.from('reminders').select('*').order('due_at', { ascending: true }),
          supabase
            .from('proactive_alerts')
            .select('*')
            .eq('dismissed', false)
            .order('severity', { ascending: true })
            .order('created_at', { ascending: false })
            .limit(20),
          supabase.from('facts').select('*').order('observed_at', { ascending: false }).limit(300),
          supabase
            .from('support_tickets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('ai_conversations')
            .select('*')
            .eq('user_id', userId)
            .order('started_at', { ascending: false })
            .limit(100),
        ]);
        if (!active) return;

        const rows = <T,>(r: PromiseSettledResult<{ data: unknown }>): T[] =>
          r.status === 'fulfilled' ? ((r.value.data ?? []) as T[]) : [];
        const one = (r: PromiseSettledResult<{ data: unknown }>): unknown =>
          r.status === 'fulfilled' ? (r.value.data ?? null) : null;

        void save('account:profile', one(profile));
        void save('account:preferences', one(preferences));
        void save('account:roles', rows(roles));

        const memoryRows = rows<{ id: string; attachment_url?: string | null }>(memories);
        void save('logbook:list', memoryRows);
        void save('logbook:trash', rows(trash));
        void save('inbox:messages', rows(messages));
        void save('inbox:archived', rows(archived));
        void save('reminders:list', rows(reminders));
        void save('alerts:list', rows(alerts));
        void save('facts:list', rows(facts));
        void save('assistant:conversations', rows(conversations));

        // Every individual record's full detail, not just the list.
        for (const record of memoryRows) void save(`record:${record.id}`, record);

        // Per-category slices, so a category page opens offline directly.
        const byModule = new Map<string, unknown[]>();
        for (const record of memoryRows as { module?: string }[]) {
          const key = record.module ?? 'personal';
          if (!byModule.has(key)) byModule.set(key, []);
          byModule.get(key)!.push(record);
        }
        for (const [moduleId, items] of byModule) void save(`logbook:list:${moduleId}`, items);

        // Access / entitlement level, including the conversations used.
        const subRow = one(subscription);
        const start = (subRow as { current_period_start?: string } | null)?.current_period_start;
        const { count } = await supabase
          .from('ai_conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('started_at', start ?? new Date(Date.now() - 30 * 86400000).toISOString());
        void save('account:access', { subscription: subRow, used: count ?? 0 });

        // Support threads plus every reply.
        const ticketRows = rows<{ id: string }>(tickets);
        void save('inbox:threads', ticketRows);
        await Promise.allSettled(
          ticketRows.map(async (ticket) => {
            const { data } = await supabase
              .from('support_replies')
              .select('*')
              .eq('ticket_id', ticket.id)
              .order('created_at', { ascending: true });
            void save(`thread:${ticket.id}`, data ?? []);
            void save(`ticket:${ticket.id}`, ticket);
          }),
        );

        // Reference library: plans / pricing and category filter values.
        try {
          void save('library:pricing', await fetchPricing());
        } catch {
          /* best effort */
        }
        void save('library:filters', {
          modules: [...byModule.keys()],
          kinds: [...new Set(memoryRows.map((r) => (r as { kind?: string }).kind).filter(Boolean))],
        });

        // Storage / progress numbers.
        let usedBytes = 0;
        let fileCount = 0;
        for (const row of memoryRows as { attachment_url?: string | null; metadata?: { file_size?: unknown } }[]) {
          if (!row.attachment_url) continue;
          fileCount += 1;
          if (typeof row.metadata?.file_size === 'number') usedBytes += row.metadata.file_size;
        }
        void save('progress:storage', { used: usedBytes, files: fileCount });

        // Warm the media the member owns so photos render offline too.
        const withFiles = memoryRows.filter((r) => r.attachment_url).slice(0, 200);
        for (const record of withFiles) {
          if (!active) return;
          try {
            const url = await signedUrl(record.attachment_url);
            if (!url) continue;
            void save(`media:${record.attachment_url}`, url);
            void fetch(url, { mode: 'cors' }).catch(() => undefined);
          } catch {
            /* best effort */
          }
        }

        void trimCache(800);
      } finally {
        running.current = false;
      }
    };

    void prefetch();
    const onOnline = () => void prefetch();
    window.addEventListener('online', onOnline);
    return () => {
      active = false;
      window.removeEventListener('online', onOnline);
    };
  }, [user?.id]);

  return null;
};

export default OfflineBootstrap;
