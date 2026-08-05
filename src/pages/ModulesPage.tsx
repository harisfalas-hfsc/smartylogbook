import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCategories, CATEGORY_ICONS, CustomCategory } from '@/lib/categories';
import { useMemories } from '@/lib/memories';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatBytes, STORAGE_QUOTA_BYTES, useStorageUsage } from '@/lib/media';
import { useSubscription } from '@/lib/subscription';

const ModulesPage = () => {
  const { memories } = useMemories();
  const { used, files } = useStorageUsage();
  const { active } = useSubscription();
  const quota = active ? STORAGE_QUOTA_BYTES.premium : STORAGE_QUOTA_BYTES.free;
  const pct = Math.min(100, Math.round((used / quota) * 100));
  const { categories, custom, addCategory, updateCategory, removeCategory } = useCategories();
  const [editing, setEditing] = useState<CustomCategory | 'new' | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('folder');
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing('new'); setName(''); setIcon('folder'); };
  const openEdit = (c: CustomCategory) => { setEditing(c); setName(c.label); setIcon(c.icon ?? 'folder'); };

  const submit = async () => {
    setSaving(true);
    const { error } = editing === 'new'
      ? await addCategory(name, icon)
      : await updateCategory((editing as CustomCategory).id, { label: name, icon });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing === 'new' ? `"${name.trim()}" added` : 'Category updated');
    setEditing(null);
  };

  const del = async (c: CustomCategory) => {
    const used = memories.filter((m) => m.module === c.id).length;
    const ok = window.confirm(
      used
        ? `Delete "${c.label}"? ${used} entr${used === 1 ? 'y' : 'ies'} will move back to Personal.`
        : `Delete "${c.label}"?`
    );
    if (!ok) return;
    const { error } = await removeCategory(c.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`"${c.label}" deleted`);
  };

  return (
    <div className="space-y-5">
      <header className="animate-fade-up flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every part of your life, feeding one brain.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-gradient-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-95"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </header>

      <div className="smarty-card animate-fade-up p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-bold text-foreground">Storage</p>
          <p className="text-xs font-semibold text-muted-foreground">
            {formatBytes(used)} of {formatBytes(quota)}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${Math.max(pct, used ? 2 : 0)}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {files} {files === 1 ? 'file' : 'files'} stored, photos, videos and documents.
          {!active && ' Premium raises this to 20 GB.'}
        </p>
      </div>

      <div className="space-y-3">
        {categories.map((m) => {
          const own = custom.find((c) => c.id === m.id);
          return (
            <div key={m.id} className="smarty-card flex animate-fade-up items-center gap-3 p-4">
              <Link to={`/app/module/${m.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${m.tint}`}>
                  <m.icon className={`h-6 w-6 ${m.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">{m.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.description}</p>
                  <p className="mt-1 text-[11px] font-semibold text-primary">
                    {memories.filter((x) => x.module === m.id).length} entries
                  </p>
                </div>
              </Link>
              {own ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(own)}
                    aria-label={`Edit ${m.label}`}
                    className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-secondary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => del(own)}
                    aria-label={`Delete ${m.label}`}
                    className="grid h-8 w-8 place-items-center rounded-xl text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editing === 'new' ? 'New category' : 'Edit category'}</DialogTitle>
            <DialogDescription>
              Pick a name and an icon, Smarty Assistant can file entries here too.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            maxLength={28}
            placeholder="e.g. Car, Home, Studies"
            onChange={(e) => setName(e.target.value)}
          />
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
            <Button onClick={submit} disabled={!name.trim() || saving} className="w-full rounded-2xl">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing === 'new' ? 'Add category' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModulesPage;
