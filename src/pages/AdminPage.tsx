import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  BadgeCheck, Bell, CreditCard, Crown, Loader2, RefreshCw, Save, Search, ShieldCheck, SlidersHorizontal, Timer, TrendingUp, UserPlus, Users, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AdminPayment, AdminStats, AdminUser, adminApi, euro, useIsAdmin,
} from '@/lib/admin';
import { cn } from '@/lib/utils';
import {
  DEFAULT_PRICING, PlanConfig, PricingConfig, conversationCost, planAllowance, planMargin,
} from '@/lib/pricing';
import AdminJobsTab from '@/components/admin/AdminJobsTab';
import AdminMessagesTab from '@/components/admin/AdminMessagesTab';

const TABS = ['Overview', 'Customers', 'Subscriptions', 'Payments', 'Pricing', 'Jobs', 'Messages'] as const;
type Tab = (typeof TABS)[number];


const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StatCard = ({ icon: Icon, label, value, sub }: {
  icon: typeof Users; label: string; value: string; sub?: string;
}) => (
  <div className="smarty-card p-4">
    <div className="flex items-center gap-2 text-primary">
      <Icon className="h-4 w-4" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
    <p className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
    {sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p> : null}
  </div>
);

const Pill = ({ tone, children }: { tone: 'premium' | 'free' | 'canceled' | 'admin' | 'grant'; children: React.ReactNode }) => (
  <span
    className={cn(
      'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
      tone === 'premium' && 'bg-primary/10 text-primary',
      tone === 'free' && 'bg-muted text-muted-foreground',
      tone === 'canceled' && 'bg-destructive/10 text-destructive',
      tone === 'admin' && 'bg-amber-500/15 text-amber-600',
      tone === 'grant' && 'bg-emerald-500/15 text-emerald-600',
    )}
  >
    {children}
  </span>
);

