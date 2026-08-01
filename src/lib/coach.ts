import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Memory } from '@/lib/memories';
import type { Preferences } from '@/lib/preferences';

export interface CoachCard {
  id: string;
  for_date: string;
  headline: string;
  action: string;
  reason: string | null;
  module: string | null;
  done: boolean;
  done_at: string | null;
}

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * One scheduled AI recommendation per day. It is generated the first time the
 * user opens the app on a new day and persisted so it stays stable all day.
 */
export const useCoachCard = (memories: Memory[], prefs: Preferences | null, ready: boolean) => {
  const { user } = useAuth();
  const [card, setCard] = useState<CoachCard | null>(null);
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
            mode: 'coach',
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
              done: false,
              done_at: null,
            },
            { onConflict: 'user_id,for_date' }
          )
          .select('*')
          .maybeSingle();
        if (saved) setCard(saved as CoachCard);
      } finally {
        setGenerating(false);
      }
    },
    [user, memories, prefs]
  );

  const load = useCallback(async () => {
    if (!user) {
      setCard(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('coach_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('for_date', todayKey())
      .maybeSingle();
    setCard((data as CoachCard) ?? null);
    setLoading(false);
    if (!data && ready) generate();
  }, [user, ready, generate]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  const toggleDone = async () => {
    if (!card) return;
    const next = !card.done;
    setCard({ ...card, done: next, done_at: next ? new Date().toISOString() : null });
    await supabase
      .from('coach_cards')
      .update({ done: next, done_at: next ? new Date().toISOString() : null })
      .eq('id', card.id);
  };

  return { card, loading, generating, toggleDone, regenerate: () => generate(true) };
};
