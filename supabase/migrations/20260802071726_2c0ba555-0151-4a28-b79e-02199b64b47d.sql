ALTER TABLE public.memories ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS memories_deleted_at_idx ON public.memories (user_id, deleted_at);

CREATE OR REPLACE FUNCTION public.match_memories(query_embedding extensions.vector, match_count integer DEFAULT 12, min_similarity double precision DEFAULT 0.15)
 RETURNS TABLE(id uuid, title text, summary text, content text, module text, kind text, amount numeric, currency text, ai_tags text[], metadata jsonb, occurred_at timestamp with time zone, similarity double precision)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  select m.id, m.title, m.summary, m.content, m.module, m.kind, m.amount, m.currency,
         m.ai_tags, m.metadata, m.occurred_at,
         1 - (m.embedding <=> query_embedding) as similarity
  from public.memories m
  where m.user_id = auth.uid()
    and m.deleted_at is null
    and m.embedding is not null
    and 1 - (m.embedding <=> query_embedding) > min_similarity
  order by m.embedding <=> query_embedding
  limit greatest(1, least(match_count, 40));
$function$;

CREATE OR REPLACE FUNCTION public.purge_expired_trash()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE removed integer;
BEGIN
  WITH d AS (
    DELETE FROM public.memories
    WHERE deleted_at IS NOT NULL AND deleted_at < now() - interval '30 days'
    RETURNING 1
  )
  SELECT count(*) INTO removed FROM d;
  RETURN removed;
END;
$function$;