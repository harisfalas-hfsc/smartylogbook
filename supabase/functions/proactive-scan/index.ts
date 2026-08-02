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
  const soon = addDays(7);

  /* ---- bills & reminders coming up or overdue ---- */
  const { data: reminders } = await db
    .from("reminders")
    .select("id,user_id,title,type,amount,due_at,done")
    .eq("done", false)
    .lte("due_at", soon.toISOString());

  for (const r of reminders ?? []) {
    const due = new Date(r.due_at as string);
    const overdue = due < today;
    alerts.push({
      user_id: r.user_id as string,
      kind: r.type as string,
      title: overdue ? `Overdue: ${r.title}` : `Coming up: ${r.title}`,
      detail: `${overdue ? "Was due" : "Due"} ${day(due)}${r.amount ? ` — ${r.amount}` : ""}.`,
      severity: overdue ? "high" : "normal",
      due_at: due.toISOString(),
      dedupe_key: `reminder:${r.id}:${overdue ? "overdue" : "soon"}`,
    });
  }

  /* ---- recurring money items due in the next week ---- */
  const { data: money } = await db
    .from("money_items")
    .select("id,user_id,label,type,amount,currency,next_due,active")
    .eq("active", true)
    .not("next_due", "is", null)
    .lte("next_due", day(soon));

  for (const m of money ?? []) {
    const overdue = String(m.next_due) < day(today);
    alerts.push({
      user_id: m.user_id as string,
      kind: "bill",
      title: `${overdue ? "Overdue payment" : "Payment due"}: ${m.label}`,
      detail: `${m.amount} ${m.currency} ${overdue ? "was due" : "due"} ${m.next_due}.`,
      severity: overdue ? "high" : "normal",
      due_at: new Date(`${m.next_due}T09:00:00Z`).toISOString(),
      dedupe_key: `money:${m.id}:${m.next_due}`,
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
        detail: `Your last reading was ${v.at.slice(0, 10)} — over a year ago.`,
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

  console.log(`proactive-scan: ${alerts.length} candidates, ${inserted} new alerts`);
  return new Response(JSON.stringify({ candidates: alerts.length, inserted }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
