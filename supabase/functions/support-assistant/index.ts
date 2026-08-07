/**
 * First-line support by Smarty Assistant.
 *
 * When a customer sends their very first message on a support ticket, the
 * assistant answers straight away and the reply lands in the customer's
 * message center. Once the customer writes again, the assistant stays quiet
 * and a human takes over from the admin panel.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const SYSTEM = `You are Smarty Assistant, the first-line support agent for Smarty Logbook.

Smarty Logbook is a second brain: people capture anything by typing, speaking, photographing or uploading it, and the assistant files it into categories, links it and answers questions about it in plain words. There are no scores. Membership is Smarty Premium at 9.99 euro per month, which includes 300 assistant conversations each month; without it people can try one capture per category. Records can be moved between categories, reminders can be marked done or postponed, deleted records sit in Trash for 30 days, and everything can be exported from Settings, Account and data.

Answer the customer's support message yourself, warmly and directly, in plain language. Solve the problem if you can, with clear steps naming the real screens (Home, Timeline, Capture, Smarty Assistant, Insights, Categories, Calendar, Messages, Settings). If it needs a human, say so plainly and promise a follow-up. Never invent features, prices or refunds. No emoji, no slashes, no greetings longer than one short line. Maximum 140 words.

Reply with JSON only: {"reply":"..."}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const ticketId = String(body?.ticketId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(ticketId)) return json({ error: "Invalid ticket id" }, 400);

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: ticket } = await db
      .from("support_tickets")
      .select("id,user_id,name,email,subject,message,created_at")
      .eq("id", ticketId)
      .maybeSingle();
    if (!ticket) return json({ error: "Ticket not found" }, 404);

    // Only ever answer the first message on a ticket.
    const { data: existing } = await db
      .from("support_replies")
      .select("id")
      .eq("ticket_id", ticketId)
      .limit(1);
    if (existing && existing.length) return json({ skipped: "already answered" });

    const key = Deno.env.get("LOVABLE_API_KEY");
    let reply =
      "Thanks for writing in. I have logged your message and a human from Smarty Logbook will come back to you shortly with an answer.";

    if (key) {
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
            messages: [
              { role: "system", content: SYSTEM },
              {
                role: "user",
                content: JSON.stringify({
                  customer_name: ticket.name,
                  subject: ticket.subject,
                  message: ticket.message,
                }),
              },
            ],
            response_format: { type: "json_object" },
            max_tokens: 1200,
          }),
        });
        if (!res.ok) {
          console.error("support-assistant gateway error", res.status, await res.text());
        } else {
          const data = await res.json();
          const raw = String(data?.choices?.[0]?.message?.content ?? "");
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed?.reply) reply = String(parsed.reply).slice(0, 2000);
          }
        }
      } catch (e) {
        console.error("support-assistant model call failed", e);
      }
    }

    const { error: insErr } = await db
      .from("support_replies")
      .insert({ ticket_id: ticketId, author: "assistant", body: reply });
    if (insErr) return json({ error: insErr.message }, 400);

    await db
      .from("support_tickets")
      .update({ admin_reply: reply, replied_at: new Date().toISOString() })
      .eq("id", ticketId);

    if (ticket.user_id) {
      await db.from("messages").insert({
        user_id: ticket.user_id,
        kind: "assistant",
        title: `Support: ${ticket.subject}`.slice(0, 120),
        body: reply,
        level: "normal",
        related_at: new Date().toISOString(),
        action_label: "Open the conversation",
        action_url: `/app/support/${ticketId}`,
        dedupe_key: `support:${ticketId}:assistant`,
        metadata: { ticket_id: ticketId, author: "assistant" },
      });
    }

    return json({ ok: true, reply });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
