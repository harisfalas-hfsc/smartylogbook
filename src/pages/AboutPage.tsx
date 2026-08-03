import { Sparkles, Layers, ShieldCheck } from 'lucide-react';
import { Panel, MiniRow, PageHeader, CtaCard } from '@/lib/marketing';
import { MODULES } from '@/lib/constants';

const pillars = [
  { e: '📥', t: 'Put anything in', s: 'Type it, say it, snap it, upload it.' },
  { e: '🧠', t: 'It understands', s: 'Reads it and pulls out the details itself.' },
  { e: '🔗', t: 'It relates', s: 'A scan links to an old injury. A receipt to a monthly bill.' },
  { e: '💬', t: 'Ask in plain words', s: '"What did the doctor say in March?" It answers.' },
];

const promises = [
  { e: '📂', t: 'No filing', s: 'It lands in the right place on its own — move it if you disagree.' },
  { e: '🏷️', t: 'No busywork', s: 'Tags, dates and amounts are written for you.' },
  { e: '🔒', t: 'Private by default', s: 'Encrypted, yours only, export or delete any time.' },
];

const AboutPage = () => (
  <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="About"
      title="Smarty Logbook — a logbook with a brain."
      subtitle="Put anything in. It understands it, relates it to the rest of your life, and finds it the moment you ask."
    />

    <Panel
      eyebrow="The idea"
      eyebrowEmoji="✨"
      badge={Sparkles}
      title={<>A logbook <span className="gradient-text">with a brain.</span></>}
      lead="You put things in; the Smarty Assistant makes sense of them. Six seconds of effort from you — everything after that is Smarty Logbook."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {pillars.map((p) => (
          <MiniRow key={p.t} emoji={p.e} title={p.t} text={p.s} />
        ))}
      </div>
    </Panel>

    <Panel
      eyebrow="Life modules"
      eyebrowEmoji="🗂️"
      badge={Layers}
      title={<>It files it — <span className="gradient-text">you stay in control.</span></>}
      lead="Every entry lands in the right area on its own. You can always move it yourself."
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {MODULES.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5 rounded-2xl border border-primary/15 bg-card p-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${m.tint}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </span>
            <p className="text-[13px] font-bold leading-tight text-foreground">{m.label}</p>
          </div>
        ))}
      </div>
    </Panel>

    <Panel
      eyebrow="The promise"
      eyebrowEmoji="🤝"
      badge={ShieldCheck}
      title={<>Effortless, and <span className="gradient-text">private.</span></>}
      lead="Free to start. Premium unlocks the Smarty Assistant for €9.99 per month."
    >
      <div className="grid gap-2 sm:grid-cols-3">
        {promises.map((p) => (
          <MiniRow key={p.t} emoji={p.e} title={p.t} text={p.s} />
        ))}
      </div>
    </Panel>

    <CtaCard text="Free to begin. Capture your first memory in under ten seconds — the Smarty Assistant handles the rest." />
  </div>
);

export default AboutPage;
