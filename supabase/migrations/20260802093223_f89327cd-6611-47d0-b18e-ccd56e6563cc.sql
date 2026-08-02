-- Pricing configuration (single admin-managed row, publicly readable)
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id smallint PRIMARY KEY DEFAULT 1,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT pricing_config_singleton CHECK (id = 1)
);

GRANT SELECT ON public.pricing_config TO anon;
GRANT SELECT ON public.pricing_config TO authenticated;
GRANT ALL ON public.pricing_config TO service_role;

ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pricing is public" ON public.pricing_config;
CREATE POLICY "Pricing is public" ON public.pricing_config FOR SELECT USING (true);

INSERT INTO public.pricing_config (id, config)
VALUES (1, jsonb_build_object(
  'currency', 'EUR',
  'targetMargin', 0.5,
  'usdToEur', 0.92,
  'overhead', 0.3,
  'inputPricePerMTokensUsd', 0.3,
  'outputPricePerMTokensUsd', 2.5,
  'avgInputTokensPerConversation', 25000,
  'avgOutputTokensPerConversation', 2000,
  'conversationWindowMinutes', 45,
  'roundTo', 10,
  'plans', jsonb_build_array(
    jsonb_build_object('key','insight','name','Smarty Insight','price',6.99,'tagline','Intelligence when you need it.','allowanceOverride', null),
    jsonb_build_object('key','intelligence','name','Smarty Intelligence','price',9.99,'tagline','Your everyday thinking partner.','allowanceOverride', null,'featured', true),
    jsonb_build_object('key','genius','name','Smarty Genius','price',12.99,'tagline','Unlimited-feeling depth.','allowanceOverride', null)
  )
))
ON CONFLICT (id) DO NOTHING;

-- AI conversation ledger (one row per billable conversation)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text,
  plan text,
  messages integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_conversations_user_time_idx
  ON public.ai_conversations (user_id, last_message_at DESC);

GRANT SELECT ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own conversations" ON public.ai_conversations;
CREATE POLICY "Users read their own conversations" ON public.ai_conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Subscriptions: support the three assistant tiers and billing anchor
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_key text,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz;

UPDATE public.subscriptions
  SET plan_key = CASE WHEN plan = 'premium' THEN 'intelligence' ELSE NULL END
  WHERE plan_key IS NULL;