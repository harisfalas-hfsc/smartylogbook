import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageHeader, faqs } from '@/lib/marketing';

const FaqPage = () => (
  <div className="mx-auto max-w-3xl px-5 py-10">
    <PageHeader eyebrow="FAQ" title="Everything else you're wondering." />
    <Accordion type="single" collapsible className="space-y-2.5">
      {faqs.map((f, i) => (
        <AccordionItem key={f.q} value={`item-${i}`} className="smarty-card border-none px-5">
          <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">{f.q}</AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);

export default FaqPage;
