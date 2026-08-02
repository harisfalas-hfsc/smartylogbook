import { Brain, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import { Panel, SubCard, MiniRow, Divider, DesktopOnly, PageHeader, CtaCard, BrandText, features } from '@/lib/marketing';
import { MODULES } from '@/lib/constants';

const pillars = [
  { e: '📥', t: 'Put anything in', s: 'Type it, say it, snap it, upload it.' },
  { e: '🧠', t: 'It understands', s: 'Reads it and pulls out the details itself.' },
  { e: '🔗', t: 'It relates', s: 'A scan links to an old injury. A receipt to a monthly bill.' },
  { e: '💬', t: 'Ask in plain words', s: '"What did the doctor say in March?" It answers.' },
];

const problemsShort = [
  { e: '📱', t: 'Ten apps, one life', s: 'Everything scattered, nothing connected.' },
  { e: '🗒️', t: 'Notes go to die', s: 'Written once, never read again.' },
  { e: '🧾', t: 'Paper disappears', s: 'Receipts and reports lost in a camera roll.' },
  { e: '🔁', t: 'No learning', s: 'You remember the past but never learn from it.' },
];

const assistantPowers = [
  { e: '🗣️', t: 'Talk to it', s: 'Text or voice, attach a photo or document.' },
  { e: '🔎', t: 'Knows your logbook', s: 'Every answer grounded in what you captured.' },
  { e: '🧩', t: 'Links everything', s: 'New entries attach to the ones they belong with.' },
  { e: '📌', t: 'Plans ahead', s: 'Reminders and follow-ups created for you.' },
  { e: '❓', t: 'Asks, never guesses', s: 'Missing a date or amount? It asks one question.' },
  { e: '☀️', t: 'Daily brief', s: 'One headline, the actions that matter, nothing else.' },
];

const promises = [
  { e: '📂', t: 'No filing', s: 'It lands in the right place on its own — and you can move it if you disagree.' },
  { e: '🏷️', t: 'No busywork', s: 'Tags, dates and amounts are written for you.' },
  { e: '🗣️', t: 'Plain language', s: 'Summaries you can read, not numbers to decode.' },
];

const privacy = [
  { e: '🔒', t: 'Encrypted storage', s: 'Protected in transit and at rest.' },
  { e: '🙋', t: 'Yours only', s: 'Every entry gated behind your account.' },
  { e: '📤', t: 'Export or delete', s: 'Take everything, or erase it, any time.' },
];

const AboutPage = () => (
  <div className="mx-auto max-w-6xl px-3 py-7 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="About"
      title="Smarty Logbook — a logbook with a brain."
      subtitle="Put anything in: type it, say it, snap it, upload it. It understands it, relates it to the rest of your life, keeps it and finds it the moment you ask."
    />

    <Panel
      eyebrow="Our mission"
      eyebrowEmoji="🌱"
      badge={Sparkles}
      title={<>Your life, <span className="gradient-text">remembered.</span></>}
      lead="Smarty Logbook takes the work of organising, filing and remembering off your hands. You throw things in; the Smarty Assistant makes sense of them."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <SubCard label="How it feels" labelEmoji="✨">
          <div className="grid gap-2 sm:grid-cols-2">
            {pillars.map((p) => (
              <MiniRow key={p.t} emoji={p.e} title={p.t} text={p.s} />
            ))}
          </div>
          <DesktopOnly>
            <Divider />
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              <BrandText>Six seconds of effort from you. Everything after that is Smarty Logbook.</BrandText>
            </p>
          </DesktopOnly>
        </SubCard>

        <DesktopOnly>
          <SubCard label="Why it exists" labelEmoji="⚠️">
            <div className="grid gap-2">
              {problemsShort.map((p) => (
                <MiniRow key={p.t} emoji={p.e} title={p.t} text={p.s} />
              ))}
            </div>
          </SubCard>
        </DesktopOnly>
      </div>
    </Panel>

    <Panel
      eyebrow="What powers Smarty Logbook"
      eyebrowEmoji="🧠"
      badge={Brain}
      title={<>The <span className="gradient-text">Smarty Assistant</span></>}
      lead="The brain behind everything — included with Premium. It reads, files, links, reminds and answers, so your logbook stays organised without you touching it."
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {assistantPowers.map((a, i) => {
          const row = <MiniRow key={a.t} emoji={a.e} title={a.t} text={a.s} />;
          return i < 4 ? row : <DesktopOnly key={a.t}>{row}</DesktopOnly>;
        })}
      </div>
    </Panel>

    <Panel
      eyebrow="Everything it does"
      eyebrowEmoji="⚡"
      badge={Layers}
      title={<>Twelve things you <span className="gradient-text">never do again.</span></>}
      lead="No setup, no maintenance, no organising — the whole feature set works in the background."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <SubCard label="Capture & understand" labelEmoji="📥">
          <div className="grid gap-2">
            {features.slice(0, 6).map((f, i) => {
              const row = <MiniRow key={f.title} emoji={f.emoji} title={f.title} text={f.text} />;
              return i < 4 ? row : <DesktopOnly key={f.title}>{row}</DesktopOnly>;
            })}
          </div>
        </SubCard>
        <DesktopOnly>
          <SubCard label="Recall & guidance" labelEmoji="💡">
            <div className="grid gap-2">
              {features.slice(6).map((f) => (
                <MiniRow key={f.title} emoji={f.emoji} title={f.title} text={f.text} />
              ))}
            </div>
          </SubCard>
        </DesktopOnly>
      </div>
    </Panel>

    <Panel
      eyebrow="Life modules"
      eyebrowEmoji="🗂️"
      badge={Layers}
      title={<>You never choose <span className="gradient-text">where it goes.</span></>}
      lead="Every memory lands in the right module automatically. These are the areas your life gets filed into."
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <div key={m.id} className="rounded-2xl border border-primary/15 bg-card p-3.5">
            <div className="flex items-center gap-2.5">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${m.tint}`}>
                <m.icon className={`h-4 w-4 ${m.color}`} />
              </span>
              <p className="text-sm font-bold text-foreground">{m.label}</p>
            </div>
            <p className="mt-2 hidden text-[11.5px] leading-relaxed text-muted-foreground sm:block">{m.description}</p>
            <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
              {m.topics.slice(0, 4).map((t) => (
                <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {t}
                </span>
              ))}
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
      lead="Free to start. Premium unlocks the Smarty Assistant for €9.99 per month."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <SubCard label="What you never deal with" labelEmoji="🚫">
          <div className="grid gap-2">
            {promises.map((p) => (
              <MiniRow key={p.t} emoji={p.e} title={p.t} text={p.s} />
            ))}
          </div>
        </SubCard>
        <DesktopOnly>
          <SubCard label="Your data" labelEmoji="🔐">
            <div className="grid gap-2">
              {privacy.map((p) => (
                <MiniRow key={p.t} emoji={p.e} title={p.t} text={p.s} />
              ))}
            </div>
          </SubCard>
        </DesktopOnly>
      </div>
    </Panel>

    <CtaCard text="Free to begin. Capture your first memory in under ten seconds — the Smarty Assistant handles the rest." />
  </div>
);

export default AboutPage;
