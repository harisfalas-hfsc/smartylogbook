import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Check, Link2, MapPin, Pencil, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { kindIcon } from '@/lib/constants';
import { albumOf, formatBytes, formatDuration, durationOf, isVideoMemory, useSignedUrl } from '@/lib/media';
import { useCategories } from '@/lib/categories';
import { Memory } from '@/lib/memories';
import { cn } from '@/lib/utils';

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

const MemoryDetailSheet = ({
  memory, open, onOpenChange, allMemories = [], onOpenMemory, onSave, onMove, onDelete,
}: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Memory>>({});
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [album, setAlbum] = useState('');
  const attachment = useSignedUrl(memory?.attachment_url);
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
  }, [memory]);

  if (!memory) return null;
  const module = getCategory(memory.module);
  const Icon = kindIcon(memory.kind);
  const related = allMemories.filter((m) => memory.related_ids?.includes(m.id));

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
              {editing ? 'Edit record' : memory.title}
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
          {editing ? (
            <div className="space-y-3">
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
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    ...(isDateOnly(memory) ? {} : { hour: '2-digit', minute: '2-digit' }),
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

              {albumOf(memory) && (
                <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {albumOf(memory)}
                </span>
              )}
              {memory.summary && <p className="text-sm font-medium text-foreground">{memory.summary}</p>}
              {memory.content && (
                <div className="smarty-card p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{memory.content}</p>
                </div>
              )}
              {memory.attachment_url && attachment && (
                isVideoMemory(memory) ? (
                  <video src={attachment} controls playsInline className="w-full overflow-hidden rounded-2xl border border-border" />
                ) : (
                  <a href={attachment} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-border">
                    <img src={attachment} alt={memory.title} className="w-full object-cover" loading="lazy" />
                  </a>
                )
              )}
              {memory.attachment_url && (
                <p className="text-[11px] text-muted-foreground">
                  {typeof memory.metadata?.file_size === 'number' ? formatBytes(memory.metadata.file_size as number) : 'File'}
                  {durationOf(memory) != null ? ` , ${formatDuration(durationOf(memory)!)}` : ''}
                </p>
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
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((m) => (
                  <button
                    key={m.id}
                    onClick={async () => {
                      if (m.id === memory.module) return;
                      const res = await onMove(memory, m.id);
                      if (res && 'error' in res && res.error) return toast.error('Could not move this record');
                      toast.success(`Moved to ${m.label}`, { description: 'Smarty Assistant will remember this choice.' });
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-[11px] font-semibold transition-smooth active:scale-95',
                      m.id === memory.module ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
                    )}
                  >
                    <m.icon className={cn('h-3.5 w-3.5', m.id === memory.module ? '' : m.color)} />
                    {m.label}
                    {m.id === memory.module && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
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
