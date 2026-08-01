import { Link } from 'react-router-dom';
import {
  ArrowRight, Brain, Camera, CheckCircle2, Clock, Fingerprint, Layers, LineChart,
  Lock, Mic, PlayCircle, Search, Shield, Sparkles, Star, Wand2, Zap,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MODULES } from '@/lib/constants';

const problems = [
  'Your life is scattered across ten apps.',
  'Notes get written and never read again.',
  'Receipts, reports and ideas disappear.',
  'You remember the past, but never learn from it.',
];

const steps = [
  { icon: Camera, title: 'Capture', text: 'One tap. Text, voice, photo, receipt, report — anything.' },
  { icon: Wand2, title: 'Understand', text: 'The AI classifies, summarises and tags it instantly.' },
  { icon: Layers, title: 'Connect', text: 'Every memory joins one continuous life timeline.' },
  { icon: LineChart, title: 'Guide', text: 'Patterns become insight, insight becomes better decisions.' },
];

const features = [
  { icon: Sparkles, title: 'Quick Capture', text: 'Voice, camera and text capture always one thumb away.' },
  { icon: Clock, title: 'Universal Timeline', text: 'Everything in chronological order. Like Instagram, for your life.' },
  { icon: Search, title: 'Ask anything', text: '"How much did I spend on restaurants?" Natural language search.' },
  { icon: Brain, title: 'Behaviour intelligence', text: 'It notices what you never would — patterns across months.' },
  { icon: Zap, title: 'Predictive AI', text: 'Warns you before recovery drops or the budget breaks.' },
  { icon: Shield, title: 'Privacy first', text: 'Encrypted storage, biometric lock, your data stays yours.' },
];

const insights = [
  'You sleep better on days you train before 6pm.',
  'You spend 41% more every Friday evening.',
  'Your productivity drops the day after poor sleep.',
  'Your shoulder pain increases after heavy pressing.',
  'Recovery improves on days with a 20 minute walk.',
];

const plans = [
  { name: 'Starter', price: '$0', note: 'forever', points: ['Unlimited notes', 'Universal timeline', 'Basic AI search', '1 device'], cta: 'Start free' },
  { name: 'Pro', price: '$9', note: 'per month', points: ['Unlimited AI capture', 'Predictive insights', 'Daily AI coach', 'All modules', 'Multi-device sync'], cta: 'Go Pro', featured: true },
  { name: 'Ecosystem', price: '$19', note: 'per month', points: ['Everything in Pro', 'Smarty Gym + Diet + Move', 'Wearable integrations', 'Priority AI models'], cta: 'Join ecosystem' },
];

const testimonials = [
  { name: 'Elena R.', role: 'Founder', text: 'It found the connection between my sleep and my worst work days. Nothing else ever told me that.' },
  { name: 'Marcus T.', role: 'Athlete', text: 'Every session, every ache, every meal — one place. My physio asks for the export now.' },
  { name: 'Sofia K.', role: 'Doctor', text: 'I photograph a report and forget it. The AI remembers it better than I ever could.' },
];

const faqs = [
  { q: 'Is Smarty Logbook another note app?', a: 'No. Notes store text. Smarty Logbook understands it — classifying, connecting and analysing everything you capture into one intelligent life timeline.' },
  { q: 'Do I need to organise anything?', a: 'Never. No folders, no tags, no manual filing. Capture it and the AI takes care of the rest.' },
  { q: 'How private is my data?', a: 'Privacy-first architecture with encrypted storage, biometric unlock and full export or deletion at any time.' },
  { q: 'Does it work with my watch?', a: 'Apple Health, Google Health Connect, Garmin, Polar, Whoop, Oura and Fitbit integrations are modular and rolling out continuously.' },
  { q: 'How does it fit the Smarty ecosystem?', a: 'Smarty Gym, Diet and Move feed the Logbook. The Logbook analyses everything and returns personalised recommendations to each app.' },
];

