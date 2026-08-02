UPDATE public.pricing_config
SET config = jsonb_set(
      COALESCE(config, '{}'::jsonb),
      '{plans}',
      '[{"key":"premium","name":"Smarty Premium","price":9.99,"tagline":"Your everyday thinking partner — about 10 conversations a day.","featured":true,"allowanceOverride":300}]'::jsonb,
      true
    ),
    updated_at = now()
WHERE id = 1;

INSERT INTO public.pricing_config (id, config)
SELECT 1, '{"currency":"EUR","targetMargin":0.5,"usdToEur":0.92,"overhead":0.3,"inputPricePerMTokensUsd":0.3,"outputPricePerMTokensUsd":2.5,"avgInputTokensPerConversation":25000,"avgOutputTokensPerConversation":2000,"conversationWindowMinutes":45,"roundTo":10,"plans":[{"key":"premium","name":"Smarty Premium","price":9.99,"tagline":"Your everyday thinking partner — about 10 conversations a day.","featured":true,"allowanceOverride":300}]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_config WHERE id = 1);

UPDATE public.subscriptions
SET plan_key = 'premium'
WHERE plan = 'premium' AND (plan_key IS NULL OR plan_key <> 'premium');