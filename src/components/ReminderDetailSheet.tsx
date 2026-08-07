import { useEffect, useRef, useState } from 'react';
import {
  CalendarClock, Check, FileText, Loader2, Paperclip, RotateCcw, Save, Trash2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSignedUrl } from '@/lib/media';
import { Reminder, REMINDER_TYPES, reminderIcon } from '@/lib/reminders';
import { asStatus, fromLocalInput, isOverdue, shiftDays, STATUS_META, toLocalInput } from '@/lib/status';
import { cn } from '@/lib/utils';

interface Props {
  reminder: Reminder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, patch: Partial<Reminder>) => Promise<{ error: Error | null }>;
  onToggleDone: (id: string, done: boolean) => Promise<{ error: unknown }>;
  onReschedule: (id: string, dueAt: string) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }> | void;
}

/**
 * The single, universal view for anything scheduled: calendar entries,
 * reminders, meetings. Identical wherever it is opened from.
 */
const ReminderDetailSheet = ({
  reminder, open, onOpenChange, onUpdate, onToggleDone, onReschedule, onDelete,
}: Props) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [due, setDue] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const attachment = useSignedUrl(reminder?.attachment_url);

  useEffect(() => {
    if (!reminder) return;
    setTitle(reminder.title);
    setNotes(reminder.notes ?? '');
    setDue(toLocalInput(reminder.due_at));
  }, [reminder]);

  if (!reminder) return null;

  const status = asStatus(reminder.done ? 'done' : reminder.status);
  const meta = STATUS_META[status];
  const Icon = reminderIcon(reminder.type);
  const typeLabel = REMINDER_TYPES.find((t) => t.id === reminder.type)?.label ?? 'Reminder';
  const overdue = isOverdue(reminder.due_at, status);

  const save = async () => {
    if (!title.trim()) return toast.error('Give it a name');
    setSaving(true);
    const { error } = await onUpdate(reminder.id, {
      title: title.trim(),
      notes: notes.trim() || null,
      due_at: fromLocalInput(due),
    });
    setSaving(false);
    if (error) return toast.error('Could not save changes');
    toast.success('Saved');
  };

  const postpone = async (days: number) => {
    const { error } = await onReschedule(reminder.id, shiftDays(reminder.due_at, days));
    if (error) return toast.error('Could not reschedule');
    toast.success(days === 1 ? 'Postponed to tomorrow' : `Postponed by ${days} days`);
  };

  const upload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop() ?? 'dat';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('captures').upload(path, file, {
      contentType: file.type,
    });
    if (uploadError) {
      setUploading(false);
      return toast.error(uploadError.message);
    }
    const { error } = await onUpdate(reminder.id, { attachment_url: path, attachment_name: file.name });
    setUploading(false);
    if (error) return toast.error('Could not attach the file');
    toast.success('File attached');
  };

  const isImage = /\.(png|jpe?g|gif|webp|heic)$/i.test(reminder.attachment_name ?? reminder.attachment_url ?? '');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-border p-0">
        <SheetHeader className="sticky top-0 z-10 space-y-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <SheetTitle className="truncate text-left text-base font-extrabold">{reminder.title}</SheetTitle>
              <p className="text-[11px] text-muted-foreground">{typeLabel} · scheduled</p>
            </div>
            <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold', meta.badge)}>
              {meta.label}
            </span>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-10 pt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={cn('inline-flex items-center gap-1', overdue ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
              <CalendarClock className="h-3.5 w-3.5" />
              {new Date(reminder.due_at).toLocaleString([], {
                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
              {overdue ? ' · overdue' : ''}
            </span>
            {reminder.amount != null && (
              <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                {reminder.amount}
              </span>
            )}
          </div>

          {/* Progress actions, identical to records */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onToggleDone(reminder.id, status !== 'done')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-smooth active:scale-95',
                status === 'done'
                  ? 'border border-border bg-card text-muted-foreground'
                  : 'bg-gradient-primary text-primary-foreground'
              )}
            >
              {status === 'done' ? <><RotateCcw className="h-3.5 w-3.5" /> Reopen</> : <><Check className="h-3.5 w-3.5" /> Mark as done</>}
            </button>
            <button
              type="button"
              onClick={() => postpone(1)}
              className="rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-smooth active:scale-95"
            >
              Postpone 1 day
            </button>
            <button
              type="button"
              onClick={() => postpone(7)}
              className="rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-smooth active:scale-95"
            >
              Next week
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Agenda, address, what to bring…"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Date &amp; time</label>
              <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="mt-1" />
            </div>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save changes
            </button>
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Attachment</p>
            {reminder.attachment_url && attachment ? (
              isImage ? (
                <a href={attachment} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-border">
                  <img src={attachment} alt={reminder.attachment_name ?? reminder.title} className="w-full object-cover" loading="lazy" />
                </a>
              ) : (
                <a
                  href={attachment}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-foreground">
                      {reminder.attachment_name ?? 'Attached file'}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">Tap to open or download</span>
                  </span>
                </a>
              )
            ) : (
              <p className="text-xs text-muted-foreground">No file attached yet.</p>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-smooth active:scale-95 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                {reminder.attachment_url ? 'Replace file' : 'Attach a file'}
              </button>
              {reminder.attachment_url && (
                <button
                  type="button"
                  onClick={async () => {
                    const { error } = await onUpdate(reminder.id, { attachment_url: null, attachment_name: null });
                    if (error) return toast.error('Could not remove the file');
                    toast.success('File removed');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-smooth active:scale-95"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await onDelete(reminder.id);
              onOpenChange(false);
              toast.success('Deleted');
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive transition-smooth active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ReminderDetailSheet;
