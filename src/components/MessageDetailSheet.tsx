import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, Mail, MailOpen, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { messageStyle, bucketOf, type MessageRow } from '@/lib/messages';
import { cn } from '@/lib/utils';

interface Props {
  message: MessageRow | null;
  open: boolean;
  archived: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleRead: (message: MessageRow) => void;
  onToggleArchive: (message: MessageRow) => void;
  onDelete: (message: MessageRow) => void;
}

const MessageDetailSheet = ({
  message, open, archived, onOpenChange, onToggleRead, onToggleArchive, onDelete,
}: Props) => {
  if (!message) return null;
  const style = messageStyle(message.kind);
  const Icon = style.icon;
  const missed = bucketOf(message) === 'missed';

  const action = (label: string, icon: React.ReactNode, onClick: () => void, danger?: boolean) => (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-semibold transition-smooth active:scale-[0.98]',
        danger ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground',
      )}
    >
      {icon} {label}
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-border p-0">
        <SheetHeader className="sticky top-0 z-10 space-y-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3 pr-8">
            <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-2xl', style.tint)}>
              <Icon className={cn('h-4 w-4', style.color)} />
            </span>
            <SheetTitle className="min-w-0 flex-1 text-left text-base font-extrabold leading-snug">
              {message.title}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
              {style.label}
            </span>
            {missed && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                Missed
              </span>
            )}
            {archived && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                Archived
              </span>
            )}
            <span className="text-[10px] font-medium text-muted-foreground">
              {new Date(message.created_at).toLocaleString(undefined, {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>

          {message.body && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{message.body}</p>
          )}

          {message.related_at && (
            <p className="text-xs text-muted-foreground">
              Related to{' '}
              {new Date(message.related_at).toLocaleString(undefined, {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}

          {message.action_url && (
            <Link
              to={message.action_url}
              onClick={() => onOpenChange(false)}
              className="inline-flex rounded-2xl bg-gradient-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
            >
              {message.action_label ?? 'Open'}
            </Link>
          )}

          <div className="flex gap-2 border-t border-border pt-4">
            {action(
              message.read_at ? 'Unread' : 'Read',
              message.read_at ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />,
              () => onToggleRead(message),
            )}
            {action(
              archived ? 'Restore' : 'Archive',
              archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />,
              () => onToggleArchive(message),
            )}
            {action('Delete', <Trash2 className="h-3.5 w-3.5" />, () => onDelete(message), true)}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MessageDetailSheet;
