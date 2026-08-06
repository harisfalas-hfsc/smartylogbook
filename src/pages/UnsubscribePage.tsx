import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type State = 'loading' | 'valid' | 'used' | 'invalid' | 'done';

const UnsubscribePage = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return setState('invalid');
        if (data?.already_unsubscribed || data?.used) return setState('used');
        setState('valid');
      })
      .catch(() => setState('invalid'));
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke('handle-email-unsubscribe', {
      body: { token },
    });
    setBusy(false);
    setState(error ? 'invalid' : 'done');
  };

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-5 py-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Email preferences</h1>
        {state === 'loading' && (
          <p className="mt-3 text-sm text-muted-foreground">Checking your link…</p>
        )}
        {state === 'valid' && (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Unsubscribe this address from Smarty Logbook emails?
            </p>
            <Button className="mt-5 w-full" onClick={confirm} disabled={busy}>
              {busy ? 'Working…' : 'Confirm unsubscribe'}
            </Button>
          </>
        )}
        {state === 'used' && (
          <p className="mt-3 text-sm text-muted-foreground">
            You are already unsubscribed. Nothing else to do.
          </p>
        )}
        {state === 'done' && (
          <p className="mt-3 text-sm text-muted-foreground">
            Done — you will not receive these emails again.
          </p>
        )}
        {state === 'invalid' && (
          <p className="mt-3 text-sm text-muted-foreground">
            This unsubscribe link is invalid or has expired.
          </p>
        )}
      </div>
    </main>
  );
};

export default UnsubscribePage;
