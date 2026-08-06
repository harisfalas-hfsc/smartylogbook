import { useMemo, useState } from 'react';
import {
  CheckCheck, ChevronDown, Clock, FileText, Image as ImageIcon, Info, Loader2, MoreVertical,
  RotateCcw, Trash2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTrash, daysLeftInTrash, TRASH_RETENTION_DAYS, type Memory } from '@/lib/memories';
import { MODULES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const moduleLabel = (id: string) => MODULES.find((m) => m.id === id)?.label ?? id;

type Filter = 'all' | 'soon' | 'notes' | 'photos' | 'files';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'soon', label: 'Soon' },
  { id: 'notes', label: 'Notes' },
  { id: 'photos', label: 'Photos' },
  { id: 'files', label: 'Files' },
];

const isPhoto = (m: Memory) =>
  m.kind === 'photo' || m.kind === 'image' || /\.(png|jpe?g|gif|webp|heic)$/i.test(m.attachment_url ?? '');
const isFile = (m: Memory) => !!m.attachment_url && !isPhoto(m);

const matches = (m: Memory, filter: Filter) => {
  if (filter === 'all') return true;
  if (filter === 'soon') return daysLeftInTrash(m.deleted_at ?? new Date().toISOString()) <= 7;
  if (filter === 'photos') return isPhoto(m);
  if (filter === 'files') return isFile(m);
  return !m.attachment_url;
};

const styleOf = (m: Memory) =>
  isPhoto(m)
    ? { icon: ImageIcon, tint: 'bg-primary/10', color: 'text-primary' }
    : isFile(m)
      ? { icon: FileText, tint: 'bg-secondary', color: 'text-secondary-foreground' }
      : { icon: Trash2, tint: 'bg-secondary', color: 'text-muted-foreground' };

