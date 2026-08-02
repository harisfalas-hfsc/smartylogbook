create extension if not exists vector with schema extensions;

alter table public.memories
  add column if not exists embedding extensions.vector(1536),
  add column if not exists embedded_at timestamptz;

create index if not exists memories_embedding_idx
  on public.memories using hnsw (embedding extensions.vector_cosine_ops);

create index if not exists memories_embedded_at_idx
  on public.memories (user_id) where embedding is null;

create or replace function public.match_memories(
  query_embedding extensions.vector(1536),
  match_count int default 12,
  min_similarity float default 0.15
)
returns table (
  id uuid,
  title text,
  summary text,
  content text,
  module text,
  kind text,
  amount numeric,
  currency text,
  ai_tags text[],
  metadata jsonb,
  occurred_at timestamptz,
  similarity float
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select m.id, m.title, m.summary, m.content, m.module, m.kind, m.amount, m.currency,
         m.ai_tags, m.metadata, m.occurred_at,
         1 - (m.embedding <=> query_embedding) as similarity
  from public.memories m
  where m.user_id = auth.uid()
    and m.embedding is not null
    and 1 - (m.embedding <=> query_embedding) > min_similarity
  order by m.embedding <=> query_embedding
  limit greatest(1, least(match_count, 40));
$$;

grant execute on function public.match_memories(extensions.vector, int, float) to authenticated, service_role;