CREATE TABLE public.proactive_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'task',
  title text NOT NULL,
  detail text,
  severity text NOT NULL DEFAULT 'normal',
  due_at timestamptz,
  dedupe_key text NOT NULL,
  seen boolean NOT NULL DEFAULT false,
  dismissed boolean NOT NULL DEFAULT false,
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proactive_alerts TO authenticated;
GRANT ALL ON public.proactive_alerts TO service_role;

ALTER TABLE public.proactive_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own alerts"
ON public.proactive_alerts FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX proactive_alerts_dedupe_idx ON public.proactive_alerts (user_id, dedupe_key);
CREATE INDEX proactive_alerts_user_open_idx ON public.proactive_alerts (user_id, dismissed, created_at DESC);

CREATE TRIGGER update_proactive_alerts_updated_at
BEFORE UPDATE ON public.proactive_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule('smarty-proactive-scan')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'smarty-proactive-scan');

SELECT cron.schedule(
  'smarty-proactive-scan',
  '10 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bjjezupqfoxbnhqlrwrg.supabase.co/functions/v1/proactive-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', current_setting('app.cron_secret', true)
    ),
    body := '{"source":"cron"}'::jsonb
  );
  $$
);