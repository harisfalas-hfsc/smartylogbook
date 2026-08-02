import { Link } from 'react-router-dom';
import {
  Brain, Camera, Clock, Fingerprint, Layers, Bell, Lock, Search, Shield,
  Sparkles, Wand2, Link2, MessageCircle, FileText, Mic,
} from 'lucide-react';

export const problems = [
  'Your life is scattered across ten apps.',
  'Notes get written and never read again.',
  'Receipts, reports and ideas disappear.',
  'You remember the past, but never learn from it.',
];

export const steps = [
  { icon: Camera, emoji: '📥', title: 'Capture', text: 'Type it, say it, or snap it. Text, voice, photo, receipt, PDF — one tap, no forms.' },
  { icon: Wand2, emoji: '🧠', title: 'Understand', text: 'The Smarty Assistant reads it, extracts dates, amounts and details, and classifies it. You never pick a category.' },
  { icon: Link2, emoji: '🔗', title: 'Connect', text: 'It links the new entry to what already exists — a scan to an old injury, a receipt to a recurring bill.' },
  { icon: Bell, emoji: '⏰', title: 'Remind', text: 'Follow-ups, renewals, appointments and important dates are scheduled automatically.' },
  { icon: MessageCircle, emoji: '💬', title: 'Ask', text: 'Ask anything in plain language. The Assistant searches your whole logbook and answers.' },
  { icon: Sparkles, emoji: '☀️', title: 'Guide', text: 'Every morning a short brief: what matters today, what is coming, what changed.' },
];

export const features = [
  { icon: Sparkles, emoji: '⚡', title: 'Quick Capture', text: 'Text, voice, camera and files — always one thumb away.' },
  { icon: Mic, emoji: '🎙️', title: 'Voice to memory', text: 'Speak naturally. It is transcribed, understood and stored.' },
  { icon: FileText, emoji: '🧾', title: 'Document intelligence', text: 'Receipts, lab results and invoices: key details extracted for you.' },
  { icon: Wand2, emoji: '🪄', title: 'Auto-classification', text: 'No folders, no tags, no category picker. Ever.' },
  { icon: Link2, emoji: '🔗', title: 'Relationship engine', text: 'New entries connect to related ones and build your knowledge graph.' },
  { icon: Clock, emoji: '🕰️', title: 'Universal timeline', text: 'One chronological feed, filtered by day, week, month or year.' },
  { icon: Search, emoji: '🔍', title: 'Ask anything', text: '"What did the doctor say in March?" Plain-language search.' },
  { icon: MessageCircle, emoji: '🤖', title: 'Smarty Assistant', text: 'A real assistant that answers, asks follow-ups and never guesses.' },
  { icon: Brain, emoji: '💡', title: 'Pattern insights', text: 'Plain-language observations written like a person would say them.' },
  { icon: Bell, emoji: '🔔', title: 'Proactive reminders', text: 'Bills, check-ups, birthdays and overdue tests surface on time.' },
  { icon: Layers, emoji: '🗂️', title: 'Life modules', text: 'Health, fitness, nutrition, finance, business, documents, personal.' },
  { icon: Shield, emoji: '🔒', title: 'Privacy first', text: 'Encrypted storage, your data, export or delete any time.' },
];

/* The whole product in two columns: what you put in, what comes back. */
export const givesIn = [
  { e: '⌨️', t: 'Type it', s: 'A thought, a number, a note.' },
  { e: '🎙️', t: 'Say it', s: 'Speak, it gets written down.' },
  { e: '📷', t: 'Snap it', s: 'A receipt, a label, a screen.' },
  { e: '📎', t: 'Upload it', s: 'PDFs, reports, invoices.' },
];

export const givesBack = [
  { e: '🧠', t: 'Understands', s: 'Reads it and pulls out the details.' },
  { e: '🔗', t: 'Relates', s: 'Attaches it to what already exists.' },
  { e: '📌', t: 'Remembers', s: 'Kept for as long as you want it.' },
  { e: '🔎', t: 'Finds it', s: 'Ask in plain words, get the answer.' },
];


export const insights = [
  'You sleep better on days you train before 6pm.',
  'You spend 41% more every Friday evening.',
  'Your productivity drops the day after poor sleep.',
  'Your shoulder pain increases after heavy pressing.',
  'Recovery improves on days with a 20 minute walk.',
];

export const predictions = [
  'A blood test is due again this month',
  'Your insurance renews in 12 days',
  'Two subscriptions charge on the same day',
  "You haven't logged a workout in 9 days",
  'A follow-up appointment was never booked',
  "You haven't contacted an important client",
];

