import { Brain, Zap } from 'lucide-react';
import { Block, PageHeader, insights, predictions, steps } from '@/lib/marketing';

const HowItWorksPage = () => (
  <div className="mx-auto max-w-3xl px-5 py-10">
    <PageHeader
      eyebrow="How it works"
      title="Four seconds from thought to memory."
      subtitle="Capture is instant. Everything else happens on its own."
    />

    <Block>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {steps.map((s, i) => (
          <div key={s.title} className="smarty-card relative p-5">
            <span className="absolute right-4 top-4 text-2xl font-extrabold text-secondary">{i + 1}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
              <s.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </Block>

    <Block title="It notices what you never would">
      <div className="space-y-2">
        {insights.map((i) => (
          <div key={i} className="glass flex items-center gap-3 rounded-3xl p-3.5 shadow-soft">
            <Brain className="h-4.5 w-4.5 shrink-0 text-primary" />
            <p className="text-sm font-medium text-foreground">{i}</p>
          </div>
        ))}
      </div>
    </Block>

    <Block title="Tomorrow, before it happens">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {predictions.map((p) => (
          <div key={p} className="smarty-card flex items-center gap-3 p-4">
            <Zap className="h-4.5 w-4.5 shrink-0 text-warning" />
            <p className="text-sm font-semibold text-foreground">{p}</p>
          </div>
        ))}
      </div>
    </Block>
  </div>
);

export default HowItWorksPage;
