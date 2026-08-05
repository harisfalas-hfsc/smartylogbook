import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, List, Loader2, Plus, Sparkles } from 'lucide-react';
import { useCategories } from '@/lib/categories';
import { useMemo, useState } from 'react';
import { useMemories, Memory } from '@/lib/memories';
import MemoryCard from '@/components/MemoryCard';
import MediaTile from '@/components/MediaTile';
import MemoryDetailSheet from '@/components/MemoryDetailSheet';
import { albumOf, albumsOf } from '@/lib/media';
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
  const { getCategory } = useCategories();
  const module = getCategory(id ?? 'personal');
  const { memories, loading, remove, reclassify, update } = useMemories({ module: module.id });
  const [selected, setSelected] = useState<Memory | null>(null);
  const isMedia = module.id === 'photos' || module.id === 'videos';
  const [view, setView] = useState<ViewMode>(isMedia ? 'grid' : 'list');
  const [group, setGroup] = useState<GroupMode>(isMedia ? 'month' : 'day');
  const [album, setAlbum] = useState<string | null>(null);

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

  return (
    <div className="space-y-5">
      <header className="flex animate-fade-up items-center gap-3">
        <Link
          to="/app/modules"
          aria-label="Back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-smooth active:scale-95"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Link>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${module.tint}`}>
          <module.icon className={`h-5 w-5 ${module.color}`} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground">{module.label}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {visible.length} {visible.length === 1 ? 'record' : 'records'} , {module.description}
          </p>
        </div>
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

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
        {module.topics.map((t) => (
          <span key={t} className="shrink-0 rounded-2xl bg-secondary px-3 py-1.5 text-[11px] font-semibold text-secondary-foreground">
            {t}
          </span>
        ))}
      </div>

      <Link
        to="/app/capture"
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
