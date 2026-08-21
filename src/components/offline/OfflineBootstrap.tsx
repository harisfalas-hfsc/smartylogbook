import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { offlineSave } from '@/lib/offline/offline-first';
import { readCache, scopedKey, trimCache } from '@/lib/offline/store';
import { signedUrl, filesOf } from '@/lib/media';
import { fetchPricing } from '@/lib/pricing';
import { connectivityState, isOnline, subscribeConnectivity } from '@/lib/offline/connectivity';
import { onSyncRequested, setSyncState, type SyncState } from '@/lib/offline/sync-bus';
import { markOfflineReady, readOfflineReadiness } from '@/lib/offline/readiness';
import { cacheMediaUrls } from '@/lib/offline/media-cache';
import {
  bindOfflineUser,
  isSyncPhaseFresh,
  markSyncFinished,
  markSyncPhaseDone,
  markSyncStarted,
} from '@/lib/offline/db';

type QueryResult<T> = { data: T | null; error: { message?: string } | null };
type MemoryRow = {
  id: string;
  module?: string;
  kind?: string;
  attachment_url?: string | null;
  metadata?: { file_size?: unknown };
};

async function requireData<T>(promise: PromiseLike<QueryResult<T>>, name: string): Promise<T> {
  const result = await promise;
  if (result.error) throw new Error(result.error.message || `${name} did not download`);
  return result.data as T;
}

async function fetchEveryMemory(deleted: boolean): Promise<MemoryRow[]> {
  const rows: MemoryRow[] = [];
  const pageSize = 1000;
  for (let start = 0; ; start += pageSize) {
    let query = supabase
      .from('memories')
      .select('*')
      .order(deleted ? 'deleted_at' : 'occurred_at', { ascending: false })
      .range(start, start + pageSize - 1);
    query = deleted ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null);
    const page = await requireData(query, deleted ? 'trash' : 'logbook');
    const values = (page ?? []) as unknown as MemoryRow[];
    rows.push(...values);
    if (values.length < pageSize) break;
  }
  return rows;
}

