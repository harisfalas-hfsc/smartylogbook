import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, FileText, Loader2, Mic, Paperclip, Sparkles, Square, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { saveFacts, type AiFact } from '@/lib/facts';
import { saveMoneyItems, type AiMoneyItem } from '@/lib/money';
import { useMemories } from '@/lib/memories';
import { CAPTURE_KINDS, MODULES, CaptureKind, getModule } from '@/lib/constants';
import { useReminders } from '@/lib/reminders';
import { cn } from '@/lib/utils';

const suggestions = [
  'Upper body session, 48 minutes, felt strong',
  'Lunch: grilled salmon, rice and salad',
  'Paid €42.10 at the supermarket',
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
  due_date?: string | null;
  details?: Record<string, unknown>;
  related_ids?: string[];
  relation_note?: string | null;
  reminder?: { title?: string; type?: string; due_date?: string } | null;
  facts?: AiFact[];
  money?: AiMoneyItem[];
}

const readAsDataUrl = (file: File | Blob) =>
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
  const { memories: recent } = useMemories({ limit: 40 });
  const { create: createReminder } = useReminders();
  const [text, setText] = useState('');
  const [kind, setKind] = useState<CaptureKind | null>(null);
  const [module, setModule] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showOverride, setShowOverride] = useState(false);

  const candidates = recent.map((m) => ({
    id: m.id, title: m.title, module: m.module, kind: m.kind, occurred_at: m.occurred_at,
  }));

  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  /* ---------- voice ---------- */

  const transcribeBlob = async (blob: Blob, mime: string) => {
    setTranscribing(true);
    try {
      const dataUrl = await readAsDataUrl(blob);
      const format = mime.includes('mp4') || mime.includes('m4a') ? 'mp4' : mime.includes('ogg') ? 'ogg' : 'webm';
      const { data, error } = await supabase.functions.invoke('ai-brain', {
        body: { mode: 'transcribe', audio: dataUrl, audioFormat: format },
      });
      if (error) throw error;
      const transcript = String(data?.text ?? '').trim();
      if (!transcript) {
        toast.error('No speech detected — try again a bit closer to the mic');
        return;
      }
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setKind('voice');
      toast.success('Transcribed');
    } catch {
      toast.error('Could not transcribe that recording');
    } finally {
      setTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Recording is not supported in this browser');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(
        (m) => MediaRecorder.isTypeSupported?.(m)
      );
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        const type = recorder.mimeType || mime || 'audio/webm';
        const blob = new Blob(chunks, { type });
        if (blob.size < 1200) {
          toast.error('That recording was too short');
          return;
        }
        await transcribeBlob(blob, type);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      toast.info('Recording — tap the square to stop');
    } catch {
      toast.error('Microphone access was blocked. Allow it in your browser settings.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const startVoice = () => {
    if (recording) { stopRecording(); return; }
    if (transcribing) return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { void startRecording(); return; }

    let gotResult = false;
    let recognition: any;
    try {
      recognition = new SR();
    } catch {
      void startRecording();
      return;
    }
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (e: any) => {
      setListening(false);
      if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') {
        toast.error('Microphone access was blocked. Allow it in your browser settings.');
        return;
      }
      if (!gotResult) void startRecording(); // fall back to record + AI transcription
    };
    recognition.onresult = (e: any) => {
      gotResult = true;
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setKind('voice');
    };
    try {
      recognition.start();
    } catch {
      void startRecording();
    }
  };

  // Home-screen shortcuts: /app/capture?mode=voice | photo
  const modeParam = new URLSearchParams(useLocation().search).get('mode');
  useEffect(() => {
    if (modeParam === 'voice') startVoice();
    if (modeParam === 'photo') cameraInput.current?.click();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeParam]);



  /* ---------- files ---------- */

  const pickFile = async (chosen: File | undefined, asKind: CaptureKind) => {
    if (!chosen) return;
    const isImage = chosen.type.startsWith('image/');
    const isPdf = chosen.type === 'application/pdf';
    if (!isImage && !isPdf) {
      toast.error('Choose an image or a PDF');
      return;
    }
    if (chosen.size > 8 * 1024 * 1024) {
      toast.error('File is larger than 8 MB');
      return;
    }
    setFile(chosen);
    setKind(isPdf ? 'document' : asKind);
    setExtracted(null);

    if (!isImage) {
      setPreview(null);
      return;
    }

    const dataUrl = await readAsDataUrl(chosen);
    setPreview(dataUrl);
    setExtracting(true);
    try {
      const { data } = await supabase.functions.invoke('ai-brain', {
        body: { mode: 'extract', image: dataUrl, input: text, candidates },
      });
      if (data && !data.error) {
        setExtracted(data as Extracted);
        if (data.module) setModule(data.module as string);
        if (data.kind === 'receipt' || data.kind === 'expense') setKind('receipt');
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
    if (cameraInput.current) cameraInput.current.value = '';
    if (fileInput.current) fileInput.current.value = '';
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
          body: { mode: 'classify', input: text.trim(), candidates },
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

    const { error, id: newId } = await create({
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
      related_ids: Array.isArray(classified?.related_ids)
        ? classified!.related_ids!.map(String).filter((id) => recent.some((m) => m.id === id)).slice(0, 5)
        : [],
      relation_note: classified?.relation_note ?? null,
      metadata: classified
        ? {
            merchant: classified.merchant ?? null,
            category: classified.category ?? null,
            date: classified.date ?? null,
            due_date: classified.due_date ?? null,
            items: classified.items ?? [],
            details: classified.details ?? {},
          }
        : {},
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    if (newId && user) {
      void saveFacts(user.id, newId, classified?.facts, occurredAt);
      void saveMoneyItems(user.id, newId, classified?.money);
    }
    const reminder = classified?.reminder;
    if (reminder?.title && reminder.due_date) {
      const dueAt = new Date(`${reminder.due_date}T09:00:00`);
      if (!Number.isNaN(dueAt.getTime())) {
        await createReminder({
          title: String(reminder.title).slice(0, 80),
          type: (['task', 'bill', 'health', 'event'].includes(String(reminder.type)) ? reminder.type : 'task') as 'task' | 'bill' | 'health' | 'event',
          due_at: dueAt.toISOString(),
          module: classified?.module ?? null,
        });
        toast.info(`Reminder set: ${reminder.title}`);
      }
    }
    toast.success(classified?.module ? `Filed under ${getModule(classified.module).label} automatically` : 'Captured');
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
        <p className="mt-1 text-sm text-muted-foreground">
          Type, speak or snap it. The AI reads it, files it and connects it to what you already have — you never pick a category.
        </p>
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
            {extracted.related_ids?.length ? (
              <p className="mt-2 text-[11px] font-semibold text-primary">
                Connected to {extracted.related_ids.length} existing{' '}
                {extracted.related_ids.length === 1 ? 'entry' : 'entries'}
                {extracted.relation_note ? ` — ${extracted.relation_note}` : ''}
              </p>
            ) : null}
            {extracted.items?.length ? (
              <p className="mt-2 text-[11px] text-muted-foreground">{extracted.items.slice(0, 6).join(' · ')}</p>
            ) : null}
          </div>
        )}

        {file && !preview && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-secondary/50 px-3 py-2.5">
            <FileText className="h-4 w-4 text-primary" />
            <span className="flex-1 truncate text-xs font-semibold text-foreground">{file.name}</span>
            <button onClick={clearFile} aria-label="Remove file" className="text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0], 'photo')}
        />
        <input
          ref={fileInput}
          type="file"
          accept="image/*,application/pdf"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0], 'photo')}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <button
            onClick={startVoice}
            disabled={transcribing}
            aria-label={recording ? 'Stop recording' : 'Voice capture'}
            className={cn(
              'flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold transition-smooth active:scale-95 disabled:opacity-60',
              listening || recording
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {transcribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : recording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {transcribing ? 'Transcribing' : recording ? 'Stop' : listening ? 'Listening' : 'Voice'}
          </button>
          <button
            onClick={() => cameraInput.current?.click()}
            aria-label="Take a photo"
            className="flex items-center gap-1.5 rounded-2xl bg-secondary px-3 py-2.5 text-xs font-semibold text-secondary-foreground transition-smooth active:scale-95"
          >
            <Camera className="h-4 w-4" /> Camera
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            aria-label="Upload a photo, receipt or PDF"
            className="flex items-center gap-1.5 rounded-2xl bg-secondary px-3 py-2.5 text-xs font-semibold text-secondary-foreground transition-smooth active:scale-95"
          >
            <Paperclip className="h-4 w-4" /> File
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
        <button
          onClick={() => setShowOverride((v) => !v)}
          className="text-xs font-semibold text-muted-foreground underline underline-offset-4"
        >
          {showOverride ? 'Hide manual override' : 'The AI files this automatically — override manually'}
        </button>
      </section>

      {showOverride && (
      <>
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
      </>
      )}

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
