import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Mic, Receipt, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

interface Extracted {
  title?: string;
  summary?: string;
  module?: string;
  kind?: string;
  ai_tags?: string[];
  amount?: number | null;
  currency?: string | null;
  merchant?: string | null;
  date?: string | null;
  category?: string | null;
  items?: string[];
}

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });

const CapturePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { create } = useMemories({ limit: 1 });
  const [text, setText] = useState('');
  const [kind, setKind] = useState<CaptureKind | null>(null);
  const [module, setModule] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const receiptInput = useRef<HTMLInputElement>(null);

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

  const pickFile = async (chosen: File | undefined, asKind: CaptureKind) => {
    if (!chosen) return;
    if (!chosen.type.startsWith('image/')) {
      toast.error('Please choose an image');
      return;
    }
    if (chosen.size > 8 * 1024 * 1024) {
      toast.error('Image is larger than 8 MB');
      return;
    }
    const dataUrl = await readAsDataUrl(chosen);
    setFile(chosen);
    setPreview(dataUrl);
    setKind(asKind);
    setExtracted(null);
    setExtracting(true);
    try {
      const { data } = await supabase.functions.invoke('ai-brain', {
        body: { mode: 'extract', image: dataUrl, input: text },
      });
      if (data && !data.error) {
        setExtracted(data as Extracted);
        if (data.module) setModule(data.module as string);
        if (!text.trim() && data.summary) setText(String(data.summary));
      } else if (data?.error) {
        toast.error(String(data.error));
      }
    } catch {
      toast.error('Could not read that image');
    } finally {
      setExtracting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setExtracted(null);
  };

  const save = async () => {
    if (!text.trim() && !file) {
      toast.error('Capture something first');
      return;
    }
    setSaving(true);

    let classified: Extracted | null = extracted;
    if (!classified && text.trim()) {
      try {
        const { data } = await supabase.functions.invoke('ai-brain', {
          body: { mode: 'classify', input: text.trim() },
        });
        if (data && !data.error) classified = data as Extracted;
      } catch {
        /* fall back to raw capture */
      }
    }

    let attachmentUrl: string | null = null;
    if (file && user) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('captures').upload(path, file, {
        contentType: file.type,
      });
      if (uploadError) {
        setSaving(false);
        toast.error(uploadError.message);
        return;
      }
      attachmentUrl = path;
    }

    const occurredAt = classified?.date ? new Date(`${classified.date}T12:00:00`).toISOString() : undefined;

    const { error } = await create({
      title: classified?.title ?? text.trim().slice(0, 60) ?? 'Capture',
      summary: classified?.summary ?? null,
      content: text.trim() || null,
      module: module ?? classified?.module ?? 'personal',
      kind: kind ?? (classified?.kind as CaptureKind) ?? 'text',
      ai_tags: Array.isArray(classified?.ai_tags) ? classified!.ai_tags!.slice(0, 4) : [],
      amount: typeof classified?.amount === 'number' ? classified.amount : null,
      currency: classified?.currency ?? null,
      location: classified?.merchant ?? null,
      attachment_url: attachmentUrl,
      occurred_at: occurredAt,
      metadata: classified
        ? {
            merchant: classified.merchant ?? null,
            category: classified.category ?? null,
            date: classified.date ?? null,
            items: classified.items ?? [],
          }
        : {},
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(classified?.module ? `Filed under ${classified.module}` : 'Memory captured');
    setText('');
    setKind(null);
    setModule(null);
    clearFile();
    navigate('/app/timeline');
  };

  return (
    <div className="space-y-5">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Quick Capture</h1>
        <p className="mt-1 text-sm text-muted-foreground">Type, speak or snap it. The AI reads and files it for you.</p>
      </header>

      <div className="smarty-card animate-fade-up p-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What just happened?"
          rows={5}
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
        />

        {preview && (
          <div className="relative mt-3 overflow-hidden rounded-2xl border border-border">
            <img src={preview} alt="Capture preview" className="max-h-56 w-full object-cover" />
            <button
              onClick={clearFile}
              aria-label="Remove image"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-xl bg-background/85 text-foreground backdrop-blur"
            >
              <X className="h-4 w-4" />
            </button>
            {extracting && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 text-sm font-semibold text-foreground backdrop-blur-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading the image…
              </div>
            )}
          </div>
        )}

        {extracted && !extracting && (
          <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Extracted</p>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              {[
                ['Title', extracted.title],
                ['Merchant', extracted.merchant],
                ['Date', extracted.date],
                ['Amount', extracted.amount != null ? `${extracted.amount} ${extracted.currency ?? ''}`.trim() : null],
                ['Category', extracted.category],
                ['Module', extracted.module],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={String(label)}>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="font-semibold text-foreground">{String(value)}</p>
                  </div>
                ))}
            </div>
            {extracted.items?.length ? (
              <p className="mt-2 text-[11px] text-muted-foreground">{extracted.items.slice(0, 6).join(' · ')}</p>
            ) : null}
          </div>
        )}

        <input
          ref={photoInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0], 'photo')}
        />
        <input
          ref={receiptInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0], 'receipt')}
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
            onClick={() => photoInput.current?.click()}
            aria-label="Photo capture"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-smooth active:scale-95"
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            onClick={() => receiptInput.current?.click()}
            aria-label="Receipt upload"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-smooth active:scale-95"
          >
            <Receipt className="h-5 w-5" />
          </button>
          <button
            onClick={save}
            disabled={saving || extracting}
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
