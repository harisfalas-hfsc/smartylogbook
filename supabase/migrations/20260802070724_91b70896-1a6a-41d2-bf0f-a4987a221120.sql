CREATE TABLE public.classification_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  memory_id UUID REFERENCES public.memories(id) ON DELETE SET NULL,
  title TEXT,
  summary TEXT,
  ai_tags TEXT[] NOT NULL DEFAULT '{}',
  kind TEXT,
  from_module TEXT NOT NULL,
  to_module TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classification_corrections TO authenticated;
GRANT ALL ON public.classification_corrections TO service_role;

ALTER TABLE public.classification_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own corrections"
ON public.classification_corrections FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_classification_corrections_user ON public.classification_corrections (user_id, created_at DESC);

CREATE TRIGGER update_classification_corrections_updated_at
BEFORE UPDATE ON public.classification_corrections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();