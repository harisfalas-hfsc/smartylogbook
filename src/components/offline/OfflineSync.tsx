import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { flushQueue, type QueuedAction } from '@/lib/offline/queue';
import { useOnlineStatus } from '@/lib/offline/useOnlineStatus';
import { useAuth } from '@/contexts/AuthContext';

/** Replays anything the member did while offline as soon as the network returns. */
const OfflineSync = () => {
  const online = useOnlineStatus();
  const { user } = useAuth();
  const busy = useRef(false);

  useEffect(() => {
    if (!online || !user || busy.current) return;
    busy.current = true;

    const run = async (action: QueuedAction) => {
      const p = action.payload as Record<string, never>;
      const fail = (error: { message: string } | null) => {
        if (error) throw new Error(error.message);
      };
      switch (action.kind) {
        case 'memory-update':
        case 'memory-reclassify': {
          const { error } = await supabase
            .from('memories')
            .update(p.patch as never)
            .eq('id', p.id as string);
          return fail(error);
        }
        case 'reminder-patch': {
          const { error } = await supabase
            .from('reminders')
            .update(p.patch as never)
            .eq('id', p.id as string);
          return fail(error);
        }
        case 'message-read': {
          const { error } = await supabase
            .from('messages')
            .update({ read_at: (p.readAt as string) ?? null })
            .in('id', p.ids as unknown as string[]);
          return fail(error);
        }
        case 'message-archive': {
          const { error } = await supabase
            .from('messages')
            .update({ archived_at: (p.archivedAt as string) ?? null })
            .in('id', p.ids as unknown as string[]);
          return fail(error);
        }
        case 'alert-dismiss': {
          const { error } = await supabase
            .from('proactive_alerts')
            .update({ dismissed: true, seen: true })
            .eq('id', p.id as string);
          return fail(error);
        }
      }
    };

    (async () => {
      try {
        const done = await flushQueue(run, user.id);
        if (done > 0) {
          toast.success(
            done === 1 ? 'Your offline update synced.' : `${done} offline updates synced.`,
          );
        }
      } finally {
        busy.current = false;
      }
    })();
  }, [online, user?.id]);

  return null;
};

export default OfflineSync;
