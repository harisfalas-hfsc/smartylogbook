import { useEffect, useState } from 'react';

/** Live online/offline flag. Assumes online until the browser says otherwise. */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  );

  useEffect(() => {
    const update = () => setOnline(navigator.onLine !== false);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}

/** The single sentence we show whenever an action needs the internet. */
export const OFFLINE_NOTICE =
  "You're offline — you can view everything saved on this device. Creating new items needs an internet connection.";

/** Honest empty state for a list with no saved copy on this device. */
export const OFFLINE_EMPTY =
  "You're offline and this device has no saved copy yet. Connect once and it will be stored here.";
