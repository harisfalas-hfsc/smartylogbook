import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotes, getMoneyEntries, getWorkouts, getMoodEntries, getHabits, getSavingsGoals } from '@/lib/store';

const InsightsPage = () => {
  const navigate = useNavigate();
  const notes = getNotes();
  const money = getMoneyEntries();
  const workouts = getWorkouts();
  const moods = getMoodEntries();
  const habits = getHabits();
  const savingsGoals = getSavingsGoals();

  const totalIncome = money.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpenses = money.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  const last7Workouts = workouts.filter(w => (Date.now() - new Date(w.date).getTime()) / 86400000 <= 7);
  const avgMood = moods.length > 0 ? (moods.slice(-7).reduce((s, m) => s + m.value, 0) / Math.min(moods.length, 7)) : 0;

  const today = new Date().toISOString().slice(0, 10);
  const habitsDoneToday = habits.filter(h => h.dates.includes(today)).length;

  // Weekly report
  const weekNotes = notes.filter(n => (Date.now() - new Date(n.createdAt).getTime()) / 86400000 <= 7);
  const weekSpending = money.filter(e => e.type === 'expense' && (Date.now() - new Date(e.date).getTime()) / 86400000 <= 7).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen pb-24 px-4 pt-1 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Insights</h1>
      </div>

      {/* Weekly Summary */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-primary/10 mb-4 animate-fade-in">
        <div className="flex items-center gap-1.5 mb-3"><Sparkles className="w-4 h-4 text-primary" /><span className="text-sm font-semibold text-primary">Weekly Report</span></div>
        <div className="grid grid-cols-2 gap-3">
          <div><p className="text-[10px] text-muted-foreground">Notes Created</p><p className="text-lg font-bold text-foreground">{weekNotes.length}</p></div>
          <div><p className="text-[10px] text-muted-foreground">Money Spent</p><p className="text-lg font-bold text-foreground">${weekSpending.toFixed(0)}</p></div>
          <div><p className="text-[10px] text-muted-foreground">Workouts</p><p className="text-lg font-bold text-foreground">{last7Workouts.length}</p></div>
          <div><p className="text-[10px] text-muted-foreground">Avg Mood</p><p className="text-lg font-bold text-foreground">{avgMood > 0 ? `${avgMood.toFixed(1)}/10` : '—'}</p></div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Balance</p>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>${balance.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">${totalIncome.toFixed(0)} earned • ${totalExpenses.toFixed(0)} spent</p>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Habits Today</p>
          <p className="text-3xl font-bold text-foreground">{habitsDoneToday}/{habits.length}</p>
          <p className="text-xs text-muted-foreground mt-1">habits completed</p>
        </div>

        {savingsGoals.length > 0 && (
          <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in">
            <p className="text-xs font-semibold text-muted-foreground mb-3">Savings Goals</p>
            {savingsGoals.map(g => {
              const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
              return (
                <div key={g.id} className="mb-2 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{g.name}</span>
                    <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Total Notes</p>
          <p className="text-3xl font-bold text-foreground">{notes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{notes.filter(n => n.pinned).length} pinned</p>
        </div>
      </div>

      {notes.length === 0 && money.length === 0 && workouts.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">Start logging to see your insights!</p>
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
