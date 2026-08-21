import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { offlineSave } from '@/lib/offline/offline-first';
import { readCache, scopedKey, trimCache } from '@/lib/offline/store';
import { signedUrl } from '@/lib/media';
import { fetchPricing } from '@/lib/pricing';
import { isOnline, subscribeConnectivity } from '@/lib/offline/connectivity';
import { onSyncRequested, setSyncState, syncState } from '@/lib/offline/sync-bus';
import { markOfflineReady } from '@/lib/offline/readiness';
import { cacheMediaUrls } from '@/lib/offline/media-cache';
import { filesOf } from '@/lib/media';

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
    let retryTimer = 0;
    const userId = user.id;
    const save = (key: string, value: unknown) => offlineSave(key, value, userId);

    const prefetch = async () => {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
        retryTimer = 0;
      }
      if (!isOnline() || running.current) return;
      running.current = true;
      setSyncState('syncing');
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

        type QueryResult = { data: unknown; error?: { message?: string } | null };
        const valueOf = (name: string, result: PromiseSettledResult<QueryResult>): unknown => {
          if (result.status === 'rejected') {
            throw result.reason instanceof Error ? result.reason : new Error(`${name} did not download`);
          }
          if (result.value.error) {
            throw new Error(result.value.error.message || `${name} did not download`);
          }
          return result.value.data;
        };
        const rows = <T,>(name: string, result: PromiseSettledResult<QueryResult>): T[] =>
          (valueOf(name, result) ?? []) as T[];
        const one = (name: string, result: PromiseSettledResult<QueryResult>): unknown =>
          valueOf(name, result) ?? null;

        const profileRow = one('profile', profile);
        const preferenceRow = one('preferences', preferences);
        const subscriptionRow = one('subscription', subscription);
        const roleRows = rows('roles', roles);
        const memoryRows = rows<{ id: string; attachment_url?: string | null }>('logbook', memories);
        const trashRows = rows('trash', trash);
        const messageRows = rows('messages', messages);
        const archivedRows = rows('archived messages', archived);
        const reminderRows = rows('reminders', reminders);
        const alertRows = rows('alerts', alerts);
        const factRows = rows<{ category?: string }>('facts', facts);
        const ticketRows = rows<{ id: string }>('support tickets', tickets);
        const conversationRows = rows('assistant conversations', conversations);

        // Do not announce "ready" until the core world is actually committed
        // to IndexedDB. Previously these writes were fire-and-forget, so an
        // immediate offline transition could expose an empty logbook.
        await Promise.all([
          save('account:profile', profileRow),
          save('account:preferences', preferenceRow),
          save('account:roles', roleRows),
          save('logbook:list', memoryRows),
          save('logbook:trash', trashRows),
          save('inbox:messages', messageRows),
          save('inbox:archived', archivedRows),
          save('reminders:list', reminderRows),
          save('alerts:list', alertRows),
          save('facts:list', factRows),
          save('assistant:conversations', conversationRows),
          save('inbox:threads', ticketRows),
        ]);
        const storedLogbook = await readCache<unknown[]>(scopedKey(userId, 'logbook:list'));
        if (!storedLogbook || storedLogbook.data.length !== memoryRows.length) {
          throw new Error('The downloaded logbook could not be stored on this device');
        }

        // Every individual record's full detail, not just the list.
        await Promise.all(memoryRows.map((record) => save(`record:${record.id}`, record)));

        // Per-category slices, so a category page opens offline directly.
        const byModule = new Map<string, unknown[]>();
        for (const record of memoryRows as { module?: string }[]) {
          const key = record.module ?? 'personal';
          if (!byModule.has(key)) byModule.set(key, []);
          byModule.get(key)!.push(record);
        }
        await Promise.all(
          [...byModule].map(([moduleId, items]) => save(`logbook:list:${moduleId}`, items)),
        );
        const factsByCategory = new Map<string, unknown[]>();
        for (const fact of factRows) {
          const key = fact.category ?? 'other';
          if (!factsByCategory.has(key)) factsByCategory.set(key, []);
          factsByCategory.get(key)?.push(fact);
        }
        await Promise.all(
          [...factsByCategory].map(([category, items]) => save(`facts:list:${category}`, items)),
        );

        // Access / entitlement level, including the conversations used.
        const subRow = subscriptionRow;
        const start = (subRow as { current_period_start?: string } | null)?.current_period_start;
        const { count } = await supabase
          .from('ai_conversations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('started_at', start ?? new Date(Date.now() - 30 * 86400000).toISOString());
        await save('account:access', { subscription: subRow, used: count ?? 0 });

        // Support threads plus every reply.
        await Promise.allSettled(
          ticketRows.map(async (ticket) => {
            const { data } = await supabase
              .from('support_replies')
              .select('*')
              .eq('ticket_id', ticket.id)
              .order('created_at', { ascending: true });
            await Promise.all([
              save(`thread:${ticket.id}`, data ?? []),
              save(`ticket:${ticket.id}`, ticket),
            ]);
          }),
        );

        // Reference library: plans / pricing and category filter values.
        try {
          await save('library:pricing', await fetchPricing());
        } catch {
          /* best effort */
        }
        await save('library:filters', {
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
        await save('progress:storage', { used: usedBytes, files: fileCount });

        // Download every owned attachment, including album extras. A bare
        // fetch is not durable in native WebViews, so explicitly store each
        // signed URL in the same dedicated Cache Storage strategy as Workout.
        const mediaUrls: string[] = [];
        for (const record of memoryRows) {
          if (!active) return;
          for (const file of filesOf(record as never)) {
            try {
              const url = await signedUrl(file.path);
              if (!url) continue;
              await save(`media:${file.path}`, url);
              mediaUrls.push(url);
            } catch {
              /* best effort */
            }
          }
        }
        await cacheMediaUrls(mediaUrls, { concurrency: 6, isActive: () => active });

        await trimCache(800);

        await markOfflineReady({
          userId,
          records: memoryRows.length,
          messages: messageRows.length,
          reminders: reminderRows.length,
        });
      } catch {
        setSyncState('error');
        if (active && isOnline()) retryTimer = window.setTimeout(() => void prefetch(), 30_000);
      } finally {
        running.current = false;
        if (syncState() === 'syncing') setSyncState('idle');
      }
    };

    void prefetch();
    const stopConnectivity = subscribeConnectivity((online) => {
      if (online) void prefetch();
    });
    const stopManual = onSyncRequested(() => void prefetch());
    const onFocus = () => void prefetch();
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      stopConnectivity();
      stopManual();
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id]);

  return null;
};

export default OfflineBootstrap;
