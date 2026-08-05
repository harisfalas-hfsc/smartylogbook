import { Link, useNavigate, useParams } from 'react-router-dom';
import { LayoutGrid, List, Loader2, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories, CATEGORY_ICONS } from '@/lib/categories';
import { useMemo, useState } from 'react';
import { useMemories, Memory } from '@/lib/memories';
import MemoryCard from '@/components/MemoryCard';
import MediaTile from '@/components/MediaTile';
import MemoryDetailSheet from '@/components/MemoryDetailSheet';
import { albumOf, albumsOf } from '@/lib/media';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


type ViewMode = 'grid' | 'list';
type GroupMode = 'day' | 'month' | 'year' | 'album';

const GROUPS: { id: GroupMode; label: string }[] = [
  { id: 'day', label: 'By day' },
  { id: 'month', label: 'By month' },
  { id: 'year', label: 'By year' },
  { id: 'album', label: 'By album' },
];

const groupKey = (m: Memory, mode: GroupMode) => {
  const d = new Date(m.occurred_at);
  if (mode === 'album') return albumOf(m) ?? 'No album';
  if (mode === 'year') return String(d.getFullYear());
  if (mode === 'month') return d.toLocaleDateString([], { month: 'long', year: 'numeric' });
  return d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const ModuleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCategory, custom, updateCategory, removeCategory } = useCategories();
  const module = getCategory(id ?? 'personal');
  const { memories, loading, remove, reclassify, update, moveAll } = useMemories({ module: module.id });
  const [selected, setSelected] = useState<Memory | null>(null);
  const isMedia = module.id === 'photos' || module.id === 'videos';
  const [view, setView] = useState<ViewMode>(isMedia ? 'grid' : 'list');
  const [group, setGroup] = useState<GroupMode>(isMedia ? 'month' : 'day');
  const [album, setAlbum] = useState<string | null>(null);
  const own = custom.find((c) => c.id === module.id);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(module.label);
  const [icon, setIcon] = useState(own?.icon ?? 'folder');
  const [saving, setSaving] = useState(false);

  const albums = useMemo(() => albumsOf(memories), [memories]);
  const visible = useMemo(
    () => (album ? memories.filter((m) => albumOf(m) === album) : memories),
    [memories, album]
  );

  const groups = useMemo(() => {
    const out: { key: string; items: Memory[] }[] = [];
    for (const m of visible) {
      const key = groupKey(m, group);
      const existing = out.find((g) => g.key === key);
      if (existing) existing.items.push(m);
      else out.push({ key, items: [m] });
    }
    return out;
  }, [visible, group]);

  const openEdit = () => { setName(module.label); setIcon(own?.icon ?? 'folder'); setEditOpen(true); };

  const saveEdit = async () => {
    if (!own) return;
    setSaving(true);
    const { error } = await updateCategory(own.id, { label: name, icon });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Category updated');
    setEditOpen(false);
  };

  const deleteCategory = async () => {
    if (!own) return;
    const count = memories.length;
    const ok = window.confirm(
      count
        ? `Delete "${module.label}"? Nothing is lost: ${count} entr${count === 1 ? 'y' : 'ies'} will move to Personal.`
        : `Delete "${module.label}"?`
    );
    if (!ok) return;
    if (count) {
      const { error } = await moveAll(own.id, 'personal');
      if (error) { toast.error(error.message); return; }
    }
    const { error } = await removeCategory(own.id);
    if (error) { toast.error(error.message); return; }
    toast.success(count ? `"${module.label}" deleted, ${count} moved to Personal` : `"${module.label}" deleted`);
    navigate('/app/modules');
  };

  return (
    <div className="space-y-5">
      <header className="flex animate-fade-up items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${module.tint}`}>
          <module.icon className={`h-5 w-5 ${module.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">{module.label}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {visible.length} {visible.length === 1 ? 'record' : 'records'} , {module.description}
          </p>
        </div>
        {own ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={openEdit}
              aria-label={`Edit ${module.label}`}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-smooth hover:bg-secondary active:scale-95"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={deleteCategory}
              aria-label={`Delete ${module.label}`}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card text-destructive transition-smooth hover:bg-destructive/10 active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </header>


      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-2xl bg-secondary p-1">
          {([
            { id: 'grid' as ViewMode, icon: LayoutGrid, label: 'Grid' },
            { id: 'list' as ViewMode, icon: List, label: 'Details' },
          ]).map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              aria-label={v.label}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-smooth',
                view === v.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              <v.icon className="h-3.5 w-3.5" /> {v.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGroup(g.id)}
              className={cn(
                'rounded-2xl border px-3 py-1.5 text-[11px] font-semibold transition-smooth active:scale-95',
                group === g.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {albums.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
          <button
            onClick={() => setAlbum(null)}
            className={cn(
              'shrink-0 rounded-2xl px-3 py-1.5 text-[11px] font-semibold transition-smooth',
              album === null ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            )}
          >
            All albums
          </button>
          {albums.map((a) => (
            <button
              key={a.name}
              onClick={() => setAlbum(a.name === album ? null : a.name)}
              className={cn(
                'shrink-0 rounded-2xl px-3 py-1.5 text-[11px] font-semibold transition-smooth',
                album === a.name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              )}
            >
              {a.name} <span className="opacity-60">{a.count}</span>
            </button>
          ))}
        </div>
      )}

      <p className="px-0.5 text-[11px] text-muted-foreground">
        Albums work as subfolders inside this category. Open any record and set its album to file it.
      </p>


      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {module.topics.map((t) => (
          <span key={t} className="shrink-0 rounded-2xl bg-secondary px-3 py-1.5 text-[11px] font-semibold text-secondary-foreground">
            {t}
          </span>
        ))}
      </div>

      <Link
        to={`/app/capture?module=${module.id}`}
        className="flex items-center justify-center gap-2 rounded-3xl bg-gradient-primary p-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" /> Capture to {module.label}
      </Link>

      {loading ? (
        <div className="smarty-card flex items-center justify-center p-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <div className="smarty-card p-10 text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-sm font-semibold text-foreground">This category is empty</p>
          <p className="mt-1 text-xs text-muted-foreground">Capture anything, the AI will route it here automatically.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key}>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {g.key} <span className="text-muted-foreground/60">{g.items.length}</span>
              </p>
              {view === 'grid' ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {g.items.map((m) => <MediaTile key={m.id} memory={m} onOpen={setSelected} />)}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {g.items.map((m) => <MemoryCard key={m.id} memory={m} onDelete={remove} onMove={reclassify} onOpen={setSelected} />)}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit category</DialogTitle>
            <DialogDescription>
              Rename it and pick an icon. Records inside stay exactly where they are.
            </DialogDescription>
          </DialogHeader>
          <Input autoFocus value={name} maxLength={28} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-8 gap-1.5">
            {CATEGORY_ICONS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => setIcon(i.id)}
                aria-label={`Icon ${i.id}`}
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-xl border transition-smooth',
                  icon === i.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                )}
              >
                <i.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} disabled={!name.trim() || saving} className="w-full rounded-2xl">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MemoryDetailSheet

        memory={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
        allMemories={memories}
        onOpenMemory={setSelected}
        onSave={update}
        onMove={reclassify}
        onDelete={remove}
      />
    </div>
  );
};

export default ModuleDetailPage;
