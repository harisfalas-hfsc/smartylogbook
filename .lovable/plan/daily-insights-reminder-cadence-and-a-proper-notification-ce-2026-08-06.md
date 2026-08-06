# Daily insights, reminder cadence and a proper notification center

## Where things stand today

- There is exactly one scheduled job running: `smarty-proactive-scan`, hourly at :10. It calls the `proactive-scan` function, which purges expired trash, raises alerts for reminders and bills due within 7 days, stale health readings, expiring documents, plan renewals, and posts one daily brief per user at their chosen hour.
- The Message Center already stores kind, level, action link, read and archived state, but the page shows a single flat list ordered by creation date. There is no grouping by due / today / missed / scheduled.
- The Admin panel can already create, pause, run and delete jobs, but the form asks for a raw SQL command, so there is no practical way to add a new job from the UI.

## What to build

### 1. Reminder cadence: 2 days before, 1 day before, day of, 1 day after, 2 days after

Today a reminder produces one generic "coming up" or "overdue" alert. Replace that with five distinct, deduplicated stages per reminder (and per recurring money item):

```text
T-2  "In 2 days"        normal
T-1  "Tomorrow"         normal
T-0  "Today"            high
T+1  "Missed yesterday" high
T+2  "Still not done"   high
```

Each stage gets its own dedupe key, so a user gets exactly one message per stage and never a repeat. Once a reminder is marked done, its open stages are dismissed (the existing stale-alert sweep already does this, it gets extended to the new keys).

### 2. Daily insight message

One message each morning at the user's chosen time, replacing the current thin brief, containing:

- Today: what is due today (reminders, bills, events), counted and listed.
- Tomorrow: a short heads-up of what is coming.
- Missed: anything overdue and still open.
- On this day: what was captured on the same calendar day one year ago (and 2, 3 years back when it exists), pulled from `memories`.

Free users get the factual list. Premium users additionally get one short assistant-written line of context. Both are one message a day, deduplicated by date.

### 3. Weekly recap

One message every Monday morning: what got logged last week, what got completed, what slipped, and what is scheduled for the coming week.

### 4. Notification center that is actually organised

Rework the Message Center page into grouped, filterable sections instead of one long list:

```text
[ All ] [ Missed ] [ Today ] [ Upcoming ] [ Insights ] [ Archive ]

MISSED            (red)     2
TODAY             (blue)    3
TOMORROW                    1
THIS WEEK                   4
EARLIER                     ...
```

- Grouping is derived from `related_at` versus now, falling back to `created_at`.
- Missed items sort first and are visually distinct.
- Each message keeps its existing action button (open calendar, my plan, open the record).
- Unread count in the header stays as is.

### 5. Admin: create a job without writing SQL

Replace the raw command box with a task picker in the Jobs tab:

- Choose a task from a list (Proactive scan, Daily insights, Weekly recap, Purge trash, Reminder cadence sweep).
- Choose a schedule from presets or a plain-language builder (every hour at :10, daily at 07:00, weekly Monday 08:00).
- The panel builds the SQL command itself and shows a plain-English description of what the job does plus its last 10 runs.
- Raw SQL stays available behind an "Advanced" toggle for existing jobs.

### Suggested job set after this work

| Job | Schedule | Purpose |
| --- | --- | --- |
| smarty-proactive-scan | hourly at :10 | alerts, reminder cadence, trash purge |
| smarty-daily-insights | hourly at :05 | fires the daily insight for users whose chosen hour matches |
| smarty-weekly-recap | Monday 07:05 UTC | weekly recap message |

Hourly jobs are needed because each user picks their own morning time; the function only acts on users whose hour matches the current hour.

## Technical notes

- `proactive-scan` gains a stage-based alert generator (`stagesFor(dueDate)`) and extends the stale-key sweep to all five stages.
- New edge function `daily-insights` (cron-key protected, same pattern as `proactive-scan`) handling the daily insight and the Monday recap; it reads `reminders`, `money_items`, `memories` (for the year-ago lookback) and `user_preferences`.
- `messages` gains no schema change: grouping uses `related_at`, and new kinds `insight` and `recap` are added to `MESSAGE_KINDS` in `src/lib/messages.ts`.
- `MessagesPage.tsx` gets a filter bar and grouped rendering; message list logic moves into a small helper in `src/lib/messages.ts`.
- Admin job templates live in `src/lib/admin.ts` (task id, label, description, generated command) and are rendered by `AdminJobsTab.tsx`; `admin_save_cron_job` is reused unchanged.
- Cron jobs are created with the insert tool (they embed project-specific URL and key), not a migration.
