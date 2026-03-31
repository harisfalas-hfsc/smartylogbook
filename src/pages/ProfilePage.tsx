import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, Bell, Shield, FileText, HelpCircle, LogOut, Trash2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const sections = [
  { icon: User, label: 'Manage Account', desc: 'Username & password', path: '/profile/account' },
  { icon: Bell, label: 'Notifications', desc: 'Reminders & alerts', path: '/profile/notifications' },
  { icon: Shield, label: 'Privacy & Data', desc: 'Your data & privacy', path: '/profile/privacy' },
  { icon: FileText, label: 'Terms & Policies', desc: 'Legal information', path: '/profile/terms' },
  { icon: HelpCircle, label: 'Help & Support', desc: 'FAQ & contact', path: '/profile/help' },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, deleteAccount } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out');
    navigate('/auth');
  };

  const handleDelete = async () => {
    const { error } = await deleteAccount();
    if (error) {
      toast.error('Failed to delete account');
    } else {
      toast.success('Account deleted');
      navigate('/auth');
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const initials = (profile?.username || user.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pb-24 px-4 pt-2 max-w-lg mx-auto">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl p-5 shadow-card flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
          <span className="text-lg font-bold text-primary-foreground">{initials}</span>
        </div>
        <div>
          <p className="text-base font-bold text-foreground">{profile?.username || 'User'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="space-y-2">
        {sections.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <item.icon className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 text-left mt-4"
      >
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <LogOut className="w-5 h-5 text-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">Log Out</p>
      </button>

      {/* Delete Account */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 text-left mt-2">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete all data</p>
            </div>
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-2xl mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all your data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground">
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfilePage;
