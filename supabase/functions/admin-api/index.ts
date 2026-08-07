import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { createStripeClient } from "../_shared/stripe.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const PREMIUM_PRICE = 9.99;

type Sub = {
  user_id: string;
  plan: string;
  status: string;
  source: string;
  amount_eur: number | string;
  current_period_end: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const caller = userData?.user;
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    // Authorisation: caller must hold the admin role.
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden: admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    const action: string = body?.action ?? "";

    // ---- helpers -------------------------------------------------------
    const listAllAuthUsers = async () => {
      const all: { id: string; email: string | null; created_at: string; last_sign_in_at: string | null }[] = [];
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw new Error(error.message);
        const users = data?.users ?? [];
        for (const u of users) {
          all.push({
            id: u.id,
            email: u.email ?? null,
            created_at: u.created_at,
            last_sign_in_at: (u as { last_sign_in_at?: string | null }).last_sign_in_at ?? null,
          });
        }
        if (users.length < 200) break;
      }
      return all;
    };

    const effective = (s: Sub | undefined) => {
      if (!s) return { plan: "free", status: "none", source: "none", ends: null as string | null };
      const expired =
        s.plan === "premium" &&
        s.current_period_end != null &&
        new Date(s.current_period_end).getTime() < Date.now();
      return {
        plan: expired ? "free" : s.plan,
        status: expired ? "expired" : s.status,
        source: s.source,
        ends: s.current_period_end,
      };
    };

    // ---- actions -------------------------------------------------------
    if (action === "list_users") {
      const search = String(body?.search ?? "").trim().toLowerCase();
      const users = await listAllAuthUsers();
      const [{ data: subs }, { data: roles }, { data: pays }, { data: mems }] = await Promise.all([
        admin.from("subscriptions").select("*"),
        admin.from("user_roles").select("user_id, role"),
        admin.from("payments").select("user_id, amount_eur, status"),
        admin.from("memories").select("user_id"),
      ]);
      const subMap = new Map((subs ?? []).map((s) => [s.user_id, s as Sub]));
      const adminSet = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
      const spend = new Map<string, number>();
      for (const p of pays ?? []) {
        if (p.status !== "succeeded" || !p.user_id) continue;
        spend.set(p.user_id, (spend.get(p.user_id) ?? 0) + Number(p.amount_eur ?? 0));
      }
      const memCount = new Map<string, number>();
      for (const m of mems ?? []) memCount.set(m.user_id, (memCount.get(m.user_id) ?? 0) + 1);

      const rows = users
        .filter((u) => !search || (u.email ?? "").toLowerCase().includes(search))
        .map((u) => {
          const e = effective(subMap.get(u.id));
          return {
            id: u.id,
            email: u.email ?? "-",
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            is_admin: adminSet.has(u.id),
            plan: e.plan,
            subscription_status: e.status,
            source: e.source,
            current_period_end: e.ends,
            total_spend: spend.get(u.id) ?? 0,
            memories: memCount.get(u.id) ?? 0,
          };
        })
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

      return json({ users: rows });
    }

    if (action === "stats") {
      const users = await listAllAuthUsers();
      const [{ data: subs }, { data: pays }] = await Promise.all([
        admin.from("subscriptions").select("*"),
        admin.from("payments").select("amount_eur, currency, status, created_at"),
      ]);

      let activePremium = 0;
      let canceled = 0;
      let granted = 0;
      let paid = 0;
      let mrr = 0;
      for (const s of (subs ?? []) as Sub[]) {
        const e = effective(s);
        if (e.plan === "premium" && e.status === "active") {
          activePremium++;
          if (e.source === "admin_grant") granted++;
          if (e.source === "paid") { paid++; mrr += Number(s.amount_eur ?? PREMIUM_PRICE); }
        }
        if (s.status === "canceled") canceled++;
      }

      const succeeded = (pays ?? []).filter((p) => p.status === "succeeded");
      const totalRevenue = succeeded.reduce((sum, p) => sum + Number(p.amount_eur ?? 0), 0);
      const byMonth = new Map<string, number>();
      for (const p of succeeded) {
        const key = String(p.created_at).slice(0, 7);
        byMonth.set(key, (byMonth.get(key) ?? 0) + Number(p.amount_eur ?? 0));
      }
      const revenueByMonth = [...byMonth.entries()]
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .slice(-12)
        .map(([month, amount]) => ({ month, amount: Number(amount.toFixed(2)) }));

      return json({
        totalUsers: users.length,
        newUsers30d: users.filter(
          (u) => Date.now() - new Date(u.created_at).getTime() < 30 * 864e5,
        ).length,
        activeSubscriptions: activePremium,
        paidSubscriptions: paid,
        grantedSubscriptions: granted,
        canceledSubscriptions: canceled,
        freeUsers: users.length - activePremium,
        mrr: Number(mrr.toFixed(2)),
        totalRevenue: Number(totalRevenue.toFixed(2)),
        paymentsCount: succeeded.length,
        currency: "EUR",
        revenueByMonth,
      });
    }

    if (action === "get_pricing") {
      const { data } = await admin.from("pricing_config").select("config").eq("id", 1).maybeSingle();
      return json({ config: data?.config ?? {} });
    }

    /**
     * What Stripe will actually charge. The pricing table only drives what the
     * app *shows*; the real charge lives on the Stripe price with lookup key
     * `premium_monthly`. The admin panel compares the two so they cannot drift.
     */
    if (action === "stripe_price") {
      const env = String(body?.environment ?? "sandbox") === "live" ? "live" : "sandbox";
      try {
        const stripe = createStripeClient(env);
        const prices = await stripe.prices.list({ lookup_keys: ["premium_monthly"], limit: 1 });
        const p = prices.data[0];
        if (!p) return json({ price: null, environment: env, error: "No Stripe price with lookup key premium_monthly" });
        return json({
          price: {
            amount: (p.unit_amount ?? 0) / 100,
            currency: (p.currency ?? "eur").toUpperCase(),
            interval: p.recurring?.interval ?? "one-off",
          },
          environment: env,
        });
      } catch (e) {
        return json({ price: null, environment: env, error: e instanceof Error ? e.message : "Stripe unavailable" });
      }
    }



    if (action === "save_pricing") {
      const config = body?.config;
      if (!config || typeof config !== "object") return json({ error: "Invalid config" }, 400);
      const { error } = await admin
        .from("pricing_config")
        .upsert({ id: 1, config, updated_at: new Date().toISOString(), updated_by: caller.id }, { onConflict: "id" });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "grant_premium" || action === "grant_plan") {
      const userId = String(body?.userId ?? "");
      const planKey = String(body?.planKey ?? "intelligence");
      const months = Number(body?.months ?? 1);
      if (!userId || !Number.isFinite(months) || months < 1 || months > 60) {
        return json({ error: "Invalid userId or months" }, 400);
      }
      const { data: existing } = await admin
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const base =
        existing?.current_period_end && new Date(existing.current_period_end) > new Date()
          ? new Date(existing.current_period_end)
          : new Date();
      const end = new Date(base);
      end.setMonth(end.getMonth() + months);

      const { data: cfgRow } = await admin.from("pricing_config").select("config").eq("id", 1).maybeSingle();
      const cfgPlans = ((cfgRow?.config as Record<string, unknown> | null)?.plans ?? []) as Array<{ key: string; price: number }>;
      const planPrice = cfgPlans.find((p) => p.key === planKey)?.price ?? PREMIUM_PRICE;

      const payload = {
        user_id: userId,
        plan_key: planKey,
        current_period_start: new Date().toISOString(),
        plan: "premium",
        status: "active",
        source: existing?.source === "paid" ? "paid" : "admin_grant",
        amount_eur: existing?.source === "paid" ? planPrice : 0,
        current_period_end: end.toISOString(),
        granted_by: caller.id,
      };
      const { error } = await admin.from("subscriptions").upsert(payload, { onConflict: "user_id" });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, current_period_end: end.toISOString() });
    }

    if (action === "revoke_premium") {
      const userId = String(body?.userId ?? "");
      if (!userId) return json({ error: "Invalid userId" }, 400);
      const { error } = await admin.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "free",
          plan_key: null,
          status: "canceled",
          source: "none",
          amount_eur: 0,
          current_period_end: null,
          granted_by: caller.id,
        },
        { onConflict: "user_id" },
      );
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_role") {
      const userId = String(body?.userId ?? "");
      const makeAdmin = Boolean(body?.makeAdmin);
      if (!userId) return json({ error: "Invalid userId" }, 400);
      if (userId === caller.id && !makeAdmin) {
        return json({ error: "You cannot remove your own admin access" }, 400);
      }
      if (makeAdmin) {
        const { error } = await admin
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
        if (error) return json({ error: error.message }, 400);
      } else {
        const { error } = await admin
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) return json({ error: error.message }, 400);
      }
      return json({ ok: true });
    }

    if (action === "create_user") {
      const email = String(body?.email ?? "").trim().toLowerCase();
      const password = String(body?.password ?? "");
      const username = String(body?.username ?? "").trim() || email.split("@")[0];
      const months = Number(body?.months ?? 0);
      if (!email || !email.includes("@")) return json({ error: "A valid email is required" }, 400);
      if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // created by an admin: no verification email needed
        user_metadata: { username },
      });
      if (createErr) return json({ error: createErr.message }, 400);
      const newId = created?.user?.id;
      if (!newId) return json({ error: "User could not be created" }, 400);

      if (Number.isFinite(months) && months >= 1) {
        const end = new Date();
        end.setMonth(end.getMonth() + Math.min(60, Math.round(months)));
        await admin.from("subscriptions").upsert(
          {
            user_id: newId,
            plan: "premium",
            plan_key: String(body?.planKey ?? "premium"),
            status: "active",
            source: "admin_grant",
            amount_eur: 0,
            current_period_start: new Date().toISOString(),
            current_period_end: end.toISOString(),
            granted_by: caller.id,
          },
          { onConflict: "user_id" },
        );
      }
      return json({ ok: true, userId: newId });
    }

    if (action === "recent_payments") {
      const { data } = await admin
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25);
      return json({ payments: data ?? [] });
    }

    // ---- scheduled jobs (pg_cron) ---------------------------------------
    if (action === "cron_jobs") {
      const { data, error } = await admin.rpc("admin_list_cron_jobs");
      if (error) return json({ error: error.message }, 400);
      return json({ jobs: data ?? [] });
    }

    if (action === "cron_save") {
      const jobname = String(body?.jobname ?? "").trim();
      const schedule = String(body?.schedule ?? "").trim();
      const template = String(body?.template ?? "").trim();
      const active = body?.active !== false;

      // Templates let an administrator schedule a known task without writing SQL.
      const cronKey = Deno.env.get("CRON_JOB_KEY") ?? "";
      const baseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const invoke = (fn: string, payload: string) => `
  SELECT net.http_post(
    url := '${baseUrl}/functions/v1/${fn}',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-key', '${cronKey}'),
    body := '${payload}'::jsonb
  );`;
      const TEMPLATES: Record<string, string> = {
        proactive_scan: invoke("proactive-scan", '{"source":"cron"}'),
        daily_insights: invoke("daily-insights", '{"mode":"daily"}'),
        daily_tip: invoke("daily-tip", '{"hour":6}'),
        weekly_recap: invoke("daily-insights", '{"mode":"recap"}'),
        purge_trash: "SELECT public.purge_expired_trash();",
      };

      const command = template
        ? (TEMPLATES[template] ?? "")
        : String(body?.command ?? "").trim();
      if (template && !command) return json({ error: "Unknown job template" }, 400);
      if (!jobname || !schedule || !command) {
        return json({ error: "Name, schedule and task are all required" }, 400);
      }
      const { data, error } = await admin.rpc("admin_save_cron_job", {
        _jobname: jobname,
        _schedule: schedule,
        _command: command,
        _active: active,
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, result: data });
    }


    if (action === "cron_toggle") {
      const { error } = await admin.rpc("admin_set_cron_active", {
        _jobid: Number(body?.jobid),
        _active: Boolean(body?.active),
      });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "cron_delete") {
      const { error } = await admin.rpc("admin_delete_cron_job", { _jobid: Number(body?.jobid) });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "cron_run") {
      const { error } = await admin.rpc("admin_run_cron_job", { _jobid: Number(body?.jobid) });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    // ---- messages / notifications ---------------------------------------
    if (action === "list_messages") {
      const search = String(body?.search ?? "").trim().toLowerCase();
      const { data, error } = await admin
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) return json({ error: error.message }, 400);
      const users = await listAllAuthUsers();
      const emailById = new Map(users.map((u) => [u.id, u.email ?? "-"]));
      const rows = (data ?? [])
        .map((m) => ({ ...m, email: emailById.get(m.user_id) ?? "-" }))
        .filter(
          (m) =>
            !search ||
            `${m.title ?? ""} ${m.body ?? ""} ${m.email} ${m.kind ?? ""}`.toLowerCase().includes(search),
        );
      const byKind = new Map<string, number>();
      for (const m of data ?? []) byKind.set(m.kind ?? "other", (byKind.get(m.kind ?? "other") ?? 0) + 1);

      // Recipient counts, so "Send an announcement" can say exactly who gets it.
      const { data: subsForCount } = await admin.from("subscriptions").select("*");
      const subCountMap = new Map((subsForCount ?? []).map((s) => [s.user_id, s as Sub]));
      let premiumCount = 0;
      for (const u of users) {
        if (effective(subCountMap.get(u.id)).plan === "premium") premiumCount += 1;
      }
      return json({
        messages: rows,
        total: (data ?? []).length,
        unread: (data ?? []).filter((m) => !m.read_at).length,
        byKind: [...byKind.entries()].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count),
        audience: { all: users.length, premium: premiumCount, free: users.length - premiumCount },
      });
    }

    if (action === "delete_messages_by_kind") {
      const kind = String(body?.kind ?? "").trim();
      if (!kind) return json({ error: "Invalid kind" }, 400);
      const { error } = await admin.from("messages").delete().eq("kind", kind);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }


    if (action === "update_message") {
      const id = String(body?.id ?? "");
      if (!id) return json({ error: "Invalid message id" }, 400);
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const k of ["title", "body", "level", "kind", "action_label", "action_url"]) {
        if (body?.[k] !== undefined) patch[k] = body[k];
      }
      const { error } = await admin.from("messages").update(patch).eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "delete_message") {
      const id = String(body?.id ?? "");
      if (!id) return json({ error: "Invalid message id" }, 400);
      const { error } = await admin.from("messages").delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "broadcast_message") {
      const title = String(body?.title ?? "").trim();
      const text = String(body?.body ?? "").trim();
      const audience = String(body?.audience ?? "all");
      if (!title || !text) return json({ error: "Title and body are required" }, 400);

      const users = await listAllAuthUsers();
      const { data: subs } = await admin.from("subscriptions").select("*");
      const subMap = new Map((subs ?? []).map((s) => [s.user_id, s as Sub]));
      const targets = users.filter((u) => {
        if (audience === "all") return true;
        const e = effective(subMap.get(u.id));
        return audience === "premium" ? e.plan === "premium" : e.plan !== "premium";
      });
      if (targets.length === 0) return json({ error: "No recipients match that audience" }, 400);

      const now = new Date().toISOString();
      const rows = targets.map((u) => ({
        user_id: u.id,
        kind: "announcement",
        title,
        body: text,
        // The app only understands "normal" and "high"; map the admin wording onto it.
        level: String(body?.level ?? "normal") === "warning" ? "high" : "normal",
        related_at: now,
        metadata: { sent_by: caller.id, audience },
      }));
      const { error } = await admin.from("messages").insert(rows);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, sent: rows.length });
    }

    return json({ error: "Invalid action" }, 400);

  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
