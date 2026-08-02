import { Brain, HelpCircle, Loader2, RefreshCw, Repeat, Sparkles } from 'lucide-react';
import { useAssistantProfile } from '@/lib/assistantProfile';
import { cn } from '@/lib/utils';

const confidenceCopy: Record<string, string> = {
  high: 'Knows you well',
  medium: 'Still learning you',
  low: 'Just getting started',
};

/**
 * What Smarty Assistant has learned about this specific user. It retrains itself
 * in the background as the logbook grows, so this panel deepens over time.
 */
const AssistantMemoryCard = () => {
  const { profile, loading, training, train } = useAssistantProfile(true);

  if (loading) return null;

  const empty = !profile || (!profile.portrait && profile.patterns.length === 0);

  return (
    <section className="smarty-card space-y-4 p-4">
      <header className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
          <Brain className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-foreground">What your assistant has learned</h2>
          <p className="text-xs text-muted-foreground">
            {profile
              ? `${confidenceCopy[profile.confidence]} · trained on ${profile.data_points} ${
                  profile.data_points === 1 ? 'entry' : 'entries'
                }`
              : 'It trains itself as you log more of your life'}
          </p>
        </div>
        <button
          onClick={train}
          disabled={training}
          aria-label="Retrain assistant"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground transition-smooth active:scale-95 disabled:opacity-50"
        >
          {training ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </header>

      {empty ? (
        <p className="text-sm text-muted-foreground">
          {training
            ? 'Reading your logbook and building your personal profile…'
            : 'Keep capturing — after a few entries your assistant builds a private profile of your habits, routines and patterns.'}
        </p>
      ) : (
        <div className="space-y-4">
          {profile.portrait && (
            <p className="text-sm leading-relaxed text-foreground">{profile.portrait}</p>
          )}

          {profile.patterns.length > 0 && (
            <div className="space-y-2">
              {profile.patterns.slice(0, 4).map((p) => (
                <div key={p.title} className="rounded-2xl border border-primary/25 bg-secondary/40 p-3">
                  <p className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    {p.title}
                    {p.confidence && (
                      <span
                        className={cn(
                          'ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          p.confidence === 'high'
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {p.confidence}
                      </span>
                    )}
                  </p>
                  {p.detail && <p className="mt-1 text-xs text-muted-foreground">{p.detail}</p>}
                </div>
              ))}
            </div>
          )}

          {profile.habits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.habits.slice(0, 6).map((h) => (
                <span
                  key={h}
                  className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-foreground"
                >
                  <Repeat className="h-3 w-3 text-primary" />
                  {h}
                </span>
              ))}
            </div>
          )}

          {profile.open_questions.length > 0 && (
            <div className="space-y-1.5 rounded-2xl border border-mod-business/25 bg-mod-business/5 p-3">
              <p className="flex items-center gap-2 text-xs font-bold text-foreground">
                <HelpCircle className="h-3.5 w-3.5 text-mod-business" /> To know you better it needs
              </p>
              {profile.open_questions.slice(0, 3).map((q) => (
                <p key={q} className="text-xs text-muted-foreground">• {q}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default AssistantMemoryCard;
