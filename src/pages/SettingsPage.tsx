import { ArrowLeft, User, Bell, Shield, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const items = [
  { icon: User, label: 'Profile', desc: 'Manage your account' },
  { icon: Bell, label: 'Notifications', desc: 'Reminders & alerts' },
  { icon: Shield, label: 'Privacy', desc: 'Data & privacy settings' },
  { icon: FileText, label: 'Terms & Conditions', desc: 'Legal information' },
  { icon: Trash2, label: 'Delete All Data', desc: 'Clear all entries', danger: true },
];

const SettingsPage = () => {
  const navigate = useNavigate();

  const handleDeleteAll = () => {
    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-1 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <button
            key={item.label}
            onClick={item.label === 'Delete All Data' ? handleDeleteAll : undefined}
            className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 text-left animate-fade-in"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              item.danger ? 'bg-destructive/10' : 'bg-secondary'
            }`}>
              <item.icon className={`w-5 h-5 ${item.danger ? 'text-destructive' : 'text-foreground'}`} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${item.danger ? 'text-destructive' : 'text-foreground'}`}>{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
