ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS notify_daily_tip boolean NOT NULL DEFAULT true;