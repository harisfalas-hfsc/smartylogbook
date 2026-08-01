import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mic, Sparkles, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMemories } from '@/lib/memories';
import { CAPTURE_KINDS, MODULES, CaptureKind } from '@/lib/constants';
import { cn } from '@/lib/utils';

const suggestions = [
  'Upper body session, 48 minutes, felt strong',
  'Lunch: grilled salmon, rice and salad',
  'Paid $42.10 at the supermarket',
  'Idea: a weekly review email for the team',
  'Call the clinic about the blood test results',
];

const CapturePage = () => {
  const navigate = useNavigate();
  const { create } = useMemories({ limit: 1 });
  const [text, setText] = useState('');
  const [kind, setKind] = useState<CaptureKind | null>(null);
  const [module, setModule] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error('Voice input is not supported in this browser');
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); toast.error('Could not hear that — try again'); };
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setKind('voice');
    };
    recognition.start();
  };

  const save = async () => {
    if (!text.trim()) {
      toast.error('Capture something first');
      return;
    }
    setSaving(true);
    let classified: any = null;
    try {
      const { data } = await supabase.functions.invoke('ai-brain', {
        body: { mode: 'classify', input: text.trim() },
      });
      if (data && !data.error) classified = data;
    } catch {
      /* fall back to raw capture */
    }

    const { error } = await create({
      title: classified?.title ?? text.trim().slice(0, 60),
      summary: classified?.summary ?? null,
      content: text.trim(),
      module: module ?? classified?.module ?? 'personal',
      kind: kind ?? classified?.kind ?? 'text',
      ai_tags: Array.isArray(classified?.ai_tags) ? classified.ai_tags.slice(0, 4) : [],
      amount: typeof classified?.amount === 'number' ? classified.amount : null,
      location: classified?.location ?? null,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(classified ? `Filed under ${classified.module}` : 'Memory captured');
    setText('');
    setKind(null);
    setModule(null);
    navigate('/app/timeline');
  };

  return (
    <div className="space-y-5">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Quick Capture</h1>
        <p className="mt-1 text-sm text-muted-foreground">One tap. The AI classifies everything for you.</p>
      </header>

      <div className="smarty-card animate-fade-up p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What just happened?"
          rows={5}
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <button
            onClick={startVoice}
            aria-label="Voice capture"
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-2xl transition-smooth active:scale-95',
              listening ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
            )}
          >
            <Mic className="h-5 w-5" />
          </button>
          <button
            onClick={() => toast.info('Camera capture arrives with the native app')}
            aria-label="Photo capture"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-smooth active:scale-95"
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="ml-auto flex items-center gap-2 rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-95 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {saving ? 'Understanding…' : 'Capture'}
          </button>
        </div>
      </div>

      <section className="animate-fade-up">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Type (optional)</p>
        <div className="flex flex-wrap gap-2">
          {CAPTURE_KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(kind === k.id ? null : k.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-semibold transition-smooth active:scale-95',
                kind === k.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground'
              )}
            >
              <k.icon className="h-3.5 w-3.5" /> {k.label}
            </button>
          ))}
        </div>
      </section>

      <section className="animate-fade-up">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Module (optional)</p>
        <div className="flex flex-wrap gap-2">
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => setModule(module === m.id ? null : m.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-semibold transition-smooth active:scale-95',
                module === m.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
              )}
            >
              <m.icon className="h-3.5 w-3.5" /> {m.label}
            </button>
          ))}
        </div>
      </section>

      <section className="animate-fade-up">
        <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Try one</p>
        <div className="space-y-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setText(s)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left text-xs text-muted-foreground transition-smooth hover:border-primary/40 active:scale-[0.99]"
            >
              {s}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CapturePage;