const AdminPage = () => {
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [tab, setTab] = useState<Tab>('Overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  const [grantPlan, setGrantPlan] = useState<string>(DEFAULT_PRICING.plans[0]?.key ?? 'premium');
  const [newUser, setNewUser] = useState({ email: '', password: '', username: '', months: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, u, p, c] = await Promise.all([
        adminApi<AdminStats>('stats'),
        adminApi<{ users: AdminUser[] }>('list_users'),
        adminApi<{ payments: AdminPayment[] }>('recent_payments'),
        adminApi<{ config: Partial<PricingConfig> }>('get_pricing'),
      ]);
      setStats(s);
      setUsers(u.users ?? []);
      setPayments(p.payments ?? []);
      const cfg = c.config ?? {};
      const plans = Array.isArray(cfg.plans) && cfg.plans.length ? cfg.plans : DEFAULT_PRICING.plans;
      setPricing({ ...DEFAULT_PRICING, ...cfg, plans });
      setGrantPlan((prev) => (plans.some((p) => p.key === prev) ? prev : plans[0]?.key ?? 'premium'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const act = async (key: string, fn: () => Promise<unknown>, msg: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(msg);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  if (roleLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/app" replace />;

  const filtered = users.filter((u) => u.email.toLowerCase().includes(search.trim().toLowerCase()));
  const subscribers = users.filter((u) => u.plan === 'premium' || u.subscription_status === 'canceled');

  const updatePlan = (i: number, patch: Partial<PlanConfig>) =>
    setPricing((prev) => ({
      ...prev,
      plans: prev.plans.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));

  const UserRow = ({ u }: { u: AdminUser }) => (
    <div className="smarty-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{u.email}</p>
        {u.is_admin && <Pill tone="admin">Admin</Pill>}
        <Pill tone={u.plan === 'premium' ? 'premium' : u.subscription_status === 'canceled' ? 'canceled' : 'free'}>
          {u.plan === 'premium' ? 'Premium' : u.subscription_status === 'canceled' ? 'Canceled' : 'Free'}
        </Pill>
        {u.source === 'admin_grant' && u.plan === 'premium' && <Pill tone="grant">Granted</Pill>}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-muted-foreground sm:grid-cols-4">
        <span>Joined {fmtDate(u.created_at)}</span>
        <span>Last seen {fmtDate(u.last_sign_in_at)}</span>
        <span>Renews {fmtDate(u.current_period_end)}</span>
        <span>{u.memories} entries · {euro(u.total_spend)}</span>
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Grant access — pick a plan, then how many months
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          value={grantPlan}
          onChange={(e) => setGrantPlan(e.target.value)}
          className="rounded-2xl border border-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-foreground outline-none"
          aria-label="Plan to grant"
        >
          {pricing.plans.map((p) => (
            <option key={p.key} value={p.key}>{p.name}</option>
          ))}
        </select>
        {[1, 2, 3, 6, 12].map((m) => (
          <button
            key={m}
            disabled={busy !== null}
            onClick={() => act(`${u.id}-${m}`, () => adminApi('grant_plan', { userId: u.id, months: m, planKey: grantPlan }), `${pricing.plans.find((p) => p.key === grantPlan)?.name ?? 'Premium'} granted for ${m} month${m > 1 ? 's' : ''}`)}
            className="rounded-2xl border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11px] font-bold text-primary transition-smooth active:scale-95 disabled:opacity-50"
          >
            +{m}m
          </button>
        ))}
        <button
          disabled={busy !== null}
          onClick={() => act(`${u.id}-revoke`, () => adminApi('revoke_premium', { userId: u.id }), 'Premium revoked')}
          className="rounded-2xl border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[11px] font-bold text-destructive transition-smooth active:scale-95 disabled:opacity-50"
        >
          <XCircle className="mr-1 inline h-3 w-3" /> Revoke
        </button>
        <button
          disabled={busy !== null}
          onClick={() => act(`${u.id}-role`, () => adminApi('set_role', { userId: u.id, makeAdmin: !u.is_admin }), u.is_admin ? 'Admin access removed' : 'Admin access granted')}
          className="rounded-2xl border border-border px-3 py-1.5 text-[11px] font-bold text-foreground transition-smooth active:scale-95 disabled:opacity-50"
        >
          {u.is_admin ? 'Remove admin' : 'Make admin'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <header className="animate-fade-up flex items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-foreground">
            <ShieldCheck className="h-6 w-6 text-primary" /> Admin panel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Customers, subscriptions and revenue.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"
          aria-label="Refresh"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 rounded-2xl px-4 py-2 text-xs font-bold transition-smooth',
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="smarty-card border-destructive/40 p-4 text-sm font-semibold text-destructive">{error}</div>
      )}

      {loading && !stats ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {tab === 'Overview' && stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard icon={Users} label="Customers" value={String(stats.totalUsers)} sub={`${stats.newUsers30d} new in 30 days`} />
                <StatCard icon={Crown} label="Active premium" value={String(stats.activeSubscriptions)} sub={`${stats.grantedSubscriptions} granted · ${stats.paidSubscriptions} paid`} />
                <StatCard icon={TrendingUp} label="MRR" value={euro(stats.mrr)} sub="Paid subscriptions" />
                <StatCard icon={CreditCard} label="Total revenue" value={euro(stats.totalRevenue)} sub={`${stats.paymentsCount} payments`} />
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard icon={BadgeCheck} label="Free users" value={String(stats.freeUsers)} />
                <StatCard icon={XCircle} label="Canceled" value={String(stats.canceledSubscriptions)} />
                <StatCard icon={Crown} label="Granted access" value={String(stats.grantedSubscriptions)} />
                <StatCard icon={CreditCard} label="Currency" value={stats.currency} />
              </div>
              {stats.revenueByMonth.length > 0 && (
                <div className="smarty-card p-4">
                  <p className="text-sm font-bold text-foreground">Revenue by month</p>
                  <div className="mt-3 space-y-2">
                    {stats.revenueByMonth.map((m) => {
                      const max = Math.max(...stats.revenueByMonth.map((x) => x.amount), 1);
                      return (
                        <div key={m.month} className="flex items-center gap-3">
                          <span className="w-16 shrink-0 text-[11px] text-muted-foreground">{m.month}</span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                            <span className="block h-full rounded-full bg-gradient-primary" style={{ width: `${(m.amount / max) * 100}%` }} />
                          </span>
                          <span className="w-20 shrink-0 text-right text-[11px] font-bold text-foreground">{euro(m.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'Customers' && (
            <div className="space-y-3">
              <div className="smarty-card p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <UserPlus className="h-4 w-4 text-primary" /> Create a customer
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Creates the account immediately with the password you choose — already verified, so the
                  person can sign in straight away without any confirmation email.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Email"
                    className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
                  />
                  <input
                    value={newUser.username}
                    onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                    placeholder="Username (optional)"
                    className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
                  />
                  <input
                    type="text"
                    value={newUser.password}
                    onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Password (min 8 characters)"
                    className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
                  />
                  <select
                    value={newUser.months}
                    onChange={(e) => setNewUser((p) => ({ ...p, months: Number(e.target.value) }))}
                    className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none"
                    aria-label="Premium months to grant"
                  >
                    <option value={0}>Free account</option>
                    {[1, 2, 3, 6, 12].map((m) => (
                      <option key={m} value={m}>Premium for {m} month{m > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <button
                  disabled={busy !== null}
                  onClick={() =>
                    act('create-user', async () => {
                      await adminApi('create_user', { ...newUser, planKey: grantPlan });
                      setNewUser({ email: '', password: '', username: '', months: 0 });
                    }, 'Customer created')
                  }
                  className="mt-3 w-full rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-smooth active:scale-[0.99] disabled:opacity-50 sm:w-auto"
                >
                  Create customer
                </button>
              </div>

              <div className="smarty-card flex items-center gap-2 px-4 py-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email"
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              {filtered.length === 0 && <p className="px-1 text-sm text-muted-foreground">No customers found.</p>}
              {filtered.map((u) => <UserRow key={u.id} u={u} />)}
            </div>
          )}

          {tab === 'Subscriptions' && (
            <div className="space-y-3">
              {subscribers.length === 0 && (
                <p className="px-1 text-sm text-muted-foreground">No subscriptions yet. Grant premium from the Customers tab.</p>
              )}
              {subscribers.map((u) => <UserRow key={u.id} u={u} />)}
            </div>
          )}

          {tab === 'Payments' && (
            <div className="space-y-3">
              {payments.length === 0 && (
                <p className="px-1 text-sm text-muted-foreground">No payments recorded yet.</p>
              )}
              {payments.map((p) => (
                <div key={p.id} className="smarty-card flex items-center gap-3 p-4">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{p.description ?? 'Payment'}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtDate(p.created_at)} · {p.status}</p>
                  </div>
                  <span className="text-sm font-extrabold text-foreground">{euro(Number(p.amount_eur))}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'Pricing' && (
            <div className="space-y-4">
              <div className="smarty-card border-primary/40 p-4">
                <p className="text-sm font-bold text-foreground">What this tab does</p>
                <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-muted-foreground">
                  <li>
                    <strong className="text-foreground">Cost model</strong> — what one Smarty Assistant conversation
                    actually costs you in AI usage. Change these numbers only if model prices change.
                  </li>
                  <li>
                    <strong className="text-foreground">Plans</strong> — the price customers pay and how many
                    conversations they get each month. Leave “allowance override” empty to let the target margin decide
                    it automatically, or type a fixed number (currently 300).
                  </li>
                  <li>
                    Whatever you save here is what the public pricing page, the plan page and the conversation meter
                    show — nothing is hardcoded.
                  </li>
                </ul>
              </div>

              <div className="smarty-card p-4">

                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <SlidersHorizontal className="h-4 w-4 text-primary" /> Cost model
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Allowances are derived from these numbers so every plan keeps the target margin.
                  One conversation currently costs {euro(conversationCost(pricing))}.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {([
                    ['targetMargin', 'Target margin (0-1)', 0.01],
                    ['inputPricePerMTokensUsd', 'Input $ / 1M tokens', 0.01],
                    ['outputPricePerMTokensUsd', 'Output $ / 1M tokens', 0.01],
                    ['avgInputTokensPerConversation', 'Avg input tokens', 500],
                    ['avgOutputTokensPerConversation', 'Avg output tokens', 100],
                    ['overhead', 'Overhead factor', 0.05],
                    ['usdToEur', 'USD → EUR', 0.01],
                    ['conversationWindowMinutes', 'Conversation window (min)', 5],
                  ] as const).map(([key, label, step]) => (
                    <label key={key} className="block">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
                      <input
                        type="number"
                        step={step}
                        value={pricing[key] as number}
                        onChange={(e) => setPricing((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground outline-none"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {pricing.plans.map((plan, i) => (
                  <div key={plan.key} className="smarty-card p-4">
                    <input
                      value={plan.name}
                      onChange={(e) => updatePlan(i, { name: e.target.value })}
                      className="w-full bg-transparent text-sm font-bold text-foreground outline-none"
                    />
                    <label className="mt-3 block">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Price € / month</span>
                      <input
                        type="number"
                        step={0.5}
                        value={plan.price}
                        onChange={(e) => updatePlan(i, { price: Number(e.target.value) })}
                        className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground outline-none"
                      />
                    </label>
                    <label className="mt-2 block">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Allowance override</span>
                      <input
                        type="number"
                        placeholder="auto"
                        value={plan.allowanceOverride ?? ''}
                        onChange={(e) => updatePlan(i, { allowanceOverride: e.target.value === '' ? null : Number(e.target.value) })}
                        className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground outline-none"
                      />
                    </label>
                    <div className="mt-3 rounded-2xl bg-primary/5 p-3">
                      <p className="text-lg font-extrabold text-primary">{planAllowance(pricing, plan)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        conversations · margin {(planMargin(pricing, plan) * 100).toFixed(0)}% · AI cost{' '}
                        {euro(planAllowance(pricing, plan) * conversationCost(pricing))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                disabled={busy !== null}
                onClick={() => act('save-pricing', () => adminApi('save_pricing', { config: pricing }), 'Pricing updated')}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow transition-smooth active:scale-95 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> Save pricing
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPage;
