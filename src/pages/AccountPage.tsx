import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Download, FileText, KeyRound, Loader2, Mail, ShieldCheck, Trash2, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/lib/admin';

const LEGAL = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms-and-conditions', label: 'Terms & Conditions' },
  { to: '/disclaimer', label: 'Disclaimer' },
];

const AccountPage = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [roles, setRoles] = useState<string[]>([]);
  const [busy, setBusy] = useState<'export' | 'delete' | 'password' | null>(null);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .then(({ data }) => setRoles((data ?? []).map((r: { role: string }) => r.role)));
  }, [user]);

  const callAccount = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('account', { body });
    if (error) throw new Error(error.message);
    if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
    return data as Record<string, unknown>;
  };

  /**
   * Full data export: everything you ever put in, packaged as one ZIP.
   * It contains your records as JSON and CSV, plus every original file you
   * uploaded (photos, receipts, PDFs) inside a `files/` folder.
   */
  const exportData = async () => {
    setBusy('export');
    try {
      const data = await callAccount({ action: 'export' });
      const files = (data.files as { path: string; name: string; url: string | null }[]) ?? [];

      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      const tables = (data.data ?? {}) as Record<string, Record<string, unknown>[]>;
      zip.file('data.json', JSON.stringify({ ...data, files: files.map((f) => f.path) }, null, 2));

      /* A spreadsheet-friendly copy of every table, so the export is readable
       * without any technical tool. */
      const csv = (rows: Record<string, unknown>[]) => {
        if (!rows.length) return '';
        const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
        const cell = (v: unknown) => {
          const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        };
        return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n');
      };
      for (const [name, rows] of Object.entries(tables)) {
        if (Array.isArray(rows) && rows.length) zip.file(`tables/${name}.csv`, csv(rows));
      }

      let downloaded = 0;
      let failed = 0;
      await Promise.all(
        files.map(async (f) => {
          if (!f.url) { failed += 1; return; }
          try {
            const res = await fetch(f.url);
            if (!res.ok) throw new Error(String(res.status));
            zip.file(`files/${f.path}`, await res.blob());
            downloaded += 1;
          } catch {
            failed += 1;
          }
        }),
      );

      zip.file(
        'README.txt',
        [
          'Smarty Logbook, personal data export',
          `Created: ${new Date().toISOString()}`,
          '',
          'data.json    every record we hold about you, in full',
          'tables/      the same records as spreadsheet files',
          'files/       every photo, receipt and document you uploaded',
          '',
          `Files included: ${downloaded}${failed ? ` (${failed} could not be fetched)` : ''}`,
        ].join('\n'),
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smarty-logbook-export-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(
        downloaded
          ? `Export ready, ${downloaded} uploaded file${downloaded > 1 ? 's' : ''} included`
          : 'Export downloaded',
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(null);
    }
  };


  const deleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setBusy('delete');
    try {
      await callAccount({ action: 'delete', confirm: 'DELETE' });
      toast.success('Your account and all data have been permanently deleted');
      await signOut();
      navigate('/');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Deletion failed');
    } finally {
      setBusy(null);
    }
  };

  const resetPassword = async () => {
    if (!user?.email) return;
    setBusy('password');
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(null);
    if (error) toast.error(error.message);
    else toast.success('Password reset link sent to your email');
  };

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Account management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your data, your rights, access, portability and erasure under GDPR.
        </p>
      </header>

      <section className="smarty-card animate-fade-up space-y-3 p-5">
        <div className="flex items-center gap-3">
          <UserCircle className="h-5 w-5 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{profile?.username ?? 'Your logbook'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="rounded-2xl bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary">
            Role: {roles.length ? roles.join(', ') : 'user'}
          </span>
          <span className="rounded-2xl bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
          </span>
        </div>
      </section>

      {isAdmin && (
        <Link
          to="/app/admin"
          className="smarty-card animate-fade-up flex items-center gap-3 border-primary/40 px-4 py-3.5 transition-smooth active:scale-[0.99]"
        >
          <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          <span className="flex-1 text-sm font-bold text-foreground">Admin panel</span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">Admin</span>
        </Link>
      )}

      <section className="smarty-card animate-fade-up space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Download className="h-4 w-4 text-primary" /> Download your data
        </h2>
        <p className="text-xs text-muted-foreground">
          A ZIP archive with every entry, preference and reminder as JSON and spreadsheet files,
          plus a <span className="font-semibold">files</span> folder holding the original photos,
          receipts and documents you uploaded (right to data portability, Art. 20 GDPR).
        </p>
        <button
          onClick={exportData}
          disabled={busy !== null}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-[0.99] disabled:opacity-60"
        >
          {busy === 'export' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export everything
        </button>
      </section>

      <section className="smarty-card animate-fade-up space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <KeyRound className="h-4 w-4 text-primary" /> Security
        </h2>
        <button
          onClick={resetPassword}
          disabled={busy !== null}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-semibold text-foreground transition-smooth active:scale-[0.99] disabled:opacity-60"
        >
          {busy === 'password' ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Mail className="h-4 w-4 text-primary" />}
          Send password reset email
        </button>
        <Link
          to="/app/privacy"
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-smooth active:scale-[0.99]"
        >
          <ShieldCheck className="h-4 w-4 text-primary" /> Privacy & security settings
        </Link>
      </section>

      <section className="animate-fade-up">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <FileText className="h-4 w-4 text-primary" /> Legal & policies
        </h2>
        <div className="smarty-card divide-y divide-border p-2">
          {LEGAL.map((l) => (
            <Link key={l.to} to={l.to} className="block px-3 py-3 text-sm font-medium text-foreground">
              {l.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="animate-fade-up rounded-3xl border border-destructive/30 bg-destructive/5 p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-destructive">
          <AlertTriangle className="h-4 w-4" /> Delete my account
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Permanently erases your account, every entry, health record, document and uploaded
          file. This cannot be undone (right to erasure, Art. 17 GDPR). Export your data first
          if you want to keep a copy.
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
          placeholder="Type DELETE to confirm"
          className="mt-3 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-destructive"
        />
        <button
          onClick={deleteAccount}
          disabled={busy !== null || confirmText !== 'DELETE'}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground transition-smooth active:scale-[0.99] disabled:opacity-50"
        >
          {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete account permanently
        </button>
      </section>
    </div>
  );
};

export default AccountPage;
