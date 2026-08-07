import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useIsAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setIsAdmin(Boolean(data));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  return { isAdmin, loading };
};

export async function adminApi<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: { action, ...payload },
  });
  if (error) throw new Error(error.message);
  if (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)) {
    throw new Error(String((data as Record<string, unknown>).error));
  }
  return data as T;
}

export const euro = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(Number(n || 0));

export interface AdminStats {
  totalUsers: number;
  newUsers30d: number;
  activeSubscriptions: number;
  paidSubscriptions: number;
  grantedSubscriptions: number;
  canceledSubscriptions: number;
  freeUsers: number;
  mrr: number;
  totalRevenue: number;
  paymentsCount: number;
  currency: string;
  revenueByMonth: { month: string; amount: number }[];
}

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  plan: string;
  subscription_status: string;
  source: string;
  current_period_end: string | null;
  total_spend: number;
  memories: number;
}

export interface AdminPayment {
  id: string;
  user_id: string | null;
  amount_eur: number;
  currency: string;
  status: string;
  description: string | null;
  created_at: string;
}

export interface CronRun {
  runid: number;
  status: string;
  return_message: string;
  start_time: string | null;
  end_time: string | null;
}

export interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  command: string;
  active: boolean;
  runs: CronRun[];
}

export interface AdminMessage {
  id: string;
  user_id: string;
  email: string;
  kind: string | null;
  title: string | null;
  body: string | null;
  level: string | null;
  module: string | null;
  action_label: string | null;
  action_url: string | null;
  read_at: string | null;
  archived_at: string | null;
  related_at: string | null;
  created_at: string;
}

/** Ready-made jobs an administrator can schedule without writing any SQL. */
export interface JobTemplate {
  id: string;
  label: string;
  description: string;
  suggestedName: string;
  suggestedSchedule: string;
}

export const JOB_TEMPLATES: JobTemplate[] = [
  {
    id: 'proactive_scan',
    label: 'Proactive scan (reminders, bills, documents)',
    description:
      'Raises alerts two days before, one day before, on the day, and again one and two days after anything that was missed. Also checks bills, expiring documents, stale health readings and plan renewals, and empties expired Trash.',
    suggestedName: 'smarty-proactive-scan',
    suggestedSchedule: '10 * * * *',
  },
  {
    id: 'daily_insights',
    label: 'Daily insight message',
    description:
      'Sends each user one message at their chosen morning time: what is due today, what is coming tomorrow, what is still missed, and what they captured on this day in previous years.',
    suggestedName: 'smarty-daily-insights',
    suggestedSchedule: '5 * * * *',
  },
  {
    id: 'daily_tip',
    label: 'Daily assistant tip (6 a.m. local time)',
    description:
      'Every day at 6 a.m. in each person\'s own timezone, Smarty Assistant sends one short hint, suggestion or piece of advice on how to use Smarty Logbook to make their life easier. It never repeats a tip it has already sent.',
    suggestedName: 'smarty-daily-tip',
    suggestedSchedule: '0 * * * *',
  },
  {
    id: 'weekly_recap',
    label: 'Weekly recap message',
    description:
      'Every Monday morning: what was logged last week, what was completed, what slipped, and what is scheduled for the coming week.',
    suggestedName: 'smarty-weekly-recap',
    suggestedSchedule: '5 7 * * 1',
  },
  {
    id: 'purge_trash',
    label: 'Empty expired Trash',
    description: 'Permanently deletes items that have been sitting in Trash for more than 30 days.',
    suggestedName: 'smarty-purge-trash',
    suggestedSchedule: '0 3 * * *',
  },
];

/** Plain-language explanation of what a scheduled job does. */
export const describeJob = (job: CronJob) => {
  const c = `${job.jobname} ${job.command}`.toLowerCase();
  if (c.includes('proactive-scan')) return JOB_TEMPLATES[0].description;
  if (c.includes('"mode":"recap"') || c.includes('weekly-recap')) return JOB_TEMPLATES[3].description;
  if (c.includes('daily-tip')) return JOB_TEMPLATES[2].description;
  if (c.includes('daily-insights')) return JOB_TEMPLATES[1].description;
  if (c.includes('purge_expired_trash')) return JOB_TEMPLATES[4].description;
  if (c.includes('ai-brain')) return 'Runs a Smarty Assistant background task.';
  return 'Runs a scheduled database or function task.';
};


/** Human-readable cron expression, e.g. "10 * * * *" → "every hour at :10". */
export const describeSchedule = (expr: string) => {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;
  const [min, hour, dom, mon, dow] = parts;
  if (min === '*' && hour === '*') return 'every minute';
  if (hour === '*' && dom === '*' && mon === '*' && dow === '*')
    return `every hour at :${min.padStart(2, '0')}`;
  if (dom === '*' && mon === '*' && dow === '*')
    return `every day at ${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;
  if (dom === '*' && mon === '*')
    return `weekly (day ${dow}) at ${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;
  return expr;
};

export const SCHEDULE_PRESETS: { label: string; value: string }[] = [
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Hourly at :10', value: '10 * * * *' },
  { label: 'Daily 07:00 UTC', value: '0 7 * * *' },
  { label: 'Daily 20:00 UTC', value: '0 20 * * *' },
  { label: 'Weekly Monday 08:00 UTC', value: '0 8 * * 1' },
];
