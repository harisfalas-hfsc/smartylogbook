import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { assistantDecide } from "../_shared/assistant.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
};

const day = (d: Date) => d.toISOString().slice(0, 10);
const shift = (from: Date, n: number) => new Date(from.getTime() + n * 86400000);

const list = (items: string[], max = 4) =>
  items.length <= max ? items.join(", ") : `${items.slice(0, max).join(", ")} and ${items.length - max} more`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const secret = Deno.env.get("CRON_JOB_KEY");
  if (!secret || req.headers.get("x-cron-key") !== secret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const mode = String(body.mode ?? "daily"); // "daily" | "recap"
  const force = body.force === true;

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const now = new Date();
  const todayKey = day(now);
  const tomorrowKey = day(shift(now, 1));
  const weekAhead = day(shift(now, 7));
  const weekBack = day(shift(now, -7));

  /* Which users are due a message this hour? */
  const { data: prefRows } = await db
    .from("user_preferences")
    .select("user_id,coach_time,notify_coach")
    .eq("notify_coach", true);

  const targets = (prefRows ?? []).filter((p) => {
    if (force) return true;
    const hour = Number(String(p.coach_time ?? "07:30").slice(0, 2));
    return !Number.isNaN(hour) && hour === now.getUTCHours();
  });

  if (!targets.length) {
    return new Response(JSON.stringify({ mode, users: 0, written: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userIds = targets.map((t) => String(t.user_id));

  /* Shared data pulls, scoped to the users we are writing for. */
  const { data: reminders } = await db
    .from("reminders")
    .select("user_id,title,type,amount,due_at,done")
    .in("user_id", userIds)
    .gte("due_at", shift(now, -30).toISOString())
    .lte("due_at", shift(now, 8).toISOString());

  const { data: money } = await db
    .from("money_items")
    .select("user_id,label,amount,currency,next_due,active")
    .in("user_id", userIds)
    .eq("active", true)
    .not("next_due", "is", null)
    .gte("next_due", day(shift(now, -30)))
    .lte("next_due", weekAhead);

  const rows: Record<string, unknown>[] = [];

  if (mode === "recap") {
    const { data: logged } = await db
      .from("memories")
      .select("user_id,module,created_at")
      .in("user_id", userIds)
      .is("deleted_at", null)
      .gte("created_at", shift(now, -7).toISOString());

    for (const uid of userIds) {
      const mine = (logged ?? []).filter((m) => m.user_id === uid);
      const byModule = new Map<string, number>();
      for (const m of mine) byModule.set(String(m.module), (byModule.get(String(m.module)) ?? 0) + 1);
      const myRem = (reminders ?? []).filter((r) => r.user_id === uid);
      const done = myRem.filter((r) => r.done && String(r.due_at).slice(0, 10) >= weekBack).length;
      const slipped = myRem.filter((r) => !r.done && String(r.due_at).slice(0, 10) < todayKey).length;
      const ahead = myRem.filter(
        (r) => !r.done && String(r.due_at).slice(0, 10) >= todayKey && String(r.due_at).slice(0, 10) <= weekAhead,
      ).length;

      const parts = [
        `You logged ${mine.length} thing${mine.length === 1 ? "" : "s"} last week${
          byModule.size ? ` (${list([...byModule].map(([k, v]) => `${k} ${v}`))})` : ""
        }.`,
        `${done} completed, ${slipped} slipped.`,
        ahead ? `${ahead} scheduled for the coming week.` : "Nothing scheduled for the coming week yet.",
      ];

      rows.push({
        user_id: uid,
        kind: "recap",
        title: "Your week in review",
        body: parts.join(" "),
        level: slipped ? "high" : "normal",
        related_at: now.toISOString(),
        action_label: "Open your timeline",
        action_url: "/app/timeline",
        dedupe_key: `recap:${todayKey}`,
      });
    }
  } else {
    /* On this day: same calendar day in previous years. */
    const md = todayKey.slice(5);
    const { data: past } = await db
      .from("memories")
      .select("user_id,title,occurred_at")
      .in("user_id", userIds)
      .is("deleted_at", null)
      .lte("occurred_at", shift(now, -180).toISOString())
      .order("occurred_at", { ascending: false })
      .limit(4000);

    for (const uid of userIds) {
      const myRem = (reminders ?? []).filter((r) => r.user_id === uid && !r.done);
      const myMoney = (money ?? []).filter((m) => m.user_id === uid);

      const todayItems = [
        ...myRem.filter((r) => String(r.due_at).slice(0, 10) === todayKey).map((r) => String(r.title)),
        ...myMoney.filter((m) => String(m.next_due) === todayKey).map((m) => `${m.label} ${m.amount} ${m.currency}`),
      ];
      const tomorrowItems = [
        ...myRem.filter((r) => String(r.due_at).slice(0, 10) === tomorrowKey).map((r) => String(r.title)),
        ...myMoney.filter((m) => String(m.next_due) === tomorrowKey).map((m) => String(m.label)),
      ];
      const missedItems = [
        ...myRem.filter((r) => String(r.due_at).slice(0, 10) < todayKey).map((r) => String(r.title)),
        ...myMoney.filter((m) => String(m.next_due) < todayKey).map((m) => String(m.label)),
      ];
      const memories = (past ?? [])
        .filter((m) => m.user_id === uid && String(m.occurred_at).slice(5, 10) === md)
        .slice(0, 3);

      const lines: string[] = [];
      lines.push(
        todayItems.length ? `Today: ${list(todayItems)}.` : "Today: nothing due, a clear day.",
      );
      if (tomorrowItems.length) lines.push(`Tomorrow: ${list(tomorrowItems)}.`);
      if (missedItems.length) lines.push(`Still open from before: ${list(missedItems)}.`);
      if (memories.length) {
        const years = new Date(String(memories[0].occurred_at)).getUTCFullYear();
        lines.push(
          `On this day ${now.getUTCFullYear() - years} year${
            now.getUTCFullYear() - years === 1 ? "" : "s"
          } ago: ${list(memories.map((m) => String(m.title)), 3)}.`,
        );
      }

      rows.push({
        user_id: uid,
        kind: "insight",
        title: missedItems.length
          ? `${missedItems.length} thing${missedItems.length === 1 ? "" : "s"} still need you`
          : todayItems.length
            ? `${todayItems.length} thing${todayItems.length === 1 ? "" : "s"} due today`
            : "Your daily insight is ready",
        body: lines.join(" "),
        level: missedItems.length ? "high" : "normal",
        related_at: now.toISOString(),
        action_label: "Open your calendar",
        action_url: "/app/calendar",
        dedupe_key: `insight:${todayKey}`,
      });
    }
  }

  let written = 0;
  if (rows.length) {
    const { data, error } = await db
      .from("messages")
      .upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
      .select("id");
    if (error) {
      console.error("daily-insights insert failed", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    written = data?.length ?? 0;
  }

  console.log(`daily-insights (${mode}): ${targets.length} users, ${written} messages`);
  return new Response(JSON.stringify({ mode, users: targets.length, written }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
