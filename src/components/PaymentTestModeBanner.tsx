const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

/** Shown only while payments run in test mode (or are not configured yet). */
export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-xs font-semibold text-destructive">
        Live payments are not configured yet. Finish the go-live steps to accept real cards.
      </div>
    );
  }
  if (clientToken.startsWith('pk_test_')) {
    return (
      <div className="w-full rounded-2xl border border-warning/40 bg-warning/10 px-4 py-2 text-center text-xs font-semibold text-warning-foreground">
        Test mode, payments made here are not real.{' '}
        <a
          href="https://docs.lovable.dev/features/payments#test-and-live-environments"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Read more
        </a>
      </div>
    );
  }
  return null;
}

export default PaymentTestModeBanner;
