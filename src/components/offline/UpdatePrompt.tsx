import { useEffect } from 'react';
import { registerAppServiceWorker } from '@/lib/offline/register-sw';

/** Registers the app shell silently. Updates activate automatically. */
const UpdatePrompt = () => {
  useEffect(() => {
    registerAppServiceWorker();
  }, []);

  return null;
};

export default UpdatePrompt;
