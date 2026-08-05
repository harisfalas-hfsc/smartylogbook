import { useState } from 'react';
import { RotateCcw, Trash2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useTrash, daysLeftInTrash, TRASH_RETENTION_DAYS } from '@/lib/memories';
import { MODULES } from '@/lib/constants';

const moduleLabel = (id: string) => MODULES.find((m) => m.id === id)?.label ?? id;

const TrashPage = () => {
  const { items, loading, restore, deleteForever, emptyTrash } = useTrash();
  const [busy, setBusy] = useState<string | null>(null);

  return (
    <div className="space-y-5 pb-24">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Trash</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Deleted records stay here for {TRASH_RETENTION_DAYS} days, then they are removed for good.
        </p>
      </header>

      <div className="smarty-card flex gap-3 p-4 animate-fade-up">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          While a record is in Trash it is hidden from your timeline, categories and from Smarty
          Assistant, it cannot be used in answers or insights. Restore it and the assistant
          remembers it again instantly.
        </p>
      </div>

      {!loading && items.length > 0 && (
        <button
          onClick={async () => {
            if (busy) return;
            setBusy('all');
            const { error } = await emptyTrash();
            setBusy(null);
            toast[error ? 'error' : 'success'](error ? 'Could not empty Trash' : 'Trash emptied');
          }}
          className="w-full rounded-2xl border border-destructive/30 bg-card px-4 py-3 text-sm font-semibold text-destructive transition-smooth active:scale-[0.99]"
        >
          Empty Trash ({items.length})
        </button>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="smarty-card p-8 text-center animate-fade-up">
          <Trash2 className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">Trash is empty</p>
          <p className="mt-1 text-xs text-muted-foreground">Nothing has been deleted recently.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((m) => (
            <div key={m.id} className="smarty-card p-4 animate-fade-up">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{m.title}</p>
                  {m.summary && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{m.summary}</p>
                  )}
                  <p className="mt-1.5 text-[10px] font-semibold text-muted-foreground">
                    {moduleLabel(m.module)} · {new Date(m.occurred_at).toLocaleDateString()} ·{' '}
                    <span className="text-destructive">
                      {daysLeftInTrash(m.deleted_at ?? new Date().toISOString())} days left
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  disabled={busy === m.id}
                  onClick={async () => {
                    setBusy(m.id);
                    const { error } = await restore(m.id);
                    setBusy(null);
                    toast[error ? 'error' : 'success'](error ? 'Could not restore' : 'Record restored');
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary transition-smooth active:scale-[0.99]"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                </button>
                <button
                  disabled={busy === m.id}
                  onClick={async () => {
                    setBusy(m.id);
                    const { error } = await deleteForever(m.id);
                    setBusy(null);
                    toast[error ? 'error' : 'success'](error ? 'Could not delete' : 'Deleted permanently');
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-border px-3 py-2.5 text-xs font-semibold text-destructive transition-smooth active:scale-[0.99]"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashPage;
