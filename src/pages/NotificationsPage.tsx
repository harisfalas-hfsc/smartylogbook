import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';

const defaultToggles = [
  { key: 'tasks', label: 'Task Reminders', desc: 'Get reminded about pending tasks' },
  { key: 'events', label: 'Event Reminders', desc: 'Upcoming family & personal events' },
  { key: 'money', label: 'Money Alerts', desc: 'Budget limits & spending alerts' },
  { key: 'health', label: 'Health Reminders', desc: 'Workout & wellness reminders' },
  { key: 'checkin', label: 'Daily Check-in', desc: 'Evening mood & reflection prompt' },
  { key: 'weekly', label: 'Weekly Summary', desc: 'Your weekly progress report' },
];

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('smarty_notifications');
      return raw ? JSON.parse(raw) : Object.fromEntries(defaultToggles.map(t => [t.key, true]));
    } catch {
      return Object.fromEntries(defaultToggles.map(t => [t.key, true]));
    }
  });

  const toggle = (key: string) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    localStorage.setItem('smarty_notifications', JSON.stringify(next));
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Notifications</h1>
      </div>

      <div className="space-y-2">
        {defaultToggles.map(item => (
          <div key={item.key} className="bg-card rounded-2xl p-4 shadow-card flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <Switch checked={settings[item.key] ?? true} onCheckedChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
