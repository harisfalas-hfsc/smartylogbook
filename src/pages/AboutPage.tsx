import { CheckCircle2 } from 'lucide-react';
import { Block, PageHeader, problems } from '@/lib/marketing';

const AboutPage = () => (
  <div className="mx-auto max-w-3xl px-5 py-10">
    <PageHeader
      eyebrow="About"
      title="Your life is bigger than your memory."
      subtitle="Smarty Logbook is a personal operating system: one place where everything that happens to you is captured, understood and connected."
    />

    <Block title="The problem">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {problems.map((p) => (
          <div key={p} className="smarty-card p-4 text-sm font-medium text-muted-foreground">{p}</div>
        ))}
      </div>
    </Block>

    <Block title="The solution">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          { t: 'No folders', s: 'Nothing to file. Nothing to name.' },
          { t: 'No tags', s: 'The AI writes them for you.' },
          { t: 'No searching', s: 'Just ask a question in plain language.' },
        ].map((c) => (
          <div key={c.t} className="smarty-card p-5">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <p className="mt-2.5 text-sm font-bold text-foreground">{c.t}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.s}</p>
          </div>
        ))}
      </div>
    </Block>

    <Block title="The ecosystem">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Smarty Gym, Smarty Diet and Smarty Move feed the Logbook with training, nutrition and movement data.
        The Logbook analyses everything together and returns personalised guidance to each app — one brain
        behind your whole wellness life.
      </p>
    </Block>
  </div>
);

export default AboutPage;
