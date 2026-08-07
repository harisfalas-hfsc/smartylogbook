/**
 * Daily Smarty Assistant tip.
 *
 * Runs every hour. For each user it works out the local time in their own
 * timezone and only writes to those for whom it is currently 6 a.m. The tip is
 * one short, practical hint on how to get more out of Smarty Logbook, written
 * by Smarty Assistant and personalised with what the user actually uses.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Local calendar day + hour for a timezone, using the runtime's tz database. */
const localParts = (now: Date, tz: string) => {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    });
    const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
    return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24 };
  } catch {
    return { day: now.toISOString().slice(0, 10), hour: now.getUTCHours() };
  }
};

const FALLBACK_TIPS = [
  {
    title: "Capture it the moment it happens",
    body:
      "Anything you say, snap or upload lands in your logbook and Smarty Assistant files it for you. No category to pick, no form to fill in.",
  },
  {
    title: "Ask in plain words",
    body:
      "Try asking your assistant something like when was my last blood test, or how much did I spend on groceries this month. It reads your own logbook to answer.",
  },
  {
    title: "Let reminders chase you",
    body:
      "Add a due date to anything that matters and your assistant will nudge you before it is due, on the day, and again if it slips.",
  },
  {
    title: "Photograph your paperwork",
    body:
      "Snap receipts, bills and letters. Your assistant pulls out the date, the amount and what it is about, so you can find it later by simply describing it.",
  },
  {
    title: "Correct me once",
    body:
      "If something is filed in the wrong category, move it. Your assistant remembers your choice and files the same kind of thing your way from now on.",
  },
];

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
  } catch { /* empty body is fine */ }
  const force = body.force === true;
  const targetHour = Number(body.hour ?? 6);

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const now = new Date();

  const { data: prefRows, error: prefError } = await db
    .from("user_preferences")
    .select("user_id,timezone,notify_daily_tip,goals,focus_modules,tone");
  if (prefError) {
    return new Response(JSON.stringify({ error: prefError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const targets = (prefRows ?? [])
    .filter((p) => p.notify_daily_tip !== false)
    .map((p) => ({ ...p, local: localParts(now, String(p.timezone ?? "UTC")) }))
    .filter((p) => force || p.local.hour === targetHour);

  if (!targets.length) {
    return new Response(JSON.stringify({ users: 0, written: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userIds = targets.map((t) => String(t.user_id));

  /* What each user already does, so tips stay relevant instead of generic. */
  const { data: memories } = await db
    .from("memories")
    .select("user_id,module")
    .in("user_id", userIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(600);

  /* Tips already sent, so the assistant never repeats itself. */
  const { data: sent } = await db
    .from("messages")
    .select("user_id,title")
    .in("user_id", userIds)
    .eq("kind", "tip")
    .order("created_at", { ascending: false })
    .limit(300);

  const key = Deno.env.get("LOVABLE_API_KEY");

  const writeTip = async (uid: string, seed: number) => {
    const used = (memories ?? []).filter((m) => m.user_id === uid);
    const counts: Record<string, number> = {};
    used.forEach((m) => { counts[String(m.module)] = (counts[String(m.module)] ?? 0) + 1; });
    const usedCategories = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([m, n]) => `${m} (${n})`);
    const previous = (sent ?? [])
      .filter((s) => s.user_id === uid)
      .slice(0, 12)
      .map((s) => String(s.title));

    let tip = FALLBACK_TIPS[seed % FALLBACK_TIPS.length];

    if (key) {
      try {
        const res = await fetch(GATEWAY, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            messages: [
              {
                role: "system",
                content:
                  `You are Smarty Assistant inside Smarty Logbook, a second brain where people capture anything by typing, speaking, photographing or uploading it, and the assistant files it, links it and answers questions about it in plain words.
Write ONE short morning tip that makes the person's day easier by using the logbook better. Warm, plain language, specific and immediately actionable. No jargon, no scores, no slashes, no emoji, no greetings.
Title max 55 characters. Body max 200 characters, one or two sentences.
Never repeat a tip that was already sent.
Reply with JSON only: {"title":"...","body":"..."}`,
              },
              {
                role: "user",
                content: JSON.stringify({
                  categories_they_use: usedCategories,
                  total_entries: used.length,
                  tips_already_sent: previous,
                }),
              },
            ],
            max_tokens: 300,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const raw = String(data?.choices?.[0]?.message?.content ?? "");
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed?.title && parsed?.body) {
              tip = {
                title: String(parsed.title).slice(0, 70),
                body: String(parsed.body).slice(0, 260),
              };
            }
          }
        }
      } catch (e) {
        console.error("daily-tip model call failed", e);
      }
    }
    return tip;
  };

  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const uid = String(t.user_id);
    const tip = await writeTip(uid, i + now.getUTCDate());
    rows.push({
      user_id: uid,
      kind: "tip",
      title: tip.title,
      body: tip.body,
      level: "normal",
      related_at: now.toISOString(),
      action_label: "Open Smarty Assistant",
      action_url: "/app/assistant",
      dedupe_key: `tip:${t.local.day}`,
    });
  }

  let written = 0;
  if (rows.length) {
    const { data, error } = await db
      .from("messages")
      .upsert(rows, { onConflict: "user_id,dedupe_key", ignoreDuplicates: true })
      .select("id");
    if (error) {
      console.error("daily-tip insert failed", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    written = data?.length ?? 0;
  }

  console.log(`daily-tip: ${targets.length} users at local ${targetHour}:00, ${written} messages`);
  return new Response(JSON.stringify({ users: targets.length, written }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
