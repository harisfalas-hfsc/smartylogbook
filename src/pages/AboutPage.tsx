import { Sparkles, Layers, ShieldCheck, Plus } from 'lucide-react';
import { Panel, PageHeader, CtaCard, ExplainerRow } from '@/lib/marketing';
import { MODULES } from '@/lib/constants';
import PillarsCircle from '@/components/PillarsCircle';
import LifeModulesOrbit from '@/components/LifeModulesOrbit';

const pillars = [
  { e: '📥', t: 'Put anything in', s: 'Type it, say it, snap it, upload it.' },
  { e: '🧠', t: 'It understands', s: 'Reads it and pulls out the details itself.' },
  { e: '🔗', t: 'It relates', s: 'A scan links to an old injury. A receipt to a monthly bill.' },
  { e: '💬', t: 'Ask in plain words', s: '"What did the doctor say in March?" It answers.' },
];

const promises = ['no-filing', 'no-busywork', 'private-by-default'];


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
      <PillarsCircle items={pillars} />
    </Panel>


    <Panel
      eyebrow="Life categories"
      eyebrowEmoji="🗂️"
      badge={Layers}
      title={<>It files it, <span className="gradient-text">you stay in control.</span></>}
      lead="Every entry lands in the right area on its own. Move it whenever you disagree, or create a category of your own."
    >
      <div className="sm:hidden">
        <LifeModulesOrbit />
      </div>
      <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {MODULES.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5 rounded-2xl border border-primary/15 bg-card p-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${m.tint}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </span>
            <p className="text-[13px] font-bold leading-tight text-foreground">{m.label}</p>
          </div>
        ))}
        <div className="flex items-center gap-2.5 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Plus className="h-4 w-4 text-primary" />
          </span>
          <p className="text-[13px] font-bold leading-tight text-primary">Add your own</p>
        </div>
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
