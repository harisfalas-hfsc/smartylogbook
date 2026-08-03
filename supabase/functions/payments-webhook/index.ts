import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

const iso = (unix?: number | null) => (unix ? new Date(unix * 1000).toISOString() : null);

/** Map Stripe statuses onto the app's own subscription states. */
const mapStatus = (stripeStatus: string): "active" | "canceled" | "expired" => {
  if (["active", "trialing", "past_due"].includes(stripeStatus)) return "active";
  if (stripeStatus === "canceled") return "canceled";
  return "expired";
};

async function syncSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("Subscription without userId metadata:", subscription.id);
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const status = mapStatus(subscription.status);
  const amount = (item?.price?.unit_amount ?? 0) / 100;

  const { error } = await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      plan: status === "active" ? "premium" : "free",
      plan_key: status === "active" ? "premium" : null,
      status,
      source: "paid",
      amount_eur: amount,
      price_id: priceId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id,
      current_period_start: iso(periodStart),
      current_period_end: iso(periodEnd),
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) console.error("subscriptions upsert failed:", error.message);
}

async function recordPayment(invoiceOrSession: any, env: StripeEnv, userId?: string) {
  if (!userId) return;
  const amount = (invoiceOrSession.amount_paid ?? invoiceOrSession.amount_total ?? 0) / 100;
  const { error } = await getSupabase().from("payments").insert({
    user_id: userId,
    amount_eur: amount,
    currency: (invoiceOrSession.currency ?? "eur").toUpperCase(),
    status: "succeeded",
    provider: "stripe",
    reference: invoiceOrSession.id,
    environment: env,
  });
  if (error) console.error("payments insert failed:", error.message);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  console.log("payments-webhook event:", event.type, env);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object, env);
      break;
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "unpaid") {
        await recordPayment(session, env, session.metadata?.userId);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await recordPayment(event.data.object, env, event.data.object.metadata?.userId);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Invalid env query parameter:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
