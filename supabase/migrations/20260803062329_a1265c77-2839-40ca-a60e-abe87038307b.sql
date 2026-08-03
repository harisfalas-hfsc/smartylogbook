
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_list_cron_jobs()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, cron, extensions
AS $$
  SELECT COALESCE(jsonb_agg(x ORDER BY x->>'jobname'), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'jobid', j.jobid,
      'jobname', j.jobname,
      'schedule', j.schedule,
      'command', j.command,
      'active', j.active,
      'runs', COALESCE((
        SELECT jsonb_agg(r ORDER BY r->>'start_time' DESC)
        FROM (
          SELECT jsonb_build_object(
            'runid', d.runid,
            'status', d.status,
            'return_message', left(COALESCE(d.return_message, ''), 500),
            'start_time', d.start_time,
            'end_time', d.end_time
          ) AS r
          FROM cron.job_run_details d
          WHERE d.jobid = j.jobid
          ORDER BY d.start_time DESC
          LIMIT 10
        ) s
      ), '[]'::jsonb)
    ) AS x
    FROM cron.job j
  ) t;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_cron_job(_jobname text, _schedule text, _command text, _active boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, extensions
AS $$
DECLARE _jobid bigint;
BEGIN
  IF _jobname IS NULL OR length(trim(_jobname)) = 0 THEN
    RAISE EXCEPTION 'Job name is required';
  END IF;
  SELECT cron.schedule(_jobname, _schedule, _command) INTO _jobid;
  IF _active IS FALSE THEN
    PERFORM cron.alter_job(_jobid, active := false);
  ELSE
    PERFORM cron.alter_job(_jobid, active := true);
  END IF;
  RETURN jsonb_build_object('jobid', _jobid);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_cron_active(_jobid bigint, _active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, extensions
AS $$
BEGIN
  PERFORM cron.alter_job(_jobid, active := _active);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_cron_job(_jobid bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, extensions
AS $$
BEGIN
  PERFORM cron.unschedule(_jobid);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_run_cron_job(_jobid bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, extensions
AS $$
DECLARE _cmd text;
BEGIN
  SELECT command INTO _cmd FROM cron.job WHERE jobid = _jobid;
  IF _cmd IS NULL THEN RAISE EXCEPTION 'Job not found'; END IF;
  EXECUTE _cmd;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_cron_jobs() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_save_cron_job(text, text, text, boolean) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_set_cron_active(bigint, boolean) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_cron_job(bigint) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_run_cron_job(bigint) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_list_cron_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_save_cron_job(text, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_cron_active(bigint, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_cron_job(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_run_cron_job(bigint) TO service_role;
