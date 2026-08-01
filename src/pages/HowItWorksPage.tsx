import { Wand2, Brain, Bell, MessageCircle } from 'lucide-react';
import { Panel, SubCard, MiniRow, Divider, PageHeader, CtaCard, insights, predictions, steps } from '@/lib/marketing';

const captureTypes = [
  { e: '✍️', t: 'Text', s: 'A thought, a note, a number.' },
  { e: '🎙️', t: 'Voice', s: 'Say it out loud, hands free.' },
  { e: '📷', t: 'Photo', s: 'Receipts, labels, whiteboards.' },
  { e: '📄', t: 'Documents', s: 'PDFs, reports, invoices.' },
];

const examples = [
  { e: '🩺', in: 'Photo of a blood test', out: 'Filed under Health, values extracted, linked to your last test, follow-up reminder set.' },
  { e: '🧾', in: 'Photo of a receipt', out: 'Amount, merchant and date extracted, filed under Finance, matched to monthly spending.' },
  { e: '🎙️', in: '"Called the plumber, coming Tuesday"', out: 'Saved as a task with a reminder for Tuesday morning.' },
  { e: '💬', in: '"How much did I spend on restaurants?"', out: 'The Assistant searches your logbook and answers with the total and the entries behind it.' },
];

const HowItWorksPage = () => (
  <div className="mx-auto max-w-6xl px-3 py-7 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="How it works"
      title="You capture. The Smarty Logbook does everything else."
      subtitle="Six seconds of your effort — classification, connections, reminders and answers happen on their own."
    />

    <Panel
      eyebrow="Step 1 — capture"
      eyebrowEmoji="📥"
      badge={Wand2}
      title={<>Throw <span className="gradient-text">anything</span> at it.</>}
      lead="No forms, no categories, no naming. Four ways in, all of them one tap away."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <SubCard label="Ways to capture" labelEmoji="⚡">
          <div className="grid gap-2 sm:grid-cols-2">
            {captureTypes.map((c) => (
              <MiniRow key={c.t} emoji={c.e} title={c.t} text={c.s} />
            ))}
          </div>
          <Divider />
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Nothing is required except the thing itself. No title, no tags, no folder.
          </p>
        </SubCard>
        <SubCard label="What you never do" labelEmoji="🚫">
          <div className="grid gap-2">
            <MiniRow emoji="📂" title="Pick a folder" text="The Assistant decides where it belongs." />
            <MiniRow emoji="🏷️" title="Write tags" text="Generated automatically from the content." />
            <MiniRow emoji="⌨️" title="Fill in fields" text="Dates and amounts are extracted for you." />
          </div>
        </SubCard>
      </div>
    </Panel>

    <Panel
      eyebrow="Step 2 — the flow"
      eyebrowEmoji="🔄"
      badge={Brain}
      title={<>What happens the <span className="gradient-text">moment you save.</span></>}
      lead="Six stages run in the background, in order, every single time."
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card p-3.5">
            <span className="absolute right-3 top-2 text-2xl font-extrabold text-secondary">{i + 1}</span>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <s.icon className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="text-base leading-none">{s.emoji}</span>
            </div>
            <p className="mt-2.5 text-sm font-bold text-foreground">{s.title}</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </Panel>

    <Panel
      eyebrow="Step 3 — real examples"
      eyebrowEmoji="🎬"
      badge={MessageCircle}
      title={<>What you give it, and <span className="gradient-text">what comes back.</span></>}
    >
      <div className="grid gap-2 lg:grid-cols-2">
        {examples.map((x) => (
          <div key={x.in} className="rounded-2xl border border-primary/15 bg-card p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm">{x.e}</span>
              <p className="text-[13px] font-bold leading-snug text-foreground">{x.in}</p>
            </div>
            <div className="mt-2.5 rounded-xl bg-secondary/70 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Assistant</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{x.out}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>

    <Panel
      eyebrow="Step 4 — it speaks first"
      eyebrowEmoji="🔔"
      badge={Bell}
      title={<>It notices what <span className="gradient-text">you never would.</span></>}
      lead="Patterns across weeks and months, written in plain language — and a nudge before anything slips."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <SubCard label="Patterns it finds" labelEmoji="💡">
          <div className="grid gap-2">
            {insights.map((i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-2xl border border-primary/15 bg-card p-2.5 sm:p-3">
                <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-[12.5px] font-medium leading-snug text-foreground">{i}</p>
              </div>
            ))}
          </div>
        </SubCard>
        <SubCard label="What it reminds you of" labelEmoji="⏰">
          <div className="grid gap-2">
            {predictions.map((p) => (
              <div key={p} className="flex items-start gap-2.5 rounded-2xl border border-primary/15 bg-card p-2.5 sm:p-3">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-[12.5px] font-medium leading-snug text-foreground">{p}</p>
              </div>
            ))}
          </div>
          <Divider />
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            If a memory is missing something important — a date, an amount, a name — the Assistant asks one
            short follow-up question instead of guessing.
          </p>
        </SubCard>
      </div>
    </Panel>

    <CtaCard title="Try it in ten seconds." text="Capture one thing today and watch the Smarty Assistant do the rest." />
  </div>
);

export default HowItWorksPage;
