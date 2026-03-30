import { getNotes, getMoneyEntries, getWorkouts, getMoodEntries } from '@/lib/store';
import { Sparkles } from 'lucide-react';

const SmartSummary = () => {
  const notes = getNotes();
  const money = getMoneyEntries();
  const workouts = getWorkouts();
  const moods = getMoodEntries();

  const suggestions: string[] = [];

  // Smart spending feedback
  const today = new Date().toISOString().slice(0, 10);
  const todaySpending = money.filter(e => e.type === 'expense' && e.date === today).reduce((s, e) => s + e.amount, 0);
  const avgDailySpend = money.filter(e => e.type === 'expense').length > 0
    ? money.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0) / 
      Math.max(1, new Set(money.filter(e => e.type === 'expense').map(e => e.date)).size)
    : 0;
  if (todaySpending > avgDailySpend * 1.5 && todaySpending > 0) {
    suggestions.push(`💸 You spent more than usual today ($${todaySpending.toFixed(0)} vs avg $${avgDailySpend.toFixed(0)})`);
  }

  // Workout consistency
  const last7 = workouts.filter(w => (Date.now() - new Date(w.date).getTime()) / 86400000 <= 7);
  const prev7 = workouts.filter(w => {
    const d = (Date.now() - new Date(w.date).getTime()) / 86400000;
    return d > 7 && d <= 14;
  });
  if (last7.length > prev7.length && last7.length > 0) {
    suggestions.push('💪 Your activity improved this week — keep it up!');
  } else if (last7.length < prev7.length && prev7.length > 0) {
    suggestions.push('🏃 You\'re less active than last week — time to move!');
  }

  // Incomplete tasks
  const incompleteTasks = notes.filter(n => 
    !n.archived && n.checklist.length > 0 && n.checklist.some(c => !c.checked)
  );
  if (incompleteTasks.length > 0) {
    suggestions.push(`📝 You have ${incompleteTasks.length} note(s) with unchecked tasks`);
  }

  // No activity today
  const todayNotes = notes.filter(n => n.createdAt.startsWith(today));
  const todayWorkouts = workouts.filter(w => w.date === today);
  if (todayNotes.length === 0 && todayWorkouts.length === 0 && money.filter(e => e.date === today).length === 0) {
    suggestions.push('✨ Start your day! Add your first entry');
  }

  // Mood insight
  if (moods.length >= 3) {
    const recent = moods.slice(-3);
    const avg = recent.reduce((s, m) => s + m.value, 0) / recent.length;
    if (avg >= 7) suggestions.push('😊 Your mood has been great lately!');
    else if (avg <= 4) suggestions.push('🤗 Hang in there — consider some self-care today');
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-primary/10">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-primary">Smart Insights</span>
      </div>
      <div className="space-y-1.5">
        {suggestions.slice(0, 3).map((s, i) => (
          <p key={i} className="text-xs text-foreground">{s}</p>
        ))}
      </div>
    </div>
  );
};

export default SmartSummary;
