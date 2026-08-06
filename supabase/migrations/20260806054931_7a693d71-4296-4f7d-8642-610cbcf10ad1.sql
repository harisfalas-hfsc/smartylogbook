DELETE FROM public.messages a USING public.messages b
WHERE a.dedupe_key IS NOT NULL AND a.user_id = b.user_id AND a.dedupe_key = b.dedupe_key AND a.ctid > b.ctid;
CREATE UNIQUE INDEX IF NOT EXISTS messages_user_dedupe_key_uidx ON public.messages (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;