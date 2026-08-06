import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, LifeBuoy, Mail, Paperclip, Send, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader, Panel } from '@/lib/marketing';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MAX_ATTACHMENT_BYTES, SUPPORT_EMAIL, submitTicket } from '@/lib/support';

const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const pick = (f: File | null) => {
    if (f && f.size > MAX_ATTACHMENT_BYTES) {
      toast.error('That file is larger than 10 MB');
      return;
    }
    setFile(f);
  };

  const send = async () => {
    setSending(true);
    const { error } = await submitTicket({ name, email, subject, message, file });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    setName(''); setEmail(''); setSubject(''); setMessage(''); setFile(null);
    toast.success('Message sent, we reply by email');
  };

  return (
    <div className="mx-auto max-w-4xl px-3 py-7 sm:px-5 sm:py-10">
      <PageHeader
        eyebrow="Support"
        title="Something not working? Tell us, we answer by email."
      />

      <Panel
        eyebrow="Try this first"
        eyebrowEmoji="🧠"
        badge={Sparkles}
        title={<>Ask the <span className="gradient-text">Assistant</span></>}
      >
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Smarty Logbook is fully AI powered. Most problems, a missing capture, a file you cannot find,
          something filed in the wrong category, a reminder that did not fire, are solved instantly by
          Smarty Assistant inside the app. Ask it in plain words: "where is the PDF I uploaded
          yesterday?" or "move my blood test to Health". It searches your whole logbook, fixes the
          filing and learns from the correction.
        </p>
        <Link
          to="/app/assistant"
          className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" /> Open Smarty Assistant
        </Link>
      </Panel>

      <Panel
        eyebrow="Contact us"
        eyebrowEmoji="✉️"
        badge={LifeBuoy}
        title={<>Write to <span className="gradient-text">a human</span></>}
      >
        {sent ? (
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center">
            <Mail className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 text-sm font-bold text-foreground">Message received</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              We reply to the email you gave us, usually within one working day.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-3 text-[13px] font-semibold text-primary underline underline-offset-4"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => { e.preventDefault(); void send(); }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="c-name" className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Your name</label>
                <Input id="c-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Haris" />
              </div>
              <div>
                <label htmlFor="c-email" className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Your email</label>
                <Input id="c-email" type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label htmlFor="c-subject" className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Subject</label>
              <Input id="c-subject" value={subject} maxLength={140} onChange={(e) => setSubject(e.target.value)} className="mt-1" placeholder="My PDF does not open" />
            </div>
            <div>
              <label htmlFor="c-message" className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Message</label>
              <Textarea id="c-message" value={message} maxLength={4000} rows={6} onChange={(e) => setMessage(e.target.value)} className="mt-1" placeholder="Tell us what happened, and what you expected to see." />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2 text-[13px] font-semibold text-foreground transition-smooth active:scale-95">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                {file ? 'Change file' : 'Attach a screenshot or file'}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf,video/*,.doc,.docx,.txt"
                  onChange={(e) => pick(e.target.files?.[0] ?? null)}
                />
              </label>
              {file && (
                <span className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-[12px] font-semibold text-secondary-foreground">
                  <span className="max-w-[160px] truncate">{file.name}</span>
                  <button type="button" aria-label="Remove file" onClick={() => setFile(null)}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">Max 10 MB</span>
            </div>

            <Button type="submit" disabled={sending} className="w-full rounded-2xl">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Send message</>}
            </Button>
            <p className="text-center text-[11.5px] text-muted-foreground">
              Or email us directly at{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-primary underline underline-offset-4">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </form>
        )}
      </Panel>
    </div>
  );
};

export default ContactPage;
