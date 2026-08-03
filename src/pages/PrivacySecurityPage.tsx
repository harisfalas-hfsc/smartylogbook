import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Lock, ShieldCheck, Trash2, Database } from 'lucide-react';

const PrivacySecurityPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Privacy & security</h1>
        <p className="mt-1 text-sm text-muted-foreground">How your logbook is protected and what you control.</p>
      </header>

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
