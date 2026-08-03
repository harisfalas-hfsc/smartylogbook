import { Wand2, Brain } from 'lucide-react';
import { Panel, SubCard, MiniRow, PageHeader, steps, givesIn, givesBack, DesktopIntro } from '@/lib/marketing';
import StepsCircle from '@/components/StepsCircle';


const HowItWorksPage = () => (
  <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="How it works"
      title="You put it in. Smarty Logbook does the thinking."
      subtitle="Four ways in — type, say, snap, upload. Then it understands, relates, remembers and finds it for you."
    />

    <DesktopIntro
      title="How Smarty Logbook works, end to end"
      lead="There are four ways in — type it, say it, snap it or upload it — and one way out: you ask. In between, the Smarty Assistant reads every entry, extracts the details that matter, files it into the right life module without asking you, connects it to related entries so your logbook becomes a map of your life, and schedules the follow-ups, renewals and appointments it finds. Every morning it hands you a short brief of what actually matters today."
      points={[
        { e: '📥', t: 'Four ways in', s: 'Type, voice, photo or file — one tap.' },
        { e: '🧠', t: 'It understands', s: 'Dates, amounts and details extracted.' },
        { e: '🔗', t: 'It connects', s: 'New entries link to what you already have.' },
        { e: '💬', t: 'You just ask', s: 'Plain language in, real answers back.' },
      ]}
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

  </div>
);

export default HowItWorksPage;
