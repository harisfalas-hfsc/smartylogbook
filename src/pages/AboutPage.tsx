import { Link } from 'react-router-dom';
import {
  ArrowRight, Brain, Camera, Mic, FileText, Link2, MessageCircle, Clock,
  Bell, Sparkles, ShieldCheck, HeartPulse, Wallet, Users, Briefcase,
  Lightbulb, Plane, CheckCircle2,
} from 'lucide-react';
import { Block, PageHeader, problems } from '@/lib/marketing';

const pillars = [
  {
    icon: Camera,
    emoji: '📸',
    title: 'Capture anything',
    text: 'Text, voice, a photo of a receipt, a blood test PDF, a screenshot. One tap and it is in.',
  },
  {
    icon: Brain,
    emoji: '🧠',
    title: 'AI classifies it',
    text: 'You never pick a category. The Assistant reads it, understands it and files it for you.',
  },
  {
    icon: Link2,
    emoji: '🔗',
    title: 'It connects the dots',
    text: 'A new MRI links to an old injury. A receipt links to a monthly expense. Your life becomes a graph.',
  },
  {
    icon: MessageCircle,
    emoji: '💬',
    title: 'Ask in plain language',
    text: '"What did the doctor say in March?" The Assistant searches your whole logbook and answers.',
  },
];

const abilities = [
  { emoji: '🎙️', icon: Mic, t: 'Voice capture', s: 'Speak it. It is transcribed, understood and stored.' },
  { emoji: '🧾', icon: FileText, t: 'Document intelligence', s: 'Receipts, lab results, invoices — key details extracted automatically.' },
  { emoji: '🕰️', icon: Clock, t: 'Universal timeline', s: 'One chronological feed of your life. Filter by day, week, month or year.' },
  { emoji: '☀️', icon: Sparkles, t: 'Daily brief', s: 'Every morning: one clear headline, the actions that matter, nothing else.' },
  { emoji: '🔔', icon: Bell, t: 'Proactive reminders', s: 'Bills, check-ups, birthdays and follow-ups surface before you forget.' },
  { emoji: '💡', icon: Lightbulb, t: 'Pattern insights', s: 'Plain-language observations — no scores, no dashboards to decode.' },
  { emoji: '❓', icon: Users, t: 'Follow-up questions', s: 'When something is missing, the Assistant asks instead of guessing.' },
  { emoji: '🔒', icon: ShieldCheck, t: 'Private by design', s: 'Encrypted storage, your data, exportable and deletable any time.' },
];

const modules = [
  { emoji: '❤️', icon: HeartPulse, t: 'Health', s: 'Symptoms, tests, medication, appointments.' },
  { emoji: '💰', icon: Wallet, t: 'Money', s: 'Receipts, bills, subscriptions, spending patterns.' },
  { emoji: '👨‍👩‍👧', icon: Users, t: 'People', s: 'Family, friends, important dates and promises.' },
  { emoji: '💼', icon: Briefcase, t: 'Work', s: 'Meetings, decisions, deadlines and ideas.' },
  { emoji: '🧭', icon: Lightbulb, t: 'Personal', s: 'Habits, thoughts, goals and reflections.' },
  { emoji: '✈️', icon: Plane, t: 'Life events', s: 'Travel, moves, milestones and documents.' },
];

const AboutPage = () => (
  <div className="mx-auto max-w-5xl px-5 py-10">
    <PageHeader
      eyebrow="About"
      title="The Smarty Logbook that remembers your life better than you do."
      subtitle="One place where everything that happens to you is captured, understood and connected — by an AI that does all the organising for you."
    />

    <Block>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {pillars.map((p) => (
          <div key={p.title} className="smarty-card p-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-base">{p.emoji}</span>
              <p.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">{p.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>
    </Block>

    <Block title="Why it exists">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {problems.map((p) => (
          <div key={p} className="smarty-card p-4 text-sm font-medium text-muted-foreground">{p}</div>
        ))}
      </div>
    </Block>

    <Block title="What it can do">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {abilities.map((a) => (
          <div key={a.t} className="smarty-card p-5">
            <span className="text-lg">{a.emoji}</span>
            <p className="mt-2.5 text-sm font-bold text-foreground">{a.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.s}</p>
          </div>
        ))}
      </div>
    </Block>

    <Block title="Everything it keeps">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <div key={m.t} className="smarty-card flex items-start gap-3 p-4">
            <span className="text-lg leading-none">{m.emoji}</span>
            <div>
              <p className="text-sm font-bold text-foreground">{m.t}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{m.s}</p>
            </div>
          </div>
        ))}
      </div>
    </Block>

    <Block title="The promise">
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

    <Block title="Part of something bigger">
      <p className="text-sm leading-relaxed text-muted-foreground">
        🏋️ Smarty Gym, 🥗 Smarty Diet and 🚶 Smarty Move feed the Logbook with training, nutrition and
        movement data. The Logbook analyses everything together and returns personalised guidance to each
        app — one brain behind your whole life.
      </p>
    </Block>

    <section className="smarty-card mt-2 p-7 text-center">
      <h2 className="text-lg font-extrabold tracking-tight text-foreground md:text-2xl">
        Start remembering everything.
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Free to begin. Capture your first memory in under ten seconds — the Assistant handles the rest.
      </p>
      <Link
        to="/auth"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
      >
        Create your logbook <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  </div>
);

export default AboutPage;
