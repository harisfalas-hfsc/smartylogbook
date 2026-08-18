import { CloudOff } from 'lucide-react';
import { OFFLINE_EMPTY } from '@/lib/offline/useOnlineStatus';

/**
 * Honest empty state: this device simply has no saved copy yet, the member's
 * data is not gone.
 */
const OfflineNotice = ({ className = '' }: { className?: string }) => (
  <div className={`smarty-card flex items-start gap-3 p-4 ${className}`}>
    <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
    <p className="text-xs leading-relaxed text-muted-foreground">{OFFLINE_EMPTY}</p>
  </div>
);

export default OfflineNotice;
