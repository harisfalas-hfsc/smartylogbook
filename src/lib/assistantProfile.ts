import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AssistantPattern {
  title: string;
  detail: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface AssistantPerson {
  name: string;
  relation?: string;
  note?: string;
}

export interface AssistantProfile {
  id: string;
  portrait: string | null;
  habits: string[];
  routines: string[];
  preferences: string[];
  patterns: AssistantPattern[];
  people: AssistantPerson[];
  watchlist: AssistantPattern[];
  open_questions: string[];
  confidence: 'high' | 'medium' | 'low';
  data_points: number;
  version: number;
  trained_at: string | null;
}

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, 12) : [];

const objects = <T,>(v: unknown): T[] =>
  Array.isArray(v) ? (v.filter((x) => x && typeof x === 'object') as T[]).slice(0, 12) : [];

const normalise = (row: Record<string, unknown> | null): AssistantProfile | null =>
  row
    ? {
        id: String(row.id),
        portrait: row.portrait ? String(row.portrait) : null,
        habits: strings(row.habits),
        routines: strings(row.routines),
        preferences: strings(row.preferences),
        patterns: objects<AssistantPattern>(row.patterns),
        people: objects<AssistantPerson>(row.people),
        watchlist: objects<AssistantPattern>(row.watchlist),
        open_questions: strings(row.open_questions),
        confidence: (['high', 'medium', 'low'].includes(String(row.confidence))
          ? String(row.confidence)
          : 'low') as AssistantProfile['confidence'],
        data_points: Number(row.data_points ?? 0),
        version: Number(row.version ?? 0),
        trained_at: row.trained_at ? String(row.trained_at) : null,
      }
    : null;

/** How much new material justifies another self-training pass. */
const RETRAIN_AFTER_ENTRIES = 8;
const RETRAIN_AFTER_DAYS = 7;

const shouldRetrain = (profile: AssistantProfile | null, entryCount: number) => {
  if (!profile || !profile.trained_at) return entryCount >= 3;
  const days = (Date.now() - new Date(profile.trained_at).getTime()) / 86_400_000;
  return entryCount - profile.data_points >= RETRAIN_AFTER_ENTRIES || days >= RETRAIN_AFTER_DAYS;
};

/**
 * Every user has their own Smarty Assistant. This hook holds the assistant's
 * learned profile of the user and retrains it in the background as the logbook
 * grows, so the assistant keeps getting more personal over time.
 */
export const useAssistantProfile = (autoTrain = false) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<AssistantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const attempted = useRef(false);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return null;
    }
    const { data } = await supabase
      .from('assistant_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    const next = normalise(data as Record<string, unknown> | null);
    setProfile(next);
    setLoading(false);
    return next;
  }, [user]);

  const train = useCallback(async () => {
    if (!user || training) return null;
    setTraining(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-brain', { body: { mode: 'train' } });
      if (error || data?.error) throw new Error(data?.error ?? error?.message ?? 'Training failed');
      const next = normalise((data?.profile ?? null) as Record<string, unknown> | null);
      if (next) setProfile(next);
      return next;
    } catch (e) {
      console.error('assistant training failed', e);
      return null;
    } finally {
      setTraining(false);
    }
  }, [user, training]);

  useEffect(() => {
    load();
  }, [load]);

  /* background self-training: only when there is genuinely new material */
  useEffect(() => {
    if (!autoTrain || !user || loading || attempted.current) return;
    attempted.current = true;
    (async () => {
      const { count } = await supabase
        .from('memories')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (shouldRetrain(profile, count ?? 0)) train();
    })();
  }, [autoTrain, user, loading, profile, train]);

  return { profile, loading, training, train, reload: load };
};
