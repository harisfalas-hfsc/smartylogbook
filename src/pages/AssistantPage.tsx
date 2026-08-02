import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Mic, Paperclip, Send, Square, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useMemories } from '@/lib/memories';
import { usePreferences } from '@/lib/preferences';
import { useDailyBrief } from '@/lib/assistant';
import DailyBriefCard from '@/components/DailyBriefCard';
import AssistantMemoryCard from '@/components/AssistantMemoryCard';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: { url: string; name: string; isImage: boolean }[];
}

const readAsDataUrl = (file: File | Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });

const AssistantPage = () => {
  const { memories, loading, create, reload } = useMemories({ limit: 60 });
  const { prefs } = usePreferences();
  const { brief, generating, regenerate } = useDailyBrief(memories, prefs, !loading);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

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
        toast.error('No speech detected — try again closer to the mic');
        return;
      }
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
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

  const toggleVoice = () => {
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
    recognition.onresult = (e: any) => {
      gotResult = true;
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join(' ').trim();
      if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => { setRecording(false); if (!gotResult) void startRecording(); };
    recognition.onend = () => { setRecording(false); };
    try {
      recognition.start();
      setRecording(true);
      toast.info('Listening…');
    } catch {
      void startRecording();
    }
  };

  /* ---------- attachments ---------- */

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = '';
    const ok = picked.filter((f) => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (ok.length !== picked.length) toast.error('Only images and PDF files are supported');
    Promise.all(ok.map(async (file) => ({ file, url: await readAsDataUrl(file) })))
      .then((next) => setFiles((prev) => [...prev, ...next].slice(0, 3)))
      .catch(() => toast.error('Could not read that file'));
  };

  /* ---------- send ---------- */

  const send = async () => {
    const question = input.trim();
    if ((!question && files.length === 0) || thinking) return;

    const attachments = files.map((f) => ({
      url: f.url,
      name: f.file.name,
      isImage: f.file.type.startsWith('image/'),
    }));
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: question, attachments }]);
    setInput('');
    setFiles([]);
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-brain', {
        body: {
          mode: 'chat',
          input: question,
          retrieve: true,
          history,
          attachments: attachments.map((a) => ({ url: a.url, name: a.name })),
          preferences: prefs ? { goals: prefs.goals, focus: prefs.focus_modules, tone: prefs.tone } : null,
          memories: memories.slice(0, 40).map((m) => ({
            id: m.id, title: m.title, summary: m.summary, module: m.module, kind: m.kind,
            amount: m.amount, occurred_at: m.occurred_at, tags: m.ai_tags,
          })),
          candidates: memories.slice(0, 40).map((m) => ({
            id: m.id, title: m.title, module: m.module, kind: m.kind, occurred_at: m.occurred_at,
          })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const save = data?.save;
      if (save && typeof save === 'object' && save.title) {
        const { error: saveError } = await create({
          title: String(save.title).slice(0, 80),
          summary: save.summary ? String(save.summary) : null,
          content: save.content ? String(save.content) : question || null,
          module: save.module ? String(save.module) : 'personal',
          kind: save.kind ? String(save.kind) : 'text',
          ai_tags: Array.isArray(save.ai_tags) ? save.ai_tags.map(String).slice(0, 4) : [],
          amount: typeof save.amount === 'number' ? save.amount : null,
          related_ids: Array.isArray(save.related_ids)
            ? save.related_ids.map(String).filter((id: string) => memories.some((m) => m.id === id)).slice(0, 5)
            : [],
        });
        if (saveError) toast.error('Could not save that to your timeline');
        else { toast.success('Saved to your timeline'); void reload(); }
      }
      const question2 = typeof data?.question === 'string' ? data.question.trim() : '';
      const answer = String(data?.answer ?? '').trim();
      const content = question2 && !answer.includes(question2)
        ? `${answer}\n\n${question2}`.trim()
        : answer;
      setMessages((prev) => [...prev, { role: 'assistant', content: content || 'I could not read that — try again.' }]);
    } catch (err) {
      toast.error((err as Error).message || 'Smarty Assistant is unavailable right now');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Something went wrong reaching me just now. Please try again.' }]);
    } finally {
      setThinking(false);
    }
  };

  const quick = [
    'When was my last blood test?',
    'Read this report and explain it',
    'How much did I spend on groceries last month?',
    'What do I need to deal with this week?',
  ];

  return (
    <div className="space-y-5 pb-4">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Smarty <span className="gradient-text">Assistant</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask anything about your life. It searches everything you have logged, reads your documents and answers.
        </p>
      </header>

      <DailyBriefCard
        brief={brief}
        generating={generating}
        onRegenerate={regenerate}
        onAsk={(t) => setInput(t)}
      />

      <AssistantMemoryCard />

      <div className="space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {quick.map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-smooth active:scale-95"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] space-y-2 rounded-3xl px-4 py-3 text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-gradient-primary text-primary-foreground shadow-glow'
                  : 'smarty-card text-foreground'
              )}
            >
              {m.attachments?.map((a) =>
                a.isImage ? (
                  <img key={a.url} src={a.url} alt={a.name} className="max-h-48 rounded-2xl object-cover" />
                ) : (
                  <p key={a.url} className="text-xs opacity-80">📄 {a.name}</p>
                )
              )}
              {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
            </div>
          </div>
        ))}

        {thinking && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Smarty Assistant is thinking…
          </p>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-24 z-20 md:bottom-4">
        <div className="smarty-card space-y-3 p-3">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="relative">
                  {f.file.type.startsWith('image/') ? (
                    <img src={f.url} alt={f.file.name} className="h-16 w-16 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-16 items-center rounded-xl bg-secondary px-3 text-xs font-medium">
                      {f.file.name.slice(0, 18)}
                    </div>
                  )}
                  <button
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label="Remove attachment"
                    className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder="Ask your assistant anything…"
            className="w-full resize-none bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              aria-label="Voice"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl transition-smooth active:scale-95',
                recording ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
              )}
            >
              {transcribing ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : recording ? <Square className="h-4 w-4" /> : <Mic className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={() => cameraInput.current?.click()}
              aria-label="Camera"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-smooth active:scale-95"
            >
              <Camera className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => fileInput.current?.click()}
              aria-label="Attach file"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-smooth active:scale-95"
            >
              <Paperclip className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={send}
              disabled={thinking || (!input.trim() && files.length === 0)}
              aria-label="Send"
              className="ml-auto flex h-10 items-center gap-2 rounded-2xl bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-95 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Ask
            </button>
          </div>

          <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
          <input ref={fileInput} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={onPick} />
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