const TrashPage = () => {
  const { items, loading, restore, deleteForever, restoreMany, deleteMany } = useTrash();
  const [filter, setFilter] = useState<Filter>('all');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ ids: string[]; all?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: items.length, soon: 0, notes: 0, photos: 0, files: 0 };
    for (const m of items) for (const f of FILTERS) if (f.id !== 'all' && matches(m, f.id)) c[f.id] += 1;
    return c;
  }, [items]);

  const visible = useMemo(() => items.filter((m) => matches(m, filter)), [items, filter]);
  const visibleIds = useMemo(() => visible.map((m) => m.id), [visible]);
  const picked = useMemo(() => visibleIds.filter((id) => selected.has(id)), [visibleIds, selected]);
  const allPicked = visibleIds.length > 0 && picked.length === visibleIds.length;

  const exitSelect = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => setSelected(allPicked ? new Set() : new Set(visibleIds));

  const runRestore = async (ids: string[]) => {
    if (!ids.length || busy) return;
    setBusy(true);
    const { error } = await restoreMany(ids);
    setBusy(false);
    toast[error ? 'error' : 'success'](
      error ? 'Could not restore' : `${ids.length} record${ids.length === 1 ? '' : 's'} restored`,
    );
    exitSelect();
  };

  const doDelete = async () => {
    if (!confirm || busy) return;
    setBusy(true);
    const { error } = await deleteMany(confirm.ids);
    setBusy(false);
    toast[error ? 'error' : 'success'](
      error ? 'Could not delete' : `${confirm.ids.length} record${confirm.ids.length === 1 ? '' : 's'} deleted`,
    );
    setConfirm(null);
    exitSelect();
  };

  const renderItem = (m: Memory) => {
    const style = styleOf(m);
    const Icon = style.icon;
    const left = daysLeftInTrash(m.deleted_at ?? new Date().toISOString());
    const urgent = left <= 7;
    const isPicked = selected.has(m.id);
    return (
      <li
        key={m.id}
        onClick={() => (selecting ? toggleOne(m.id) : setOpenId(m.id))}
        className={cn(
          'smarty-card flex cursor-pointer gap-3 p-3.5 transition-smooth',
          urgent && 'border-destructive/40 bg-destructive/[0.03]',
          isPicked && 'border-primary bg-primary/[0.07]',
        )}
      >

        {selecting ? (
          <div className="grid h-9 w-9 shrink-0 place-items-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isPicked} onCheckedChange={() => toggleOne(m.id)} aria-label="Select record" />
          </div>

        ) : (
          <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-2xl', style.tint)}>
            <Icon className={cn('h-4 w-4', style.color)} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{m.title}</p>
            <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
              {new Date(m.occurred_at).toLocaleDateString()}
            </span>
          </div>
          {m.summary && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{m.summary}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
              {moduleLabel(m.module)}
            </span>
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                urgent ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground',
              )}
            >
              <Clock className="h-3 w-3" /> {left} day{left === 1 ? '' : 's'} left
            </span>
          </div>
        </div>
        {!selecting && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Record options"
                onClick={(e) => e.stopPropagation()}
                className="grid h-8 w-8 shrink-0 place-items-center self-start rounded-full text-muted-foreground hover:bg-secondary"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={async () => {
                  const { error } = await restore(m.id);
                  toast[error ? 'error' : 'success'](error ? 'Could not restore' : 'Record restored');
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Restore
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelecting(true); setSelected(new Set([m.id])); }}>
                <CheckCheck className="mr-2 h-4 w-4" /> Select records
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={async () => {
                  const { error } = await deleteForever(m.id);
                  toast[error ? 'error' : 'success'](error ? 'Could not delete' : 'Deleted permanently');
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete forever
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-4 pb-4">
      <header className="animate-fade-up space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-2xl font-extrabold tracking-tight text-foreground">
            <span className="gradient-text">Trash</span>
          </h1>
          <div className="flex shrink-0 items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 items-center gap-1 rounded-2xl bg-secondary px-3 text-xs font-semibold text-secondary-foreground active:scale-95">
                  {FILTERS.find((f) => f.id === filter)?.label ?? 'All'}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {FILTERS.map((f) => (
                  <DropdownMenuItem key={f.id} onClick={() => { setFilter(f.id); exitSelect(); }}>
                    {f.label} <span className="ml-auto text-muted-foreground">{counts[f.id]}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Trash options"
                  className="grid h-9 w-9 place-items-center rounded-2xl bg-secondary text-secondary-foreground active:scale-95"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  disabled={!visibleIds.length}
                  onClick={() => { setSelecting(true); setSelected(new Set(visibleIds)); }}
                >
                  <CheckCheck className="mr-2 h-4 w-4" /> Select all
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!visibleIds.length} onClick={() => setSelecting(true)}>
                  <CheckCheck className="mr-2 h-4 w-4" /> Select records
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={!visibleIds.length} onClick={() => runRestore(visibleIds)}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Restore all shown
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={!visibleIds.length}
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirm({ ids: visibleIds, all: true })}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Empty Trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Deleted records stay here for {TRASH_RETENTION_DAYS} days, then they are removed for good.
        </p>
      </header>

      <div className="grid grid-cols-5 gap-1 rounded-2xl bg-secondary/60 p-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              'flex min-w-0 items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold leading-none transition-smooth active:scale-95',
              filter === f.id
                ? 'bg-gradient-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              f.id === 'soon' && counts.soon > 0 && filter !== f.id && 'text-destructive',
            )}
          >
            <span className="truncate">{f.label}</span>
            {counts[f.id] > 0 && <span className="shrink-0 opacity-70">{counts[f.id]}</span>}
          </button>
        ))}
      </div>

      {selecting && (
        <div className="sticky top-12 z-20 flex items-center gap-2 rounded-2xl border border-border bg-background/95 p-2 shadow-sm backdrop-blur lg:top-16">
          <button
            onClick={toggleAll}
            className="flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary"
          >
            <Checkbox checked={allPicked} aria-label="Select all" />
            <span className="whitespace-nowrap">{picked.length ? `${picked.length}` : 'All'}</span>
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              disabled={!picked.length || busy}
              onClick={() => runRestore(picked)}
              aria-label="Restore selected"
              title="Restore"
              className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-secondary-foreground disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              disabled={!picked.length || busy}
              onClick={() => setConfirm({ ids: picked })}
              aria-label="Delete selected forever"
              title="Delete forever"
              className="grid h-9 w-9 place-items-center rounded-xl bg-destructive/10 text-destructive disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={exitSelect}
              aria-label="Cancel selection"
              title="Cancel"
              className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="smarty-card flex gap-3 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          While a record is in Trash it is hidden from your timeline, categories and from Smarty Assistant, it cannot
          be used in answers or insights. Restore it and the assistant remembers it again instantly.
        </p>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your Trash…
        </p>
      ) : visible.length === 0 ? (
        <div className="smarty-card flex flex-col items-center gap-2 p-8 text-center">
          <Trash2 className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            {items.length ? 'Nothing in this view' : 'Trash is empty'}
          </p>
          <p className="text-xs text-muted-foreground">
            {items.length
              ? 'Try another filter to see the rest of your deleted records.'
              : 'Nothing has been deleted recently.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">{visible.map(renderItem)}</ul>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {confirm?.ids.length} record{confirm?.ids.length === 1 ? '' : 's'} forever
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {confirm?.all ? 'every record shown in this view' : 'the selected records'}.
              This cannot be undone. Restore them instead if you still need them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrashPage;
