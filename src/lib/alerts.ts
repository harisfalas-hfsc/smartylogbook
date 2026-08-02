import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Proactive alerts written by the daily background scan (edge function
 * `proactive-scan`, scheduled server-side) — bills due, overdue payments,
 * stale health values, documents about to expire. They exist even when the
 * app is closed; the client only reads, notifies and dismisses.
 */

export interface ProactiveAlert {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  detail: string | null;
  severity: string;
  due_at: string | null;
  seen: boolean;
  dismissed: boolean;
  notified_at: string | null;
  created_at: string;
}

export const useProactiveAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('proactive_alerts')
      .select('*')
      .eq('dismissed', false)
      .order('severity', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(20);
    setAlerts((data ?? []) as ProactiveAlert[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const dismiss = useCallback(async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    await supabase.from('proactive_alerts').update({ dismissed: true, seen: true }).eq('id', id);
  }, []);

  return { alerts, loading, reload: load, dismiss };
};