/** Downloads the signed-in member's complete readable world to this device. */
const OfflineBootstrap = () => {
  const { user } = useAuth();
  const running = useRef(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    let retryTimer = 0;
    let statusTimer = 0;
    const userId = user.id;
    const save = (key: string, value: unknown) => offlineSave(key, value, userId);

    const saveCore = async () => {
      const [profile, preferences, memories, trash] = await Promise.all([
        requireData(supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(), 'profile'),
        requireData(
          supabase.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
          'preferences',
        ),
        fetchEveryMemory(false),
        fetchEveryMemory(true),
      ]);
      if (!active) return [] as MemoryRow[];

      await Promise.all([
        save('account:profile', profile ?? null),
        save('account:preferences', preferences ?? null),
        save('logbook:list', memories),
        save('logbook:trash', trash),
        ...memories.map((record) => save(`record:${record.id}`, record)),
      ]);

      // A successful network response is not enough: prove the complete list
      // was committed before this device can be called offline-ready.
      const stored = await readCache<MemoryRow[]>(scopedKey(userId, 'logbook:list'));
      if (!stored || stored.data.length !== memories.length) {
        throw new Error('The downloaded logbook could not be stored on this device');
      }
      await markSyncPhaseDone('core');
      return memories;
    };

    const saveSupportingData = async () => {
      const jobs: Array<Promise<void>> = [
        requireData(supabase.from('user_roles').select('role').eq('user_id', userId), 'roles')
          .then((data) => save('account:roles', data ?? [])),
        requireData(
          supabase
            .from('subscriptions')
            .select('plan, plan_key, status, source, current_period_start, current_period_end, cancel_at_period_end')
            .eq('user_id', userId)
            .maybeSingle(),
          'subscription',
        ).then(async (subscription) => {
          const start = (subscription as { current_period_start?: string } | null)?.current_period_start;
          const countResult = await supabase
            .from('ai_conversations')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('started_at', start ?? new Date(Date.now() - 30 * 86400000).toISOString());
          if (countResult.error) throw new Error(countResult.error.message);
          await save('account:access', { subscription: subscription ?? null, used: countResult.count ?? 0 });
        }),
        requireData(
          supabase.from('messages').select('*').is('archived_at', null).order('created_at', { ascending: false }).limit(120),
          'messages',
        ).then((data) => save('inbox:messages', data ?? [])),
        requireData(
          supabase.from('messages').select('*').not('archived_at', 'is', null).order('created_at', { ascending: false }).limit(120),
          'archived messages',
        ).then((data) => save('inbox:archived', data ?? [])),
        requireData(supabase.from('reminders').select('*').order('due_at', { ascending: true }), 'reminders')
          .then((data) => save('reminders:list', data ?? [])),
        requireData(
          supabase.from('proactive_alerts').select('*').eq('dismissed', false).order('created_at', { ascending: false }).limit(100),
          'alerts',
        ).then((data) => save('alerts:list', data ?? [])),
        requireData(supabase.from('facts').select('*').order('observed_at', { ascending: false }).limit(1000), 'facts')
          .then(async (data) => {
            const facts = (data ?? []) as Array<{ category?: string }>;
            await save('facts:list', facts);
            const groups = new Map<string, unknown[]>();
            for (const fact of facts) {
              const category = fact.category ?? 'other';
              groups.set(category, [...(groups.get(category) ?? []), fact]);
            }
            await Promise.all([...groups].map(([category, items]) => save(`facts:list:${category}`, items)));
          }),
        requireData(
          supabase.from('ai_conversations').select('*').eq('user_id', userId).order('started_at', { ascending: false }).limit(300),
          'assistant conversations',
        ).then((data) => save('assistant:conversations', data ?? [])),
      ];

      const results = await Promise.allSettled(jobs);
      if (results.some((result) => result.status === 'rejected')) {
        throw new Error('Some supporting account data did not download');
      }
      await markSyncPhaseDone('supporting');
    };

    const saveSupport = async () => {
      const tickets = (await requireData(
        supabase.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
        'support tickets',
      )) ?? [];
      await save('inbox:threads', tickets);
      await Promise.all((tickets as Array<{ id: string }>).map(async (ticket) => {
        const replies = await requireData(
          supabase.from('support_replies').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true }),
          'support replies',
        );
        await Promise.all([save(`thread:${ticket.id}`, replies ?? []), save(`ticket:${ticket.id}`, ticket)]);
      }));
      await markSyncPhaseDone('support');
    };

    const saveMedia = async (memories: MemoryRow[]) => {
      const mediaEntries: Array<{ key: string; url: string }> = [];
      let usedBytes = 0;
      let fileCount = 0;
      for (const record of memories) {
        for (const file of filesOf(record as never)) {
          fileCount += 1;
          try {
            const url = await signedUrl(file.path);
            if (!url) continue;
            mediaEntries.push({ key: file.path, url });
          } catch {
            // Keep downloading every other file; readiness reports metadata even
            // when one remote object has been removed.
          }
        }
        const size = record.metadata?.file_size;
        if (typeof size === 'number') usedBytes += size;
      }
      await save('progress:storage', { used: usedBytes, files: fileCount });
      const media = await cacheMediaUrls(mediaEntries, { concurrency: 4, isActive: () => active });
      await Promise.all(media.storedKeys.map((path) => save(`media:${path}`, path)));
      await save('progress:media', { requested: media.requested, stored: media.stored });
      // Missing or removed attachments must not keep the whole account in a
      // retry loop. Readiness already records the exact stored/requested
      // counts, so the offline status can honestly report partial media.
      await markSyncPhaseDone('media');
    };

    const prefetch = async () => {
      if (retryTimer) window.clearTimeout(retryTimer);
      retryTimer = 0;
      // A definite device-offline signal should use the saved copy. A failed
      // health probe must not suppress the real download attempt when the
      // device still has a network route.
      if (connectivityState() === 'offline' || running.current) return;
      running.current = true;
      const startedAt = Date.now();
      let completedState: SyncState = 'idle';
      setSyncState('syncing');
      await markSyncStarted();
      try {
        await bindOfflineUser(userId);
        const previous = await readOfflineReadiness(userId);
        const memories = await saveCore();

        // Independent phases cannot prevent the core logbook from being usable.
        const phaseResults = await Promise.allSettled([
          isSyncPhaseFresh('supporting', 60_000).then(async (fresh) => {
            if (!fresh) await saveSupportingData();
          }),
          isSyncPhaseFresh('support', 5 * 60_000).then(async (fresh) => {
            if (!fresh) await saveSupport();
          }),
          isSyncPhaseFresh('media', 15 * 60_000).then(async (fresh) => {
            if (!fresh) await saveMedia(memories);
          }),
          fetchPricing().then((pricing) => save('library:pricing', pricing)),
        ]);

        const messages = await readCache<unknown[]>(scopedKey(userId, 'inbox:messages'));
        const reminders = await readCache<unknown[]>(scopedKey(userId, 'reminders:list'));
        const media = await readCache<{ requested: number; stored: number }>(scopedKey(userId, 'progress:media'));
        await markOfflineReady({
          userId,
          records: memories.length,
          messages: messages?.data.length ?? (previous.userId === userId ? previous.messages : 0),
          reminders: reminders?.data.length ?? (previous.userId === userId ? previous.reminders : 0),
          mediaReady: Boolean(media && media.data.requested === media.data.stored),
          mediaFiles: media?.data.stored ?? 0,
        });
        await trimCache(6000);

        const partial = phaseResults.some((result) => result.status === 'rejected');
        // The complete Logbook is already durably stored at this point. A
        // temporary failure downloading an optional file or supporting list
        // must not tell the member that synchronization failed. Keep retrying
        // those extras silently while reporting the usable offline copy as
        // synchronized.
        await markSyncFinished();
        completedState = 'synced';
        if (partial && active && isOnline()) retryTimer = window.setTimeout(() => void prefetch(), 5 * 60_000);
      } catch (error) {
        await markSyncFinished(error);
        completedState = 'error';
        if (active && isOnline()) retryTimer = window.setTimeout(() => void prefetch(), 60_000);
      } finally {
        // Keep the indicator tied to the real sync state until every durable
        // write above has finished. The minimum display time only makes that
        // genuine work visible; it never starts or extends a fake sync.
        const wait = 1000 - (Date.now() - startedAt);
        if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
        if (active) {
          setSyncState(completedState);
          if (completedState === 'synced') {
            statusTimer = window.setTimeout(() => setSyncState('idle'), 3000);
          }
        }
        running.current = false;
      }
    };

    void prefetch();
    const stopConnectivity = subscribeConnectivity((online) => online && void prefetch());
    const stopManual = onSyncRequested(() => void prefetch());
    const onFocus = () => void prefetch();
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      running.current = false;
      if (retryTimer) window.clearTimeout(retryTimer);
      if (statusTimer) window.clearTimeout(statusTimer);
      stopConnectivity();
      stopManual();
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id]);

  return null;
};

export default OfflineBootstrap;