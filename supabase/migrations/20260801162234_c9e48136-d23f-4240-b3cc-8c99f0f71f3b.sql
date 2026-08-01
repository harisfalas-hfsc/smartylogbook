ALTER TABLE public.coach_cards ADD COLUMN IF NOT EXISTS alerts jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS related_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];
ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS relation_note text;