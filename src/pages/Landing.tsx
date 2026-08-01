import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Clock, Sparkles } from 'lucide-react';

const highlights = [
  { icon: Sparkles, t: 'Capture in 3 seconds', s: 'Voice, photo or text. No folders, no tags.' },
  { icon: Clock, t: 'One life timeline', s: 'Everything you do, in one continuous feed.' },
  { icon: Brain, t: 'It thinks for you', s: 'Patterns, answers and a daily brief from Smarty Assistant.' },
];

const Landing = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-halo" />
        <div className="relative mx-auto w-full max-w-5xl px-5 md:px-8 pb-10 pt-12 text-center md:pb-16 md:pt-20">
          <span className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by the Smarty Assistant
          </span>
          <h1 className="mx-auto mt-5 animate-fade-up text-[30px] font-extrabold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            The <span className="gradient-text">Smarty Logbook</span> that remembers{' '}
            <span className="gradient-text">your life</span> better than you do.
          </h1>
          <p className="mx-auto mt-4 max-w-md animate-fade-up text-sm leading-relaxed text-muted-foreground md:text-base">
            Capture anything. It organises, understands and connects the rest.
          </p>
          <div className="mt-7 flex animate-fade-up flex-col items-center gap-2.5">
            <Link
              to="/auth"
              className="flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-95"
            >
              Get Started free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground shadow-soft transition-smooth active:scale-95"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Three highlights */}
      <section className="mx-auto w-full max-w-5xl px-5 md:px-8 pb-10">
        <div className="grid gap-2.5 md:grid-cols-3">
          {highlights.map((h) => (
            <div key={h.t} className="smarty-card flex items-start gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
                <h.icon className="h-5 w-5 text-primary-foreground" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">{h.t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{h.s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Landing;
