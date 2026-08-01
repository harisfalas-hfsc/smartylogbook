import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

const AppearancePage = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="animate-fade-up">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Appearance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose how the Logbook looks on this device.</p>
      </header>

      <section className="smarty-card animate-fade-up divide-y divide-border p-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            className="flex w-full items-center gap-3 px-3 py-3.5 text-left"
          >
            <o.icon className="h-4.5 w-4.5 shrink-0 text-primary" />
            <span className="flex-1 text-sm font-semibold text-foreground">{o.label}</span>
            <span
              className={cn(
                'h-5 w-5 rounded-full border-2',
                theme === o.value ? 'border-primary bg-primary' : 'border-border'
              )}
            />
          </button>
        ))}
      </section>
    </div>
  );
};

export default AppearancePage;
