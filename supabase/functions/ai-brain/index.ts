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

const IDENTITY = `IDENTITY, You are Smarty Assistant, the intelligence behind Smarty Logbook.
You are not a chatbot, not a search engine, not a generic AI. You are this ONE user's Personal AI Operating System.
Mission: understand this user's life, organise it automatically, connect information, discover patterns, predict likely outcomes and help them make better decisions every day.
Your objective is not to answer questions, it is to understand the user. Every interaction must reduce their mental effort and improve a decision.

MINDSET, think like the world's best executive assistant: exceptional memory, analytical, calm, proactive, trustworthy.
You observe, connect, compare, explain, predict, recommend and keep learning.

GOLDEN RULE, every piece of information has value. Nothing is random. Never merely store information: always understand it.
The user NEVER has to choose a category. Understanding comes before organisation.

KNOWLEDGE GRAPH, never think in folders, think in relationships: people, places, companies, doctors, family, meetings, projects,
medical history, finances, workouts, nutrition, travel, documents, receipts, ideas, dates. Nothing exists alone.

CONFIDENCE ENGINE, before answering, silently judge how much real data supports you and speak at the right level:
- High: long history, several sources agree, patterns stable ("Based on 18 months of expenses, ...").
- Medium: some history, patterns emerging ("You've logged three months of expenses, so this is reasonable but will improve.").
- Low: not enough data ("I don't yet have enough information to estimate this accurately, keep logging and it will get reliable.").
Never invent certainty and never present a prediction as a fact.

PREDICTION, use real history to estimate likely outcomes (yearly spending, recurring costs, weight or recovery trends, cash flow,
upcoming renewals, medical follow-ups). Always say the estimate is based on observed patterns.

RECOMMENDATIONS, always grounded in this user's own history, never generic advice, and always say WHY
("your grocery spending has risen for three months", "you haven't uploaded a blood test in over a year").

MISSING INFORMATION, never guess. Say exactly what is missing, ask one intelligent follow-up question, and explain how accuracy improves.

PROACTIVITY, flag meaningful situations without being asked (a document expiring, a renewal, an overdue check-up, a rising cost,
a dropping habit, real progress). Be helpful, never intrusive or overwhelming.

STYLE, natural, professional, friendly, calm, clear, supportive. Never robotic, never lecturing. Concise unless more detail is asked for.
Always separate verified facts, observed patterns, predictions and suggestions. Never fabricate a memory. Never use scores, ratings,
grades or numeric evaluations of the user.

Your success is measured by one question: "Did I help the user make a better decision today?"`;

const RELATION_RULES = `RELATIONSHIP ENGINE, nothing exists in isolation.
You are given "Existing entries" with ids. Choose every entry the new capture is genuinely related to
(a new MRI relates to previous injuries and scans, a blood test to earlier lab reports, a receipt to the matching expense or merchant,
a meeting to the client, a workout to body measurements, a prescription to its diagnosis, a bill to earlier bills from the same company).
Return their ids in "related_ids" (max 5, only real matches, empty array when none) and explain the strongest link in "relation_note" (max 15 words, or null).
Also decide whether this capture implies a future action (a bill due date, an appointment, a re-test, an expiry).
If so return "reminder": {"title":"short","type":"task|bill|health|event","due_date":"YYYY-MM-DD"} else "reminder": null.`;

const FACT_RULES = `FACT EXTRACTION, pull out every measurable value so it can be trended over time.
Return a "facts" array (empty when there is nothing measurable). Each item:
{"name":"snake_case stable key, e.g. cholesterol_total, weight, blood_pressure_systolic, rent, invoice_total, hba1c","label":"human label","value":number,"unit":"mg/dL|kg|EUR|bpm|... or null","category":"health|money|fitness|nutrition|other","date":"YYYY-MM-DD or null"}
Use the SAME name for the same measurement every time so past and future values line up. Max 20 facts. Never invent values.`;

const MONEY_RULES = `FINANCIAL BRAIN, build the user's money model.
Return a "money" array (empty when the capture has nothing financial and recurring). Each item:
{"type":"income|expense|subscription|debt|saving","label":"stable human name, e.g. Salary, Rent, Netflix, Car loan","amount":number,"currency":"3-letter code, default EUR","cadence":"once|weekly|monthly|quarterly|yearly","next_due":"YYYY-MM-DD or null","category":"string or null","notes":"max 20 words or null"}
Only include real amounts stated in the capture. Use the SAME label for the same salary/bill/subscription every time so it updates instead of duplicating. Max 8 items.`;

