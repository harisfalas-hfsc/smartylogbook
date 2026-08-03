import { Wand2, Brain, CreditCard } from 'lucide-react';
import { Panel, SubCard, MiniRow, DesktopOnly, PageHeader, CtaCard, steps, givesIn, givesBack } from '@/lib/marketing';
import StepsCircle from '@/components/StepsCircle';


const HowItWorksPage = () => (
  <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-10">
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
      lead="No forms, no naming, no filing."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <SubCard label="You put in" labelEmoji="📥">
          <div className="grid grid-cols-2 gap-2">
            {givesIn.map((c) => (
              <MiniRow key={c.t} emoji={c.e} title={c.t} text={c.s} tint={c.tint} />
            ))}
          </div>
        </SubCard>
        <SubCard label="It gives back" labelEmoji="✨">
          <div className="grid grid-cols-2 gap-2">
            {givesBack.map((c) => (
              <MiniRow key={c.t} emoji={c.e} title={c.t} text={c.s} tint={c.tint} />
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
      lead="Six quiet stages, in order, every time."
    >
      {/* Mobile: circular connected flow */}
      <div className="lg:hidden">
        <StepsCircle />
      </div>

      {/* Desktop: unchanged list */}
      <div className="hidden gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="flex items-center gap-2.5 rounded-2xl border border-primary/15 bg-card p-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <s.icon className="h-4 w-4 text-primary-foreground" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-tight text-foreground">
                <span className="text-primary">{i + 1}.</span> {s.title}
              </p>
              <p className="mt-0.5 hidden text-[11.5px] leading-snug text-muted-foreground sm:block">{s.text}</p>
            </div>
          </div>
        ))}
      </div>

    </Panel>

    <Panel
      eyebrow="What it costs"
      eyebrowEmoji="💶"
      badge={CreditCard}
      title={<>Free to keep. <span className="gradient-text">Paid to think.</span></>}
      lead="The logbook itself never costs anything. Smarty Assistant is the only paid part."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <SubCard label="Free forever — €0" labelEmoji="♾️">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <MiniRow emoji="📥" title="Unlimited capture" text="Text, voice, photos, PDFs — no storage limits." />
            <MiniRow emoji="🗂️" title="Timeline & search" text="Filter by day, week, month or year and find anything you saved." />
          </div>
        </SubCard>
        <SubCard label="Smarty Premium — €9.99 / month" labelEmoji="✨">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <MiniRow emoji="💬" title="300 AI Conversations" text="About 10 a day. One conversation is one topic, follow-ups included." />
            <MiniRow emoji="🧠" title="The Assistant switches on" text="Reasoning, analysis, predictions and your daily brief." />
          </div>
        </SubCard>
      </div>
      <DesktopOnly>
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
          Capturing, classifying, searching and reminders never use a conversation — you only spend one when the
          Assistant actually thinks for you.
        </p>
      </DesktopOnly>
    </Panel>

    <CtaCard title="Try it in ten seconds." text="Capture one thing today and watch the Smarty Assistant do the rest." />
  </div>
);

export default HowItWorksPage;
