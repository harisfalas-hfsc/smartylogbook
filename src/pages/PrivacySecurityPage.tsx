import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Fingerprint, FileText, Lock, ShieldCheck, Trash2, Database } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const LOCK_KEY = 'smarty-app-lock';

const PrivacySecurityPage = () => {
  const navigate = useNavigate();
  const [lock, setLock] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setLock(localStorage.getItem(LOCK_KEY) === '1');
    setSupported(typeof window !== 'undefined' && 'PublicKeyCredential' in window);
  }, []);

  const toggleLock = async () => {
    if (!supported) {
      toast.info('This device or browser does not expose biometric unlock');
      return;
    }
    const next = !lock;
    setLock(next);
    localStorage.setItem(LOCK_KEY, next ? '1' : '0');
    toast.success(next ? 'App lock enabled on this device' : 'App lock disabled');
  };

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Privacy & security</h1>
        <p className="mt-1 text-sm text-muted-foreground">How your logbook is protected and what you control.</p>
      </header>

      <section className="smarty-card animate-fade-up divide-y divide-border p-2">
        <button onClick={toggleLock} className="flex w-full items-center gap-3 px-3 py-3.5 text-left">
          <Fingerprint className="h-4.5 w-4.5 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Biometric / device lock</p>
            <p className="text-[11px] text-muted-foreground">
              {supported ? 'Require your device unlock before opening the logbook' : 'Not available on this device'}
            </p>
          </div>
          <span className={cn('h-6 w-11 shrink-0 rounded-full p-0.5 transition-smooth', lock ? 'bg-primary' : 'bg-muted')}>
            <span className={cn('block h-5 w-5 rounded-full bg-white transition-smooth', lock && 'translate-x-5')} />
          </span>
        </button>
      </section>

      <section className="smarty-card animate-fade-up space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> How we protect your data
        </h2>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex gap-2"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Encrypted in transit (TLS) and at rest.</li>
          <li className="flex gap-2"><Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Row-level security: only your account can read your entries and uploads.</li>
          <li className="flex gap-2"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Documents live in a private bucket; links are short-lived and signed.</li>
          <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Health data is special-category data (Art. 9 GDPR) processed only on your explicit consent.</li>
        </ul>
      </section>

      <section className="animate-fade-up">
        <h2 className="mb-3 text-sm font-bold text-foreground">Your rights</h2>
        <div className="smarty-card divide-y divide-border p-2">
          <Link to="/app/account" className="flex items-center gap-3 px-3 py-3.5 text-sm font-medium text-foreground">
            <FileText className="h-4 w-4 text-primary" /> Download / export my data
          </Link>
          <Link to="/app/account" className="flex items-center gap-3 px-3 py-3.5 text-sm font-medium text-destructive">
            <Trash2 className="h-4 w-4" /> Delete my account & all data
          </Link>
          <Link to="/privacy-policy" className="block px-3 py-3.5 text-sm font-medium text-foreground">Privacy Policy</Link>
          <Link to="/terms-and-conditions" className="block px-3 py-3.5 text-sm font-medium text-foreground">Terms & Conditions</Link>
          <Link to="/disclaimer" className="block px-3 py-3.5 text-sm font-medium text-foreground">Disclaimer</Link>
        </div>
      </section>
    </div>
  );
};

export default PrivacySecurityPage;