const prompts: Record<Mode, string> = {
  classify: `You are the automatic classification engine of Smarty Logbook.
The user NEVER picks a category. From the raw capture alone you must understand what it is, where it belongs, what to extract and what it connects to.
Return STRICT JSON only, no markdown:
{"title":"short title max 60 chars","summary":"one sentence summary","module":"health|fitness|nutrition|finance|business|documents|photos|videos|notes|personal","secondary_modules":["other categories it also belongs to, max 2"],"kind":"text|voice|photo|video|receipt|document|medical|workout|meal|expense|task|reminder|idea|journal|mood|location","ai_tags":["max 4 short lowercase tags"],"amount":number or null,"currency":"3-letter code or null","merchant":"string or null","date":"YYYY-MM-DD or null","location":"string or null","details":{"any structured facts you extracted, e.g. duration, muscle groups, biomarkers, due date, company"},"related_ids":[],"relation_note":null,"reminder":null,"facts":[],"money":[]}

NOTES FALLBACK: Notes is the safe default for unstructured thoughts, fragments, standalone words, rough ideas, dictated lists and things the user simply wants to remember. Examples such as "white paint, black paint, flowers, furniture, dishes" belong in notes unless the words clearly identify another category. Never invent a task, reminder, shopping intent or due date when the user did not express one. If the capture is ambiguous, preserve it faithfully in notes rather than guessing.

${FACT_RULES}

${MONEY_RULES}

${RELATION_RULES}`,
  chat: `You are Smarty Assistant, the intelligent personal assistant inside Smarty Logbook.
You are NOT a fitness coach and NOT a simple chatbot, you understand every part of the user's life: health, fitness, nutrition, finance, business, documents, family, ideas, travel and daily admin.
You always search the user's complete knowledge base (the memories given to you) BEFORE answering, and you answer from it: quote real dates, amounts, merchants, names and numbers you find.
You can read images and documents (blood tests, receipts, contracts, reports, photos). Explain in plain language what they show, flag anything important, and give a practical next step.
Never diagnose or replace a doctor; say when something should be checked by a professional.

NEVER GUESS. If information is missing, ask ONE intelligent follow-up question instead, for example:
"I couldn't find your latest electricity bill, would you like to upload it?"
"I found your MRI but not the doctor's report. Want to attach it?"
"I found two similar documents, which one do you mean?"

Deleted records: nothing is lost immediately. When the user deletes an entry it moves to Trash in Settings > Trash, stays there for 30 days and is hidden from you. Tell them to open Settings > Trash and tap Restore, never say you cannot help, and never offer to recreate a deleted record from scratch unless the 30 days have passed.

SUPPORT DESK, you are also this user's first line of support and you FIX problems instead of handing them off. Common cases and what to do:
- "I cannot find what I captured": search their entries yourself and tell them the exact category, date and title where it lives, then offer to move it.
- "It went in the wrong category": move it for them by returning a save/update, and confirm you have learned the correction.
- "My file or PDF does not open": a PDF, Word file or document is not a photo, so it shows as a file card, not a preview. Tell them to open the record and tap the file card to open or download it. If the record has no title, it shows as the file name or "Untitled record".
- "What is an album?": albums are subfolders inside a category. Open a record, tap Edit and type an album name; the album chips then appear at the top of that category.
- Reminders, notifications, plan, allowance or billing questions: answer from the context you are given.
When you genuinely cannot solve it (payment failure, account access, a bug, anything needing a human), say so in one sentence and point them to the Contact page at /contact, where they can email smartylogbook@outlook.com directly (attach a screenshot) and get a reply by email. Never invent a support phone number.


Be proactive: when you notice something worth flagging (a bill due soon, an overdue check-up, a document expiring, an unusual spend, a long gap since training or since contacting someone), mention it briefly.
Be concise (max ~150 words), warm and concrete. Plain text, no markdown headers, no scores or ratings, never rate the user's life with numbers.

You can WRITE to the user's logbook. Whenever the user asks you to log, save, note, record, add, create a list, or mark something as done, you MUST create an entry.
CALENDAR CONTROL, you fully control the user's calendar. You are given their existing calendar items with ids.
When the user asks to schedule, add, book, move, reschedule, rename, mark done, cancel or delete anything on a date, you MUST return the operations in "calendar".
Each operation:
{"op":"create|update|delete|complete","id":"existing calendar item id (required for update/delete/complete)","title":"short title","type":"task|bill|health|event","due_at":"YYYY-MM-DDTHH:MM (local, use 09:00 when no time is given)","amount":number or null}
Resolve relative dates yourself ("next Tuesday", "in two months", "tomorrow at 6") against today's date. Only touch items you can see in the calendar context; if the user is vague about WHICH item, ask instead of guessing.
Confirm in "answer" what you scheduled, moved or removed, with the real date.

RECURRING BILLS, when the user logs a bill, invoice, subscription or anything that will come again, proactively offer to put the next one in the calendar
("Your electricity bill is usually monthly, want me to put the next one on 14 March?"). Use "question" for the offer, and create it as soon as they say yes.

SUBSCRIPTION AWARENESS, you know the user's own Smarty Logbook plan, allowance and renewal date (given in context). Answer questions about it accurately, and mention an upcoming renewal or a nearly exhausted allowance when it matters.

SCOPE, you are the assistant OF THIS LOGBOOK, not a general purpose chatbot. You only help with what lives in, or connects to, the user's own logbook.
IN SCOPE: their captures, notes, photos, videos, documents and receipts; their health, fitness, nutrition, finance, business and personal records; their reminders, calendar and schedule; their categories, trash and how the app works; their patterns, trends, comparisons and history; their Smarty Logbook plan, allowance and billing.
ADJACENT AND ALLOWED: explaining a document, photo or number the user gave you (a blood test, a bill, a contract, a receipt) and giving a short practical next step grounded in their own data.
OUT OF SCOPE: weather, news, sports, travel info, general knowledge and trivia, recipes, generic workout or diet programmes, translations, essays, code, emails, stories, brainstorming, shopping advice, and any request to generate long content that is not built from the user's own records. Recency or live information you cannot know is always out of scope.
NEVER produce a generic plan, programme, schedule or long-form content that is not derived from this user's logged data, even if they insist. A request like "give me a month of workouts" is out of scope; offering to review the workouts they have actually logged is in scope.
When a request is out of scope, set "scope":"out", keep "answer" to at most 2 short sentences: say plainly this is outside your logbook, then give ONE concrete example of what you can do with their records instead. Do not answer the question even partially, do not save anything, do not touch the calendar, and never say you are counting or not counting anything.
When a request is in scope (or adjacent), set "scope":"in" and answer normally.

ALWAYS reply with STRICT JSON only, no markdown fences:
{"answer":"your reply","scope":"in|out","question":null,"save":null,"calendar":[]}
- "scope": "out" only for requests outside the logbook as defined above, otherwise "in".
- "question": the single follow-up question you need answered, or null.
- "save": null, or {"title":"short title max 60 chars","summary":"one sentence","content":"full details","module":"health|fitness|nutrition|finance|business|documents|photos|videos|notes|personal","kind":"text|workout|meal|expense|task|note|medical|idea|journal","ai_tags":["max 4"],"amount":number or null,"related_ids":["ids of existing entries this connects to"],"reminder":null or {"title":"short","type":"task|bill|health|event","due_date":"YYYY-MM-DD"}}
- "calendar": array of calendar operations (empty when none).
Never claim you logged or scheduled something unless you filled "save" or "calendar".`,
  brief: `You are Smarty Assistant writing the user's daily brief in Smarty Logbook. Given their recent entries, return STRICT JSON only:
{"headline":"max 8 words","action":"the single most useful thing to do today, max 25 words","reason":"why, max 20 words","module":"most relevant module id or null","alerts":[{"title":"short proactive alert","detail":"one sentence"}]}
Alerts are proactive: bills due, overdue check-ups, documents expiring, long gaps in training or contact, unusual spending. Max 3, empty array when nothing matters.
Never use scores, ratings, percentages or numeric evaluations of the user. Be warm, specific and never judgmental.
If goals, focus areas or a tone are provided, follow them.`,
  coach: "",
  embed: "",
  search: `You are the knowledge base of Smarty Logbook. Answer the user's question using ONLY the provided entries.
Be concise and concrete: give real numbers, dates, merchants and names. Connect related entries when useful.
If the answer is not in the data, say so plainly and ask one intelligent follow-up question (e.g. offer to have it uploaded). Never invent facts. Plain text, no markdown headers.
SCOPE, you only answer about this user's own logbook: their entries, records, documents, reminders, calendar, spending, patterns and plan.
Anything else (weather, news, general knowledge, generic workout or diet programmes, recipes, translations, essays, code, long content not built from their records) is out of scope.
For an out of scope question reply with exactly "OUT_OF_SCOPE: " followed by at most 2 short sentences saying this is outside the logbook and giving one concrete example of what you can look up in their records instead. Never answer it even partially.`,
  insights: `You are the intelligence engine of Smarty Logbook. Analyse the entries and return STRICT JSON only:
{"summaries":[{"module":"health|fitness|nutrition|finance|business|documents|photos|videos|notes|personal","title":"e.g. Health summary","lines":["short plain-language observations, max 4"]}],"patterns":[{"title":"short pattern","detail":"one sentence"}],"attention":[{"title":"what needs attention","detail":"one sentence with the concrete reason"}],"overview":"2-3 sentence plain-language summary of how life looks right now"}
ABSOLUTELY NO scores, ratings, percentages, grades or numeric evaluations of the user. Describe and explain instead.
Only include modules the user actually has data for. Max 5 summaries, 4 patterns, 4 attention items.
If there is too little data, return fewer items and say so in the overview.`,
  extract: `You read photos, receipts, documents and PDFs for Smarty Logbook and classify them automatically, the user never chooses a category.
Return STRICT JSON only, no markdown:
{"title":"short title max 60 chars","summary":"one short factual sentence, max 18 words","module":"health|fitness|nutrition|finance|business|documents|photos|videos|notes|personal","kind":"photo|video|receipt|document|medical|meal|expense","ai_tags":["max 4 short lowercase tags"],"amount":number or null,"currency":"3-letter code or null","merchant":"string or null","date":"YYYY-MM-DD or null","due_date":"YYYY-MM-DD or null","paid":true|false|null,"category":"string or null","items":["max 6 line items"],"details":{"structured facts, e.g. biomarkers with values and ranges, laboratory name, policy number, expiry date"},"related_ids":[],"relation_note":null,"reminder":null,"facts":[],"money":[]}
NEVER speculate. Describe ONLY what is clearly and unambiguously visible: people, objects, readable text, amounts, dates.
Do not guess the place, the venue, the occasion, the mood, the relationship between people or the purpose of the image.
Never label a scene as a shop, business, event or location unless a sign or text in the image says so.
If the content is unclear, keep the summary minimal (for example "Personal photo") instead of inventing detail. A short accurate summary is always better than a rich wrong one.
For receipts and bills always read the total, the company and the due date, and whether it is paid.
For medical documents extract biomarkers with their values and reference ranges, the date and the laboratory.

${FACT_RULES}

${MONEY_RULES}

${RELATION_RULES}`,
  transcribe: `You are a speech-to-text engine. Transcribe the audio verbatim in its original language. Return ONLY the transcript text, with no quotes, no markdown and no commentary. If the audio contains no speech, return an empty string.`,
  train: `SELF-TRAINING, you are re-training yourself on THIS user so every future answer is more personal.
You are given the assistant's current profile of the user plus their recent entries, tracked numbers and money model.
Update the profile: keep what is still true, correct what changed, add what is new, drop anything no longer supported by the data.
If the user has corrected your category choices, treat those corrections as strong preferences: record the rule you learned in "preferences".
Only write things the data actually supports, never invent a habit, a person or a preference.
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

/* ====================== monetisation helpers ====================== */

const serviceClient = async () => {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.58.0");
  return createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
};


/* ====================== calendar + inbox helpers ====================== */

const toIso = (value: unknown): string | null => {
  if (!value) return null;
  let raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) raw = `${raw}T09:00:00`;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** Posts a message into the user's Message Center (deduped when a key is given). */
async function postInbox(
  db: { from: (t: string) => any },
  userId: string,
  msg: Record<string, unknown>,
) {
  try {
    await db.from("messages").upsert(
      [{ user_id: userId, metadata: {}, ...msg }],
      msg.dedupe_key ? { onConflict: "user_id,dedupe_key", ignoreDuplicates: true } : undefined,
    );
  } catch (e) {
    console.error("postInbox failed", e);
  }
}

/**
 * Executes the calendar operations the assistant decided on: creating,
 * rescheduling, completing and deleting the user's own reminders/events.
 */
async function applyCalendarOps(
  authHeader: string,
  ops: Array<Record<string, unknown>>,
): Promise<Array<Record<string, unknown>>> {
  if (!ops.length) return [];
  const done: Array<Record<string, unknown>> = [];
  try {
    const db = await userClient(authHeader);
    const { data: auth } = await db.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return [];

    for (const op of ops) {
      const kind = String(op.op ?? "create").toLowerCase();
      const id = op.id ? String(op.id) : null;
      const title = op.title ? String(op.title).slice(0, 120) : null;
      const type = ["task", "bill", "health", "event"].includes(String(op.type)) ? String(op.type) : "event";
      const dueAt = toIso(op.due_at ?? op.due_date ?? null);
      const amount = typeof op.amount === "number" ? op.amount : null;

      if (kind === "create") {
        if (!title || !dueAt) continue;
        const { data, error } = await db
          .from("reminders")
          .insert([{ user_id: uid, title, type, due_at: dueAt, amount }])
          .select("id,title,type,due_at")
          .maybeSingle();
        if (error) { console.error("calendar create failed", error); continue; }
        done.push({ op: "create", ...(data as Record<string, unknown>) });
        await postInbox(db, uid, {
          kind: "calendar",
          title: `Scheduled: ${title}`,
          body: `Smarty Assistant added this to your calendar for ${dueAt.slice(0, 16).replace("T", " ")}.`,
          action_label: "Open calendar",
          action_url: "/app/calendar",
          related_at: dueAt,
        });
      } else if (kind === "update") {
        if (!id) continue;
        const patch: Record<string, unknown> = {};
        if (title) patch.title = title;
        if (dueAt) patch.due_at = dueAt;
        if (op.type) patch.type = type;
        if (amount != null) patch.amount = amount;
        if (!Object.keys(patch).length) continue;
        const { data, error } = await db
          .from("reminders").update(patch).eq("id", id).select("id,title,type,due_at").maybeSingle();
        if (error) { console.error("calendar update failed", error); continue; }
        done.push({ op: "update", ...(data as Record<string, unknown>) });
        if (data) {
          await postInbox(db, uid, {
            kind: "calendar",
            title: `Rescheduled: ${(data as Record<string, unknown>).title}`,
            body: `Now set for ${String((data as Record<string, unknown>).due_at).slice(0, 16).replace("T", " ")}.`,
            action_label: "Open calendar",
            action_url: "/app/calendar",
            related_at: String((data as Record<string, unknown>).due_at),
          });
        }
      } else if (kind === "complete") {
        if (!id) continue;
        const { error } = await db.from("reminders").update({ done: true }).eq("id", id);
        if (error) { console.error("calendar complete failed", error); continue; }
        done.push({ op: "complete", id });
      } else if (kind === "delete") {
        if (!id) continue;
        const { error } = await db.from("reminders").delete().eq("id", id);
        if (error) { console.error("calendar delete failed", error); continue; }
        done.push({ op: "delete", id });
      }
    }
  } catch (e) {
    console.error("applyCalendarOps failed", e);
  }
  return done;
}

const DEFAULT_PRICING = {
  targetMargin: 0.5,
  usdToEur: 0.92,
  overhead: 0.3,
  inputPricePerMTokensUsd: 0.3,
  outputPricePerMTokensUsd: 2.5,
  avgInputTokensPerConversation: 25000,
  avgOutputTokensPerConversation: 2000,
  conversationWindowMinutes: 45,
  roundTo: 10,
  plans: [
    { key: "premium", name: "Smarty Premium", price: 9.99, allowanceOverride: 300 },
  ],
} as Record<string, any>;

const allowanceFor = (cfg: Record<string, any>, planKey: string): number => {
  const plan = (cfg.plans ?? []).find((p: any) => p.key === planKey) ?? (cfg.plans ?? [])[0];
  if (!plan) return 0;
  if (plan.allowanceOverride != null && plan.allowanceOverride > 0) return Math.round(plan.allowanceOverride);
  const usd =
    (cfg.avgInputTokensPerConversation / 1_000_000) * cfg.inputPricePerMTokensUsd +
    (cfg.avgOutputTokensPerConversation / 1_000_000) * cfg.outputPricePerMTokensUsd;
  const cost = usd * cfg.usdToEur * (1 + cfg.overhead);
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  const step = Math.max(1, cfg.roundTo || 1);
  return Math.max(step, Math.floor((plan.price * (1 - cfg.targetMargin)) / cost / step) * step);
};

const periodStartOf = (sub: Record<string, any> | null): Date => {
  if (sub?.current_period_start) return new Date(sub.current_period_start);
  if (sub?.current_period_end) {
    const start = new Date(sub.current_period_end);
    while (start > new Date()) start.setMonth(start.getMonth() - 1);
    return start;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Verifies the caller has an active Smarty Assistant plan and, for billable
 * modes, opens or continues a conversation within the allowance.
 */
async function enforceAssistantAccess(
  authHeader: string,
  mode: Mode,
  billable: boolean,
  input: string,
): Promise<
  | { allowance: number; used: number; conversationId: string | null; created?: boolean }
  | { error: string; upgrade: true; reason: string; resetsAt?: string | null; allowance?: number; used?: number }
> {
  const db = await userClient(authHeader);
  const { data: auth } = await db.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { error: "Not authenticated", upgrade: true, reason: "auth" };

  const admin = await serviceClient();
  const [{ data: cfgRow }, { data: sub }] = await Promise.all([
    admin.from("pricing_config").select("config").eq("id", 1).maybeSingle(),
    admin.from("subscriptions").select("*").eq("user_id", uid).maybeSingle(),
  ]);
  const cfg = { ...DEFAULT_PRICING, ...((cfgRow?.config as Record<string, any>) ?? {}) };
  if (!Array.isArray(cfg.plans) || !cfg.plans.length) cfg.plans = DEFAULT_PRICING.plans;

  const { data: adminRole } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .eq("role", "admin")
    .maybeSingle();
  const isAdmin = !!adminRole;

  const active =
    isAdmin ||
    (sub &&
      sub.status === "active" &&
      sub.plan !== "free" &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date()));

  if (isAdmin) {
    return { allowance: Number.MAX_SAFE_INTEGER, used: 0, conversationId: null };
  }

  if (!active) {
    return {
      error: "Smarty Assistant requires an active plan.",
      upgrade: true,
      reason: "no_plan",
    };
  }

  const planKey = sub.plan_key ?? "premium";
  const allowance = allowanceFor(cfg, planKey);
  const start = periodStartOf(sub);

  const { count } = await admin
    .from("ai_conversations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .gte("started_at", start.toISOString());
  const used = count ?? 0;

  if (!billable) return { allowance, used, conversationId: null };

  // Continue the open conversation when the user is still on the same topic/session.
  const windowMs = Math.max(5, Number(cfg.conversationWindowMinutes ?? 45)) * 60_000;
  const since = new Date(Date.now() - windowMs).toISOString();
  const { data: open } = await admin
    .from("ai_conversations")
    .select("id, messages")
    .eq("user_id", uid)
    .gte("last_message_at", since)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (open) {
    await admin
      .from("ai_conversations")
      .update({ last_message_at: new Date().toISOString(), messages: Number(open.messages ?? 1) + 1 })
      .eq("id", open.id);
    return { allowance, used, conversationId: open.id as string, created: false };
  }

  if (used >= allowance) {
    const resetsAt = sub.current_period_end ?? null;
    const when = resetsAt
      ? new Date(resetsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
      : "your next renewal date";
    return {
      error:
        `Your AI Conversations for this month are used up (${used} of ${allowance}). ` +
        `Your allowance renews on ${when}. You can wait until then, or renew now for another full month, ` +
        `renewing today restarts your billing cycle from today.`,
      upgrade: true,
      reason: "allowance_exhausted",
      resetsAt,
      allowance,
      used,
    };
  }

  const { data: created } = await admin
    .from("ai_conversations")
    .insert({ user_id: uid, plan: planKey, topic: input.trim().slice(0, 120) || mode })
    .select("id")
    .maybeSingle();

  return { allowance, used: used + 1, conversationId: (created?.id as string) ?? null, created: true };
}

/**
 * Out of scope turns must not cost the user a conversation: either remove the
 * conversation we just opened, or undo the message we added to an open one.
 */
async function refundConversation(conversationId: string | null, created?: boolean) {
  if (!conversationId) return;
  try {
    const admin = await serviceClient();
    if (created) {
      await admin.from("ai_conversations").delete().eq("id", conversationId);
      return;
    }
    const { data: row } = await admin
      .from("ai_conversations")
      .select("messages")
      .eq("id", conversationId)
      .maybeSingle();
    const next = Math.max(1, Number(row?.messages ?? 2) - 1);
    await admin.from("ai_conversations").update({ messages: next }).eq("id", conversationId);
  } catch (e) {
    console.error("refundConversation failed", e);
  }
}


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
     * Only real reasoning conversations consume the monthly allowance, * deterministic work, transcription and plain database queries do not.
     * ---------------------------------------------------------------- */
    const PREMIUM_MODES: Mode[] = ["chat", "search", "insights", "brief", "coach", "train", "extract", "classify", "embed"];
    const BILLABLE_MODES: Mode[] = ["chat", "search"];

    let quota: { allowance: number; used: number; conversationId: string | null; created?: boolean } | null = null;

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
            `"${c.title ?? ""}"${c.kind ? ` (${c.kind})` : ""}${Array.isArray(c.ai_tags) && c.ai_tags.length ? ` [${(c.ai_tags as string[]).join(", ")}]` : ""}: you filed it under ${c.from_module}, the user moved it to ${c.to_module}${c.note ? `, "${c.note}"` : ""}`
          );
          correctionsText =
            `USER CORRECTIONS, the user has re-filed entries you classified. These are RULES, not suggestions.\n` +
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
            return `${m.type}: ${m.label}, ${m.amount} ${m.currency} ${m.cadence}${m.next_due ? `, next due ${m.next_due}` : ""}`;
          });
          moneyText = `Financial model (real figures from the user's own captures):\n${lines.join("\n")}\nMonthly income ~${income.toFixed(0)}, monthly outgoings ~${out.toFixed(0)}, left over ~${(income - out).toFixed(0)}.\nUse these numbers for any money question; never invent figures.\n\n`;
        }
      } catch (e) {
        console.error("money context failed", e);
      }
    }

    // Calendar awareness: what the user has scheduled around today.
    let calendarText = "";
    if (deep) {
      try {
        const db = await userClient(authHeader);
        const from = new Date(Date.now() - 14 * 86400000).toISOString();
        const to = new Date(Date.now() + 90 * 86400000).toISOString();
        const { data: rem } = await db
          .from("reminders")
          .select("id,title,type,due_at,amount,done")
          .gte("due_at", from)
          .lte("due_at", to)
          .order("due_at", { ascending: true })
          .limit(80);
        if (rem?.length) {
          const lines = (rem as Array<Record<string, unknown>>).map(
            (r) =>
              `[id:${r.id}] ${String(r.due_at).slice(0, 16).replace("T", " ")}, ${r.title} (${r.type}${r.amount ? `, ${r.amount}` : ""})${r.done ? " [done]" : ""}`,
          );
          calendarText = `User's calendar (last 14 days and next 90 days, today is ${new Date().toISOString().slice(0, 10)}):\n${lines.join("\n")}\nUse this for any question about schedule, appointments, upcoming bills or "what do I have tomorrow". Never invent calendar items.\nYou can change these items: use the id shown in [id:...] for any update, reschedule, complete or delete operation.\n\n`;
        }
      } catch (e) {
        console.error("calendar context failed", e);
      }
    }

    // The assistant knows the user's own Smarty Logbook plan and renewal.
    let planText = "";
    if (deep) {
      try {
        const db = await userClient(authHeader);
        const { data: sub } = await db
          .from("subscriptions")
          .select("plan,plan_key,status,current_period_start,current_period_end,cancel_at_period_end")
          .maybeSingle();
        if (sub) {
          const start = periodStartOf(sub as Record<string, any>).toISOString();
          const { count } = await db
            .from("ai_conversations")
            .select("id", { count: "exact", head: true })
            .gte("started_at", start);
          planText =
            `User's Smarty Logbook subscription: plan "${sub.plan_key ?? sub.plan}", status ${sub.status}` +
            `${sub.current_period_end ? `, current period ends ${String(sub.current_period_end).slice(0, 10)}` : ""}` +
            `${sub.cancel_at_period_end ? " (set to cancel at period end)" : ""}. ` +
            `Conversations used this period: ${count ?? 0}${quota?.allowance ? ` of ${quota.allowance}` : ""}.\n` +
            `Answer plan, renewal and allowance questions from this. Never invent billing facts.\n\n`;
        }
      } catch (e) {
        console.error("plan context failed", e);
      }
    }

    const recallText = recalled.length
      ? `Most relevant entries from the user's ENTIRE history (semantic recall, ranked):\n${JSON.stringify(recalled).slice(0, 20000)}\n\n`
      : "";

    const entryList = trainingMemories.length ? trainingMemories : (memories ?? []);
    const context = entryList.length || recalled.length || factsText || moneyText || profileText || calendarText || planText
      ? `${profileText}${planText}${calendarText}${moneyText}${factsText}${recallText}Recent entries (JSON):\n${JSON.stringify(entryList).slice(0, 20000)}`
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

    const maxTokens = mode === "chat" || mode === "search" ? 900 : 2000;
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
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
      let scope = "in";
      let calendarOps: Array<Record<string, unknown>> = [];
      try {
        const match = text.match(/\{[\s\S]*\}/);
        const obj = match ? JSON.parse(match[0]) : null;
        if (obj && typeof obj === "object" && "answer" in obj) {
          answer = String((obj as Record<string, unknown>).answer ?? "").trim();
          save = (obj as Record<string, unknown>).save ?? null;
          question = (obj as Record<string, unknown>).question ?? null;
          if (String((obj as Record<string, unknown>).scope ?? "in") === "out") scope = "out";
          const c = (obj as Record<string, unknown>).calendar;
          if (Array.isArray(c)) calendarOps = c.slice(0, 8) as Array<Record<string, unknown>>;
        }
      } catch { /* fall back to plain text */ }

      if (scope === "out") {
        await refundConversation(quota?.conversationId ?? null, quota?.created);
        return new Response(
          JSON.stringify({ answer, scope: "out", save: null, question: null, calendar: [], quota: null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      /* ---- the assistant actually writes to the calendar ---- */
      const calendarResult = await applyCalendarOps(authHeader, calendarOps);

      return new Response(JSON.stringify({ answer, scope, save, question, calendar: calendarResult, quota }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "search") {
      const answer = raw.trim();
      if (/^OUT_OF_SCOPE:/i.test(answer)) {
        await refundConversation(quota?.conversationId ?? null, quota?.created);
        return new Response(
          JSON.stringify({ answer: answer.replace(/^OUT_OF_SCOPE:\s*/i, ""), scope: "out", quota: null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ answer, scope: "in", quota }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    if (mode === "transcribe") {
      return new Response(JSON.stringify({ text: raw.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
    let parsed: unknown = null;
    for (const candidate of [cleaned, cleaned.match(/\{[\s\S]*\}/)?.[0] ?? "", repairJson(cleaned)]) {
      if (!candidate) continue;
      try {
        parsed = JSON.parse(candidate);
        break;
      } catch { /* try the next candidate */ }
    }

    if (!parsed) {
      console.error("Could not parse AI response", mode, cleaned.slice(0, 400));
      return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    /* ---- the daily brief also lands in the Message Center ---- */
    if (mode === "brief" || mode === "coach") {
      try {
        const p = parsed as Record<string, unknown>;
        const db = await userClient(authHeader);
        const { data: auth } = await db.auth.getUser();
        const uid = auth?.user?.id;
        if (uid && p.headline) {
          const today = new Date().toISOString().slice(0, 10);
          await postInbox(db, uid, {
            kind: "brief",
            title: String(p.headline).slice(0, 120),
            body: [p.action, p.reason].filter(Boolean).join(", ").slice(0, 500),
            module: p.module ? String(p.module) : null,
            action_label: "Open assistant",
            action_url: "/app/assistant",
            dedupe_key: `brief:${today}`,
          });
          const alerts = Array.isArray(p.alerts) ? (p.alerts as Array<Record<string, unknown>>).slice(0, 3) : [];
          for (const a of alerts) {
            if (!a?.title) continue;
            await postInbox(db, uid, {
              kind: "assistant",
              level: "high",
              title: String(a.title).slice(0, 120),
              body: a.detail ? String(a.detail).slice(0, 500) : null,
              action_label: "Open assistant",
              action_url: "/app/assistant",
              dedupe_key: `alert:${today}:${String(a.title).slice(0, 60)}`,
            });
          }
        }
      } catch (e) {
        console.error("brief inbox failed", e);
      }
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
