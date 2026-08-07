CREATE TABLE public.support_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author text not null check (author in ('customer','assistant','admin')),
  body text not null,
  created_at timestamptz not null default now()
);

CREATE INDEX support_replies_ticket_idx ON public.support_replies (ticket_id, created_at);

GRANT SELECT, INSERT ON public.support_replies TO authenticated;
GRANT DELETE ON public.support_replies TO authenticated;
GRANT ALL ON public.support_replies TO service_role;

ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read replies on their own tickets"
  ON public.support_replies FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));

CREATE POLICY "Users reply on their own tickets"
  ON public.support_replies FOR INSERT TO authenticated
  WITH CHECK (author = 'customer' AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid()));

CREATE POLICY "Admins read every reply"
  ON public.support_replies FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write replies"
  ON public.support_replies FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete replies"
  ON public.support_replies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));