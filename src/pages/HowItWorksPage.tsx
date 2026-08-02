import { Wand2, Brain, Bell, MessageCircle } from 'lucide-react';
import { Panel, SubCard, MiniRow, Divider, DesktopOnly, PageHeader, CtaCard, insights, predictions, steps, givesIn, givesBack } from '@/lib/marketing';

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
      title="You put it in. Smarty Logbook does the thinking."
      subtitle="Four ways in — type, say, snap, upload. Then it understands, relates, remembers and finds it for you."
    />

    <Panel
      eyebrow="The whole idea"
      eyebrowEmoji="🔁"
      badge={Wand2}
      title={<>Put anything in, <span className="gradient-text">get sense back.</span></>}
      lead="No forms, no naming, no filing. One tap in, and the thinking happens on the other side."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <SubCard label="You put in" labelEmoji="📥">
          <div className="grid gap-2 sm:grid-cols-2">
            {givesIn.map((c) => (
              <MiniRow key={c.t} emoji={c.e} title={c.t} text={c.s} />
            ))}
          </div>
          <DesktopOnly>
            <Divider />
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              Nothing is required except the thing itself. No title, no tags, no folder.
            </p>
          </DesktopOnly>
        </SubCard>
        <SubCard label="It gives back" labelEmoji="✨">
          <div className="grid gap-2 sm:grid-cols-2">
            {givesBack.map((c) => (
              <MiniRow key={c.t} emoji={c.e} title={c.t} text={c.s} />
            ))}
          </div>
        </SubCard>
      </div>
    </Panel>


    <Panel
      eyebrow="What happens next"
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
            <p className="mt-1 hidden text-[11.5px] leading-relaxed text-muted-foreground sm:block">{s.text}</p>
          </div>
        ))}
      </div>
    </Panel>

    <Panel
      eyebrow="Real examples"
      eyebrowEmoji="🎬"
      badge={MessageCircle}
      title={<>What you give it, and <span className="gradient-text">what comes back.</span></>}
    >
      <div className="grid gap-2 lg:grid-cols-2">
        {examples.map((x, idx) => {
          const card = (
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
          );
          return idx < 2 ? card : <DesktopOnly key={x.in}>{card}</DesktopOnly>;
        })}
      </div>
    </Panel>

    <Panel
      eyebrow="It speaks first"
      eyebrowEmoji="🔔"
      badge={Bell}
      title={<>It notices what <span className="gradient-text">you never would.</span></>}
      lead="Patterns across weeks and months, written in plain language — and a nudge before anything slips."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <SubCard label="Patterns it finds" labelEmoji="💡">
          <div className="grid gap-2">
            {insights.map((t, i) => {
              const row = (
                <div key={t} className="flex items-start gap-2.5 rounded-2xl border border-primary/15 bg-card p-2.5 sm:p-3">
                  <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-[12.5px] font-medium leading-snug text-foreground">{t}</p>
                </div>
              );
              return i < 3 ? row : <DesktopOnly key={t}>{row}</DesktopOnly>;
            })}
          </div>
        </SubCard>
        <DesktopOnly>
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
        </DesktopOnly>
      </div>
    </Panel>

    <CtaCard title="Try it in ten seconds." text="Capture one thing today and watch the Smarty Assistant do the rest." />
  </div>
);

export default HowItWorksPage;
