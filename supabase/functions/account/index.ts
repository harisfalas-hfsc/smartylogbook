import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { action, confirm } = await req.json().catch(() => ({ action: "" }));
    const admin = createClient(supabaseUrl, serviceKey);

    if (action === "export") {
      const tables = ["profiles", "memories", "daily_scores", "user_preferences", "coach_cards", "reminders", "user_roles", "account_requests"];
      const data: Record<string, unknown> = {};
      for (const t of tables) {
        const { data: rows } = await admin.from(t).select("*").eq("user_id", user.id);
        data[t] = rows ?? [];
      }

      const files: { path: string; size?: number; url: string | null }[] = [];
      const { data: objects } = await admin.storage.from("captures").list(user.id, { limit: 1000 });
      for (const o of objects ?? []) {
        const path = `${user.id}/${o.name}`;
        const { data: signed } = await admin.storage.from("captures").createSignedUrl(path, 60 * 60);
        files.push({ path, size: (o as { metadata?: { size?: number } }).metadata?.size, url: signed?.signedUrl ?? null });
      }

      await admin.from("account_requests").insert({ user_id: user.id, kind: "export" });

      return json({
        exported_at: new Date().toISOString(),
        account: { id: user.id, email: user.email, created_at: user.created_at },
        data,
        files,
      });
    }

    if (action === "delete") {
      if (confirm !== "DELETE") return json({ error: "Confirmation required" }, 400);

      const { data: objects } = await admin.storage.from("captures").list(user.id, { limit: 1000 });
      const paths = (objects ?? []).map((o) => `${user.id}/${o.name}`);
      if (paths.length) await admin.storage.from("captures").remove(paths);

      for (const t of ["memories", "daily_scores", "coach_cards", "reminders", "user_preferences", "user_roles", "profiles", "account_requests"]) {
        await admin.from(t).delete().eq("user_id", user.id);
      }

      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) return json({ error: error.message }, 400);

      return json({ deleted: true });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
