import { Link2, MapPin, Trash2 } from 'lucide-react';
import { getModule, kindIcon } from '@/lib/constants';
import { Memory, timeOf } from '@/lib/memories';

interface Props {
  memory: Memory;
  onDelete?: (id: string) => void;
}

const MemoryCard = ({ memory, onDelete }: Props) => {
  const module = getModule(memory.module);
  const Icon = kindIcon(memory.kind);

  return (
    <article className="smarty-card group animate-fade-up p-4 transition-smooth hover:shadow-elevated">
      <div className="flex gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${module.tint}`}>
          <Icon className={`h-5 w-5 ${module.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{memory.title}</p>
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
              {timeOf(memory.occurred_at)}
            </span>
          </div>
          {memory.summary && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{memory.summary}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${module.tint} ${module.color}`}>
              {module.label}
            </span>
            {memory.amount != null && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                {memory.amount.toLocaleString(undefined, { style: 'currency', currency: memory.currency ?? 'USD' })}
              </span>
            )}
            {memory.location && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <MapPin className="h-3 w-3" /> {memory.location}
              </span>
            )}
            {memory.related_ids?.length ? (
              <span
                title={memory.relation_note ?? undefined}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
              >
                <Link2 className="h-3 w-3" /> {memory.related_ids.length} connected
              </span>
            ) : null}
            {memory.ai_tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                #{tag}
              </span>
            ))}
            {onDelete && (
              <button
                onClick={() => onDelete(memory.id)}
                aria-label="Delete memory"
                className="ml-auto rounded-full p-1.5 text-muted-foreground opacity-0 transition-smooth hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default MemoryCard;
