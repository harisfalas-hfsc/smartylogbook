import { Link } from 'react-router-dom';
import { LifeBuoy, Mail, Sparkles } from 'lucide-react';

import { PageHeader, Panel } from '@/lib/marketing';
import { SUPPORT_EMAIL } from '@/lib/support';

const ContactPage = () => (
  <div className="mx-auto max-w-4xl px-3 py-7 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="Support"
      title="Ask the Assistant first, email us if you still need a human."
    />

    <Panel
      eyebrow="Try this first"
      eyebrowEmoji="🧠"
      badge={Sparkles}
      title={<>Ask the <span className="gradient-text">Assistant</span></>}
    >
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Smarty Logbook is fully AI powered, and the Assistant is trained on how the whole app works.
        Ask it in plain words: "where is the PDF I uploaded yesterday?", "move my blood test to
        Health", "what is an album?", "why did my reminder not fire?". It searches your logbook,
        fixes the filing and learns from the correction.
      </p>
      <Link
        to="/app/assistant"
        className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-[0.98]"
      >
        <Sparkles className="h-4 w-4" /> Open Smarty Assistant
      </Link>
    </Panel>

    <Panel
      eyebrow="Write to a human"
      eyebrowEmoji="✉️"
      badge={LifeBuoy}
      title={<>Email us <span className="gradient-text">directly</span></>}
    >
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        For payments, account access or anything the Assistant could not solve, send us an email from
        your own address so we can reply straight back to you. Add a screenshot if it helps.
      </p>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm transition-smooth active:scale-[0.98]"
      >
        <Mail className="h-4 w-4 text-primary" />
        <span className="break-all">{SUPPORT_EMAIL}</span>
      </a>
      <p className="mt-2 text-[11.5px] text-muted-foreground">
        We usually reply within one working day.
      </p>
    </Panel>
  </div>
);

export default ContactPage;
