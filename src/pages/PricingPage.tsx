import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PageHeader, plans, faqs } from '@/lib/marketing';

const PricingPage = () => (
  <div className="mx-auto max-w-4xl px-4 py-8 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="Pricing"
      title="Two plans. One simple difference."
      subtitle="Free keeps your life in one place. Premium adds the Smarty Assistant that organises, connects and answers."
    />

    <div className="grid gap-3 md:grid-cols-2">
      {plans.map((p) => (
        <div key={p.name} className={`smarty-card relative p-5 sm:p-6 ${p.featured ? 'ring-2 ring-primary shadow-elevated' : ''}`}>
          {p.featured && (
            <span className="absolute -top-3 left-5 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Recommended
            </span>
          )}
          <p className="text-sm font-bold text-foreground">{p.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{p.tagline}</p>
          <p className="mt-3 text-4xl font-extrabold text-foreground">
            {p.price}
            <span className="ml-1.5 text-xs font-medium text-muted-foreground">{p.note}</span>
          </p>
          <ul className="mt-5 space-y-2">
            {p.points.map((pt) => (
              <li key={pt} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {pt}
              </li>
            ))}
          </ul>
          <Link
            to="/auth"
            className={`mt-6 flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-smooth active:scale-95 ${
              p.featured ? 'bg-gradient-primary text-primary-foreground shadow-glow' : 'border border-border bg-card text-foreground'
            }`}
          >
            {p.cta}
          </Link>
        </div>
      ))}
    </div>

    <p className="mt-4 text-center text-xs text-muted-foreground">
      All prices in euros. Cancel any time — your data stays exportable.
    </p>

    <section className="mt-10">
      <h2 className="mb-4 text-lg font-extrabold tracking-tight text-foreground md:text-2xl">Good to know</h2>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {faqs.slice(2, 6).map((f) => (
          <div key={f.q} className="smarty-card p-4 sm:p-5">
            <p className="text-sm font-bold text-foreground">{f.q}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

export default PricingPage;
