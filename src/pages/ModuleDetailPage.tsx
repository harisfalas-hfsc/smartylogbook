import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Sparkles } from 'lucide-react';
import { getModule } from '@/lib/constants';
import { groupByDay, useMemories } from '@/lib/memories';
import MemoryCard from '@/components/MemoryCard';

const ModuleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const module = getModule(id ?? 'personal');
  const { memories, loading, remove } = useMemories({ module: module.id });
  const groups = groupByDay(memories);

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
          <p className="truncate text-xs text-muted-foreground">{module.description}</p>
        </div>
      </header>

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
          <p className="mt-3 text-sm font-semibold text-foreground">This module is empty</p>
          <p className="mt-1 text-xs text-muted-foreground">Capture anything — the AI will route it here automatically.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.key}>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{g.label}</p>
              <div className="space-y-2.5">
                {g.items.map((m) => <MemoryCard key={m.id} memory={m} onDelete={remove} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModuleDetailPage;
