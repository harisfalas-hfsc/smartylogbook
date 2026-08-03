SELECT cron.unschedule('smarty-proactive-scan')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'smarty-proactive-scan');

SELECT cron.schedule(
  'smarty-proactive-scan',
  '10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bjjezupqfoxbnhqlrwrg.supabase.co/functions/v1/proactive-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', 'dt1YUNm9D2fDFLWENpAUePhMM7iNItG05JOXO8atXpGn-nMe'
    ),
    body := '{"source":"cron"}'::jsonb
  );
  $$
);