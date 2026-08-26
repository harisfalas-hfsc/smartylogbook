import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState<'checking' | 'ok' | 'invalid'>('checking');
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  // The recovery link carries a token in the URL. Give it a moment to be
  // exchanged for a session before deciding the link is no longer valid.
  useEffect(() => {
    let done = false;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        done = true;
        setReady('ok');
      }
    };
    check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        done = true;
        setReady('ok');
      }
    });
    const timer = setTimeout(() => {
      if (!done) setReady((s) => (s === 'ok' ? s : 'invalid'));
    }, 2500);
    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully!');
      navigate('/app');
    }
    setLoading(false);
  };

  if (ready === 'invalid') {
    return (
      <div className="min-h-screen pb-24 px-4 pt-2 max-w-lg mx-auto">
        <div className="mt-8 mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Link expired</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This password reset link is no longer valid. Request a new one and use the newest email.
          </p>
        </div>
        <Button className="w-full rounded-xl h-12 font-semibold" onClick={() => navigate('/auth')}>
          Back to sign in
        </Button>
      </div>
    );
  }


  return (
    <div className="min-h-screen pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="mt-8 mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Set New Password</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 rounded-xl bg-card border-border"
            required
            minLength={6}
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="pl-10 rounded-xl bg-card border-border"
            required
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full rounded-xl h-12 font-semibold" disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
