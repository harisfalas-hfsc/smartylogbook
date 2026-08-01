import { Star } from 'lucide-react';
import { PageHeader, testimonials } from '@/lib/marketing';

const TestimonialsPage = () => (
  <div className="mx-auto max-w-3xl px-5 py-10">
    <PageHeader eyebrow="Testimonials" title="People who stopped forgetting." subtitle="Real stories from the Smarty Wellness community." />
    <div className="grid gap-2.5 md:grid-cols-3">
      {testimonials.map((t) => (
        <div key={t.name} className="smarty-card p-5">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
            ))}
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-foreground">"{t.text}"</p>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">{t.name} · {t.role}</p>
        </div>
      ))}
    </div>
  </div>
);

export default TestimonialsPage;
