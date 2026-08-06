import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
};

interface AlertRow {
  user_id: string;
  kind: string;
  title: string;
  detail: string;
  severity: string;
  due_at: string | null;
  dedupe_key: string;
}

const day = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => new Date(Date.now() + n * 86400000);

/** Days between two calendar days (positive = due in the future). */
const daysUntil = (dueDay: string, todayDay: string) =>
  Math.round((Date.parse(`${dueDay}T00:00:00Z`) - Date.parse(`${todayDay}T00:00:00Z`)) / 86400000);

type Stage = { id: string; when: string; severity: string };

/**
 * The reminder cadence: two days before, the day before, the day itself,
 * then two follow ups if it was missed. Anything else stays silent.
 */
const stageFor = (delta: number): Stage | null => {
  if (delta === 2) return { id: "t-2", when: "in 2 days", severity: "normal" };
  if (delta === 1) return { id: "t-1", when: "tomorrow", severity: "normal" };
  if (delta === 0) return { id: "t-0", when: "today", severity: "high" };
  if (delta === -1) return { id: "t+1", when: "yesterday", severity: "high" };
  if (delta === -2) return { id: "t+2", when: "2 days ago", severity: "high" };
  return null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const secret = Deno.env.get("CRON_JOB_KEY");
  const provided = req.headers.get("x-cron-key");
  if (!secret || provided !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  /* ---- housekeeping: permanently remove trashed records older than 30 days ---- */
  try {
    const { data: purged } = await db.rpc("purge_expired_trash");
    if (purged) console.log("purged expired trash", purged);
  } catch (e) {
    console.error("purge_expired_trash failed", e);
  }

  const alerts: AlertRow[] = [];
  const today = new Date();
  const todayDay = day(today);
  const soon = addDays(7);

  /* ---- reminders: staged cadence around the due date ---- */
  const { data: reminders } = await db
    .from("reminders")
    .select("id,user_id,title,type,amount,due_at,done")
    .eq("done", false)
    .gte("due_at", addDays(-3).toISOString())
    .lte("due_at", soon.toISOString());

  const activeReminderKeys = new Set<string>();
  for (const r of reminders ?? []) {
    const due = new Date(r.due_at as string);
    const stage = stageFor(daysUntil(day(due), todayDay));
    if (!stage) continue;
    const missed = stage.id.startsWith("t+");
    const key = `reminder:${r.id}:${stage.id}`;
    activeReminderKeys.add(key);
    alerts.push({
      user_id: r.user_id as string,
      kind: r.type as string,
      title: missed
        ? `Missed: ${r.title}`
        : stage.id === "t-0"
          ? `Today: ${r.title}`
          : `Coming up: ${r.title}`,
      detail: `${missed ? "Was due" : "Due"} ${stage.when} (${day(due)})${r.amount ? `, ${r.amount}` : ""}.`,
      severity: stage.severity,
      due_at: due.toISOString(),
      dedupe_key: key,
    });
  }

  // Alerts are snapshots. Clear reminder alerts whose source was completed or
  // deleted so an old dashboard warning can never outlive the reminder itself.
  const { data: existingReminderAlerts } = await db
    .from("proactive_alerts")
    .select("id,dedupe_key")
    .eq("dismissed", false)
    .like("dedupe_key", "reminder:%");
  const staleAlertIds = (existingReminderAlerts ?? [])
    .filter((a) => !activeReminderKeys.has(String(a.dedupe_key)))
    .map((a) => a.id);
  if (staleAlertIds.length) {
    await db.from("proactive_alerts").update({ dismissed: true, seen: true }).in("id", staleAlertIds);
  }

  /* ---- recurring money items, same cadence ---- */
  const { data: money } = await db
    .from("money_items")
    .select("id,user_id,label,type,amount,currency,next_due,active")
    .eq("active", true)
    .not("next_due", "is", null)
    .gte("next_due", day(addDays(-3)))
    .lte("next_due", day(soon));

  for (const m of money ?? []) {
    const dueDay = String(m.next_due);
    const stage = stageFor(daysUntil(dueDay, todayDay));
    if (!stage) continue;
    const missed = stage.id.startsWith("t+");
    alerts.push({
      user_id: m.user_id as string,
      kind: "bill",
      title: missed
        ? `Missed payment: ${m.label}`
        : stage.id === "t-0"
          ? `Due today: ${m.label}`
          : `Payment coming up: ${m.label}`,
      detail: `${m.amount} ${m.currency} ${missed ? "was due" : "due"} ${stage.when} (${dueDay}).`,
      severity: stage.severity,
      due_at: new Date(`${dueDay}T09:00:00Z`).toISOString(),
      dedupe_key: `money:${m.id}:${dueDay}:${stage.id}`,
    });
  }

  /* ---- health values not refreshed in a year ---- */
  const yearAgo = addDays(-365).toISOString();
  const { data: facts } = await db
    .from("facts")
    .select("user_id,name,label,category,observed_at")
    .eq("category", "health")
    .order("observed_at", { ascending: false })
    .limit(2000);

  const latestHealth = new Map<string, { user_id: string; label: string; at: string }>();
  for (const f of facts ?? []) {
    const key = `${f.user_id}:${f.name}`;
    if (!latestHealth.has(key)) {
      latestHealth.set(key, {
        user_id: f.user_id as string,
        label: (f.label as string) ?? (f.name as string),
        at: f.observed_at as string,
      });
    }
  }
  for (const [key, v] of latestHealth) {
    if (v.at < yearAgo) {
      alerts.push({
        user_id: v.user_id,
        kind: "health",
        title: `Time to re-check ${v.label}`,
        detail: `Your last reading was ${v.at.slice(0, 10)}, over a year ago.`,
        severity: "normal",
        due_at: null,
        dedupe_key: `stale-fact:${key}:${v.at.slice(0, 7)}`,
      });
    }
  }

  /* ---- documents / captures with an expiry date coming up ---- */
  const { data: expiring } = await db
    .from("memories")
    .select("id,user_id,title,metadata")
    .is("deleted_at", null)
    .not("metadata", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000);

  for (const m of expiring ?? []) {
    const meta = (m.metadata ?? {}) as Record<string, unknown>;
    const details = (meta.details ?? {}) as Record<string, unknown>;
    const raw = (details.expiry_date ?? details.expires_at ?? details.valid_until) as string | undefined;
    if (!raw) continue;
    const when = new Date(`${String(raw).slice(0, 10)}T09:00:00Z`);
    if (Number.isNaN(when.getTime())) continue;
    const days = (when.getTime() - today.getTime()) / 86400000;
    if (days > 30 || days < -30) continue;
    alerts.push({
      user_id: m.user_id as string,
      kind: "document",
      title: `${days < 0 ? "Expired" : "Expiring soon"}: ${m.title}`,
      detail: `Valid until ${String(raw).slice(0, 10)}.`,
      severity: days < 0 ? "high" : "normal",
      due_at: when.toISOString(),
      dedupe_key: `expiry:${m.id}:${String(raw).slice(0, 10)}`,
    });
  }

  /* ---- subscription renewals and cancellations ---- */
  try {
    const { data: subs } = await db
      .from("subscriptions")
      .select("user_id,plan,plan_key,status,current_period_end,cancel_at_period_end")
      .eq("status", "active")
      .not("current_period_end", "is", null)
      .lte("current_period_end", addDays(7).toISOString());
    for (const sub of subs ?? []) {
      const end = String(sub.current_period_end).slice(0, 10);
      alerts.push({
        user_id: sub.user_id as string,
        kind: "plan",
        title: sub.cancel_at_period_end ? "Your Smarty Premium ends soon" : "Your Smarty Premium renews soon",
        detail: sub.cancel_at_period_end
          ? `Access to Smarty Assistant stops on ${end}. You can resume any time in My plan.`
          : `Your plan renews on ${end} and your conversation allowance resets.`,
        severity: "normal",
        due_at: new Date(`${end}T09:00:00Z`).toISOString(),
        dedupe_key: `plan:${sub.user_id}:${end}`,
      });
    }
  } catch (e) {
    console.error("subscription alerts failed", e);
  }

  let inserted = 0;
  if (alerts.length) {
    const { data, error } = await db
      .from("proactive_alerts")
      .upsert(alerts, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
      .select("id");
    if (error) {
      console.error("insert alerts failed", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    inserted = data?.length ?? 0;
  }

  /* ---- mirror everything into each user's Message Center ---- */
  let messaged = 0;
  if (alerts.length) {
    const rows = alerts.map((a) => ({
      user_id: a.user_id,
      kind: a.kind === "plan" ? "plan" : a.kind,
      title: a.title,
      body: a.detail,
      level: a.severity === "high" ? "high" : "normal",
      related_at: a.due_at,
      action_label: a.kind === "plan" ? "My plan" : "Open calendar",
      action_url: a.kind === "plan" ? "/app/plan" : "/app/calendar",
      dedupe_key: `scan:${a.dedupe_key}`,
    }));
    const { data, error } = await db
      .from("messages")
      .upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
      .select("id");
    if (error) console.error("insert messages failed", error);
    messaged = data?.length ?? 0;
  }

  console.log(`proactive-scan: ${alerts.length} candidates, ${inserted} new alerts, ${messaged} messages`);
  return new Response(JSON.stringify({ candidates: alerts.length, inserted, messaged }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
