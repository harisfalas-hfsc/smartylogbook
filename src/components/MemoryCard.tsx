import { Check, Link2, MapPin, Trash2, FolderInput } from 'lucide-react';
import { toast } from 'sonner';
import { kindIcon } from '@/lib/constants';
import { useCategories } from '@/lib/categories';
import { Memory, titleOf, whenLabel } from '@/lib/memories';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  memory: Memory;
  onDelete?: (id: string) => void;
  onMove?: (memory: Memory, toModule: string) => Promise<{ error: Error | null }> | void;
  onOpen?: (memory: Memory) => void;
}

const MemoryCard = ({ memory, onDelete, onMove, onOpen }: Props) => {
  const { categories, getCategory } = useCategories();
  const module = getCategory(memory.module);
  const Icon = kindIcon(memory.kind);

  return (
    <article
      onClick={() => onOpen?.(memory)}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(memory); } }}
      className={`smarty-card group animate-fade-up p-4 transition-smooth hover:shadow-elevated${onOpen ? ' cursor-pointer' : ''}`}
    >
      <div className="flex gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${module.tint}`}>
          <Icon className={`h-5 w-5 ${module.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{titleOf(memory)}</p>
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
              {whenLabel(memory)}
            </span>
          </div>
          {memory.summary && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{memory.summary}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {onMove ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Change category"
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-smooth hover:opacity-80 ${module.tint} ${module.color}`}
                  >
                    {module.label}
                    <FolderInput className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuLabel className="text-xs">Move to category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map((m) => {
                    const MIcon = m.icon;
                    return (
                      <DropdownMenuItem
                        key={m.id}
                        className="gap-2 text-sm"
                        onSelect={async () => {
                          if (m.id === memory.module) return;
                          const res = await onMove(memory, m.id);
                          if (res && 'error' in res && res.error) {
                            toast.error('Could not move this entry');
                            return;
                          }
                          toast.success(`Moved to ${m.label}`, {
                            description: 'Smarty Assistant will remember this for similar entries.',
                          });
                        }}
                      >
                        <MIcon className={`h-4 w-4 ${m.color}`} />
                        {m.label}
                        {m.id === memory.module && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${module.tint} ${module.color}`}>
                {module.label}
              </span>
            )}
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
                onClick={(e) => { e.stopPropagation(); onDelete(memory.id); }}
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
