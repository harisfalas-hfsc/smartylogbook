CREATE TABLE public.money_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_id uuid REFERENCES public.memories(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'expense',
  label text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  cadence text NOT NULL DEFAULT 'monthly',
  next_due date,
  category text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT money_items_type_check CHECK (type IN ('income','expense','subscription','debt','saving')),
  CONSTRAINT money_items_cadence_check CHECK (cadence IN ('once','weekly','monthly','quarterly','yearly'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.money_items TO authenticated;
GRANT ALL ON public.money_items TO service_role;

ALTER TABLE public.money_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own money items"
ON public.money_items FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX money_items_user_active_idx ON public.money_items (user_id, active, type);
CREATE UNIQUE INDEX money_items_user_label_type_idx ON public.money_items (user_id, lower(label), type);

CREATE TRIGGER update_money_items_updated_at
BEFORE UPDATE ON public.money_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();