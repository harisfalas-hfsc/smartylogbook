import {
  Brain, Camera, Mic, FileText, Link2, MessageCircle, Clock,
  Bell, Sparkles, ShieldCheck, CheckCircle2,
} from 'lucide-react';
import { Block, PageHeader, CtaCard, BrandText, problems, features } from '@/lib/marketing';
import { MODULES } from '@/lib/constants';

const pillars = [
  { icon: Camera, emoji: '📥', title: 'Capture anything', text: 'Text, voice, a photo of a receipt, a lab report, a screenshot. One tap and it is in.' },
  { icon: Brain, emoji: '🧠', title: 'The AI classifies it', text: 'You never pick a category. The Smarty Assistant reads it, understands it and files it.' },
  { icon: Link2, emoji: '🔗', title: 'It connects the dots', text: 'A new scan links to an old injury. A receipt links to a monthly bill. Your life becomes a graph.' },
  { icon: MessageCircle, emoji: '💬', title: 'Ask in plain language', text: '"What did the doctor say in March?" It searches your whole logbook and answers.' },
];

const assistantPowers = [
  { e: '🗣️', t: 'Talk to it', s: 'Chat by text or voice, attach a photo or a document and ask what it means.' },
  { e: '🔎', t: 'It knows your logbook', s: 'Every answer is grounded in what you actually captured.' },
  { e: '🧩', t: 'It links everything', s: 'New entries attach to the older ones they belong with.' },
  { e: '📌', t: 'It plans ahead', s: 'Reminders, renewals and follow-ups created automatically.' },
];

const abilities = [
  { emoji: '🎙️', icon: Mic, t: 'Voice capture', s: 'Speak it. Transcribed, understood, stored.' },
  { emoji: '🧾', icon: FileText, t: 'Document intelligence', s: 'Dates, amounts and results extracted automatically.' },
  { emoji: '🕰️', icon: Clock, t: 'Universal timeline', s: 'One feed of your life, filtered by day, week, month or year.' },
  { emoji: '☀️', icon: Sparkles, t: 'Daily brief', s: 'One headline, the actions that matter, nothing else.' },
  { emoji: '🔔', icon: Bell, t: 'Proactive reminders', s: 'Bills, check-ups and follow-ups before you forget.' },
  { emoji: '💡', icon: Brain, t: 'Pattern insights', s: 'Plain language observations — no scores, no dashboards.' },
  { emoji: '❓', icon: MessageCircle, t: 'Follow-up questions', s: 'When something is missing, it asks instead of guessing.' },
  { emoji: '🔒', icon: ShieldCheck, t: 'Private by design', s: 'Encrypted storage. Export or delete any time.' },
];

const AboutPage = () => (
  <div className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="About"
      title="The Smarty Logbook that remembers your life better than you do."
      subtitle="One place where everything that happens to you is captured, understood and connected — by an AI that does all the organising for you."
    />

    {/* Pillars */}
    <Block>
      <div className="grid gap-3 sm:grid-cols-2">
        {pillars.map((p, i) => (
          <div key={p.title} className="smarty-card relative overflow-hidden p-5">
            <span className="absolute right-4 top-3 text-3xl font-extrabold text-secondary">{i + 1}</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-xl">{p.emoji}</span>
            <p className="mt-3 text-[15px] font-bold text-foreground">{p.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>
    </Block>

    {/* Problem */}
    <Block title="Why it exists" subtitle="The reason nothing else worked.">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {problems.map((p) => (
          <div key={p} className="smarty-card flex items-start gap-2.5 p-4">
            <span className="text-base leading-none">⚠️</span>
            <p className="text-[13px] font-medium text-muted-foreground">{p}</p>
          </div>
        ))}
      </div>
    </Block>

    {/* Assistant */}
    <Block title="The Smarty Assistant" subtitle="The brain behind everything. Included with Premium.">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {assistantPowers.map((a) => (
          <div key={a.t} className="smarty-card p-4 sm:p-5">
            <span className="text-xl leading-none">{a.e}</span>
            <p className="mt-2.5 text-sm font-bold text-foreground">{a.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.s}</p>
          </div>
        ))}
      </div>
    </Block>

    {/* Abilities */}
    <Block title="What it can do" subtitle="Everything below happens without you organising anything.">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {abilities.map((a) => (
          <div key={a.t} className="smarty-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{a.emoji}</span>
              <a.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2.5 text-sm font-bold text-foreground">{a.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.s}</p>
          </div>
        ))}
      </div>
    </Block>

    {/* Full feature list */}
    <Block title="Every feature, in one list" subtitle="Twelve things Smarty Logbook does so you don't have to.">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="smarty-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{f.emoji}</span>
              <f.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2.5 text-sm font-bold text-foreground">{f.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </div>
    </Block>

    {/* Modules */}
    <Block title="The life modules" subtitle="You never choose one — the Assistant files each memory where it belongs.">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {MODULES.map((m) => (
          <div key={m.id} className="smarty-card p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${m.tint}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <p className="mt-2.5 text-sm font-bold text-foreground">{m.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{m.description}</p>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {m.topics.slice(0, 4).map((t) => (
                <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Block>

    {/* Promise */}
    <Block title="The promise">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          { e: '📂', t: 'No folders', s: 'Nothing to file. Nothing to name.' },
          { e: '🏷️', t: 'No tags', s: 'The Assistant writes them for you.' },
          { e: '🔢', t: 'No scores', s: 'Plain language, never numbers to decode.' },
        ].map((c) => (
          <div key={c.t} className="smarty-card p-5">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{c.e}</span>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2.5 text-sm font-bold text-foreground">{c.t}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.s}</p>
          </div>
        ))}
      </div>
    </Block>

    <div className="smarty-card mb-10 p-5 text-center text-[13px] leading-relaxed text-muted-foreground">
      <BrandText>
        Smarty Logbook is free to start. Premium unlocks the Smarty Assistant for €9.99 per month.
      </BrandText>
    </div>

    <CtaCard text="Free to begin. Capture your first memory in under ten seconds — the Smarty Assistant handles the rest." />
  </div>
);

export default AboutPage;
