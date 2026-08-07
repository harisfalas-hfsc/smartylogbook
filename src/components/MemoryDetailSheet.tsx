import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon, Check, FileText, Link2, Loader2, MapPin, Paperclip, Pencil,
  Plus, RotateCcw, Save, Sparkles, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { kindIcon } from '@/lib/constants';
import { albumOf, formatBytes, useSignedUrl } from '@/lib/media';
import { useCategories } from '@/lib/categories';
import { Memory, titleOf } from '@/lib/memories';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { asStatus, isActionableItem, isGalleryModule, isOverdue, shiftDays, STATUS_META } from '@/lib/status';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  memory: Memory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allMemories?: Memory[];
  onOpenMemory?: (memory: Memory) => void;
  onSave?: (id: string, patch: Partial<Memory>) => Promise<{ error: Error | null }> | void;
  onMove?: (memory: Memory, toModule: string) => Promise<{ error: Error | null }> | void;
  onDelete?: (id: string) => void;
}

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};

interface StoredAttachment {
  path: string;
  name: string;
  type?: string;
  size?: number;
}

const attachmentsOf = (memory: Memory): StoredAttachment[] => {
  const additional = Array.isArray(memory.metadata?.attachments)
    ? (memory.metadata.attachments as unknown[]).filter((item): item is StoredAttachment => {
        if (!item || typeof item !== 'object') return false;
        return typeof (item as { path?: unknown }).path === 'string';
      })
    : [];
  const primary = memory.attachment_url
    ? [{
        path: memory.attachment_url,
        name: String(memory.metadata?.file_name ?? titleOf(memory)),
        type: typeof memory.metadata?.file_type === 'string' ? memory.metadata.file_type : undefined,
        size: typeof memory.metadata?.file_size === 'number' ? memory.metadata.file_size : undefined,
      }]
    : [];
  return [...primary, ...additional.filter((item) => item.path !== memory.attachment_url)];
};

const AttachmentRow = ({ file, onRemove }: { file: StoredAttachment; onRemove?: () => void }) => {
  const url = useSignedUrl(file.path);
  const image = file.type?.startsWith('image/');
  const video = file.type?.startsWith('video/');
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {url && image ? (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          <img src={url} alt={file.name} className="max-h-72 w-full object-cover" loading="lazy" />
        </a>
      ) : url && video ? (
        <video src={url} controls playsInline className="max-h-72 w-full" />
      ) : (
        <a
          href={url ?? undefined}
          target={url ? '_blank' : undefined}
          rel={url ? 'noreferrer' : undefined}
          aria-disabled={!url}
          className={cn('flex min-w-0 items-center gap-3 p-3.5', url ? 'hover:bg-secondary/50' : 'cursor-wait opacity-70')}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            {url ? <FileText className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-foreground">{file.name}</span>
            <span className="block text-[11px] text-muted-foreground">
              {url ? 'Tap to open or download' : 'Preparing secure file link…'}
            </span>
          </span>
        </a>
      )}
      <div className="flex items-center justify-between border-t border-border px-3.5 py-2">
        <span className="text-[11px] text-muted-foreground">{typeof file.size === 'number' ? formatBytes(file.size) : 'Attachment'}</span>
        {onRemove && (
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
            <Trash2 className="h-3.5 w-3.5" /> Remove file
          </button>
        )}
      </div>
    </div>
  );
};


