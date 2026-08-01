import { Block, PageHeader, features } from '@/lib/marketing';
import { MODULES } from '@/lib/constants';

const FeaturesPage = () => (
  <div className="mx-auto max-w-3xl px-5 py-10">
    <PageHeader
      eyebrow="Features"
      title="Everything you need. Nothing you don't."
      subtitle="Designed mobile-first, so it works with one thumb, on the move, in three seconds."
    />

    <Block>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="smarty-card p-5">
            <f.icon className="h-5 w-5 text-primary" />
            <p className="mt-2.5 text-sm font-bold text-foreground">{f.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </div>
    </Block>

    <Block title="Modules">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {MODULES.map((m) => (
          <div key={m.id} className="smarty-card p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${m.tint}`}>
              <m.icon className={`h-4.5 w-4.5 ${m.color}`} />
            </div>
            <p className="mt-2.5 text-sm font-bold text-foreground">{m.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
          </div>
        ))}
      </div>
    </Block>
  </div>
);

export default FeaturesPage;
