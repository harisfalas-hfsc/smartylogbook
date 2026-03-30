import { useState, useEffect } from 'react';
import { Trash2, Sparkles, Target, Check } from 'lucide-react';
import { MoodEntry, GoalEntry, HabitEntry, ReflectionEntry } from '@/lib/types';
import { getMoodEntries, saveMoodEntries, getGoals, saveGoals, getHabits, saveHabits, getReflections, saveReflections } from '@/lib/store';

type Tab = 'mood' | 'goals' | 'habits' | 'reflection';

const GrowthCategory = () => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [tab, setTab] = useState<Tab>('mood');
  const [showForm, setShowForm] = useState(false);

  const [moodVal, setMoodVal] = useState(5);
  const [moodNote, setMoodNote] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalSteps, setGoalSteps] = useState('');
  const [habitName, setHabitName] = useState('');
  const [reflText, setReflText] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { setMoods(getMoodEntries()); setGoals(getGoals()); setHabits(getHabits()); setReflections(getReflections()); }, []);

  // Smart insights
  const smartTips: string[] = [];
  if (moods.length >= 3) {
    const recent = moods.slice(-7);
    const avg = recent.reduce((s, m) => s + m.value, 0) / recent.length;
    const goodDays = recent.filter(m => m.value >= 7).length;
    smartTips.push(`😊 ${goodDays} positive day(s) this week (avg: ${avg.toFixed(1)}/10)`);
  }
  habits.forEach(h => {
    const streak = getStreak(h.dates);
    if (streak >= 3) smartTips.push(`🔥 ${h.name}: ${streak}-day streak!`);
    if (!h.dates.includes(today)) smartTips.push(`📌 "${h.name}" not checked today`);
  });
  if (!reflections.some(r => r.date === today)) smartTips.push('✍️ What went well today?');

  function getStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    const sorted = [...dates].sort().reverse();
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 30; i++) {
      const ds = d.toISOString().slice(0, 10);
      if (sorted.includes(ds)) streak++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  const addMood = () => {
    const entry: MoodEntry = { id: crypto.randomUUID(), value: moodVal, note: moodNote, date: today };
    const u = [...moods, entry]; saveMoodEntries(u); setMoods(u); setMoodNote(''); setShowForm(false);
  };

  const addGoal = () => {
    if (!goalTitle) return;
    const steps = goalSteps.split('\n').filter(s => s.trim());
    const entry: GoalEntry = { id: crypto.randomUUID(), title: goalTitle, targetSteps: steps, completedSteps: steps.map(() => false), createdAt: today };
    const u = [...goals, entry]; saveGoals(u); setGoals(u); setGoalTitle(''); setGoalSteps(''); setShowForm(false);
  };

  const toggleGoalStep = (goalId: string, stepIdx: number) => {
    const u = goals.map(g => g.id === goalId ? { ...g, completedSteps: g.completedSteps.map((c, i) => i === stepIdx ? !c : c) } : g);
    saveGoals(u); setGoals(u);
  };

  const addHabit = () => {
    if (!habitName) return;
    const entry: HabitEntry = { id: crypto.randomUUID(), name: habitName, dates: [] };
    const u = [...habits, entry]; saveHabits(u); setHabits(u); setHabitName(''); setShowForm(false);
  };

  const toggleHabitToday = (habitId: string) => {
    const u = habits.map(h => {
      if (h.id !== habitId) return h;
      return { ...h, dates: h.dates.includes(today) ? h.dates.filter(d => d !== today) : [...h.dates, today] };
    });
    saveHabits(u); setHabits(u);
  };

  const addReflection = () => {
    if (!reflText) return;
    const entry: ReflectionEntry = { id: crypto.randomUUID(), text: reflText, date: today };
    const u = [...reflections, entry]; saveReflections(u); setReflections(u); setReflText(''); setShowForm(false);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'mood', label: 'Mood' }, { key: 'goals', label: 'Goals' }, { key: 'habits', label: 'Habits' }, { key: 'reflection', label: 'Reflect' },
  ];

  const moodEmoji = (v: number) => v >= 8 ? '😊' : v >= 6 ? '🙂' : v >= 4 ? '😐' : v >= 2 ? '😕' : '😢';

  return (
    <div>
      {smartTips.length > 0 && (
        <div className="bg-card rounded-2xl p-3 shadow-card border border-primary/10 mb-4">
          <div className="flex items-center gap-1.5 mb-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-semibold text-primary">Growth Coach</span></div>
          {smartTips.slice(0, 3).map((t, i) => <p key={i} className="text-xs text-foreground">{t}</p>)}
        </div>
      )}

      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'mood' && (
        <div className="space-y-2">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <div className="text-center">
                <span className="text-4xl">{moodEmoji(moodVal)}</span>
                <p className="text-sm text-muted-foreground mt-1">{moodVal}/10</p>
              </div>
              <input type="range" min="1" max="10" value={moodVal} onChange={e => setMoodVal(parseInt(e.target.value))} className="w-full accent-primary" />
              <input type="text" placeholder="How are you feeling?" value={moodNote} onChange={e => setMoodNote(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
                <button onClick={addMood} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Log</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ Log Mood</button>
          )}
          {moods.sort((a, b) => b.date.localeCompare(a.date)).map(m => (
            <div key={m.id} className="bg-card rounded-2xl p-3 shadow-card flex justify-between items-center animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-lg">{moodEmoji(m.value)}</span>
                <div><p className="text-sm font-semibold text-foreground">{m.value}/10</p>{m.note && <p className="text-xs text-muted-foreground">{m.note}</p>}<p className="text-[10px] text-muted-foreground">{m.date}</p></div>
              </div>
              <button onClick={() => { saveMoodEntries(moods.filter(x => x.id !== m.id)); setMoods(moods.filter(x => x.id !== m.id)); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'goals' && (
        <div className="space-y-2">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <input type="text" placeholder="Goal title" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <textarea placeholder="Steps (one per line)" value={goalSteps} onChange={e => setGoalSteps(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground resize-none min-h-[80px]" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
                <button onClick={addGoal} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Create</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ New Goal</button>
          )}
          {goals.map(g => {
            const done = g.completedSteps.filter(Boolean).length;
            const pct = g.targetSteps.length > 0 ? (done / g.targetSteps.length) * 100 : 0;
            return (
              <div key={g.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground flex-1">{g.title}</p>
                  <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                {g.targetSteps.map((step, i) => (
                  <button key={i} onClick={() => toggleGoalStep(g.id, i)} className="flex items-center gap-2 w-full text-left py-1">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${g.completedSteps[i] ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                      {g.completedSteps[i] && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className={`text-xs ${g.completedSteps[i] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{step}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'habits' && (
        <div className="space-y-2">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <input type="text" placeholder="Habit name" value={habitName} onChange={e => setHabitName(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
                <button onClick={addHabit} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Add</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ Add Habit</button>
          )}
          {habits.map(h => {
            const checked = h.dates.includes(today);
            const streak = getStreak(h.dates);
            return (
              <button key={h.id} onClick={() => toggleHabitToday(h.id)} className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-3 animate-fade-in">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${checked ? 'bg-primary' : 'bg-secondary'}`}>
                  <Check className={`w-5 h-5 ${checked ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-foreground">{h.name}</p>
                  <p className="text-[10px] text-muted-foreground">{streak > 0 ? `🔥 ${streak}-day streak` : 'Start today!'}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'reflection' && (
        <div className="space-y-2">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <textarea placeholder="What went well today? What can you improve?" value={reflText} onChange={e => setReflText(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground resize-none min-h-[100px]" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
                <button onClick={addReflection} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Save</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ Daily Reflection</button>
          )}
          {reflections.sort((a, b) => b.date.localeCompare(a.date)).map(r => (
            <div key={r.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in">
              <p className="text-xs text-muted-foreground mb-1">{r.date}</p>
              <p className="text-sm text-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GrowthCategory;
