import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Memory } from '@/lib/memories';
import type { Preferences } from '@/lib/preferences';

export interface BriefAlert {
  title: string;
  detail: string;
}

export interface DailyBrief {
  id: string;
  for_date: string;
  headline: string;
  action: string;
  reason: string | null;
  module: string | null;
  alerts: BriefAlert[];
  done: boolean;
  done_at: string | null;
}

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const toAlerts = (value: unknown): BriefAlert[] =>
  Array.isArray(value)
    ? value
        .filter((a) => a && typeof a === 'object')
        .slice(0, 3)
        .map((a) => ({
          title: String((a as Record<string, unknown>).title ?? ''),
          detail: String((a as Record<string, unknown>).detail ?? ''),
        }))
        .filter((a) => a.title)
    : [];

/**
 * One daily brief from Smarty Assistant: a single recommendation plus proactive
 * alerts. Generated the first time the user opens the app on a new day and
 * persisted so it stays stable all day. No scores, ever.
 */
export const useDailyBrief = (memories: Memory[], prefs: Preferences | null, ready: boolean) => {
  const { user } = useAuth();
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const generatedFor = useRef<string | null>(null);

  const generate = useCallback(
    async (force = false) => {
      if (!user) return;
      const date = todayKey();
      if (!force && generatedFor.current === date) return;
      generatedFor.current = date;
      setGenerating(true);
      try {
        const { data } = await supabase.functions.invoke('ai-brain', {
          body: {
            mode: 'brief',
            preferences: prefs
              ? { goals: prefs.goals, focus: prefs.focus_modules, tone: prefs.tone }
              : null,
            memories: memories.slice(0, 30).map((m) => ({
              title: m.title,
              summary: m.summary,
              module: m.module,
              kind: m.kind,
              amount: m.amount,
              occurred_at: m.occurred_at,
              tags: m.ai_tags,
            })),
          },
        });
        if (!data || data.error) return;
        const { data: saved } = await supabase
          .from('coach_cards')
          .upsert(
            {
              user_id: user.id,
              for_date: date,
              headline: String(data.headline ?? 'Your focus today'),
              action: String(data.action ?? ''),
              reason: data.reason ? String(data.reason) : null,
              module: data.module ? String(data.module) : null,
              alerts: toAlerts(data.alerts) as never,
              done: false,
              done_at: null,
            },
            { onConflict: 'user_id,for_date' }
          )
          .select('*')
          .maybeSingle();
        if (saved) setBrief({ ...(saved as unknown as DailyBrief), alerts: toAlerts((saved as Record<string, unknown>).alerts) });
      } finally {
        setGenerating(false);
      }
    },
    [user, memories, prefs]
  );

  const load = useCallback(async () => {
    if (!user) {
      setBrief(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('coach_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('for_date', todayKey())
      .maybeSingle();
    setBrief(data ? { ...(data as unknown as DailyBrief), alerts: toAlerts((data as Record<string, unknown>).alerts) } : null);
    setLoading(false);
    if (!data && ready) generate();
  }, [user, ready, generate]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const toggleDone = async () => {
    if (!brief) return;
    const next = !brief.done;
    setBrief({ ...brief, done: next, done_at: next ? new Date().toISOString() : null });
    await supabase
      .from('coach_cards')
      .update({ done: next, done_at: next ? new Date().toISOString() : null })
      .eq('id', brief.id);
  };

  return { brief, loading, generating, toggleDone, regenerate: () => generate(true) };
};
