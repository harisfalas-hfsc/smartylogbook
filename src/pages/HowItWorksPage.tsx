import { Brain, Bell, Zap } from 'lucide-react';
import { Block, PageHeader, CtaCard, insights, predictions, steps } from '@/lib/marketing';

const captureTypes = [
  { e: '✍️', t: 'Text', s: 'A thought, a note, a number.' },
  { e: '🎙️', t: 'Voice', s: 'Say it out loud, hands free.' },
  { e: '📷', t: 'Photo', s: 'Receipts, labels, whiteboards.' },
  { e: '📄', t: 'Documents', s: 'PDFs, reports, invoices.' },
];

const examples = [
  { e: '🩺', in: 'Photo of a blood test', out: 'Filed under Health, values extracted, linked to your last test, follow-up reminder set.' },
  { e: '🧾', in: 'Photo of a receipt', out: 'Amount, merchant and date extracted, filed under Finance, matched to your monthly spending.' },
  { e: '🎙️', in: '"Called the plumber, coming Tuesday"', out: 'Saved as a task, reminder created for Tuesday morning.' },
  { e: '💬', in: '"How much did I spend on restaurants?"', out: 'The Assistant searches your logbook and answers with the total and the entries behind it.' },
];

const HowItWorksPage = () => (
  <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="How it works"
      title="You capture. The Assistant does everything else."
      subtitle="Six seconds of your effort, and the rest happens on its own — classification, connections, reminders and answers."
    />

    {/* Step 1 — capture types */}
    <Block title="1. Throw anything at it" subtitle="No forms, no categories, no naming.">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {captureTypes.map((c) => (
          <div key={c.t} className="smarty-card p-4">
            <span className="text-xl leading-none">{c.e}</span>
            <p className="mt-2.5 text-sm font-bold text-foreground">{c.t}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{c.s}</p>
          </div>
        ))}
      </div>
    </Block>

    {/* The flow */}
    <Block title="2. The flow, step by step" subtitle="What happens the moment you hit save.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="smarty-card relative overflow-hidden p-5">
            <span className="absolute right-4 top-3 text-3xl font-extrabold text-secondary">{i + 1}</span>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-base shadow-glow">
                <s.icon className="h-4.5 w-4.5 text-primary-foreground" />
              </span>
              <span className="text-lg leading-none">{s.emoji}</span>
            </div>
            <p className="mt-3 text-[15px] font-bold text-foreground">{s.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </Block>

    {/* Real examples */}
    <Block title="3. Real examples" subtitle="What you give it, and what you get back.">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {examples.map((x) => (
          <div key={x.in} className="smarty-card p-4 sm:p-5">
            <div className="flex items-start gap-2.5">
              <span className="text-lg leading-none">{x.e}</span>
              <p className="text-sm font-bold text-foreground">{x.in}</p>
            </div>
            <div className="mt-3 rounded-2xl bg-secondary/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Assistant</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{x.out}</p>
            </div>
          </div>
        ))}
      </div>
    </Block>

    {/* Insights */}
    <Block title="4. It notices what you never would" subtitle="Patterns across weeks and months, written in plain language.">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {insights.map((i) => (
          <div key={i} className="smarty-card flex items-start gap-3 p-4">
            <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[13px] font-medium text-foreground">{i}</p>
          </div>
        ))}
      </div>
    </Block>

    {/* Proactive */}
    <Block title="5. It speaks first" subtitle="You do not have to remember to check anything.">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {predictions.map((p) => (
          <div key={p} className="smarty-card flex items-start gap-3 p-4">
            <Bell className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-[13px] font-semibold text-foreground">{p}</p>
          </div>
        ))}
      </div>
    </Block>

    <Block title="6. And it asks when unsure">
      <div className="smarty-card flex items-start gap-3 p-5">
        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          If a memory is missing something important — a date, an amount, a name — the Smarty Assistant
          asks one short follow-up question instead of guessing. Your logbook stays accurate without you
          filling in fields.
        </p>
      </div>
    </Block>

    <CtaCard title="Try it in ten seconds." text="Capture one thing today and watch the Assistant do the rest." />
  </div>
);

export default HowItWorksPage;
