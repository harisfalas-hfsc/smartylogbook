import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Sparkles, CreditCard, ShieldCheck } from 'lucide-react';
import { PageHeader, Panel, BrandText, faqs } from '@/lib/marketing';

const groups = [
  {
    eyebrow: 'The basics',
    emoji: '🧭',
    badge: HelpCircle,
    title: <>What <span className="gradient-text">is</span> it?</>,
    range: [0, 4] as const,
    accent: 'border-primary/45',
    chip: 'bg-primary/10 text-primary',
  },
  {
    eyebrow: 'Capture & AI',
    emoji: '🧠',
    badge: Sparkles,
    title: <>How the <span className="gradient-text">Assistant</span> works</>,
    range: [4, 12] as const,
    accent: 'border-accent/45',
    chip: 'bg-accent/10 text-accent',
  },
  {
    eyebrow: 'Plans & pricing',
    emoji: '💶',
    badge: CreditCard,
    title: <>What it <span className="gradient-text">costs</span></>,
    range: [12, 19] as const,
    accent: 'border-mod-finance/45',
    chip: 'bg-mod-finance/10 text-mod-finance',
  },
  {
    eyebrow: 'Privacy & limits',
    emoji: '🔒',
    badge: ShieldCheck,
    title: <>Your <span className="gradient-text">data</span></>,
    range: [19, 23] as const,
    accent: 'border-mod-health/45',
    chip: 'bg-mod-health/10 text-mod-health',
  },
];

const FaqPage = () => (
  <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="FAQ"
      title="Everything else you're wondering about Smarty Logbook."
    />

    {groups.map((g) => (
      <Panel key={g.eyebrow} eyebrow={g.eyebrow} eyebrowEmoji={g.emoji} badge={g.badge} title={g.title}>
        <Accordion type="single" collapsible className="space-y-2.5">
          {faqs.slice(g.range[0], g.range[1]).map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`${g.eyebrow}-${i}`}
              className={`rounded-2xl border ${g.accent} bg-card px-3.5 sm:px-4`}
            >
              <AccordionTrigger className="gap-3 py-3.5 text-left text-[13px] font-bold leading-snug hover:no-underline sm:text-sm">
                <span className="flex items-start gap-2.5">
                  <span
                    className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold ${g.chip}`}
                  >
                    {g.range[0] + i + 1}
                  </span>
                  <span>{f.q}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pl-[34px] text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                <BrandText>{f.a}</BrandText>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Panel>
    ))}
  </div>
);

export default FaqPage;
