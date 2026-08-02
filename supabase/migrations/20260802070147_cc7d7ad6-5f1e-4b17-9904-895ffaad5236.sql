CREATE TABLE public.assistant_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  portrait text,
  habits jsonb NOT NULL DEFAULT '[]'::jsonb,
  routines jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
  patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  people jsonb NOT NULL DEFAULT '[]'::jsonb,
  watchlist jsonb NOT NULL DEFAULT '[]'::jsonb,
  open_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence text NOT NULL DEFAULT 'low',
  data_points integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 0,
  trained_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_profiles TO authenticated;
GRANT ALL ON public.assistant_profiles TO service_role;

ALTER TABLE public.assistant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own assistant profile"
ON public.assistant_profiles FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_assistant_profiles_updated_at
BEFORE UPDATE ON public.assistant_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();