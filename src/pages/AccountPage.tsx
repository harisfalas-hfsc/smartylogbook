import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !username.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim() })
      .eq('user_id', user.id);
    if (error) {
      toast.error('Failed to update username');
    } else {
      toast.success('Username updated');
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Manage Account</h1>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
          <Input value={user?.email || ''} disabled className="rounded-xl bg-secondary border-border opacity-60" />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-xl bg-background border-border"
            placeholder="Your username"
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-11 font-semibold">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-card mt-4">
        <h2 className="text-sm font-bold text-foreground mb-2">Change Password</h2>
        <p className="text-xs text-muted-foreground mb-3">We'll send a password reset link to your email.</p>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={async () => {
            if (!user?.email) return;
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
              redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) toast.error(error.message);
            else toast.success('Reset link sent to your email');
          }}
        >
          Send Reset Link
        </Button>
      </div>
    </div>
  );
};

export default AccountPage;
