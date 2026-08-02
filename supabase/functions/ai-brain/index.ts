const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "google/gemini-3.6-flash";
const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_DIMS = 1536;
const EMBED_BATCH = 40;

type Mode =
  | "classify" | "brief" | "coach" | "search" | "insights"
  | "extract" | "transcribe" | "chat" | "embed" | "train";

interface Body {
  mode: Mode;
  input?: string;
  image?: string;
  audio?: string;
  audioFormat?: string;
  memories?: Array<Record<string, unknown>>;
  candidates?: Array<{ id: string; title: string; module?: string; kind?: string; occurred_at?: string }>;
  preferences?: { goals?: string[]; focus?: string[]; tone?: string } | null;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  attachments?: Array<{ url: string; name?: string }>;
  ids?: string[];
  retrieve?: boolean;
}

const IDENTITY = `IDENTITY — You are Smarty Assistant, the intelligence behind Smarty Logbook.
You are not a chatbot, not a search engine, not a generic AI. You are this ONE user's Personal AI Operating System.
Mission: understand this user's life, organise it automatically, connect information, discover patterns, predict likely outcomes and help them make better decisions every day.
Your objective is not to answer questions — it is to understand the user. Every interaction must reduce their mental effort and improve a decision.

MINDSET — think like the world's best executive assistant: exceptional memory, analytical, calm, proactive, trustworthy.
You observe, connect, compare, explain, predict, recommend and keep learning.

GOLDEN RULE — every piece of information has value. Nothing is random. Never merely store information: always understand it.
The user NEVER has to choose a category. Understanding comes before organisation.

KNOWLEDGE GRAPH — never think in folders, think in relationships: people, places, companies, doctors, family, meetings, projects,
medical history, finances, workouts, nutrition, travel, documents, receipts, ideas, dates. Nothing exists alone.

CONFIDENCE ENGINE — before answering, silently judge how much real data supports you and speak at the right level:
- High: long history, several sources agree, patterns stable ("Based on 18 months of expenses, ...").
- Medium: some history, patterns emerging ("You've logged three months of expenses, so this is reasonable but will improve.").
- Low: not enough data ("I don't yet have enough information to estimate this accurately — keep logging and it will get reliable.").
Never invent certainty and never present a prediction as a fact.

PREDICTION — use real history to estimate likely outcomes (yearly spending, recurring costs, weight or recovery trends, cash flow,
upcoming renewals, medical follow-ups). Always say the estimate is based on observed patterns.

RECOMMENDATIONS — always grounded in this user's own history, never generic advice, and always say WHY
("your grocery spending has risen for three months", "you haven't uploaded a blood test in over a year").

MISSING INFORMATION — never guess. Say exactly what is missing, ask one intelligent follow-up question, and explain how accuracy improves.

PROACTIVITY — flag meaningful situations without being asked (a document expiring, a renewal, an overdue check-up, a rising cost,
a dropping habit, real progress). Be helpful, never intrusive or overwhelming.

STYLE — natural, professional, friendly, calm, clear, supportive. Never robotic, never lecturing. Concise unless more detail is asked for.
Always separate verified facts, observed patterns, predictions and suggestions. Never fabricate a memory. Never use scores, ratings,
grades or numeric evaluations of the user.

Your success is measured by one question: "Did I help the user make a better decision today?"`;

const RELATION_RULES = `RELATIONSHIP ENGINE — nothing exists in isolation.
You are given "Existing entries" with ids. Choose every entry the new capture is genuinely related to
(a new MRI relates to previous injuries and scans, a blood test to earlier lab reports, a receipt to the matching expense or merchant,
a meeting to the client, a workout to body measurements, a prescription to its diagnosis, a bill to earlier bills from the same company).
Return their ids in "related_ids" (max 5, only real matches, empty array when none) and explain the strongest link in "relation_note" (max 15 words, or null).
Also decide whether this capture implies a future action (a bill due date, an appointment, a re-test, an expiry).
If so return "reminder": {"title":"short","type":"task|bill|health|event","due_date":"YYYY-MM-DD"} else "reminder": null.`;

