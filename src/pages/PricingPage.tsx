import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PageHeader, plans } from '@/lib/marketing';

const PricingPage = () => (
  <div className="mx-auto max-w-3xl px-5 py-10">
    <PageHeader eyebrow="Pricing" title="Start free. Grow smarter." subtitle="The longer you use it, the more valuable it becomes." />
    <div className="grid gap-3 md:grid-cols-3">
      {plans.map((p) => (
        <div key={p.name} className={`smarty-card relative p-5 ${p.featured ? 'ring-2 ring-primary shadow-elevated' : ''}`}>
          {p.featured && (
            <span className="absolute -top-3 left-5 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Most popular
            </span>
          )}
          <p className="text-sm font-bold text-foreground">{p.name}</p>
          <p className="mt-2 text-3xl font-extrabold text-foreground">
            {p.price}<span className="ml-1 text-xs font-medium text-muted-foreground">{p.note}</span>
          </p>
          <ul className="mt-4 space-y-2">
            {p.points.map((pt) => (
              <li key={pt} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> {pt}
              </li>
            ))}
          </ul>
          <Link
            to="/auth"
            className={`mt-5 flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-smooth active:scale-95 ${
              p.featured ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'border border-border bg-card text-foreground'
            }`}
          >
            {p.cta}
          </Link>
        </div>
      ))}
    </div>
  </div>
);

export default PricingPage;
