# Keep Smarty Assistant inside the logbook

## How it works today

- Every question you type goes to the same `chat` mode of the assistant with your full context (entries, semantic recall, calendar, money model, plan info). There is no topic check at all, so "what's the weather" or "give me a month of workouts" is answered like ChatGPT would.
- Billing: a conversation is opened the first time you write, and every message within a 45-minute window is folded into that same conversation. So one conversation can contain unlimited heavy requests, and the model work behind it is unbounded (no output limit is set).
- Result: out-of-scope, expensive answers cost real AI money while giving you nothing your logbook needed.

## How it should work

Smarty Assistant answers only about *your* logbook: captures, notes, photos and documents, health/finance/fitness records, reminders and calendar, categories, trash, patterns and trends in your own data, plus your plan and allowance. Anything else is politely declined with a redirect, not answered.

Three tiers:

1. **In scope** - answered fully, grounded in your data (as today).
2. **Adjacent** - a short, grounded reply is allowed when your own data supports it (e.g. "explain my blood test", "is this bill higher than usual"). Still no generic programs or open-ended content generation.
3. **Out of scope** - weather, news, general workout/meal plans, coding, trivia, essays, translations, generic advice with no link to your data. The assistant replies in one or two lines: what it can do instead, with one concrete example based on your actual records.

Cost protection that comes with it:
- An out-of-scope reply does **not** consume a conversation from your 300, and it is capped to a tiny response, so it costs almost nothing.
- Heavy "generate me a month of X" requests are blocked by the scope rule itself, and a hard output cap is added so no single answer can run away.

## Changes

**1. Assistant scope contract (`supabase/functions/ai-brain/index.ts`)**
- Add a `SCOPE` block to the chat prompt defining in-scope, adjacent and out-of-scope topics, with the refusal template and the rule to never produce generic plans, programs, essays or code.
- Chat JSON gains `"scope":"in|out"`. When `out`, the assistant returns only the short refusal, no save, no calendar.
- Add `max_tokens` to the gateway call so a single answer cannot balloon.

**2. Do not bill out-of-scope turns**
- Currently the conversation row is created *before* the model call. Change to: reserve as today (so the allowance check still runs), then when the model returns `scope:"out"`, roll the turn back - delete the just-created conversation row, or decrement `messages` on the reused one - so refusals never eat your 300.
- Same scope rule applied to `search` mode (the other billable mode).

**3. Front end (`src/pages/AssistantPage.tsx`)**
- Show out-of-scope replies with a subtle "outside the logbook, not counted" note, and keep the quick-prompt chips as the in-scope examples.
- Update the placeholder to "Ask about your captures, records, reminders or spending".

**4. Copy: set expectations before people ask**
- `src/pages/FaqPage.tsx`: add "What can I ask Smarty Assistant?" and "What happens if I ask something unrelated?" (answers: it politely redirects and the question is not counted).
- `src/pages/HowItWorksPage.tsx`: in the assistant/conversation section, state plainly that the assistant is your logbook's brain, not a general chatbot, with 4-5 example questions.
- `src/pages/PricingPage.tsx` conversation wording: clarify that a conversation is a logbook conversation and unrelated questions are not counted.

## Technical notes

- Scope decision is made inside the existing chat call (one extra JSON field), so there is no second model request and no added latency or cost.
- Refunding a turn uses the same `admin` client already used by `enforceAssistantAccess`; the rollback runs after the model response, before the reply is returned.
- No database migration is needed.
