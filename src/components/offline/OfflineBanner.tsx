import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/lib/offline/useOnlineStatus';

/** Global strip shown whenever the device has no connection. */
const OfflineBanner = () => {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b-2 border-primary bg-primary/10 px-4 py-2 text-center text-[11px] font-semibold text-foreground">
      <WifiOff className="h-4 w-4 shrink-0 text-primary" />
      You&apos;re offline — showing everything saved on this device. Creating new items needs internet.
    </div>
  );
};

export default OfflineBanner;
