import { Block, PageHeader, CtaCard, features } from '@/lib/marketing';
import { MODULES } from '@/lib/constants';

const assistantPowers = [
  { e: '🗣️', t: 'Talk to it', s: 'Chat by text or voice, attach a photo or a document and ask what it means.' },
  { e: '🔎', t: 'It knows your logbook', s: 'Every answer is grounded in what you actually captured.' },
  { e: '🧩', t: 'It links everything', s: 'New entries attach to the older ones they belong with.' },
  { e: '📌', t: 'It plans ahead', s: 'Reminders, renewals and follow-ups created automatically.' },
];

const FeaturesPage = () => (
  <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="Features & Modules"
      title="Everything you need. Nothing you don't."
      subtitle="Built mobile-first, so it works with one thumb, on the move, in three seconds."
    />

    <Block title="The Smarty Assistant" subtitle="The brain behind every feature. Included with Premium.">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {assistantPowers.map((a) => (
          <div key={a.t} className="smarty-card p-4 sm:p-5">
            <span className="text-xl leading-none">{a.e}</span>
            <p className="mt-2.5 text-sm font-bold text-foreground">{a.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.s}</p>
          </div>
        ))}
      </div>
    </Block>

    <Block title="Features" subtitle="Twelve things it does so you don't have to.">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="smarty-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{f.emoji}</span>
              <f.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2.5 text-sm font-bold text-foreground">{f.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </div>
    </Block>

    <Block title="Modules" subtitle="You never choose one — the Assistant files each memory where it belongs.">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {MODULES.map((m) => (
          <div key={m.id} className="smarty-card p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${m.tint}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <p className="mt-2.5 text-sm font-bold text-foreground">{m.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{m.description}</p>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {m.topics.slice(0, 4).map((t) => (
                <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Block>

    <CtaCard title="One app instead of ten." />
  </div>
);

export default FeaturesPage;
