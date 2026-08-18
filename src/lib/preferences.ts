import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineFirst } from '@/lib/offline/offline-first';
import { useAuth } from '@/contexts/AuthContext';

export interface Preferences {
  id: string;
  user_id: string;
  onboarding_completed: boolean;
  goals: string[];
  focus_modules: string[];
  tone: string;
  coach_time: string;
  /** IANA timezone, so the 6 a.m. daily tip lands at the user's own 6 a.m. */
  timezone: string;
  notify_coach: boolean;
  notify_daily_tip: boolean;
  notify_tasks: boolean;
  notify_bills: boolean;
  notify_health: boolean;
  notify_events: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export const GOAL_OPTIONS = [
  'Get fitter',
  'Eat better',
  'Sleep more',
  'Save money',
  'Lower stress',
  'Stay on top of health',
  'Be more productive',
  'Keep documents in order',
];

export const usePreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setPrefs(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const data = await offlineFirst<Preferences | null>(
      'account:preferences',
      async () => {
        const { data: row } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (row) return row as Preferences;
        const { data: created } = await supabase
          .from('user_preferences')
          .insert({ user_id: user.id, timezone: browserTz })
          .select('*')
          .maybeSingle();
        return (created as Preferences) ?? null;
      },
      user.id,
    ).catch(() => null);

    if (data) {
      setPrefs(data);
      // Keep the stored timezone in step with the device, so scheduled
      // messages always arrive at the right local hour after a move.
      if (data.timezone !== browserTz && navigator.onLine !== false) {
        void supabase
          .from('user_preferences')
          .update({ timezone: browserTz })
          .eq('user_id', user.id);
        setPrefs({ ...data, timezone: browserTz });
      }
    } else {
      setPrefs(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (patch: Partial<Preferences>) => {
    if (!user) return { error: new Error('Not signed in') };
    setPrefs((prev) => (prev ? { ...prev, ...patch } : prev));
    const { error } = await supabase
      .from('user_preferences')
      .update(patch)
      .eq('user_id', user.id);
    if (error) await load();
    return { error };
  };

  return { prefs, loading, update, reload: load };
};
