import { useRef, useState } from 'react';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMemories } from '@/lib/memories';
import { useSubscription } from '@/lib/subscription';
import AssistantUpgrade from '@/components/AssistantUpgrade';
import ConversationMeter from '@/components/ConversationMeter';

const EXAMPLES = [
  'When did my knee pain begin?',
  'Show every workout from May.',
  'How much did I spend on restaurants?',
  'When did I last meet John?',
  'Show all MRI reports.',
  'What ideas did I record last week?',
];

interface Turn { role: 'user' | 'ai'; text: string }

const AiPage = () => {
  const { memories } = useMemories({ limit: 200 });
  const {
    pricing, plan, active, allowance, used, canUseAssistant, renewsAt, renewNow, loading: subLoading, reload: reloadSub,
  } = useSubscription();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const ask = async (q: string) => {
    if (!q.trim() || loading) return;
    setTurns((t) => [...t, { role: 'user', text: q }]);
    setQuestion('');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-brain', {
        body: {
          mode: 'search',
          input: q,
          retrieve: true,
          memories: memories.map((m) => ({
            title: m.title, summary: m.summary, content: m.content, module: m.module,
            kind: m.kind, amount: m.amount, location: m.location, tags: m.ai_tags,
            occurred_at: m.occurred_at,
          })),
        },
      });
      const answer = error
        ? 'Something went wrong reaching the AI. Please try again.'
        : data?.error ?? data?.answer ?? 'No answer available.';
      setTurns((t) => [...t, { role: 'ai', text: answer }]);
    } finally {
      setLoading(false);
      void reloadSub();
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  };

  return (
    <div className="space-y-5">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Ask your life</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No folders. No filters. Just ask — {memories.length} memories indexed.
        </p>
      </header>

      {!subLoading && !canUseAssistant && <AssistantUpgrade pricing={pricing} exhausted={active} allowance={allowance} renewsAt={renewsAt} onRenew={renewNow} />}

      {canUseAssistant && (
        <ConversationMeter used={used} allowance={allowance} planName={plan?.name} renewsAt={renewsAt} />
      )}

      {canUseAssistant && turns.length === 0 && (
        <div className="animate-fade-up space-y-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => ask(e)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-smooth hover:border-primary/40 active:scale-[0.99]"
            >
              <Sparkles className="h-4 w-4 shrink-0 text-primary" /> {e}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {turns.map((t, i) => (
          <div
            key={i}
            className={
              t.role === 'user'
                ? 'ml-auto max-w-[85%] animate-fade-up rounded-3xl rounded-br-lg bg-gradient-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-glow'
                : 'mr-auto max-w-[92%] animate-fade-up whitespace-pre-wrap rounded-3xl rounded-bl-lg border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-card'
            }
          >
            {t.text}
          </div>
        ))}
        {loading && (
          <div className="mr-auto flex items-center gap-2 rounded-3xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching your memories…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {canUseAssistant && (
      <div className="sticky bottom-24 z-20 md:bottom-4">
        <form
          onSubmit={(e) => { e.preventDefault(); ask(question); }}
          className="glass flex items-center gap-2 rounded-3xl p-2 shadow-elevated"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about your life…"
            className="flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            aria-label="Ask"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition-smooth active:scale-95 disabled:opacity-50"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
      </div>
      )}
    </div>
  );
};

export default AiPage;
