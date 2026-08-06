import { Sparkles, ShieldCheck, Brain, Clock, Lock, Zap } from 'lucide-react';
import { Panel, PageHeader, CtaCard, ExplainerRow } from '@/lib/marketing';
import InputsCircle from '@/components/InputsCircle';


const promises = ['no-filing', 'no-busywork', 'private-by-default'];

const highlights = [
  { icon: Sparkles, t: 'Capture in 3 seconds', s: 'Type, say or snap it.' },
  { icon: Clock, t: 'One life timeline', s: 'Everything in one feed.' },
  { icon: Brain, t: 'It thinks for you', s: 'Patterns and answers.' },
  { icon: Lock, t: 'Always private', s: 'Encrypted, yours only.' },
];




const AboutPage = () => {
  return (
  <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="About"
      title={
        <>
          <span className="block gradient-text">Smarty Logbook.</span>
          <span className="block gradient-text">A logbook with a brain.</span>
        </>
      }
      subtitle="Put anything in. It understands it, relates it to the rest of your life, and finds it the moment you ask."
    />



    <Panel
      eyebrow="The idea"
      eyebrowEmoji="✨"
      badge={Sparkles}
      title={<>A logbook <span className="gradient-text">with a brain.</span></>}
      lead="You put things in; the Smarty Assistant makes sense of them. Six seconds of effort from you, everything after that is Smarty Logbook."
    >
      <InputsCircle />
    </Panel>


    <Panel
      eyebrow="Why it works"
      eyebrowEmoji="⚡"
      badge={Zap}
      title={<>Four reasons it <span className="gradient-text">feels effortless.</span></>}
      lead="Small effort in, a lot of clarity out."
    >
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((h) => (
          <div key={h.t} className="smarty-sub flex h-full items-center gap-3 rounded-3xl border-2 border-primary/30 bg-secondary/50 p-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
              <h.icon className="h-5 w-5 text-primary-foreground" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{h.t}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{h.s}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>


    <Panel
      eyebrow="The promise"
      eyebrowEmoji="🤝"
      badge={ShieldCheck}

      title={<>Effortless, and <span className="gradient-text">private.</span></>}
      lead="Free to start, always private. Tap any card to see exactly what it means."
    >
      <div className="grid gap-2 sm:grid-cols-3">
        {promises.map((id) => (
          <ExplainerRow key={id} id={id} />
        ))}
      </div>

    </Panel>

    <CtaCard text="Free to begin. Capture your first memory in under ten seconds, the Smarty Assistant handles the rest." />
  </div>
  );
};

export default AboutPage;
