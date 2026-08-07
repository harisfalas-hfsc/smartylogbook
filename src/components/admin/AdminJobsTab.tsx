import { useEffect, useState } from 'react';
import { Clock, Loader2, Pause, Play, Plus, RefreshCw, Save, Timer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CronJob, JOB_TEMPLATES, SCHEDULE_PRESETS, adminApi, describeJob, describeSchedule, jobKinds, kindInfo } from '@/lib/admin';
import { cn } from '@/lib/utils';

const fmtTime = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

const EMPTY = { jobname: '', schedule: '0 7 * * *', command: '', template: '' };

const AdminJobsTab = () => {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, { schedule: string; command: string }>>({});
  const [creating, setCreating] = useState(false);
  const [newJob, setNewJob] = useState(EMPTY);
  const picked = JOB_TEMPLATES.find((t) => t.id === newJob.template);


  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi<{ jobs: CronJob[] }>('cron_jobs');
      setJobs(res.jobs ?? []);
      setDrafts(
        Object.fromEntries(
          (res.jobs ?? []).map((j) => [j.jobid, { schedule: j.schedule, command: j.command }]),
        ),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load scheduled jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (key: string, fn: () => Promise<unknown>, msg: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(msg);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="smarty-card border-primary/40 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Timer className="h-4 w-4 text-primary" /> Automations
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          These are the background jobs that keep the app alive without anyone pressing a button. Every automated
          message your members receive is produced by one of these jobs, and each card below says exactly which message
          type it writes, so you can match it with the <strong className="text-foreground">Messages</strong> tab.
          Change when a job runs, pause it, run it right now, or add a new one. Times are UTC, except the daily tip,
          which uses each member’s own timezone.
        </p>
      </div>


      <div className="grid gap-3 xl:grid-cols-2">
        {jobs.map((job) => {
          const draft = drafts[job.jobid] ?? { schedule: job.schedule, command: job.command };
          const last = job.runs?.[0];
          const changed = draft.schedule !== job.schedule || draft.command !== job.command;
          return (
            <div key={job.jobid} className="smarty-card space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{job.jobname}</p>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                    job.active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {job.active ? 'Running' : 'Paused'}
                </span>
              </div>

              <p className="text-[12px] leading-relaxed text-muted-foreground">{describeJob(job)}</p>

              {jobKinds(job).length > 0 && (
                <div className="rounded-2xl bg-primary/5 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Messages it writes
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {jobKinds(job).map((k) => (
                      <span
                        key={k}
                        className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary"
                      >
                        {kindInfo(k).label}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    {kindInfo(jobKinds(job)[0]).what} You can read, edit or delete everything it has already sent in the
                    Messages tab.
                  </p>
                </div>
              )}


              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-secondary/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Frequency</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-foreground">{describeSchedule(job.schedule)}</p>
                </div>
                <div className="rounded-2xl bg-secondary/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last run</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-foreground">{fmtTime(last?.start_time)}</p>
                  {last ? (
                    <p
                      className={cn(
                        'text-[11px] font-bold',
                        last.status === 'succeeded' ? 'text-emerald-600' : 'text-destructive',
                      )}
                    >
                      {last.status}
                    </p>
                  ) : null}
                </div>
              </div>

              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  When it runs
                </span>
                <select
                  value={SCHEDULE_PRESETS.some((p) => p.value === draft.schedule) ? draft.schedule : 'custom'}
                  onChange={(e) =>
                    e.target.value !== 'custom' &&
                    setDrafts((p) => ({ ...p, [job.jobid]: { ...draft, schedule: e.target.value } }))
                  }
                  className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none"
                  aria-label="When it runs"
                >
                  {!SCHEDULE_PRESETS.some((p) => p.value === draft.schedule) && (
                    <option value="custom">Custom: {describeSchedule(draft.schedule)}</option>
                  )}
                  {SCHEDULE_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-muted-foreground">{describeSchedule(draft.schedule)}.</p>
              </label>

              <details className="rounded-2xl border border-border bg-card/60 p-3">
                <summary className="cursor-pointer text-[11px] font-bold text-muted-foreground">
                  Advanced: exact timing and command
                </summary>
                <label className="mt-2 block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Timing pattern (minute, hour, day of month, month, day of week)
                  </span>
                  <input
                    value={draft.schedule}
                    onChange={(e) =>
                      setDrafts((p) => ({ ...p, [job.jobid]: { ...draft, schedule: e.target.value } }))
                    }
                    spellCheck={false}
                    className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 font-mono text-sm font-semibold text-foreground outline-none"
                  />
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    A star means “every”. So <code>5 * * * *</code> is “at minute 5 of every hour”, and{' '}
                    <code>0 7 * * 1</code> is “07:00 on Mondays”.
                  </span>
                </label>
                <label className="mt-2 block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Command it runs
                  </span>
                  <textarea
                    value={draft.command}
                    onChange={(e) =>
                      setDrafts((p) => ({ ...p, [job.jobid]: { ...draft, command: e.target.value } }))
                    }
                    rows={4}
                    spellCheck={false}
                    className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground outline-none"
                  />
                </label>
              </details>



              <div className="flex flex-wrap gap-2">
                <button
                  disabled={busy !== null || !changed}
                  onClick={() =>
                    act(
                      `save-${job.jobid}`,
                      () =>
                        adminApi('cron_save', {
                          jobname: job.jobname,
                          schedule: draft.schedule,
                          command: draft.command,
                          active: job.active,
                        }),
                      'Job updated',
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-primary px-3.5 py-2 text-[11px] font-bold text-primary-foreground transition-smooth active:scale-95 disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
                <button
                  disabled={busy !== null}
                  onClick={() =>
                    act(`run-${job.jobid}`, () => adminApi('cron_run', { jobid: job.jobid }), 'Job triggered')
                  }
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-primary/30 bg-primary/5 px-3.5 py-2 text-[11px] font-bold text-primary transition-smooth active:scale-95 disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5" /> Run now
                </button>
                <button
                  disabled={busy !== null}
                  onClick={() =>
                    act(
                      `toggle-${job.jobid}`,
                      () => adminApi('cron_toggle', { jobid: job.jobid, active: !job.active }),
                      job.active ? 'Job paused' : 'Job resumed',
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-border px-3.5 py-2 text-[11px] font-bold text-foreground transition-smooth active:scale-95 disabled:opacity-50"
                >
                  {job.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {job.active ? 'Pause' : 'Resume'}
                </button>
                <button
                  disabled={busy !== null}
                  onClick={() => {
                    if (!confirm(`Delete the job “${job.jobname}”? This stops it permanently.`)) return;
                    act(`del-${job.jobid}`, () => adminApi('cron_delete', { jobid: job.jobid }), 'Job deleted');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-3.5 py-2 text-[11px] font-bold text-destructive transition-smooth active:scale-95 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>

              {job.runs?.length ? (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Recent runs
                  </p>
                  <div className="mt-1.5 space-y-1.5">
                    {job.runs.slice(0, 5).map((r) => (
                      <div
                        key={r.runid}
                        className="rounded-xl bg-secondary/50 px-3 py-2 text-[11px] text-muted-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="font-semibold text-foreground">{fmtTime(r.start_time)}</span>
                          <span
                            className={cn(
                              'ml-auto font-bold',
                              r.status === 'succeeded' ? 'text-emerald-600' : 'text-destructive',
                            )}
                          >
                            {r.status}
                          </span>
                        </div>
                        {r.return_message ? (
                          <p className="mt-1 break-words font-mono text-[10px]">{r.return_message}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">No runs recorded yet.</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="smarty-card p-4">
        <button
          onClick={() => setCreating((v) => !v)}
          className="flex w-full items-center gap-2 text-sm font-bold text-foreground"
        >
          <Plus className="h-4 w-4 text-primary" /> Add a new scheduled job
        </button>
        {creating && (
          <div className="mt-3 space-y-3">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                What should this job do?
              </span>
              <select
                value={newJob.template}
                onChange={(e) => {
                  const t = JOB_TEMPLATES.find((x) => x.id === e.target.value);
                  setNewJob((p) => ({
                    ...p,
                    template: e.target.value,
                    jobname: t ? t.suggestedName : p.jobname,
                    schedule: t ? t.suggestedSchedule : p.schedule,
                  }));
                }}
                className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none"
              >
                <option value="">Pick a task…</option>
                {JOB_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
                <option value="custom">Advanced, write my own SQL</option>
              </select>
              {picked && <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{picked.description}</p>}
            </label>

            <input
              value={newJob.jobname}
              onChange={(e) => setNewJob((p) => ({ ...p, jobname: e.target.value }))}
              placeholder="Job name (e.g. smarty-daily-insights)"
              className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={newJob.schedule}
                onChange={(e) => setNewJob((p) => ({ ...p, schedule: e.target.value }))}
                placeholder="Cron schedule"
                className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none"
              />
              <select
                value=""
                onChange={(e) => e.target.value && setNewJob((p) => ({ ...p, schedule: e.target.value }))}
                className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground outline-none"
                aria-label="Schedule presets"
              >
                <option value="">Pick a preset…</option>
                {SCHEDULE_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground">Runs {describeSchedule(newJob.schedule)}.</p>

            {newJob.template === 'custom' && (
              <textarea
                value={newJob.command}
                onChange={(e) => setNewJob((p) => ({ ...p, command: e.target.value }))}
                rows={4}
                spellCheck={false}
                placeholder="SQL to run, e.g. SELECT public.purge_expired_trash();"
                className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 font-mono text-[11px] text-foreground outline-none"
              />
            )}

            <button
              disabled={busy !== null || !newJob.template || !newJob.jobname.trim()}
              onClick={() =>
                act(
                  'create-job',
                  async () => {
                    await adminApi('cron_save', {
                      jobname: newJob.jobname,
                      schedule: newJob.schedule,
                      active: true,
                      ...(newJob.template === 'custom'
                        ? { command: newJob.command }
                        : { template: newJob.template }),
                    });
                    setNewJob(EMPTY);
                    setCreating(false);
                  },
                  'Job created',
                )
              }
              className="w-full rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-smooth active:scale-[0.99] disabled:opacity-50 sm:w-auto"
            >
              Create job
            </button>
          </div>
        )}
      </div>


      <button
        onClick={load}
        className="inline-flex items-center gap-2 rounded-2xl border border-border px-4 py-2.5 text-xs font-bold text-foreground"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Refresh jobs
      </button>
    </div>
  );
};

export default AdminJobsTab;
