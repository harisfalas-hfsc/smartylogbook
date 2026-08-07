import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, Mail, MailOpen, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
        'flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 text-xs font-semibold transition-smooth active:scale-[0.98]',
        danger ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground',
      )}
    >
      {icon} {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[82vh] w-[calc(100%-2.5rem)] max-w-sm flex-col gap-0 overflow-hidden rounded-3xl border-2 border-primary/20 p-0 shadow-xl sm:w-1/2 sm:max-w-2xl sm:rounded-3xl md:max-h-[78vh]"
      >
        <DialogHeader className="shrink-0 space-y-0 border-b border-border px-4 py-3.5 text-left sm:px-6 sm:py-5">
          <div className="flex items-center gap-3 pr-8">
            <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-2xl sm:h-11 sm:w-11', style.tint)}>
              <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', style.color)} />
            </span>
            <DialogTitle className="min-w-0 flex-1 text-left text-base font-extrabold leading-snug sm:text-xl">
              {message.title}
            </DialogTitle>
          </div>
        </DialogHeader>


        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
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
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground sm:text-base sm:leading-7">{message.body}</p>
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
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
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
      </DialogContent>
    </Dialog>
  );
};

export default MessageDetailSheet;