const Section = ({ id, eyebrow, title, subtitle, children }: {
  id?: string; eyebrow: string; title: string; subtitle?: string; children: React.ReactNode;
}) => (
  <section id={id} className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
    <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
      <span className="inline-block rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground md:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#how" className="transition-smooth hover:text-foreground">How it works</a>
            <a href="#features" className="transition-smooth hover:text-foreground">Features</a>
            <a href="#pricing" className="transition-smooth hover:text-foreground">Pricing</a>
            <a href="#faq" className="transition-smooth hover:text-foreground">FAQ</a>
          </nav>
          <Link
            to="/auth"
            className="rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-halo" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 text-center md:pb-24 md:pt-24">
          <span className="inline-flex animate-fade-in items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Part of the Smarty Wellness ecosystem
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl animate-fade-up text-[32px] font-extrabold leading-[1.08] tracking-tight text-foreground md:text-6xl">
            The AI That Remembers <span className="gradient-text">Your Life</span> Better Than You Do.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl animate-fade-up text-sm leading-relaxed text-muted-foreground md:text-lg">
            Your personal operating system that captures, organizes, understands and connects
            everything that happens in your life.
          </p>
          <div className="mt-8 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-95 sm:w-auto"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground shadow-soft transition-smooth active:scale-95 sm:w-auto"
            >
              <PlayCircle className="h-4 w-4 text-primary" /> Watch Demo
            </a>
            <a href="#features" className="text-sm font-semibold text-muted-foreground transition-smooth hover:text-foreground">
              Learn More
            </a>
          </div>

          {/* Phone mock */}
          <div className="relative mx-auto mt-14 w-full max-w-[300px] animate-fade-up md:max-w-[340px]">
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-glow blur-2xl" />
            <div className="relative rounded-[2.5rem] border border-border bg-card p-3 shadow-elevated">
              <div className="rounded-[2rem] bg-gradient-surface p-4 text-left">
                <p className="text-[11px] font-semibold text-muted-foreground">Good morning, Alex</p>
                <p className="mt-1 text-lg font-extrabold text-foreground">Today's one thing</p>
                <div className="mt-3 rounded-2xl bg-gradient-primary p-3.5 text-primary-foreground shadow-glow">
                  <p className="text-[11px] font-semibold opacity-80">Daily AI Coach</p>
                  <p className="mt-1 text-sm font-semibold leading-snug">
                    Sleep was short two nights running — walk 20 minutes and skip the heavy press today.
                  </p>
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    { t: 'Upper body · 48 min', s: 'Fitness · 07:10' },
                    { t: 'Blood test uploaded', s: 'Health · 09:32' },
                    { t: 'Lunch — grilled salmon', s: 'Nutrition · 13:05' },
                    { t: 'Receipt · $42.10 groceries', s: 'Finance · 18:22' },
                  ].map((row) => (
                    <div key={row.t} className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card p-2.5">
                      <div className="h-8 w-8 rounded-xl bg-gradient-primary opacity-90" />
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-foreground">{row.t}</p>
                        <p className="text-[10px] text-muted-foreground">{row.s}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <Section eyebrow="The Problem" title="Your life is bigger than your memory."
        subtitle="Everything important gets scattered, forgotten or filed somewhere you'll never look again.">
        <div className="grid gap-3 sm:grid-cols-2">
          {problems.map((p) => (
            <div key={p} className="smarty-card p-5 text-sm font-medium text-muted-foreground">{p}</div>
          ))}
        </div>
      </Section>

      {/* Solution */}
      <Section eyebrow="The Solution" title="One continuous timeline. One intelligent brain."
        subtitle="Everything is a memory: every workout, meal, meeting, receipt, report, idea and thought — understood, not just stored.">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { t: 'No folders', s: 'Nothing to file. Nothing to name. Nothing to maintain.' },
            { t: 'No tags', s: 'The AI writes them for you and keeps them consistent.' },
            { t: 'No searching', s: 'Ask a question in plain language and get the answer.' },
          ].map((c) => (
            <div key={c.t} className="smarty-card p-6">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <p className="mt-3 text-base font-bold text-foreground">{c.t}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.s}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how" eyebrow="How It Works" title="Four seconds from thought to memory."
        subtitle="Capture is instant. Everything else happens on its own.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="smarty-card relative p-6">
              <span className="absolute right-5 top-5 text-3xl font-extrabold text-secondary">{i + 1}</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
                <s.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="mt-4 text-base font-bold text-foreground">{s.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Intelligence */}
      <Section eyebrow="AI Intelligence" title="It notices what you never would."
        subtitle="Behaviour intelligence runs quietly in the background, comparing months of your life.">
        <div className="mx-auto max-w-2xl space-y-2.5">
          {insights.map((i) => (
            <div key={i} className="glass flex items-center gap-3 rounded-3xl p-4 shadow-soft">
              <Brain className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm font-medium text-foreground">{i}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Predictive */}
      <Section eyebrow="Predictive AI" title="Tomorrow, before it happens."
        subtitle="Not a report about yesterday — a warning in time to act.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {['Recovery is declining', 'Hydration is low', 'Stress is increasing', 'Budget will be exceeded', 'Fatigue likely within 2 days', "You haven't contacted an important client"].map((p) => (
            <div key={p} className="smarty-card flex items-center gap-3 p-5">
              <Zap className="h-5 w-5 shrink-0 text-warning" />
              <p className="text-sm font-semibold text-foreground">{p}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Features */}
      <Section id="features" eyebrow="Features" title="Everything you need. Nothing you don't."
        subtitle="Designed mobile-first, so it works with one thumb, on the move, in three seconds.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="smarty-card p-6 transition-smooth hover:shadow-elevated">
              <f.icon className="h-6 w-6 text-primary" />
              <p className="mt-3 text-base font-bold text-foreground">{f.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Modules */}
      <Section eyebrow="Modules" title="Every part of your life, connected."
        subtitle="Each module feeds the same brain — so health explains productivity, and training explains sleep.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <div key={m.id} className="smarty-card p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${m.tint}`}>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">{m.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Security */}
      <Section eyebrow="Security" title="Private by architecture."
        subtitle="Your life story deserves more than a checkbox.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Lock, t: 'Encrypted storage', s: 'Protected at rest and in transit.' },
            { icon: Fingerprint, t: 'Biometric lock', s: 'Face ID and fingerprint on native apps.' },
            { icon: Shield, t: 'You own it', s: 'Export or delete everything, any time.' },
          ].map((s) => (
            <div key={s.t} className="smarty-card p-6">
              <s.icon className="h-6 w-6 text-primary" />
              <p className="mt-3 text-base font-bold text-foreground">{s.t}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.s}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing" eyebrow="Pricing" title="Start free. Grow smarter."
        subtitle="The longer you use it, the more valuable it becomes.">
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`smarty-card relative p-6 ${p.featured ? 'ring-2 ring-primary shadow-elevated' : ''}`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  Most popular
                </span>
              )}
              <p className="text-sm font-bold text-foreground">{p.name}</p>
              <p className="mt-3 text-3xl font-extrabold text-foreground">
                {p.price}<span className="ml-1 text-xs font-medium text-muted-foreground">{p.note}</span>
              </p>
              <ul className="mt-5 space-y-2">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> {pt}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className={`mt-6 flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-smooth active:scale-95 ${
                  p.featured
                    ? 'bg-gradient-primary text-primary-foreground shadow-glow'
                    : 'border border-border bg-card text-foreground'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* Testimonials */}
      <Section eyebrow="Testimonials" title="People who stopped forgetting.">
        <div className="grid gap-3 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="smarty-card p-6">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">"{t.text}"</p>
              <p className="mt-4 text-xs font-semibold text-muted-foreground">{t.name} · {t.role}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" eyebrow="FAQ" title="Everything else you're wondering.">
        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="space-y-2.5">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="smarty-card border-none px-5">
                <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-primary p-10 text-center shadow-elevated md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-gradient-halo opacity-60" />
          <h2 className="relative text-2xl font-extrabold text-primary-foreground md:text-4xl">
            Build your second brain today.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-primary-foreground/80 md:text-base">
            Free to start. It gets smarter every single day you use it.
          </p>
          <Link
            to="/auth"
            className="relative mt-7 inline-flex items-center gap-2 rounded-2xl bg-background px-6 py-3.5 text-sm font-bold text-foreground shadow-elevated transition-smooth active:scale-95"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              An AI-powered personal operating system. Part of the Smarty Wellness ecosystem.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Product</p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#how" className="hover:text-foreground">How it works</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Ecosystem</p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>Smarty Gym</li>
              <li>Smarty Diet</li>
              <li>Smarty Move</li>
              <li>Smarty Logbook</li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Company</p>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li>Privacy</li>
              <li>Terms</li>
              <li>Security</li>
              <li>Contact</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border px-5 py-5 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Smarty Wellness. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