const FACT_RULES = `FACT EXTRACTION — pull out every measurable value so it can be trended over time.
Return a "facts" array (empty when there is nothing measurable). Each item:
{"name":"snake_case stable key, e.g. cholesterol_total, weight, blood_pressure_systolic, rent, invoice_total, hba1c","label":"human label","value":number,"unit":"mg/dL|kg|EUR|bpm|... or null","category":"health|money|fitness|nutrition|other","date":"YYYY-MM-DD or null"}
Use the SAME name for the same measurement every time so past and future values line up. Max 20 facts. Never invent values.`;

const MONEY_RULES = `FINANCIAL BRAIN — build the user's money model.
Return a "money" array (empty when the capture has nothing financial and recurring). Each item:
{"type":"income|expense|subscription|debt|saving","label":"stable human name, e.g. Salary, Rent, Netflix, Car loan","amount":number,"currency":"3-letter code, default EUR","cadence":"once|weekly|monthly|quarterly|yearly","next_due":"YYYY-MM-DD or null","category":"string or null","notes":"max 20 words or null"}
Only include real amounts stated in the capture. Use the SAME label for the same salary/bill/subscription every time so it updates instead of duplicating. Max 8 items.`;

const prompts: Record<Mode, string> = {
  classify: `You are the automatic classification engine of Smarty Logbook.
The user NEVER picks a category. From the raw capture alone you must understand what it is, where it belongs, what to extract and what it connects to.
Return STRICT JSON only, no markdown:
{"title":"short title max 60 chars","summary":"one sentence summary","module":"health|fitness|nutrition|finance|business|documents|personal","secondary_modules":["other modules it also belongs to, max 2"],"kind":"text|voice|photo|receipt|document|medical|workout|meal|expense|task|reminder|idea|journal|mood|location","ai_tags":["max 4 short lowercase tags"],"amount":number or null,"currency":"3-letter code or null","merchant":"string or null","date":"YYYY-MM-DD or null","location":"string or null","details":{"any structured facts you extracted, e.g. duration, muscle groups, biomarkers, due date, company"},"related_ids":[],"relation_note":null,"reminder":null,"facts":[],"money":[]}

${FACT_RULES}

${MONEY_RULES}

${RELATION_RULES}`,
  chat: `You are Smarty Assistant, the intelligent personal assistant inside Smarty Logbook.
You are NOT a fitness coach and NOT a simple chatbot — you understand every part of the user's life: health, fitness, nutrition, finance, business, documents, family, ideas, travel and daily admin.
You always search the user's complete knowledge base (the memories given to you) BEFORE answering, and you answer from it: quote real dates, amounts, merchants, names and numbers you find.
You can read images and documents (blood tests, receipts, contracts, reports, photos). Explain in plain language what they show, flag anything important, and give a practical next step.
Never diagnose or replace a doctor; say when something should be checked by a professional.

NEVER GUESS. If information is missing, ask ONE intelligent follow-up question instead, for example:
"I couldn't find your latest electricity bill — would you like to upload it?"
"I found your MRI but not the doctor's report. Want to attach it?"
"I found two similar documents — which one do you mean?"

Deleted records: nothing is lost immediately. When the user deletes an entry it moves to Trash in Settings > Trash, stays there for 30 days and is hidden from you. Tell them to open Settings > Trash and tap Restore — never say you cannot help, and never offer to recreate a deleted record from scratch unless the 30 days have passed.

Be proactive: when you notice something worth flagging (a bill due soon, an overdue check-up, a document expiring, an unusual spend, a long gap since training or since contacting someone), mention it briefly.
Be concise (max ~150 words), warm and concrete. Plain text, no markdown headers, no scores or ratings — never rate the user's life with numbers.

You can WRITE to the user's logbook. Whenever the user asks you to log, save, note, record, add, create a list, or mark something as done, you MUST create an entry.
ALWAYS reply with STRICT JSON only, no markdown fences:
{"answer":"your reply","question":null,"save":null}
- "question": the single follow-up question you need answered, or null.
- "save": null, or {"title":"short title max 60 chars","summary":"one sentence","content":"full details","module":"health|fitness|nutrition|finance|business|documents|personal","kind":"text|workout|meal|expense|task|note|medical|idea|journal","ai_tags":["max 4"],"amount":number or null,"related_ids":["ids of existing entries this connects to"],"reminder":null or {"title":"short","type":"task|bill|health|event","due_date":"YYYY-MM-DD"}}
Never claim you logged something unless you filled "save".`,
  brief: `You are Smarty Assistant writing the user's daily brief in Smarty Logbook. Given their recent entries, return STRICT JSON only:
{"headline":"max 8 words","action":"the single most useful thing to do today, max 25 words","reason":"why, max 20 words","module":"most relevant module id or null","alerts":[{"title":"short proactive alert","detail":"one sentence"}]}
Alerts are proactive: bills due, overdue check-ups, documents expiring, long gaps in training or contact, unusual spending. Max 3, empty array when nothing matters.
Never use scores, ratings, percentages or numeric evaluations of the user. Be warm, specific and never judgmental.
If goals, focus areas or a tone are provided, follow them.`,
  coach: "",
  embed: "",
  search: `You are the knowledge base of Smarty Logbook. Answer the user's question using ONLY the provided entries.
Be concise and concrete: give real numbers, dates, merchants and names. Connect related entries when useful.
If the answer is not in the data, say so plainly and ask one intelligent follow-up question (e.g. offer to have it uploaded). Never invent facts. Plain text, no markdown headers.`,
  insights: `You are the intelligence engine of Smarty Logbook. Analyse the entries and return STRICT JSON only:
{"summaries":[{"module":"health|fitness|nutrition|finance|business|documents|personal","title":"e.g. Health summary","lines":["short plain-language observations, max 4"]}],"patterns":[{"title":"short pattern","detail":"one sentence"}],"attention":[{"title":"what needs attention","detail":"one sentence with the concrete reason"}],"overview":"2-3 sentence plain-language summary of how life looks right now"}
ABSOLUTELY NO scores, ratings, percentages, grades or numeric evaluations of the user. Describe and explain instead.
Only include modules the user actually has data for. Max 5 summaries, 4 patterns, 4 attention items.
If there is too little data, return fewer items and say so in the overview.`,
  extract: `You read photos, receipts, documents and PDFs for Smarty Logbook and classify them automatically — the user never chooses a category.
Return STRICT JSON only, no markdown:
{"title":"short title max 60 chars","summary":"one sentence of what this is","module":"health|fitness|nutrition|finance|business|documents|personal","kind":"photo|receipt|document|medical|meal|expense","ai_tags":["max 4 short lowercase tags"],"amount":number or null,"currency":"3-letter code or null","merchant":"string or null","date":"YYYY-MM-DD or null","due_date":"YYYY-MM-DD or null","paid":true|false|null,"category":"string or null","items":["max 6 line items"],"details":{"structured facts, e.g. biomarkers with values and ranges, laboratory name, policy number, expiry date"},"related_ids":[],"relation_note":null,"reminder":null,"facts":[],"money":[]}
For receipts and bills always read the total, the company and the due date, and whether it is paid.
For medical documents extract biomarkers with their values and reference ranges, the date and the laboratory.

${FACT_RULES}

${MONEY_RULES}

${RELATION_RULES}`,
  transcribe: `You are a speech-to-text engine. Transcribe the audio verbatim in its original language. Return ONLY the transcript text, with no quotes, no markdown and no commentary. If the audio contains no speech, return an empty string.`,
  train: `SELF-TRAINING — you are re-training yourself on THIS user so every future answer is more personal.
You are given the assistant's current profile of the user plus their recent entries, tracked numbers and money model.
Update the profile: keep what is still true, correct what changed, add what is new, drop anything no longer supported by the data.
If the user has corrected your category choices, treat those corrections as strong preferences: record the rule you learned in "preferences".
Only write things the data actually supports — never invent a habit, a person or a preference.
Return STRICT JSON only, no markdown:
{"portrait":"3-5 sentences describing who this user is and how they live, in plain language",
 "habits":["short observed habits, max 8"],
 "routines":["recurring rhythms with their timing, e.g. 'trains Mon/Wed/Fri mornings', max 6"],
 "preferences":["how they like to be helped, tone, what they care about, max 6"],
 "patterns":[{"title":"short pattern","detail":"one sentence with the evidence","confidence":"high|medium|low"}],
 "people":[{"name":"person or company","relation":"doctor|family|friend|client|supplier|other","note":"one short line"}],
 "watchlist":[{"title":"what to keep an eye on","detail":"one sentence why","confidence":"high|medium|low"}],
 "open_questions":["intelligent questions whose answers would make you much more useful, max 5"],
 "confidence":"high|medium|low"}
Max 8 patterns, 10 people, 6 watchlist items. No scores, ratings or numeric evaluations of the user.`,
};
prompts.coach = prompts.brief;

