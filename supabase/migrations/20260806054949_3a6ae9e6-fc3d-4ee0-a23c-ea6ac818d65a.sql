DROP INDEX IF EXISTS public.messages_user_dedupe_key_uidx;
ALTER TABLE public.messages ADD CONSTRAINT messages_user_dedupe_key_key UNIQUE (user_id, dedupe_key);