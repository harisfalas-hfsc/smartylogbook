import {
  Brain, Camera, Clock, Fingerprint, Layers, LineChart, Lock, Search, Shield,
  Sparkles, Wand2, Zap,
} from 'lucide-react';

export const problems = [
  'Your life is scattered across ten apps.',
  'Notes get written and never read again.',
  'Receipts, reports and ideas disappear.',
  'You remember the past, but never learn from it.',
];

export const steps = [
  { icon: Camera, title: 'Capture', text: 'One tap. Text, voice, photo, receipt, report — anything.' },
  { icon: Wand2, title: 'Understand', text: 'The AI classifies, summarises and tags it instantly.' },
  { icon: Layers, title: 'Connect', text: 'Every memory joins one continuous life timeline.' },
  { icon: LineChart, title: 'Guide', text: 'Patterns become insight, insight becomes better decisions.' },
];

export const features = [
  { icon: Sparkles, title: 'Quick Capture', text: 'Voice, camera and text capture always one thumb away.' },
  { icon: Clock, title: 'Universal Timeline', text: 'Everything in chronological order. Like Instagram, for your life.' },
  { icon: Search, title: 'Ask anything', text: '"How much did I spend on restaurants?" Natural language search.' },
  { icon: Brain, title: 'Behaviour intelligence', text: 'It notices what you never would — patterns across months.' },
  { icon: Zap, title: 'Predictive AI', text: 'Warns you before recovery drops or the budget breaks.' },
  { icon: Shield, title: 'Privacy first', text: 'Encrypted storage, biometric lock, your data stays yours.' },
];

export const insights = [
  'You sleep better on days you train before 6pm.',
  'You spend 41% more every Friday evening.',
  'Your productivity drops the day after poor sleep.',
  'Your shoulder pain increases after heavy pressing.',
  'Recovery improves on days with a 20 minute walk.',
];

export const predictions = [
  'Recovery is declining',
  'Hydration is low',
  'Stress is increasing',
  'Budget will be exceeded',
  'Fatigue likely within 2 days',
  "You haven't contacted an important client",
];

export const plans = [
  { name: 'Starter', price: '$0', note: 'forever', points: ['Unlimited notes', 'Universal timeline', 'Basic AI search', '1 device'], cta: 'Start free' },
  { name: 'Pro', price: '$9', note: 'per month', points: ['Unlimited AI capture', 'Predictive insights', 'Daily assistant brief', 'All modules', 'Multi-device sync'], cta: 'Go Pro', featured: true },
  { name: 'Ecosystem', price: '$19', note: 'per month', points: ['Everything in Pro', 'Smarty Gym + Diet + Move', 'Wearable integrations', 'Priority AI models'], cta: 'Join ecosystem' },
];

export const testimonials = [
  { name: 'Elena R.', role: 'Founder', text: 'It found the connection between my sleep and my worst work days. Nothing else ever told me that.' },
  { name: 'Marcus T.', role: 'Athlete', text: 'Every session, every ache, every meal — one place. My physio asks for the export now.' },
  { name: 'Sofia K.', role: 'Doctor', text: 'I photograph a report and forget it. The AI remembers it better than I ever could.' },
];

export const faqs = [
  { q: 'Is Smarty Logbook another note app?', a: 'No. Notes store text. Smarty Logbook understands it — classifying, connecting and analysing everything you capture into one intelligent life timeline.' },
  { q: 'Do I need to organise anything?', a: 'Never. No folders, no tags, no manual filing. Capture it and the AI takes care of the rest.' },
  { q: 'How private is my data?', a: 'Privacy-first architecture with encrypted storage, biometric unlock and full export or deletion at any time.' },
  { q: 'Does it work with my watch?', a: 'Apple Health, Google Health Connect, Garmin, Polar, Whoop, Oura and Fitbit integrations are modular and rolling out continuously.' },
  { q: 'How does it fit the Smarty ecosystem?', a: 'Smarty Gym, Diet and Move feed the Logbook. The Logbook analyses everything and returns personalised recommendations to each app.' },
];

export const securityPoints = [
  { icon: Lock, t: 'Encrypted storage', s: 'Protected at rest and in transit.' },
  { icon: Fingerprint, t: 'Biometric lock', s: 'Face ID and fingerprint on native apps.' },
  { icon: Shield, t: 'You own it', s: 'Export or delete everything, any time.' },
];

export const PageHeader = ({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) => (
  <div className="mx-auto mb-8 max-w-2xl text-center">
    <span className="inline-block rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
      {eyebrow}
    </span>
    <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">{title}</h1>
    {subtitle && <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{subtitle}</p>}
  </div>
);

export const Block = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <section className="mb-10">
    {title && <h2 className="mb-4 text-lg font-extrabold tracking-tight text-foreground md:text-2xl">{title}</h2>}
    {children}
  </section>
);
