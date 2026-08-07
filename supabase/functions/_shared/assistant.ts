/**
 * Smarty Assistant decision layer.
 *
 * Every alert, message and notification the app produces passes through here.
 * The rule engines only gather *candidates* from live data; the Assistant
 * decides which ones are worth interrupting the user for and writes the copy
 * in its own voice. If the model is unavailable the candidates pass through
 * unchanged, so notifications never silently disappear.
 */

export type AssistantCandidate = {
  /** stable id used to match the model's decision back to the candidate */
  ref: string;
  kind: string;
  title: string;
  body: string;
  level: string;
  /** compact live facts the Assistant should reason over */
  facts?: Record<string, unknown>;
};

export type AssistantDecision = {
  ref: string;
  keep: boolean;
  title: string;
  body: string;
  level: string;
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM = `You are Smarty Assistant, the single intelligence behind Smarty Logbook.
You own every notification, message and alert the user receives. Nothing reaches
them unless you decide it is genuinely useful right now.

For each candidate you receive live facts from the user's logbook. Decide:
- keep: false when the item is stale, duplicated, trivial, or refers to something
  that no longer exists or is already done. Be strict: silence beats noise.
- keep: true when the user would regret not seeing it today.

When you keep an item, rewrite title and body in your voice: plain language,
warm, specific, no jargon, no scores, no slashes, no emoji. Title max 60 chars,
body max 220 chars, one or two sentences. Never invent facts that are not in the
candidate. Set level to "high" only for money, health or something overdue.

Reply with JSON only: {"decisions":[{"ref":"...","keep":true,"title":"...","body":"...","level":"normal"}]}`;

const clip = (s: unknown, n: number) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export async function assistantDecide(
  candidates: AssistantCandidate[],
  context: string,
): Promise<AssistantCandidate[]> {
  if (!candidates.length) return candidates;
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return candidates;

  try {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Context: ${context}\nCandidates JSON:\n${JSON.stringify(candidates).slice(0, 24000)}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("assistantDecide gateway error", res.status, await res.text());
      return candidates;
    }

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(String(raw).replace(/^```(?:json)?|```$/g, "").trim());
    const decisions: AssistantDecision[] = Array.isArray(parsed?.decisions) ? parsed.decisions : [];
    if (!decisions.length) return candidates;

    const byRef = new Map(decisions.map((d) => [String(d.ref), d]));
    return candidates.flatMap((c) => {
      const d = byRef.get(c.ref);
      if (!d) return [c];
      if (d.keep === false) return [];
      return [{
        ...c,
        title: clip(d.title, 80) || c.title,
        body: clip(d.body, 300) || c.body,
        level: d.level === "high" ? "high" : d.level === "low" ? "low" : "normal",
      }];
    });
  } catch (e) {
    console.error("assistantDecide failed", e);
    return candidates;
  }
}
