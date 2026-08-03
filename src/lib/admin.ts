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
  created_at: string;
}

/** Plain-language explanation of what a scheduled job does. */
export const describeJob = (job: CronJob) => {
  const c = `${job.jobname} ${job.command}`.toLowerCase();
  if (c.includes('proactive-scan'))
    return 'Scans every account for due bills, tasks, health check-ins and upcoming events, writes alerts into the Message Center and sends each user their morning brief at their chosen time.';
  if (c.includes('purge_expired_trash'))
    return 'Permanently deletes items that have been sitting in Trash for more than 30 days.';
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
