// deno-lint-ignore-file no-explicit-any
/**
 * Billing notifications for the member's message centre: renewal reminders
 * (3 days / 1 day before an automatic renewal), payment thank-you notes and
 * calm, actionable failed-payment notices.
 */

const DAY_MS = 86_400_000;

export const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
};

export const euro = (cents?: number | null, currency?: string | null): string => {
  const amount = (cents ?? 0) / 100;
  const code = (currency ?? "eur").toUpperCase();
  try {
    return new Intl.NumberFormat("en-IE", { style: "currency", currency: code }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
};

/** Inserts one message, ignoring duplicates via (user_id, dedupe_key). */
export async function notifyOnce(
  db: any,
  row: {
    userId: string;
    title: string;
    body: string;
    dedupeKey: string;
    level?: string;
    actionLabel?: string;
    actionUrl?: string;
  },
): Promise<boolean> {
  const { data, error } = await db
    .from("messages")
    .upsert(
      {
        user_id: row.userId,
        kind: "billing",
        title: row.title,
        body: row.body,
        level: row.level ?? "normal",
        action_label: row.actionLabel ?? "Open my membership",
        action_url: row.actionUrl ?? "/app/plan",
        related_at: new Date().toISOString(),
        dedupe_key: row.dedupeKey,
      },
      { onConflict: "user_id,dedupe_key", ignoreDuplicates: true },
    )
    .select("id");
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

/**
 * "Renews in 3 days" and "renews tomorrow" notices for memberships set to
 * auto-renew. Idempotent per subscription period.
 */
export async function runRenewalReminders(db: any): Promise<number> {
  const now = Date.now();
  const horizon = new Date(now + 3 * DAY_MS + 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("subscriptions")
    .select("user_id,current_period_end,status,cancel_at_period_end,source")
    .eq("status", "active")
    .eq("cancel_at_period_end", false)
    .eq("source", "paid")
    .not("current_period_end", "is", null)
    .lte("current_period_end", horizon)
    .gte("current_period_end", new Date(now).toISOString())
    .limit(2000);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{ user_id: string; current_period_end: string }>;
  let sent = 0;

  for (const row of rows) {
    const end = new Date(row.current_period_end).getTime();
    if (Number.isNaN(end)) continue;
    const msLeft = end - now;
    const when = formatDate(row.current_period_end);

    if (msLeft <= DAY_MS) {
      const created = await notifyOnce(db, {
        userId: row.user_id,
        title: "Your membership renews tomorrow",
        body:
          `Your Smarty Premium membership (€9.99/month) renews on ${when}. Nothing to do — the card on file will be charged automatically. ` +
          `If you'd like to update your card or stop the renewal, you can do it any time from your membership page.`,
        dedupeKey: `renew-1d:${row.current_period_end}`,
      });
      if (created) sent += 1;
    } else if (msLeft <= 3 * DAY_MS) {
      const created = await notifyOnce(db, {
        userId: row.user_id,
        title: "Your membership renews in 3 days",
        body:
          `A friendly heads-up: your Smarty Premium membership (€9.99/month) renews on ${when}. No action is needed. ` +
          `If your card has changed, you can update it on your membership page so the renewal goes through smoothly.`,
        dedupeKey: `renew-3d:${row.current_period_end}`,
      });
      if (created) sent += 1;
    }
  }

  return sent;
}
