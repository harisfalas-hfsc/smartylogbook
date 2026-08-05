import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, CalendarDays, Camera, ChevronRight, Loader2, Mic, Paperclip, Plus, RefreshCw, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMemories, whenLabel, Memory } from '@/lib/memories';
import { usePreferences } from '@/lib/preferences';
import { useDailyBrief } from '@/lib/assistant';
import { useProactiveAlerts } from '@/lib/alerts';
import { useCategories } from '@/lib/categories';
import MemoryDetailSheet from '@/components/MemoryDetailSheet';
import { kindIcon } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { memories, loading, reclassify, update, remove } = useMemories({ limit: 60 });
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const { prefs } = usePreferences();
  const { brief, generating, regenerate } = useDailyBrief(memories, prefs, !loading);
  const { alerts } = useProactiveAlerts();
  const { categories, addCategory } = useCategories();
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const name = profile?.username ?? user?.email?.split('@')[0] ?? 'there';
  const todayKey = new Date().toDateString();

  const today = useMemo(
    () => memories.filter((m) => new Date(m.occurred_at).toDateString() === todayKey),
    [memories, todayKey]
  );

  const focus = prefs?.focus_modules ?? [];
  const ordered = focus.length
    ? [...categories].sort((a, b) => Number(focus.includes(b.id)) - Number(focus.includes(a.id)))
    : categories;

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    memories.forEach((m) => { map[m.module] = (map[m.module] ?? 0) + 1; });
    return map;
  }, [memories]);

  const submitCategory = async () => {
    setSaving(true);
    const { error } = await addCategory(newName);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`"${newName.trim()}" added`, { description: 'Smarty Assistant can file entries here too.' });
    setNewName('');
    setNewOpen(false);
  };

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col gap-3 pb-2">
      {/* Greeting */}
      <header className="animate-fade-up px-0.5">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{dateLabel}</p>
        <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-foreground">
          {greeting()}, {name}
        </h1>
      </header>

      {/* Quick capture, the primary action, Keep-style */}
      <section className="animate-fade-up">
        <div className="smarty-card flex items-center gap-1.5 p-2 pl-4">
          <button
            type="button"
            onClick={() => navigate('/app/capture')}
            className="min-w-0 flex-1 truncate py-2 text-left text-sm font-medium text-muted-foreground"
          >
            Capture something…
          </button>
          <Link
            to="/app/capture?mode=voice"
            aria-label="Capture with voice"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-mod-personal/10 text-mod-personal transition-smooth active:scale-95"
          >
            <Mic className="h-4.5 w-4.5" />
          </Link>
          <Link
            to="/app/capture?mode=photo"
            aria-label="Capture a photo"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-mod-health/10 text-mod-health transition-smooth active:scale-95"
          >
            <Camera className="h-4.5 w-4.5" />
          </Link>
          <Link
            to="/app/capture?mode=file"
            aria-label="Upload a file or receipt"
            className="grid h-10 w-10 place-items-center rounded-2xl bg-mod-documents/10 text-mod-documents transition-smooth active:scale-95"
          >
            <Paperclip className="h-4.5 w-4.5" />
          </Link>
        </div>
      </section>

      {/* One alert max, so the screen stays calm */}
      {alerts.length > 0 && (
        <Link
          to="/app/reminders"
          className="smarty-card flex animate-fade-up items-center gap-3 border-warning/40 p-3.5"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{alerts[0].title}</p>
          {alerts.length > 1 && (
            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              +{alerts.length - 1}
            </span>
          )}
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {/* Timeline, the first thing you see: your latest records */}
      <section className="animate-fade-up">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Timeline {today.length ? '· today' : '· latest'}
          </h2>
          <Link to="/app/timeline" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="smarty-card grid h-24 place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : memories.length === 0 ? (
          <div className="smarty-card p-6 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-2 text-sm font-semibold text-foreground">Your logbook is empty</p>
            <p className="mt-0.5 text-xs text-muted-foreground">A thought, a meal, a receipt, start anywhere.</p>
          </div>
        ) : (
          <div className="smarty-card divide-y divide-border p-1.5">
            {(today.length ? today : memories).slice(0, 4).map((m) => {
              const Icon = kindIcon(m.kind);
              const mod = categories.find((c) => c.id === m.module) ?? categories[categories.length - 1];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMemory(m)}
                  className="flex w-full items-center gap-3 px-2 py-2.5 text-left"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${mod.tint}`}>
                    <Icon className={`h-4 w-4 ${mod.color}`} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{m.title}</span>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{whenLabel(m)}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Smarty Assistant, one line, no chores */}
      <section className="animate-fade-up">
        <div className="smarty-card p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Smarty Assistant
            </p>
            <button
              onClick={regenerate}
              aria-label="Refresh"
              disabled={generating}
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-smooth active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', generating && 'animate-spin')} />
            </button>
          </div>
          {generating && !brief ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading your logbook…
            </p>
          ) : (
            <p className="mt-1.5 text-sm leading-relaxed text-foreground">
              {brief?.action ?? brief?.headline ?? 'Log one thing today and I’ll start connecting the dots.'}
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate('/app/assistant')}
            className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            Ask the assistant <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Categories, always a clean 4-across grid */}
      <section className="animate-fade-up">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Categories</h2>
          <Link to="/app/modules" className="text-xs font-semibold text-primary">See all</Link>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ordered.map((m) => (
            <Link
              key={m.id}
              to={`/app/module/${m.id}`}
              className="smarty-card flex flex-col items-center gap-1.5 px-1 py-3 transition-smooth active:scale-95"
            >
              <span className={`grid h-9 w-9 place-items-center rounded-2xl ${m.tint}`}>
                <m.icon className={`h-4.5 w-4.5 ${m.color}`} />
              </span>
              <span className="w-full truncate text-center text-[10px] font-bold text-foreground">{m.label}</span>
              <span className="text-[9px] font-medium text-muted-foreground">{counts[m.id] ?? 0}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="flex flex-col items-center gap-1.5 rounded-3xl border border-dashed border-border px-1 py-3 transition-smooth active:scale-95"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-secondary text-muted-foreground">
              <Plus className="h-4.5 w-4.5" />
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">New</span>
            <span className="text-[9px] text-transparent">.</span>
          </button>
        </div>
      </section>

      {/* Calendar shortcut */}
      <Link
        to="/app/calendar"
        className="smarty-card flex animate-fade-up items-center gap-3 p-3.5 transition-smooth active:scale-95"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CalendarDays className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">Calendar</p>
          <p className="truncate text-[11px] text-muted-foreground">
            Scheduled and logged days, month by month
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>


      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>
              Add your own category, the assistant can file entries into it too.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={newName}
            maxLength={28}
            placeholder="e.g. Car, Home, Studies"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && newName.trim()) submitCategory(); }}
          />
          <DialogFooter>
            <Button onClick={submitCategory} disabled={!newName.trim() || saving} className="w-full rounded-2xl">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MemoryDetailSheet
        memory={selectedMemory}
        open={!!selectedMemory}
        onOpenChange={(o) => !o && setSelectedMemory(null)}
        allMemories={memories}
        onOpenMemory={setSelectedMemory}
        onSave={update}
        onMove={reclassify}
        onDelete={remove}
      />
    </div>
  );
};

export default Dashboard;
