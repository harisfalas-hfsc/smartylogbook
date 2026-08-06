import { Clock, RotateCcw, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { daysLeftInTrash, type Memory } from '@/lib/memories';
import { MODULES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const moduleLabel = (id: string) => MODULES.find((m) => m.id === id)?.label ?? id;

const isImage = (m: Memory) =>
  m.kind === 'photo' || m.kind === 'image' || /\.(png|jpe?g|gif|webp|heic)$/i.test(m.attachment_url ?? '');

interface Props {
  record: Memory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (record: Memory) => void;
  onDelete: (record: Memory) => void;
}

const TrashDetailSheet = ({ record, open, onOpenChange, onRestore, onDelete }: Props) => {
  if (!record) return null;
  const left = daysLeftInTrash(record.deleted_at ?? new Date().toISOString());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-border p-0">
        <SheetHeader className="sticky top-0 z-10 space-y-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl">
          <SheetTitle className="pr-8 text-left text-base font-extrabold leading-snug">{record.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
              {moduleLabel(record.module)}
            </span>
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                left <= 7 ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground',
              )}
            >
              <Clock className="h-3 w-3" /> {left} day{left === 1 ? '' : 's'} left
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {new Date(record.occurred_at).toLocaleString(undefined, {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>

          {record.attachment_url && isImage(record) && (
            <img
              src={record.attachment_url}
              alt={record.title}
              loading="lazy"
              className="w-full rounded-2xl border border-border object-cover"
            />
          )}
          {record.attachment_url && !isImage(record) && (
            <a
              href={record.attachment_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-2xl bg-secondary px-4 py-2 text-xs font-semibold text-secondary-foreground"
            >
              Open attachment
            </a>
          )}

          {record.summary && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{record.summary}</p>
          )}
          {record.content && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{record.content}</p>
          )}

          {record.ai_tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {record.ai_tags.map((t) => (
                <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          )}

          {record.amount != null && (
            <p className="text-sm font-semibold text-foreground">
              {record.amount} {record.currency ?? ''}
            </p>
          )}

          <div className="flex gap-2 border-t border-border pt-4">
            <button
              onClick={() => onRestore(record)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary transition-smooth active:scale-[0.98]"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restore
            </button>
            <button
              onClick={() => onDelete(record)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive transition-smooth active:scale-[0.98]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete forever
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TrashDetailSheet;
