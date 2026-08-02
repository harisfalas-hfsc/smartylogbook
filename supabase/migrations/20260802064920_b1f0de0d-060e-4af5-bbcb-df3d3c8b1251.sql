CREATE TABLE public.facts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  memory_id UUID REFERENCES public.memories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  label TEXT,
  value NUMERIC,
  text_value TEXT,
  unit TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  observed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.facts TO authenticated;
GRANT ALL ON public.facts TO service_role;

ALTER TABLE public.facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own facts"
  ON public.facts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX facts_unique_per_entry
  ON public.facts (user_id, memory_id, name, observed_at);
CREATE INDEX facts_user_name_time_idx
  ON public.facts (user_id, name, observed_at DESC);
CREATE INDEX facts_user_category_idx
  ON public.facts (user_id, category, observed_at DESC);

CREATE TRIGGER update_facts_updated_at
  BEFORE UPDATE ON public.facts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();