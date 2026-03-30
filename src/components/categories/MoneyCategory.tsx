import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, Sparkles, Target } from 'lucide-react';
import { MoneyEntry, SavingsGoal, EXPENSE_CATEGORIES } from '@/lib/types';
import { getMoneyEntries, saveMoneyEntries, getSavingsGoals, saveSavingsGoals } from '@/lib/store';

type Tab = 'overview' | 'expense' | 'income' | 'savings';

const MoneyCategory = () => {
  const [entries, setEntries] = useState<MoneyEntry[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [showForm, setShowForm] = useState<'expense' | 'income' | 'goal' | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [catTag, setCatTag] = useState('Food');
  const [note, setNote] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  useEffect(() => { setEntries(getMoneyEntries()); setGoals(getSavingsGoals()); }, []);

  const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpenses = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpenses;
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  // Smart feedback
  const today = new Date().toISOString().slice(0, 10);
  const todaySpend = entries.filter(e => e.type === 'expense' && e.date === today).reduce((s, e) => s + e.amount, 0);
  const smartTips: string[] = [];
  const avgDaily = entries.filter(e => e.type === 'expense').length > 0
    ? totalExpenses / Math.max(1, new Set(entries.filter(e => e.type === 'expense').map(e => e.date)).size) : 0;
  if (todaySpend > avgDaily * 1.5 && todaySpend > 0) smartTips.push(`You spent more than usual today`);
  goals.forEach(g => {
    const pct = (g.currentAmount / g.targetAmount) * 100;
    if (pct >= 75 && pct < 100) smartTips.push(`Almost there! "${g.name}" is ${pct.toFixed(0)}% complete`);
  });

  // Category breakdown
  const catBreakdown = entries.filter(e => e.type === 'expense').reduce((acc, e) => {
    acc[e.categoryTag] = (acc[e.categoryTag] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
  const sortedCats = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]);

  const addExpense = () => {
    if (!amount) return;
    const entry: MoneyEntry = { id: crypto.randomUUID(), type: 'expense', amount: parseFloat(amount), categoryTag: catTag, note, date: today };
    const updated = [...entries, entry];
    saveMoneyEntries(updated); setEntries(updated);
    setAmount(''); setNote(''); setShowForm(null);
  };

  const addIncome = () => {
    if (!amount) return;
    const entry: MoneyEntry = { id: crypto.randomUUID(), type: 'income', amount: parseFloat(amount), categoryTag: 'Income', note, date: today };
    const updated = [...entries, entry];
    saveMoneyEntries(updated); setEntries(updated);
    setAmount(''); setNote(''); setShowForm(null);
  };

  const addGoal = () => {
    if (!goalName || !goalTarget) return;
    const goal: SavingsGoal = { id: crypto.randomUUID(), name: goalName, targetAmount: parseFloat(goalTarget), currentAmount: 0, createdAt: today };
    const updated = [...goals, goal];
    saveSavingsGoals(updated); setGoals(updated);
    setGoalName(''); setGoalTarget(''); setShowForm(null);
  };

  const addToGoal = (goalId: string) => {
    const amt = prompt('Amount to save:');
    if (!amt) return;
    const updated = goals.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + parseFloat(amt) } : g);
    saveSavingsGoals(updated); setGoals(updated);
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    saveMoneyEntries(updated); setEntries(updated);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'expense', label: 'Expenses' },
    { key: 'income', label: 'Income' },
    { key: 'savings', label: 'Savings' },
  ];

  return (
    <div>
      {/* Smart Tips */}
      {smartTips.length > 0 && (
        <div className="bg-card rounded-2xl p-3 shadow-card border border-primary/10 mb-4">
          <div className="flex items-center gap-1.5 mb-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-semibold text-primary">Smart Money Tips</span></div>
          {smartTips.map((t, i) => <p key={i} className="text-xs text-foreground">💡 {t}</p>)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Income</p>
              <p className="text-lg font-bold text-success">${totalIncome.toFixed(0)}</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Expenses</p>
              <p className="text-lg font-bold text-destructive">${totalExpenses.toFixed(0)}</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <p className="text-[10px] text-muted-foreground font-medium">Balance</p>
              <p className={`text-lg font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>${balance.toFixed(0)}</p>
            </div>
          </div>
          {sortedCats.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Spending Breakdown</p>
              {sortedCats.slice(0, 5).map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">{cat}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(amt / totalExpenses) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-14 text-right">${amt.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'expense' && (
        <div className="space-y-2">
          {showForm === 'expense' ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <select value={catTag} onChange={e => setCatTag(e.target.value)}
                className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)}
                className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(null)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
                <button onClick={addExpense} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Add</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm('expense')} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">
              + Add Expense
            </button>
          )}
          {entries.filter(e => e.type === 'expense').sort((a, b) => b.date.localeCompare(a.date)).map(e => (
            <div key={e.id} className="bg-card rounded-2xl p-4 shadow-card flex justify-between items-center animate-fade-in">
              <div>
                <p className="text-sm font-semibold text-foreground">${e.amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{e.categoryTag} • {e.date}</p>
                {e.note && <p className="text-xs text-muted-foreground mt-0.5">{e.note}</p>}
              </div>
              <button onClick={() => deleteEntry(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'income' && (
        <div className="space-y-2">
          {showForm === 'income' ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <input type="text" placeholder="Source (e.g., Salary)" value={note} onChange={e => setNote(e.target.value)}
                className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(null)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
                <button onClick={addIncome} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Add</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm('income')} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">
              + Add Income
            </button>
          )}
          {entries.filter(e => e.type === 'income').sort((a, b) => b.date.localeCompare(a.date)).map(e => (
            <div key={e.id} className="bg-card rounded-2xl p-4 shadow-card flex justify-between items-center animate-fade-in">
              <div>
                <p className="text-sm font-semibold text-success">+${e.amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{e.note || 'Income'} • {e.date}</p>
              </div>
              <button onClick={() => deleteEntry(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'savings' && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl p-4 shadow-card text-center">
            <p className="text-xs text-muted-foreground font-medium">Total Saved</p>
            <p className="text-2xl font-bold text-primary">${totalSaved.toFixed(2)}</p>
          </div>
          {showForm === 'goal' ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <input type="text" placeholder="Goal name" value={goalName} onChange={e => setGoalName(e.target.value)}
                className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <input type="number" placeholder="Target amount" value={goalTarget} onChange={e => setGoalTarget(e.target.value)}
                className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(null)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
                <button onClick={addGoal} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Create</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm('goal')} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">
              + New Savings Goal
            </button>
          )}
          {goals.map(g => {
            const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
            return (
              <div key={g.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in" onClick={() => addToGoal(g.id)}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Target className="w-4 h-4 text-primary" />{g.name}</p>
                  <p className="text-xs text-muted-foreground">{pct.toFixed(0)}%</p>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">${g.currentAmount.toFixed(2)} / ${g.targetAmount.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MoneyCategory;
