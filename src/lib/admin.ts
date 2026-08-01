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
