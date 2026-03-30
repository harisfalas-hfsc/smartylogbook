import { useState, useEffect } from 'react';
import { CheckSquare, DollarSign, Heart, Target } from 'lucide-react';
import OverviewCard from '@/components/OverviewCard';
import { getNotes, getMoneyEntries, getWorkouts } from '@/lib/store';
import SmartSummary from '@/components/SmartSummary';
import logo from '@/assets/logo.png';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const Index = () => {
  const [now, setNow] = useState(new Date());
  const notes = getNotes();
  const money = getMoneyEntries();
  const workouts = getWorkouts();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = notes.filter(n => n.checklist.length > 0 && n.createdAt.startsWith(today));
  const todaySpending = money
    .filter(e => e.type === 'expense' && e.date.startsWith(today))
    .reduce((s, e) => s + e.amount, 0);
  const weekWorkouts = workouts.filter(w => {
    const diff = (Date.now() - new Date(w.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  const totalIncome = money.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpenses = money.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header with larger logo + time/date */}
      <div className="flex flex-col items-center mb-6">
        <img src={logo} alt="Smarty Logbook" className="w-20 h-20 rounded-2xl shadow-card mb-3" />
        <p className="text-sm text-muted-foreground">{getGreeting()} 👋</p>
        <h1 className="text-xl font-bold text-foreground">Smarty Logbook</h1>
        <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">{formatTime(now)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(now)}</p>
      </div>

      <SmartSummary />

      <div className="grid grid-cols-2 gap-3 mt-4">
        <OverviewCard
          icon={<CheckSquare className="w-4 h-4" />}
          label="Today's Tasks"
          value={todayTasks.length}
          sub={`${notes.filter(n => !n.archived).length} active notes`}
        />
        <OverviewCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Balance"
          value={`$${balance.toFixed(2)}`}
          sub={`$${todaySpending.toFixed(2)} spent today`}
        />
        <OverviewCard
          icon={<Heart className="w-4 h-4" />}
          label="Workouts (7d)"
          value={weekWorkouts.length}
          sub={weekWorkouts.length >= 3 ? '🔥 Great streak!' : 'Keep moving!'}
        />
        <OverviewCard
          icon={<Target className="w-4 h-4" />}
          label="Active Notes"
          value={notes.filter(n => !n.archived).length}
          sub="Across all categories"
        />
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Pinned Notes</h2>
        {notes.filter(n => n.pinned && !n.archived).length === 0 ? (
          <div className="bg-card rounded-2xl p-6 shadow-card text-center">
            <p className="text-muted-foreground text-sm">No pinned notes yet.</p>
            <p className="text-muted-foreground text-xs mt-1">Tap + to create your first entry!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notes.filter(n => n.pinned && !n.archived).map(note => (
              <div key={note.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in">
                <p className="font-semibold text-foreground text-sm">{note.title}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