export const plans = [
  {
    name: 'Free',
    price: '€0',
    note: 'forever',
    points: [
      'Capture text, voice and photos',
      'Universal timeline',
      'Manual organisation',
      'Basic keyword search',
    ],
    cta: 'Start free',
    tagline: 'A clean place to keep your life.',
  },
  {
    name: 'Premium',
    price: '€9.99',
    note: 'per month',
    points: [
      'Everything in Free',
      'Smarty Assistant — chat, ask anything',
      'Automatic AI classification',
      'Document & receipt extraction',
      'Relationship engine & connections',
      'Proactive reminders and alerts',
      'Daily brief and pattern insights',
    ],
    cta: 'Get Premium',
    featured: true,
    tagline: 'The full second brain, with the Assistant.',
  },
];

export const testimonials = [
  { name: 'Elena R.', role: 'Founder', text: 'It found the connection between my sleep and my worst work days. Nothing else ever told me that.' },
  { name: 'Marcus T.', role: 'Athlete', text: 'Every session, every ache, every meal — one place. My physio asks for the export now.' },
  { name: 'Sofia K.', role: 'Doctor', text: 'I photograph a report and forget it. The AI remembers it better than I ever could.' },
];

export const faqs = [
  { q: 'What is Smarty Logbook?', a: 'Smarty Logbook is a second brain for your life. You capture anything — a thought, a receipt, a lab report, a voice note — and the Smarty Assistant reads it, files it, connects it to what you already have and reminds you when it matters.' },
  { q: 'Is it just another note app?', a: 'No. Notes store text and forget it. Smarty Logbook understands what you capture, extracts the details, links related entries and can answer questions about your own life.' },
  { q: 'How do I add something?', a: 'Open Capture and type it, speak it, take a photo or attach a file. That is the whole flow — no title, no category, no tags.' },
  { q: 'Do I have to choose a category?', a: 'Never. The Assistant classifies every entry into the right life module automatically, and you can always see and change where it landed.' },
  { q: 'Can it read receipts, invoices and medical reports?', a: 'Yes. Photograph or upload a document and the Assistant extracts the key details — dates, amounts, merchants, values — and stores them with the entry.' },
  { q: 'Does voice really work?', a: 'Yes. Speak naturally; your recording is transcribed, understood and saved as a normal entry. You can also talk to the Assistant by voice.' },
  { q: 'What is the Smarty Assistant?', a: 'Your personal assistant inside the logbook. It classifies what you capture, links related entries, writes your daily brief, reminds you proactively and answers any question about your own history in plain language.' },
  { q: 'How do I find something later?', a: 'Ask in plain language — "what did the doctor say in March?" or "how much did I spend on restaurants?" You can also scroll the timeline and filter by day, week, month or year.' },
  { q: 'What are life modules?', a: 'Modules are the areas your entries are filed into — health, fitness, nutrition, finance, business, documents and personal. You never pick one; the Assistant does.' },
  { q: 'How does it connect my entries?', a: 'The relationship engine looks for links: a new scan attaches to an old injury, a receipt to a recurring bill, a meeting to the person involved. Over time your logbook becomes a knowledge graph of your life.' },
  { q: 'Will it remind me about things?', a: 'Yes. Bills, renewals, appointments, follow-up tests and important dates are detected and scheduled automatically, and you control which notifications you receive.' },
  { q: 'Are there scores or ratings?', a: 'No. Scores were removed on purpose. The Assistant writes plain-language summaries and observations instead of numbers you have to interpret.' },
  { q: 'What does it cost?', a: 'Free is €0 forever: capture, timeline and basic search. Premium is €9.99 per month and adds the Smarty Assistant — automatic classification, document extraction, connections, proactive reminders, the daily brief and plain-language answers.' },
  { q: 'Can I cancel or change plan?', a: 'Yes, any time. Prices are in euros and your data stays yours and exportable whatever plan you are on.' },
  { q: 'Do I need an account?', a: 'Yes — an email and password. Your logbook is private to you and every entry is gated behind your account.' },
  { q: 'How private is my data?', a: 'Privacy-first architecture with encrypted storage in transit and at rest. You can export everything or permanently delete your account and all of its data at any time.' },
  { q: 'Does it work on mobile?', a: 'It is built mobile-first. Everything is reachable with one thumb, and capture takes about three seconds.' },
  { q: 'Is it a medical or financial adviser?', a: 'No. It organises and explains your own information. It does not replace a doctor, accountant or any other professional.' },
];

export const securityPoints = [
  { icon: Lock, t: 'Encrypted storage', s: 'Protected at rest and in transit.' },
  { icon: Fingerprint, t: 'Biometric lock', s: 'Face ID and fingerprint on native apps.' },
  { icon: Shield, t: 'You own it', s: 'Export or delete everything, any time.' },
];