const MemoryDetailSheet = ({
  memory, open, onOpenChange, allMemories = [], onOpenMemory, onSave, onMove, onDelete,
}: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Memory>>({});
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [album, setAlbum] = useState('');
  const [localStatus, setLocalStatus] = useState<'open' | 'done' | 'postponed'>('open');
  const [localModule, setLocalModule] = useState('personal');
  const [localDueAt, setLocalDueAt] = useState<string | null>(null);
  const [localCompletedAt, setLocalCompletedAt] = useState<string | null>(null);
  const [localAttachments, setLocalAttachments] = useState<StoredAttachment[]>([]);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const { categories, getCategory } = useCategories();

  useEffect(() => {
    if (!memory) return;
    setEditing(false);
    setDraft({
      title: memory.title,
      summary: memory.summary ?? '',
      content: memory.content ?? '',
      amount: memory.amount,
      location: memory.location ?? '',
      occurred_at: memory.occurred_at,
    });
    setTagsText((memory.ai_tags ?? []).join(', '));
    setAlbum(albumOf(memory) ?? '');
    setLocalStatus(asStatus(memory.status));
    setLocalModule(memory.module);
    setLocalDueAt(memory.due_at ?? null);
    setLocalCompletedAt(memory.completed_at ?? null);
    setLocalAttachments(attachmentsOf(memory));
  }, [memory]);

  if (!memory) return null;
  const module = getCategory(localModule);
  const Icon = kindIcon(memory.kind);
  const related = allMemories.filter((m) => memory.related_ids?.includes(m.id));
  const status = localStatus;
  const statusMeta = STATUS_META[status];
  const overdue = isOverdue(localDueAt, status);
  const gallery = isGalleryModule(localModule);
  const actionable = isActionableItem({ ...memory, module: localModule, status: localStatus, due_at: localDueAt });

  const setStatus = async (next: 'open' | 'done' | 'postponed', dueAt?: string) => {
    if (!onSave || changingStatus) return;
    setChangingStatus(true);
    const completedAt = next === 'done' ? new Date().toISOString() : null;
    const res = await onSave(memory.id, {
      status: next,
      completed_at: completedAt,
      ...(dueAt ? { due_at: dueAt } : {}),
    });
    setChangingStatus(false);
    if (res && 'error' in res && res.error) return toast.error('Could not update this record');
    setLocalStatus(next);
    setLocalCompletedAt(completedAt);
    if (dueAt) setLocalDueAt(dueAt);
    toast.success(
      next === 'done' ? 'Marked as completed' : next === 'postponed' ? 'Postponed' : 'Reopened'
    );
  };

  const uploadFile = async (file: File) => {
    if (!user || !onSave) return;
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
    const nextFile = { path, name: file.name, type: file.type, size: file.size };
    const hasPrimary = localAttachments.length > 0;
    const additional = hasPrimary ? [...localAttachments.slice(1), nextFile] : [];
    const res = await onSave(memory.id, hasPrimary ? {
      metadata: { ...(memory.metadata ?? {}), attachments: additional },
    } : {
      attachment_url: path,
      metadata: { ...(memory.metadata ?? {}), file_name: file.name, file_type: file.type, file_size: file.size, attachments: [] },
    });
    setUploading(false);
    if (res && 'error' in res && res.error) return toast.error('Could not attach the file');
    setLocalAttachments((current) => [...current, nextFile]);
    toast.success('File added');
  };

  const removeAttachment = async (file: StoredAttachment) => {
    if (!onSave || !window.confirm(`Remove “${file.name}” from this record?`)) return;
    const remaining = localAttachments.filter((item) => item.path !== file.path);
    const nextPrimary = remaining[0];
    const nextMetadata = {
      ...(memory.metadata ?? {}),
      file_name: nextPrimary?.name ?? null,
      file_type: nextPrimary?.type ?? null,
      file_size: nextPrimary?.size ?? null,
      attachments: remaining.slice(1),
    };
    const res = await onSave(memory.id, { attachment_url: nextPrimary?.path ?? null, metadata: nextMetadata });
    if (res && 'error' in res && res.error) return toast.error('Could not remove the file');
    if (!/^https?:\/\//.test(file.path)) await supabase.storage.from('captures').remove([file.path]);
    setLocalAttachments(remaining);
    toast.success('File removed');
  };


  const save = async () => {
    if (!onSave) return;
    setSaving(true);
    const res = await onSave(memory.id, {
      ...draft,
      ai_tags: tagsText.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      metadata: { ...(memory.metadata ?? {}), album: album.trim() || null },
    });
    setSaving(false);
    if (res && 'error' in res && res.error) {
      toast.error('Could not save changes');
      return;
    }
    toast.success('Record updated');
    setEditing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-border p-0">
        <SheetHeader className="sticky top-0 z-10 space-y-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${module.tint}`}>
              <Icon className={`h-5 w-5 ${module.color}`} />
            </div>
            <SheetTitle className="min-w-0 flex-1 truncate text-left text-base font-extrabold">
              {editing ? 'Edit record' : titleOf(memory)}
            </SheetTitle>
            {onSave && (
              editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-xl bg-gradient-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-60"
                  >
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              )
            )}
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-10 pt-4">
          {onSave && (
            <div className={cn(
              'space-y-3 rounded-2xl border p-4 transition-colors',
              status === 'done' && 'border-success/30 bg-success/10',
              status === 'postponed' && 'border-warning/30 bg-warning/10',
              status === 'open' && 'border-border bg-secondary/50'
            )}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('rounded-full px-3 py-1.5 text-xs font-extrabold', statusMeta.badge)}>
                  {statusMeta.label}
                </span>
                {localDueAt && (
                  <span className={cn('text-[11px] font-medium', overdue ? 'text-destructive' : 'text-muted-foreground')}>
                    Due {new Date(localDueAt).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {overdue ? ' · overdue' : ''}
                  </span>
                )}
                {status === 'done' && localCompletedAt && (
                  <span className="text-[11px] text-muted-foreground">
                    on {new Date(localCompletedAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-foreground">
                {status === 'done' ? 'This record is completed.' : status === 'postponed' ? `Moved to ${localDueAt ? new Date(localDueAt).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'a later date'}.` : 'This record still needs attention.'}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus(status === 'done' ? 'open' : 'done')}
                  disabled={changingStatus}
                  className={cn(
                    'inline-flex min-w-0 items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-bold transition-smooth active:scale-95',
                    status === 'done'
                      ? 'border border-border bg-card text-muted-foreground'
                      : 'bg-gradient-primary text-primary-foreground'
                  )}
                >
                  {status === 'done'
                    ? <><RotateCcw className="h-3.5 w-3.5" /> Reopen</>
                    : <><Check className="h-3.5 w-3.5" /> Mark as done</>}
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('postponed', shiftDays(localDueAt ?? memory.occurred_at, 1))}
                  disabled={changingStatus}
                  className="min-w-0 rounded-xl border border-border bg-card px-1.5 py-2 text-[11px] font-semibold text-foreground transition-smooth active:scale-95"
                >
                  +1 day
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('postponed', shiftDays(localDueAt ?? memory.occurred_at, 7))}
                  disabled={changingStatus}
                  className="min-w-0 rounded-xl border border-border bg-card px-1.5 py-2 text-[11px] font-semibold text-foreground transition-smooth active:scale-95"
                >
                  Next week
                </button>
              </div>
            </div>
          )}

          {editing ? (
            <div className="space-y-3 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-extrabold text-foreground">Edit record details</p>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Title</label>
                <Input value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Summary</label>
                <Input value={draft.summary ?? ''} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Details</label>
                <Textarea
                  value={draft.content ?? ''}
                  onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                  rows={6}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Amount</label>
                  <Input
                    type="number"
                    value={draft.amount ?? ''}
                    onChange={(e) => setDraft({ ...draft, amount: e.target.value === '' ? null : Number(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Location</label>
                  <Input value={draft.location ?? ''} onChange={(e) => setDraft({ ...draft, location: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Date &amp; time</label>
                <Input
                  type="datetime-local"
                  value={toLocalInput(draft.occurred_at ?? memory.occurred_at)}
                  onChange={(e) => setDraft({ ...draft, occurred_at: new Date(e.target.value).toISOString() })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Album (subcategory)</label>
                <Input
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="December 2025, Greece trip, Blood tests..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Tags (comma separated)</label>
                <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className="mt-1" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {new Date(memory.occurred_at).toLocaleString([], {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </span>
                {memory.amount != null && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                    {memory.amount.toLocaleString(undefined, { style: 'currency', currency: memory.currency ?? 'EUR' })}
                  </span>
                )}
                {memory.location && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {memory.location}</span>
                )}
              </div>

              {memory.summary && <p className="text-sm font-medium text-foreground">{memory.summary}</p>}
              {memory.content && (
                <div className="smarty-card p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{memory.content}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/app/assistant?ask=${encodeURIComponent(`About my entry "${memory.title}": `)}`);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary"
              >
                <Sparkles className="h-3.5 w-3.5" /> Ask Smarty Assistant about this
              </button>
              {localAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Attachments</p>
                  {localAttachments.map((file) => (
                    <AttachmentRow key={file.path} file={file} onRemove={onSave ? () => void removeAttachment(file) : undefined} />
                  ))}
                </div>
              )}

              {onSave && (
                <div>
                  <input
                    ref={fileInput}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadFile(f);
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
                     <Plus className="h-3.5 w-3.5" /> {localAttachments.length ? 'Add another file' : 'Add a file'}
                  </button>
                </div>
              )}

              {memory.ai_tags?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {memory.ai_tags.map((t) => (
                    <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">#{t}</span>
                  ))}
                </div>
              ) : null}

              {related.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <Link2 className="mr-1 inline h-3.5 w-3.5" /> Connected records
                  </p>
                  {related.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onOpenMemory?.(r)}
                      className="smarty-card w-full p-3 text-left text-sm font-medium text-foreground transition-smooth hover:shadow-elevated"
                    >
                      {r.title}
                      <span className="ml-2 text-xs text-muted-foreground">{new Date(r.occurred_at).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {onMove && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Move to another category</p>
              <Select
                value={localModule}
                onValueChange={async (next) => {
                  if (next === localModule) return;
                  const chosen = categories.find((item) => item.id === next);
                  const res = await onMove(memory, next);
                  if (res && 'error' in res && res.error) return toast.error('Could not move this record');
                  setLocalModule(next);
                  toast.success(`Moved to ${chosen?.label ?? next}`, { description: 'Smarty Assistant will remember this choice.' });
                }}
              >
                <SelectTrigger className="h-12 rounded-2xl border-border bg-card px-4 font-semibold">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {categories.map((item) => <SelectItem key={item.id} value={item.id} className="rounded-xl py-2.5">{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Selecting a category moves this record immediately.</p>
            </div>
          )}

          {onDelete && (
            <button
              onClick={() => { onDelete(memory.id); onOpenChange(false); toast.success('Moved to Trash, restore it within 30 days in Settings › Trash'); }}
              className="inline-flex items-center gap-2 rounded-2xl border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive transition-smooth active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete record
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MemoryDetailSheet;
