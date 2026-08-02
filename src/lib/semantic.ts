import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Semantic memory: every entry is turned into a vector so the Smarty Assistant
 * can recall the *relevant* parts of the user's entire history instead of just
 * the newest handful of entries.
 */

/** Index specific entries (fire-and-forget, safe to fail silently). */
export const indexMemories = async (ids: string[]) => {
  if (!ids.length) return;
  try {
    await supabase.functions.invoke('ai-brain', { body: { mode: 'embed', ids } });
  } catch {
    /* indexing is best-effort; the backfill pass will catch it later */
  }
};

/** Index everything that has no vector yet, in batches. */
export const backfillIndex = async () => {
  for (let pass = 0; pass < 6; pass++) {
    const { data, error } = await supabase.functions.invoke('ai-brain', { body: { mode: 'embed' } });
    if (error || !data || data.error) return;
    if (!data.embedded || !data.remaining) return;
  }
};

/** Runs the backfill once per session, shortly after the app loads. */
export const useMemoryIndex = (ready: boolean) => {
  const { user } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (!ready || !user || done.current) return;
    done.current = true;
    const t = setTimeout(() => { backfillIndex(); }, 2500);
    return () => clearTimeout(t);
  }, [ready, user]);
};