export const BrandText = ({ children }: { children: string }) => {
  const parts = children.split(/(Smarty Logbook)/g);
  return (
    <>
      {parts.map((part, i) =>
        part === 'Smarty Logbook' ? (
          <span key={i} className="gradient-text font-extrabold">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
};

export const PageHeader = ({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) => (
  <div className="mx-auto mb-8 max-w-2xl text-center">
    <span className="inline-block rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
      {eyebrow}
    </span>
    <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-tight text-foreground md:text-4xl"><BrandText>{title}</BrandText></h1>
    {subtitle && <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base"><BrandText>{subtitle}</BrandText></p>}
  </div>
);

export const Block = ({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) => (
  <section className="mb-10">
    {title && <h2 className="mb-1 text-lg font-extrabold tracking-tight text-foreground md:text-2xl">{title}</h2>}
    {subtitle && <p className="mb-4 text-xs text-muted-foreground md:text-sm"><BrandText>{subtitle}</BrandText></p>}
    {!subtitle && title && <div className="mb-4" />}
    {children}
  </section>
);

/* ---------- Panel system (big card → nested cards) ---------- */

type PanelProps = {
  eyebrow: string;
  eyebrowEmoji?: string;
  badge?: React.ElementType;
  title: React.ReactNode;
  lead?: string;
  children?: React.ReactNode;
};

export const Panel = ({ eyebrow, eyebrowEmoji, badge: Badge, title, lead, children }: PanelProps) => (
  <section className="smarty-card relative mb-5 overflow-hidden p-3 sm:p-5 md:p-7">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-halo opacity-70" />
    <div className="relative flex items-start gap-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-primary/25 bg-secondary/60 px-3.5 py-2">
        {eyebrowEmoji && <span className="text-sm leading-none">{eyebrowEmoji}</span>}
        <span className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:text-[11px]">
          {eyebrow}
        </span>
      </div>
      {Badge && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-secondary/60">
          <Badge className="h-4 w-4 text-primary" />
        </span>
      )}
    </div>

    <div className="relative mt-5 sm:mt-7">
      <h2 className="text-[22px] font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-3xl md:text-[34px]">
        {title}
      </h2>
      {lead && (
        <p className="mt-2.5 hidden max-w-3xl text-[13px] leading-relaxed text-muted-foreground sm:block sm:text-[15px]">
          <BrandText>{lead}</BrandText>
        </p>
      )}
    </div>

    {children && <div className="relative mt-5 sm:mt-6">{children}</div>}
  </section>
);

export const SubCard = ({
  label,
  labelEmoji,
  children,
  className = '',
}: { label?: string; labelEmoji?: string; children: React.ReactNode; className?: string }) => (
  <div className={`rounded-3xl border border-primary/20 bg-secondary/40 p-3.5 sm:p-5 ${className}`}>
    {label && (
      <div className="mb-3 flex items-center gap-1.5">
        {labelEmoji && <span className="text-sm leading-none">{labelEmoji}</span>}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground sm:text-[11px]">{label}</p>
      </div>
    )}
    {children}
  </div>
);

export const MiniRow = ({ emoji, title, text }: { emoji: string; title: string; text?: string }) => (
  <div className="flex items-center gap-2.5 rounded-2xl border border-primary/15 bg-card p-2.5 sm:items-start sm:p-3">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm">{emoji}</span>
    <div className="min-w-0">
      <p className="text-[13px] font-bold leading-snug text-foreground">{title}</p>
      {text && <p className="mt-0.5 hidden text-[11.5px] leading-relaxed text-muted-foreground sm:block">{text}</p>}
    </div>
  </div>
);

/* Content shown only from lg upwards — keeps mobile pages short without touching desktop. */
export const DesktopOnly = ({ children }: { children: React.ReactNode }) => (
  <div className="hidden lg:contents">{children}</div>
);

export const Divider = () => <div className="my-4 hidden h-px bg-primary/15 sm:block" />;

export const CtaCard = ({ title, text }: { title?: string; text?: string }) => (
  <section className="smarty-card relative mt-2 overflow-hidden p-6 text-center sm:p-9">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-halo opacity-80" />
    <h2 className="relative text-xl font-extrabold tracking-tight text-foreground md:text-3xl">
      <BrandText>{title ?? 'Start remembering everything.'}</BrandText>
    </h2>
    <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">
      <BrandText>{text ?? 'Free to begin. Capture your first memory in under ten seconds.'}</BrandText>
    </p>
    <Link
      to="/auth"
      className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
    >
      Create your logbook →
    </Link>
  </section>
);