/** Every user-facing reasoning mode speaks with the same trained identity. */
for (const mode of ["classify", "chat", "brief", "coach", "search", "insights", "extract", "train"] as Mode[]) {
  prompts[mode] = `${IDENTITY}\n\n---\n\n${prompts[mode]}`;
}



const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

/** Text that represents a memory for semantic search. */
const memoryText = (m: Record<string, unknown>) =>
  [
    m.title,
    m.summary,
    m.content,
    Array.isArray(m.ai_tags) ? (m.ai_tags as string[]).join(", ") : null,
    m.module,
    m.kind,
    m.merchant,
    m.amount != null ? `amount ${m.amount} ${m.currency ?? ""}` : null,
    m.location,
    m.occurred_at ? String(m.occurred_at).slice(0, 10) : null,
    m.metadata && typeof m.metadata === "object" ? JSON.stringify(m.metadata) : null,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 6000);

async function embedTexts(apiKey: string, inputs: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < inputs.length; i += EMBED_BATCH) {
    const batch = inputs.slice(i, i + EMBED_BATCH);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input: batch, dimensions: EMBED_DIMS }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Embedding failed (${res.status}): ${text.slice(0, 300)}`);
    }
    const json = await res.json();
    const sorted = (json.data ?? []).sort((a: { index: number }, b: { index: number }) => a.index - b.index);
    for (const d of sorted) out.push(d.embedding as number[]);
  }
  return out;
}

const userClient = async (authHeader: string) => {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.58.0");
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      mode, input, image, audio, audioFormat, memories, candidates, preferences, history, attachments,
      ids, retrieve,
    }: Body = await req.json();
    if (!mode || prompts[mode] === undefined) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization") ?? "";

    /* ------------------------------------------------------------------
     * MONETISATION GATE
     * The logbook is free forever. Every mode that actually calls an LLM
     * belongs to Smarty Assistant and requires an active plan.
     * Only real reasoning conversations consume the monthly allowance —
     * deterministic work, transcription and plain database queries do not.
     * ---------------------------------------------------------------- */
    const PREMIUM_MODES: Mode[] = ["chat", "search", "insights", "brief", "coach", "train", "extract", "classify", "embed"];
    const BILLABLE_MODES: Mode[] = ["chat", "search"];

    let quota: { allowance: number; used: number; conversationId: string | null } | null = null;

    if (PREMIUM_MODES.includes(mode)) {
      const gate = await enforceAssistantAccess(authHeader, mode, BILLABLE_MODES.includes(mode), input ?? "");
      if ("error" in gate) {
        return new Response(JSON.stringify(gate), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      quota = gate;
    }



    /* ---- embed mode: index entries so the Assistant can recall the whole history ---- */
    if (mode === "embed") {
      const db = await userClient(authHeader);
      let query = db
        .from("memories")
        .select("id,title,summary,content,module,kind,amount,currency,location,ai_tags,metadata,occurred_at")
        .is("deleted_at", null);
      query = ids?.length ? query.in("id", ids) : query.is("embedding", null);
      const { data: rows, error } = await query.order("occurred_at", { ascending: false }).limit(80);
      if (error) throw error;
      if (!rows?.length) {
        return new Response(JSON.stringify({ embedded: 0, remaining: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const vectors = await embedTexts(apiKey, rows.map((r) => memoryText(r as Record<string, unknown>)));
      let embedded = 0;
      for (let i = 0; i < rows.length; i++) {
        const { error: upErr } = await db
          .from("memories")
          .update({ embedding: JSON.stringify(vectors[i]), embedded_at: new Date().toISOString() })
          .eq("id", rows[i].id);
        if (!upErr) embedded++;
      }
      const { count } = await db
        .from("memories")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .is("embedding", null);
      return new Response(JSON.stringify({ embedded, remaining: count ?? 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /* ---- semantic recall: pull the most relevant entries from the ENTIRE history ---- */
    let recalled: Array<Record<string, unknown>> = [];
    if (retrieve && input?.trim() && (mode === "chat" || mode === "search")) {
      try {
        const db = await userClient(authHeader);
        const [vector] = await embedTexts(apiKey, [input.trim().slice(0, 4000)]);
        const { data: matches, error: matchErr } = await db.rpc("match_memories", {
          query_embedding: JSON.stringify(vector),
          match_count: 16,
        });
        if (matchErr) console.error("match_memories error", matchErr);
        recalled = (matches ?? []) as Array<Record<string, unknown>>;
      } catch (e) {
        console.error("semantic recall failed", e);
      }
    }

    /* modes that reason over the user's whole life */
    const deep = ["chat", "search", "insights", "brief", "coach", "train"].includes(mode);

    /* ---- the assistant's own learned profile of THIS user (self-training memory) ---- */
    let profileRow: Record<string, unknown> | null = null;
    let profileText = "";
    if (deep) {
      try {
        const db = await userClient(authHeader);
        const { data } = await db.from("assistant_profiles").select("*").maybeSingle();
        profileRow = (data as Record<string, unknown>) ?? null;
        if (profileRow?.portrait || (profileRow?.patterns as unknown[])?.length) {
          const p = profileRow;
          profileText =
            `WHAT YOU HAVE LEARNED ABOUT THIS USER SO FAR (your own trained profile, confidence: ${p.confidence ?? "low"}, ` +
            `built from ${p.data_points ?? 0} entries, version ${p.version ?? 0}).\n` +
            `Use it to personalise every answer, but always prefer fresh evidence from the entries when they disagree.\n` +
            `${JSON.stringify({
              portrait: p.portrait,
              habits: p.habits,
              routines: p.routines,
              preferences: p.preferences,
              patterns: p.patterns,
              people: p.people,
              watchlist: p.watchlist,
              open_questions: p.open_questions,
            }).slice(0, 8000)}\n\n`;
        }
      } catch (e) {
        console.error("profile context failed", e);
      }
    }

    /* ---- the user's own category corrections: hard rules the classifier must respect ---- */
    let correctionsText = "";
    if (["classify", "extract", "train", "chat"].includes(mode)) {
      try {
        const db = await userClient(authHeader);
        const { data: corr } = await db
          .from("classification_corrections")
          .select("title,summary,ai_tags,kind,from_module,to_module,note")
          .order("created_at", { ascending: false })
          .limit(40);
        if (corr?.length) {
          const lines = (corr as Array<Record<string, unknown>>).map((c) =>
            `"${c.title ?? ""}"${c.kind ? ` (${c.kind})` : ""}${Array.isArray(c.ai_tags) && c.ai_tags.length ? ` [${(c.ai_tags as string[]).join(", ")}]` : ""}: you filed it under ${c.from_module}, the user moved it to ${c.to_module}${c.note ? ` — "${c.note}"` : ""}`
          );
          correctionsText =
            `USER CORRECTIONS — the user has re-filed entries you classified. These are RULES, not suggestions.\n` +
            `Learn the pattern behind each correction and apply it to anything similar from now on. When a new capture resembles a corrected one, use the category the USER chose.\n${lines.join("\n")}\n\n`;
        }
      } catch (e) {
        console.error("corrections context failed", e);
      }
    }

    /* ---- training pulls the user's own history server-side ---- */

    let trainingMemories: Array<Record<string, unknown>> = [];
    let trainingCount = 0;
    if (mode === "train") {
      const db = await userClient(authHeader);
      const { data: rows, count } = await db
        .from("memories")
        .select("title,summary,module,kind,amount,currency,merchant,location,ai_tags,occurred_at,metadata", {
          count: "exact",
        })
        .is("deleted_at", null)
        .order("occurred_at", { ascending: false })
        .limit(150);
      trainingMemories = (rows ?? []) as Array<Record<string, unknown>>;
      trainingCount = count ?? trainingMemories.length;
    }

    let factsText = "";
    if (deep) {
      try {
        const db = await userClient(authHeader);
        const { data: factRows } = await db
          .from("facts")
          .select("name,label,value,unit,category,observed_at")
          .order("observed_at", { ascending: false })
          .limit(200);
        if (factRows?.length) {
          const grouped: Record<string, string[]> = {};
          for (const f of factRows as Array<Record<string, unknown>>) {
            const key = `${f.label ?? f.name}${f.unit ? ` (${f.unit})` : ""}`;
            (grouped[key] ||= []).push(`${f.value} on ${String(f.observed_at).slice(0, 10)}`);
          }
          const lines = Object.entries(grouped)
            .map(([k, v]) => `${k}: ${v.slice(0, 8).reverse().join(" -> ")}`)
            .slice(0, 40);
          factsText = `Tracked numbers over time (oldest -> newest per line). Use these for real comparisons and trends:\n${lines.join("\n")}\n\n`;
        }
      } catch (e) {
        console.error("facts context failed", e);
      }
    }

    let moneyText = "";
    if (deep) {
      try {
        const db = await userClient(authHeader);
        const { data: moneyRows } = await db
          .from("money_items")
          .select("type,label,amount,currency,cadence,next_due,category")
          .eq("active", true)
          .limit(60);
        if (moneyRows?.length) {
          const perMonth: Record<string, number> = { once: 0, weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };
          let income = 0;
          let out = 0;
          const lines = (moneyRows as Array<Record<string, unknown>>).map((m) => {
            const monthly = Number(m.amount ?? 0) * (perMonth[String(m.cadence)] ?? 0);
            if (m.type === "income") income += monthly; else out += monthly;
            return `${m.type}: ${m.label} — ${m.amount} ${m.currency} ${m.cadence}${m.next_due ? `, next due ${m.next_due}` : ""}`;
          });
          moneyText = `Financial model (real figures from the user's own captures):\n${lines.join("\n")}\nMonthly income ~${income.toFixed(0)}, monthly outgoings ~${out.toFixed(0)}, left over ~${(income - out).toFixed(0)}.\nUse these numbers for any money question; never invent figures.\n\n`;
        }
      } catch (e) {
        console.error("money context failed", e);
      }
    }

    const recallText = recalled.length
      ? `Most relevant entries from the user's ENTIRE history (semantic recall, ranked):\n${JSON.stringify(recalled).slice(0, 20000)}\n\n`
      : "";

    const entryList = trainingMemories.length ? trainingMemories : (memories ?? []);
    const context = entryList.length || recalled.length || factsText || moneyText || profileText
      ? `${profileText}${moneyText}${factsText}${recallText}Recent entries (JSON):\n${JSON.stringify(entryList).slice(0, 20000)}`
      : "No entries available yet.";


    const candidateText = candidates?.length
      ? `Existing entries (id + title):\n${JSON.stringify(candidates).slice(0, 12000)}`
      : "Existing entries: none.";

    const prefsText = preferences
      ? `User goals: ${(preferences.goals ?? []).join(", ") || "not set"}. Focus areas: ${(preferences.focus ?? []).join(", ") || "not set"}. Preferred tone: ${preferences.tone ?? "friendly"}.`
      : "";

    const userContent = mode === "classify"
      ? `${correctionsText}Raw capture:\n${input ?? ""}\n\n${candidateText}\n\nToday: ${new Date().toISOString().slice(0, 10)}`
      : mode === "search"
        ? `${context}\n\nQuestion: ${input ?? ""}`
        : mode === "train"
          ? `${context}\n\n${correctionsText}${prefsText}\n\nTotal entries in the logbook: ${trainingCount}.\n\nToday: ${new Date().toISOString().slice(0, 10)}\n\nRe-train your profile of this user now.`
          : `${context}\n\n${prefsText}\n\nToday: ${new Date().toISOString()}`;

    const chatMessages = mode === "chat"
      ? [
        {
          role: "system",
          content: `${prompts.chat}\n\n${correctionsText}${context}\n\n${candidateText}\n\n${prefsText}\n\nToday: ${new Date().toISOString()}`,
        },
        ...(history ?? []).slice(-10).map((m) => ({ role: m.role, content: m.content })),
        {
          role: "user",
          content: attachments?.length
            ? [
              { type: "text", text: input?.trim() || "What do you see in this? What should I do?" },
              ...attachments.map((a) => ({ type: "image_url", image_url: { url: a.url } })),
            ]
            : input ?? "",
        },
      ]
      : null;

    const messages = chatMessages ?? (mode === "extract"
      ? [
        { role: "system", content: prompts.extract },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${correctionsText}${input?.trim() ? `User note: ${input.trim()}\n\n` : ""}${candidateText}\n\nToday: ${new Date().toISOString().slice(0, 10)}\n\nExtract and classify this document.`,
            },
            { type: "image_url", image_url: { url: image ?? "" } },
          ],
        },
      ]
      : mode === "transcribe"
        ? [
          { role: "system", content: prompts.transcribe },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this audio." },
              {
                type: "input_audio",
                input_audio: {
                  data: (audio ?? "").replace(/^data:[^,]+,/, ""),
                  format: audioFormat ?? "webm",
                },
              },
            ],
          },
        ]
        : [
          { role: "system", content: prompts[mode] },
          { role: "user", content: userContent },
        ]);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached, please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up to continue." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error", response.status, text);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "";

    if (mode === "chat") {
      const text = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      let answer = text;
      let save: unknown = null;
      let question: unknown = null;
      try {
        const match = text.match(/\{[\s\S]*\}/);
        const obj = match ? JSON.parse(match[0]) : null;
        if (obj && typeof obj === "object" && "answer" in obj) {
          answer = String((obj as Record<string, unknown>).answer ?? "").trim();
          save = (obj as Record<string, unknown>).save ?? null;
          question = (obj as Record<string, unknown>).question ?? null;
        }
      } catch { /* fall back to plain text */ }
      return new Response(JSON.stringify({ answer, save, question }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "search") {
      return new Response(JSON.stringify({ answer: raw.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "transcribe") {
      return new Response(JSON.stringify({ text: raw.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed) {
      return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /* ---- persist the retrained profile so the assistant keeps evolving per user ---- */
    if (mode === "train") {
      const p = parsed as Record<string, unknown>;
      const arr = (v: unknown) => (Array.isArray(v) ? v.slice(0, 12) : []);
      const db = await userClient(authHeader);
      const { data: auth } = await db.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const row = {
        user_id: uid,
        portrait: p.portrait ? String(p.portrait).slice(0, 2000) : null,
        habits: arr(p.habits),
        routines: arr(p.routines),
        preferences: arr(p.preferences),
        patterns: arr(p.patterns),
        people: arr(p.people),
        watchlist: arr(p.watchlist),
        open_questions: arr(p.open_questions),
        confidence: ["high", "medium", "low"].includes(String(p.confidence)) ? String(p.confidence) : "low",
        data_points: trainingCount,
        version: Number(profileRow?.version ?? 0) + 1,
        trained_at: new Date().toISOString(),
      };
      const { data: saved, error: saveErr } = await db
        .from("assistant_profiles")
        .upsert(row, { onConflict: "user_id" })
        .select("*")
        .maybeSingle();
      if (saveErr) {
        console.error("profile save failed", saveErr);
        throw new Error(`Could not save assistant profile: ${saveErr.message}`);
      }
      return new Response(JSON.stringify({ profile: saved }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-brain error", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
