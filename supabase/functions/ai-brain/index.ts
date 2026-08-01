const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "google/gemini-3.6-flash";

interface Body {
  mode: "classify" | "coach" | "search" | "insights";
  input?: string;
  memories?: Array<Record<string, unknown>>;
}

const prompts: Record<Body["mode"], string> = {
  classify: `You are the classification engine of Smarty Logbook, an AI personal operating system.
Given a raw capture from the user, return STRICT JSON only, no markdown:
{"title":"short title max 60 chars","summary":"one sentence summary","module":"health|fitness|nutrition|finance|business|documents|personal","kind":"text|voice|photo|receipt|document|medical|workout|meal|expense|task|reminder|idea|journal|mood|location","ai_tags":["max 4 short lowercase tags"],"amount":number or null,"location":"string or null"}`,
  coach: `You are the Daily AI Coach of Smarty Logbook. Given the user's recent memories, return STRICT JSON only:
{"headline":"max 8 words","action":"one single most important action for today, max 25 words","reason":"why, max 20 words"}
Be warm, specific and never judgmental. Recommend exactly ONE action.`,
  search: `You are the memory search engine of Smarty Logbook. Answer the user's question using ONLY the provided memories.
Be concise and concrete: give numbers, dates and names when present. If nothing matches, say so plainly and suggest what to capture. Plain text, no markdown headers.`,
  insights: `You are the behaviour intelligence engine of Smarty Logbook. Analyse the memories and return STRICT JSON only:
{"patterns":[{"title":"short pattern","detail":"one sentence","confidence":"low|medium|high"}],"predictions":[{"title":"short prediction","detail":"one sentence"}],"score":{"value":0-100,"reason":"one short sentence"}}
Return at most 4 patterns and 3 predictions. If there is too little data, return fewer items and say so in the detail.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, input, memories }: Body = await req.json();
    if (!mode || !prompts[mode]) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const context = memories?.length
      ? `Memories (JSON):\n${JSON.stringify(memories).slice(0, 24000)}`
      : "No memories available yet.";

    const userContent = mode === "classify"
      ? `Raw capture:\n${input ?? ""}`
      : mode === "search"
        ? `${context}\n\nQuestion: ${input ?? ""}`
        : `${context}\n\nToday: ${new Date().toISOString()}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: prompts[mode] },
          { role: "user", content: userContent },
        ],
      }),
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

    if (mode === "search") {
      return new Response(JSON.stringify({ answer: raw.trim() }), {
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
