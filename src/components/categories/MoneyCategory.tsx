import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Sparkles, Target, ArrowRightLeft, Receipt, TrendingUp, TrendingDown, Edit2, CreditCard, Banknote, MoreHorizontal } from 'lucide-react';
import { MoneyEntry, SavingsGoal, EXPENSE_CATEGORIES } from '@/lib/types';
import { getMoneyEntries, saveMoneyEntries, getSavingsGoals, saveSavingsGoals } from '@/lib/store';

type Tab = 'dashboard' | 'expenses' | 'income' | 'bills' | 'savings';
type FormType = 'expense' | 'income' | 'transfer' | 'bill' | 'goal' | null;

const INCOME_SOURCES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'] as const;
const PAYMENT_METHODS = [
  { value: 'cash' as const, label: 'Cash', icon: Banknote },
  { value: 'card' as const, label: 'Card', icon: CreditCard },
  { value: 'other' as const, label: 'Other', icon: MoreHorizontal },
];

const MoneyCategory = () => {
  const [entries, setEntries] = useState<MoneyEntry[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showForm, setShowForm] = useState<FormType>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [catTag, setCatTag] = useState('Food');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('card');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [billName, setBillName] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  const [billRecurring, setBillRecurring] = useState(false);
  const [billInterval, setBillInterval] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [transferDirection, setTransferDirection] = useState<'to-savings' | 'from-savings'>('to-savings');

  // Swipe
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { setEntries(getMoneyEntries()); setGoals(getSavingsGoals()); }, []);

  // ===== CALCULATIONS =====
  const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpenses = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalSavedDeposits = entries.filter(e => e.type === 'savings-deposit' || e.type === 'transfer').reduce((s, e) => s + e.amount, 0);
  const totalSavedWithdrawals = entries.filter(e => e.type === 'savings-withdraw').reduce((s, e) => s + e.amount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const available = totalIncome - totalExpenses - (totalSavedDeposits - totalSavedWithdrawals);
  const thisMonthExpenses = entries.filter(e => e.type === 'expense' && e.date.startsWith(today.slice(0, 7))).reduce((s, e) => s + e.amount, 0);
  const todaySpend = entries.filter(e => e.type === 'expense' && e.date === today).reduce((s, e) => s + e.amount, 0);

  // Category breakdown
  const catBreakdown = entries.filter(e => e.type === 'expense').reduce((acc, e) => {
    acc[e.categoryTag] = (acc[e.categoryTag] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);
  const sortedCats = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCats[0]?.[0] || null;

  // Smart feedback
  const smartTips: string[] = [];
  const avgDaily = entries.filter(e => e.type === 'expense').length > 0
    ? totalExpenses / Math.max(1, new Set(entries.filter(e => e.type === 'expense').map(e => e.date)).size) : 0;
  if (todaySpend > avgDaily * 1.5 && todaySpend > 0) smartTips.push(`💸 You spent more than usual today ($${todaySpend.toFixed(0)} vs avg $${avgDaily.toFixed(0)})`);
  if (topCategory) smartTips.push(`📊 Top spending category: ${topCategory}`);
  goals.forEach(g => {
    const pct = (g.currentAmount / g.targetAmount) * 100;
    if (pct >= 75 && pct < 100) smartTips.push(`🎯 Almost there! "${g.name}" is ${pct.toFixed(0)}% done`);
    if (pct >= 100) smartTips.push(`🎉 Goal "${g.name}" achieved!`);
    if (pct < 50 && g.targetAmount > 0) {
      const remaining = g.targetAmount - g.currentAmount;
      smartTips.push(`💰 Save $${remaining.toFixed(0)} more to reach "${g.name}"`);
    }
  });
  // Upcoming bills
  const upcomingBills = entries.filter(e => e.type === 'bill' && !e.billPaid && e.billDueDate && e.billDueDate >= today)
    .sort((a, b) => (a.billDueDate || '').localeCompare(b.billDueDate || ''));
  if (upcomingBills.length > 0) smartTips.push(`📋 ${upcomingBills.length} upcoming bill(s)`);

  // Income bar ratio
  const incomeBarWidth = totalIncome > 0 ? 100 : 0;
  const expenseBarWidth = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const savingsBarWidth = totalIncome > 0 ? ((totalSavedDeposits - totalSavedWithdrawals) / totalIncome) * 100 : 0;

  // ===== ACTIONS =====
  const resetForm = () => { setAmount(''); setNote(''); setCatTag('Food'); setGoalName(''); setGoalTarget(''); setBillName(''); setBillDueDate(''); setShowForm(null); };

  const addExpense = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const entry: MoneyEntry = { id: crypto.randomUUID(), type: 'expense', amount: parseFloat(amount), categoryTag: catTag, note, paymentMethod, date: today };
    const updated = [...entries, entry]; saveMoneyEntries(updated); setEntries(updated); resetForm();
  };

  const addIncome = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const entry: MoneyEntry = { id: crypto.randomUUID(), type: 'income', amount: parseFloat(amount), categoryTag: catTag, note, date: today };
    const updated = [...entries, entry]; saveMoneyEntries(updated); setEntries(updated); resetForm();
  };

  const addTransfer = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    const amt = parseFloat(amount);
    if (transferDirection === 'to-savings') {
      // Move to savings - find first goal or create a general one
      if (goals.length > 0) {
        const updated = goals.map((g, i) => i === 0 ? { ...g, currentAmount: g.currentAmount + amt } : g);
        saveSavingsGoals(updated); setGoals(updated);
      }
      const entry: MoneyEntry = { id: crypto.randomUUID(), type: 'transfer', amount: amt, categoryTag: 'To Savings', note: note || 'Transfer to savings', date: today };
      const updated = [...entries, entry]; saveMoneyEntries(updated); setEntries(updated);
    } else {
      if (goals.length > 0) {
        const updated = goals.map((g, i) => i === 0 ? { ...g, currentAmount: Math.max(0, g.currentAmount - amt) } : g);
        saveSavingsGoals(updated); setGoals(updated);
      }
      const entry: MoneyEntry = { id: crypto.randomUUID(), type: 'savings-withdraw', amount: amt, categoryTag: 'From Savings', note: note || 'Withdraw from savings', date: today };
      const updated = [...entries, entry]; saveMoneyEntries(updated); setEntries(updated);
    }
    resetForm();
  };

  const addBill = () => {
    if (!billName || !amount) return;
    const entry: MoneyEntry = {
      id: crypto.randomUUID(), type: 'bill', amount: parseFloat(amount), categoryTag: billName, note,
      date: today, billDueDate, recurring: billRecurring, recurringInterval: billInterval, billPaid: false,
    };
    const updated = [...entries, entry]; saveMoneyEntries(updated); setEntries(updated); resetForm();
  };

  const addGoal = () => {
    if (!goalName || !goalTarget) return;
    const goal: SavingsGoal = { id: crypto.randomUUID(), name: goalName, targetAmount: parseFloat(goalTarget), currentAmount: 0, createdAt: today };
    const updated = [...goals, goal]; saveSavingsGoals(updated); setGoals(updated); resetForm();
  };

  const addToGoal = (goalId: string) => {
    const amt = prompt('Amount to save:');
    if (!amt || parseFloat(amt) <= 0) return;
    const val = parseFloat(amt);
    const updatedGoals = goals.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + val } : g);
    saveSavingsGoals(updatedGoals); setGoals(updatedGoals);
    // Also log the transfer
    const entry: MoneyEntry = { id: crypto.randomUUID(), type: 'transfer', amount: val, categoryTag: 'To Savings', note: `Saved to: ${goals.find(g => g.id === goalId)?.name}`, date: today };
    const updated = [...entries, entry]; saveMoneyEntries(updated); setEntries(updated);
  };

  const deleteEntry = (id: string) => { const u = entries.filter(e => e.id !== id); saveMoneyEntries(u); setEntries(u); };
  const toggleBillPaid = (id: string) => {
    const u = entries.map(e => e.id === id ? { ...e, billPaid: !e.billPaid } : e);
    saveMoneyEntries(u); setEntries(u);
  };

  // Swipe handlers
  const handleTouchStart = (id: string, e: React.TouchEvent) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; setSwipingId(id); setSwipeX(0); };
  const handleTouchMove = (e: React.TouchEvent) => { if (!touchStart.current) return; const dx = e.touches[0].clientX - touchStart.current.x; const dy = e.touches[0].clientY - touchStart.current.y; if (Math.abs(dy) > Math.abs(dx)) return; setSwipeX(dx); };
  const handleTouchEnd = () => { if (swipingId && swipeX < -80) deleteEntry(swipingId); setSwipingId(null); setSwipeX(0); touchStart.current = null; };

  const duplicateLastExpense = () => {
    const lastExp = entries.filter(e => e.type === 'expense').slice(-1)[0];
    if (lastExp) {
      const dup: MoneyEntry = { ...lastExp, id: crypto.randomUUID(), date: today };
      const updated = [...entries, dup]; saveMoneyEntries(updated); setEntries(updated);
    }
  };

  const recentEntries = entries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dashboard', label: 'Overview' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'income', label: 'Income' },
    { key: 'bills', label: 'Bills' },
    { key: 'savings', label: 'Savings' },
  ];

  return (
    <div>
      {/* ===== DASHBOARD ===== */}
      {tab === 'dashboard' && (
        <>
          {/* THE TRUTH - Big numbers */}
          <div className="bg-card rounded-2xl p-5 shadow-card mb-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Available</p>
                <p className={`text-xl font-bold ${available >= 0 ? 'text-foreground' : 'text-destructive'}`}>${available.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Savings</p>
                <p className="text-xl font-bold text-primary">${totalSaved.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">This Month</p>
                <p className="text-xl font-bold text-destructive">-${thisMonthExpenses.toFixed(0)}</p>
              </div>
            </div>

            {/* Visual Money Bar */}
            {totalIncome > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Income: ${totalIncome.toFixed(0)}</span>
                  <span>Expenses: ${totalExpenses.toFixed(0)}</span>
                </div>
                <div className="w-full h-4 bg-secondary rounded-full overflow-hidden flex">
                  <div className="h-full bg-destructive/70 rounded-l-full transition-all" style={{ width: `${Math.min(expenseBarWidth, 100)}%` }} />
                  {savingsBarWidth > 0 && (
                    <div className="h-full bg-primary/70 transition-all" style={{ width: `${Math.min(savingsBarWidth, 100 - expenseBarWidth)}%` }} />
                  )}
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                  <span className="text-destructive">Spent {expenseBarWidth.toFixed(0)}%</span>
                  {savingsBarWidth > 0 && <span className="text-primary">Saved {savingsBarWidth.toFixed(0)}%</span>}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Expense', icon: '💳', action: () => setShowForm('expense') },
              { label: 'Income', icon: '💰', action: () => setShowForm('income') },
              { label: 'Transfer', icon: '🔄', action: () => setShowForm('transfer') },
              { label: 'Bill', icon: '📋', action: () => setShowForm('bill') },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action}
                className="bg-card rounded-2xl p-3 shadow-card flex flex-col items-center gap-1 active:scale-95 transition-transform">
                <span className="text-lg">{btn.icon}</span>
                <span className="text-[10px] font-medium text-foreground">{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Smart Tips */}
          {smartTips.length > 0 && (
            <div className="bg-card rounded-2xl p-3 shadow-card border border-primary/10 mb-3">
              <div className="flex items-center gap-1.5 mb-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-semibold text-primary">Smart Insights</span></div>
              {smartTips.slice(0, 3).map((t, i) => <p key={i} className="text-xs text-foreground mb-0.5">{t}</p>)}
            </div>
          )}

          {/* Recent Activity */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground">Recent Activity</p>
              {entries.filter(e => e.type === 'expense').length > 0 && (
                <button onClick={duplicateLastExpense} className="text-[10px] text-primary font-medium">Repeat last</button>
              )}
            </div>
            {recentEntries.length === 0 ? (
              <div className="bg-card rounded-2xl p-6 shadow-card text-center">
                <p className="text-muted-foreground text-sm">No entries yet. Start tracking!</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentEntries.map(e => (
                  <div key={e.id} className="relative overflow-hidden rounded-xl"
                    onTouchStart={(ev) => handleTouchStart(e.id, ev)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                    <div className="absolute inset-0 bg-destructive/20 flex items-center justify-end pr-4"><Trash2 className="w-4 h-4 text-destructive" /></div>
                    <div className="relative bg-card rounded-xl p-3 shadow-sm flex items-center justify-between transition-transform"
                      style={{ transform: swipingId === e.id ? `translateX(${swipeX}px)` : 'translateX(0)' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{e.type === 'income' ? '💰' : e.type === 'bill' ? '📋' : e.type === 'transfer' || e.type === 'savings-deposit' ? '🔄' : '💳'}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{e.note || e.categoryTag}</p>
                          <p className="text-[10px] text-muted-foreground">{e.categoryTag} • {e.date}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${e.type === 'income' ? 'text-success' : e.type === 'expense' ? 'text-destructive' : 'text-primary'}`}>
                        {e.type === 'income' ? '+' : '-'}${e.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          {sortedCats.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Where Your Money Goes</p>
              {sortedCats.slice(0, 6).map(([cat, amt]) => (
                <div key={cat} className="flex items-center justify-between mb-2.5 last:mb-0">
                  <span className="text-sm text-foreground font-medium">{cat}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(amt / totalExpenses) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">${amt.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== EXPENSES TAB ===== */}
      {tab === 'expenses' && (
        <div className="space-y-2">
          <button onClick={() => setShowForm('expense')} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ Add Expense</button>
          {entries.filter(e => e.type === 'expense').sort((a, b) => b.date.localeCompare(a.date)).map(e => (
            <div key={e.id} className="bg-card rounded-2xl p-4 shadow-card flex justify-between items-center animate-fade-in">
              <div>
                <p className="text-sm font-semibold text-foreground">${e.amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{e.categoryTag} • {e.paymentMethod || 'card'} • {e.date}</p>
                {e.note && <p className="text-xs text-muted-foreground mt-0.5">{e.note}</p>}
              </div>
              <button onClick={() => deleteEntry(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* ===== INCOME TAB ===== */}
      {tab === 'income' && (
        <div className="space-y-2">
          <button onClick={() => setShowForm('income')} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ Add Income</button>
          {entries.filter(e => e.type === 'income').sort((a, b) => b.date.localeCompare(a.date)).map(e => (
            <div key={e.id} className="bg-card rounded-2xl p-4 shadow-card flex justify-between items-center animate-fade-in">
              <div>
                <p className="text-sm font-semibold text-success">+${e.amount.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{e.note || e.categoryTag} • {e.date}</p>
              </div>
              <button onClick={() => deleteEntry(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* ===== BILLS TAB ===== */}
      {tab === 'bills' && (
        <div className="space-y-2">
          <button onClick={() => setShowForm('bill')} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ Add Bill</button>
          {entries.filter(e => e.type === 'bill').sort((a, b) => (a.billDueDate || '').localeCompare(b.billDueDate || '')).map(e => {
            const overdue = e.billDueDate && e.billDueDate < today && !e.billPaid;
            return (
              <div key={e.id} className={`bg-card rounded-2xl p-4 shadow-card animate-fade-in ${overdue ? 'border border-destructive/30' : ''}`}>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {overdue && <span className="w-2 h-2 rounded-full bg-destructive" />}
                      {e.categoryTag}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${e.amount.toFixed(2)} • Due: {e.billDueDate || 'Not set'}
                      {e.recurring && ` • ${e.recurringInterval}`}
                    </p>
                    {overdue && <p className="text-[10px] text-destructive mt-0.5">⚠️ Overdue — did you pay this?</p>}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => toggleBillPaid(e.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium ${e.billPaid ? 'bg-success/20 text-success' : 'bg-secondary text-muted-foreground'}`}>
                      {e.billPaid ? 'Paid ✓' : 'Mark Paid'}
                    </button>
                    <button onClick={() => deleteEntry(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== SAVINGS TAB ===== */}
      {tab === 'savings' && (
        <div className="space-y-3">
          <div className="bg-card rounded-2xl p-5 shadow-card text-center">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Total Saved</p>
            <p className="text-3xl font-bold text-primary mt-1">${totalSaved.toFixed(2)}</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowForm('transfer')} className="flex-1 bg-card rounded-2xl p-3 shadow-card text-center text-xs font-medium text-primary">
              <ArrowRightLeft className="w-4 h-4 mx-auto mb-1" />Transfer
            </button>
            <button onClick={() => setShowForm('goal')} className="flex-1 bg-card rounded-2xl p-3 shadow-card text-center text-xs font-medium text-primary">
              <Target className="w-4 h-4 mx-auto mb-1" />New Goal
            </button>
          </div>

          {goals.map(g => {
            const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
            const remaining = g.targetAmount - g.currentAmount;
            return (
              <div key={g.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in cursor-pointer" onClick={() => addToGoal(g.id)}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Target className="w-4 h-4 text-primary" />{g.name}</p>
                  <p className="text-xs font-bold text-primary">{pct.toFixed(0)}%</p>
                </div>
                <div className="w-full h-3 bg-secondary rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${g.currentAmount.toFixed(2)} saved</span>
                  <span>{remaining > 0 ? `$${remaining.toFixed(2)} to go` : '🎉 Goal reached!'}</span>
                </div>
                <p className="text-[10px] text-primary mt-1.5">Tap to add money →</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== TABS ===== */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4 mt-4 sticky top-0 z-10"
        style={{ order: -1, position: 'relative' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setShowForm(null); }}
            className={`flex-1 py-2 rounded-lg text-[10px] font-medium transition-colors ${tab === t.key ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== FORMS ===== */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end" onClick={() => setShowForm(null)}>
          <div className="w-full max-w-lg mx-auto bg-card rounded-t-3xl p-5 pb-8 shadow-elevated animate-fade-in" onClick={e => e.stopPropagation()}>
            {/* Expense Form */}
            {showForm === 'expense' && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-foreground">💳 Add Expense</p>
                <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus
                  className="w-full text-3xl font-bold bg-transparent outline-none text-foreground text-center py-3 placeholder:text-muted-foreground/30" />
                <select value={catTag} onChange={e => setCatTag(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button key={pm.value} onClick={() => setPaymentMethod(pm.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium ${paymentMethod === pm.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      <pm.icon className="w-3.5 h-3.5" />{pm.label}
                    </button>
                  ))}
                </div>
                <input type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
                <button onClick={addExpense} className="w-full py-3 bg-primary rounded-xl text-sm font-bold text-primary-foreground">Add Expense</button>
              </div>
            )}

            {/* Income Form */}
            {showForm === 'income' && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-foreground">💰 Add Income</p>
                <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus
                  className="w-full text-3xl font-bold bg-transparent outline-none text-foreground text-center py-3 placeholder:text-muted-foreground/30" />
                <select value={catTag} onChange={e => setCatTag(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground">
                  {INCOME_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
                <button onClick={addIncome} className="w-full py-3 bg-primary rounded-xl text-sm font-bold text-primary-foreground">Add Income</button>
              </div>
            )}

            {/* Transfer Form */}
            {showForm === 'transfer' && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-foreground">🔄 Transfer</p>
                <div className="flex gap-2">
                  <button onClick={() => setTransferDirection('to-savings')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium ${transferDirection === 'to-savings' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    Available → Savings
                  </button>
                  <button onClick={() => setTransferDirection('from-savings')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium ${transferDirection === 'from-savings' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    Savings → Available
                  </button>
                </div>
                <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus
                  className="w-full text-3xl font-bold bg-transparent outline-none text-foreground text-center py-3 placeholder:text-muted-foreground/30" />
                <input type="text" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
                <button onClick={addTransfer} className="w-full py-3 bg-primary rounded-xl text-sm font-bold text-primary-foreground">Transfer</button>
              </div>
            )}

            {/* Bill Form */}
            {showForm === 'bill' && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-foreground">📋 Add Bill</p>
                <input type="text" placeholder="Bill name (Rent, Electric...)" value={billName} onChange={e => setBillName(e.target.value)} autoFocus
                  className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
                <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
                <input type="date" placeholder="Due date" value={billDueDate} onChange={e => setBillDueDate(e.target.value)}
                  className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
                <div className="flex items-center gap-3">
                  <button onClick={() => setBillRecurring(!billRecurring)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium ${billRecurring ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {billRecurring ? '🔁 Recurring' : 'One-time'}
                  </button>
                  {billRecurring && (
                    <select value={billInterval} onChange={e => setBillInterval(e.target.value as any)}
                      className="bg-secondary rounded-xl p-2 text-xs outline-none text-foreground">
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  )}
                </div>
                <button onClick={addBill} className="w-full py-3 bg-primary rounded-xl text-sm font-bold text-primary-foreground">Add Bill</button>
              </div>
            )}

            {/* Goal Form */}
            {showForm === 'goal' && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-foreground">🎯 New Savings Goal</p>
                <input type="text" placeholder="Goal name" value={goalName} onChange={e => setGoalName(e.target.value)} autoFocus
                  className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
                <input type="number" placeholder="Target amount" value={goalTarget} onChange={e => setGoalTarget(e.target.value)}
                  className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
                <button onClick={addGoal} className="w-full py-3 bg-primary rounded-xl text-sm font-bold text-primary-foreground">Create Goal</button>
              </div>
            )}

            <button onClick={() => setShowForm(null)} className="w-full py-2 mt-2 text-muted-foreground text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyCategory;
