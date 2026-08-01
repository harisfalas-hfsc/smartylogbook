-- USER PREFERENCES / ONBOARDING
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  goals TEXT[] NOT NULL DEFAULT '{}',
  focus_modules TEXT[] NOT NULL DEFAULT '{}',
  tone TEXT NOT NULL DEFAULT 'friendly',
  coach_time TEXT NOT NULL DEFAULT '07:30',
  notify_coach BOOLEAN NOT NULL DEFAULT true,
  notify_tasks BOOLEAN NOT NULL DEFAULT true,
  notify_bills BOOLEAN NOT NULL DEFAULT true,
  notify_health BOOLEAN NOT NULL DEFAULT true,
  notify_events BOOLEAN NOT NULL DEFAULT true,
  quiet_hours_start TEXT NOT NULL DEFAULT '22:00',
  quiet_hours_end TEXT NOT NULL DEFAULT '07:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON public.user_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DAILY COACH CARDS
CREATE TABLE public.coach_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  for_date DATE NOT NULL DEFAULT CURRENT_DATE,
  headline TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  module TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, for_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_cards TO authenticated;
GRANT ALL ON public.coach_cards TO service_role;

ALTER TABLE public.coach_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own coach cards" ON public.coach_cards
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_coach_cards_updated_at
  BEFORE UPDATE ON public.coach_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REMINDERS
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'task',
  module TEXT,
  amount NUMERIC,
  due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  repeat_rule TEXT,
  notified_at TIMESTAMP WITH TIME ZONE,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reminders" ON public.reminders
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX reminders_user_due_idx ON public.reminders (user_id, due_at);

-- STORAGE ACCESS RULES FOR THE captures BUCKET
CREATE POLICY "Users read own capture files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'captures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own capture files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'captures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own capture files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'captures' AND auth.uid()::text = (storage.foldername(name))[1]);