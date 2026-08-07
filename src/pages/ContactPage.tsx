import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Loader2, Lock, Mail, Paperclip, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader, Panel } from '@/lib/marketing';
import { SUPPORT_EMAIL, submitTicket } from '@/lib/support';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/lib/subscription';

/** Premium members write to support from inside the app. */
const SupportForm = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    const { error } = await submitTicket({
      name: (user?.user_metadata?.username as string) || user?.email?.split('@')[0] || 'Member',
      email: user?.email ?? '',
      subject,
      message,
      file,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setSubject(''); setMessage(''); setFile(null);
    toast.success('Sent. Smarty Assistant will answer you in your message center.');
  };

  return (
    <div className="mt-3 space-y-2">
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        className="w-full rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        placeholder="Tell us what is happening, and what you expected instead."
        className="w-full resize-none rounded-2xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center gap-2">
        <label className="inline-flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2.5 text-[12px] font-semibold text-foreground">
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{file ? file.name : 'Attach a screenshot'}</span>
          <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button
          onClick={send}
          disabled={sending || subject.trim().length < 3 || message.trim().length < 10}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
        </button>
      </div>
      <p className="text-[11.5px] text-muted-foreground">
        Smarty Assistant answers first, and a human takes over from there. The whole conversation
        lives in your message center.
      </p>
    </div>
  );
};

const ContactPage = () => {
  const { active, isAdmin, loading } = useSubscription();
  const canWrite = active || isAdmin;

  return (
    <div className="mx-auto max-w-4xl px-3 py-7 sm:px-5 sm:py-10">
      <PageHeader
        eyebrow="Support"
        title="Ask the Assistant first, write to us if you still need a human."
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
        eyebrow="Write to support"
        eyebrowEmoji="✉️"
        badge={LifeBuoy}
        title={<>Message <span className="gradient-text">support</span></>}
      >
        {loading ? (
          <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
        ) : canWrite ? (
          <>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Send us a message without leaving the app. Add a screenshot if it helps.
            </p>
            <SupportForm />
          </>
        ) : (
          <>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Support conversations are part of Smarty Premium. Members write to us from here and get
              an answer in their message center, starting with Smarty Assistant.
            </p>
            <Link
              to="/app/plan"
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition-smooth active:scale-[0.98]"
            >
              <Lock className="h-4 w-4" /> View membership
            </Link>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-sm"
            >
              <Mail className="h-4 w-4 text-primary" />
              <span className="break-all">{SUPPORT_EMAIL}</span>
            </a>
          </>
        )}
      </Panel>
    </div>
  );
};

export default ContactPage;
