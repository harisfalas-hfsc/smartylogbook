import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getStripe, getStripeEnvironment } from '@/lib/stripe';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  priceId: string;
  returnUrl?: string;
}

/** Stripe embedded checkout — the payment form renders inline, no redirect. */
const StripeEmbeddedCheckout = ({ priceId, returnUrl }: Props) => {
  const fetchClientSecret = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        priceId,
        returnUrl: returnUrl ?? `${window.location.origin}/app/checkout?status=complete&session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(data?.error || error?.message || 'Could not start checkout');
    }
    return data.clientSecret as string;
  };

  return (
    <div id="checkout" className="rounded-3xl bg-card p-1">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default StripeEmbeddedCheckout;
