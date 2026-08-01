import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { MODULES } from '@/lib/constants';
import { useMemories } from '@/lib/memories';

const ModulesPage = () => {
  const { memories } = useMemories();

  return (
    <div className="space-y-5">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Modules</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every part of your life, feeding one brain.</p>
      </header>

      <div className="space-y-3">
        {MODULES.map((m) => (
          <Link
            key={m.id}
            to={`/app/module/${m.id}`}
            className="smarty-card flex animate-fade-up items-center gap-4 p-4 transition-smooth active:scale-[0.99]"
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${m.tint}`}>
              <m.icon className={`h-6 w-6 ${m.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">{m.label}</p>
              <p className="truncate text-xs text-muted-foreground">{m.description}</p>
              <p className="mt-1 text-[11px] font-semibold text-primary">
                {memories.filter((x) => x.module === m.id).length} memories
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ModulesPage;
