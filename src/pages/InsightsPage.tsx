import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotes, getExpenses, getWorkouts } from '@/lib/store';

const InsightsPage = () => {
  const navigate = useNavigate();
  const notes = getNotes();
  const expenses = getExpenses();
  const workouts = getWorkouts();

  const totalSpending = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Insights</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Total Notes</p>
          <p className="text-3xl font-bold text-foreground">{notes.length}</p>
          <p className="text-xs text-muted-foreground mt-1">{notes.filter(n => n.pinned).length} pinned</p>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Total Spending</p>
          <p className="text-3xl font-bold text-foreground">${totalSpending.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">{expenses.length} transactions</p>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Workouts</p>
          <p className="text-3xl font-bold text-foreground">{workouts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total logged sessions</p>
        </div>
      </div>

      {notes.length === 0 && expenses.length === 0 && workouts.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground text-sm">Start logging to see your insights!</p>
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
