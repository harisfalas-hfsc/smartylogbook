import { useState, useEffect, useMemo } from 'react';
import { Trash2, Sparkles, Target, Check, Plus, Flame, TrendingUp, Heart, PenLine, Copy } from 'lucide-react';
import { MoodEntry, GoalEntry, HabitEntry, ReflectionEntry } from '@/lib/types';
import { getMoodEntries, saveMoodEntries, getGoals, saveGoals, getHabits, saveHabits, getReflections, saveReflections, getWorkouts } from '@/lib/store';

type Tab = 'dashboard' | 'mood' | 'habits' | 'goals' | 'reflect';

const REFLECTION_PROMPTS = [
  'What went well today?',
  'What did you learn today?',
  'What can you improve?',
  'What are you grateful for?',
  'What challenged you today?',
  'What made you smile?',
];

interface GrowthCategoryProps {
  quickAdd?: boolean;
}

const GrowthCategory = ({ quickAdd = false }: GrowthCategoryProps) => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showForm, setShowForm] = useState(false);

  const [moodVal, setMoodVal] = useState(5);
  const [moodNote, setMoodNote] = useState('');
  const [goalTitle, setGoalTitle] = useState('');
  const [goalSteps, setGoalSteps] = useState('');
  const [habitName, setHabitName] = useState('');
  const [reflText, setReflText] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setMoods(getMoodEntries());
    setGoals(getGoals());
    setHabits(getHabits());
    setReflections(getReflections());
  }, []);

  useEffect(() => {
    if (quickAdd) {
      setTab('mood');
      setShowForm(true);
    }
  }, [quickAdd]);

  // ---- Streak calculation ----
  function getStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    const sorted = [...new Set(dates)].sort().reverse();
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 60; i++) {
      const ds = d.toISOString().slice(0, 10);
      if (sorted.includes(ds)) streak++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  // ---- Derived data ----
  const recentMoods = moods.slice(-7);
  const avgMood = recentMoods.length > 0 ? recentMoods.reduce((s, m) => s + m.value, 0) / recentMoods.length : 0;
  const goodDays = recentMoods.filter(m => m.value >= 7).length;
  const todayMood = moods.find(m => m.date === today);
  const todayReflection = reflections.find(r => r.date === today);

  const habitStats = useMemo(() => habits.map(h => ({
    ...h,
    streak: getStreak(h.dates),
    checkedToday: h.dates.includes(today),
    totalDays: h.dates.length,
    missedRecently: !h.dates.includes(today) && h.dates.length > 0,
  })), [habits, today]);

  const habitsCheckedToday = habitStats.filter(h => h.checkedToday).length;
  const totalHabits = habits.length;

  const longestStreak = useMemo(() => {
    let max = 0;
    habitStats.forEach(h => { if (h.streak > max) max = h.streak; });
    return max;
  }, [habitStats]);

  // Mood pattern detection
  const moodPatterns = useMemo(() => {
    const tips: string[] = [];
    if (moods.length < 3) return tips;

    // Day-of-week analysis
    const dayAvg: Record<number, number[]> = {};
    moods.forEach(m => {
      const dow = new Date(m.date + 'T00:00:00').getDay();
      dayAvg[dow] = dayAvg[dow] || [];
      dayAvg[dow].push(m.value);
    });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let bestDay = -1, bestAvg = 0, worstDay = -1, worstAvg = 11;
    Object.entries(dayAvg).forEach(([d, vals]) => {
      const a = vals.reduce((s, v) => s + v, 0) / vals.length;
      if (a > bestAvg) { bestAvg = a; bestDay = parseInt(d); }
      if (a < worstAvg) { worstAvg = a; worstDay = parseInt(d); }
    });
    if (bestDay >= 0) tips.push(`😊 You feel best on ${dayNames[bestDay]}s`);
    if (worstDay >= 0 && worstDay !== bestDay) tips.push(`😔 Mood tends to dip on ${dayNames[worstDay]}s`);

    // Activity correlation
    try {
      const workouts = getWorkouts();
      const workoutDates = new Set(workouts.map(w => w.date));
      const activeMoods = moods.filter(m => workoutDates.has(m.date));
      const restMoods = moods.filter(m => !workoutDates.has(m.date));
      if (activeMoods.length >= 2 && restMoods.length >= 2) {
        const activeAvg = activeMoods.reduce((s, m) => s + m.value, 0) / activeMoods.length;
        const restAvg = restMoods.reduce((s, m) => s + m.value, 0) / restMoods.length;
        if (activeAvg > restAvg + 0.5) tips.push('💪 You feel better on active days');
      }
    } catch {}

    return tips;
  }, [moods]);

  // Smart insights
  const insights = useMemo(() => {
    const tips: string[] = [];
    if (goodDays > 0) tips.push(`😊 ${goodDays} positive day${goodDays > 1 ? 's' : ''} this week (avg: ${avgMood.toFixed(1)}/10)`);
    habitStats.forEach(h => {
      if (h.streak >= 3) tips.push(`🔥 ${h.name}: ${h.streak}-day streak!`);
    });
    const unchecked = habitStats.filter(h => !h.checkedToday);
    if (unchecked.length > 0) tips.push(`📌 ${unchecked.length} habit${unchecked.length > 1 ? 's' : ''} not checked today`);
    if (!todayReflection) tips.push('✍️ Close your day with a reflection');
    tips.push(...moodPatterns);
    return tips;
  }, [goodDays, avgMood, habitStats, todayReflection, moodPatterns]);

  // ---- Actions ----
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

  const deleteGoal = (id: string) => { const u = goals.filter(g => g.id !== id); saveGoals(u); setGoals(u); };

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

  const deleteHabit = (id: string) => { const u = habits.filter(h => h.id !== id); saveHabits(u); setHabits(u); };

  const addReflection = () => {
    if (!reflText) return;
    const entry: ReflectionEntry = { id: crypto.randomUUID(), text: reflText, date: today };
    const u = [...reflections, entry]; saveReflections(u); setReflections(u); setReflText(''); setShowForm(false);
  };

  const moodEmoji = (v: number) => v >= 8 ? '😊' : v >= 6 ? '🙂' : v >= 4 ? '😐' : v >= 2 ? '😕' : '😢';

  const randomPrompt = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];

  const inputCls = 'w-full rounded-xl bg-secondary p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground';
  const primaryBtn = 'flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground';
  const secondaryBtn = 'flex-1 rounded-xl bg-secondary py-2.5 text-sm font-medium text-foreground';

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4 overflow-x-auto no-scrollbar">
        {([
          { key: 'dashboard' as Tab, label: '📊 Overview' },
          { key: 'mood' as Tab, label: '😊 Mood' },
          { key: 'habits' as Tab, label: '🔥 Habits' },
          { key: 'goals' as Tab, label: '🎯 Goals' },
          { key: 'reflect' as Tab, label: '✍️ Reflect' },
        ]).map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); }}
            className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== DASHBOARD ===== */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          {/* Today Check-in */}
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <p className="text-sm font-semibold text-foreground mb-3">How do you feel today?</p>
            {todayMood ? (
              <div className="text-center">
                <span className="text-4xl">{moodEmoji(todayMood.value)}</span>
                <p className="text-sm text-muted-foreground mt-1">{todayMood.value}/10</p>
                {todayMood.note && <p className="text-xs text-muted-foreground mt-0.5">{todayMood.note}</p>}
              </div>
            ) : (
              <div>
                <div className="text-center mb-2">
                  <span className="text-4xl">{moodEmoji(moodVal)}</span>
                  <p className="text-xs text-muted-foreground mt-1">{moodVal}/10</p>
                </div>
                <input type="range" min="1" max="10" value={moodVal} onChange={e => setMoodVal(parseInt(e.target.value))} className="w-full accent-primary mb-2" />
                <input type="text" placeholder="Quick note (optional)" value={moodNote} onChange={e => setMoodNote(e.target.value)} className={`${inputCls} mb-2`} />
                <button onClick={addMood} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Log Mood</button>
              </div>
            )}
          </div>

          {/* Habit Quick Check */}
          {habits.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-foreground">Today's Habits</p>
                <span className="text-xs text-muted-foreground">{habitsCheckedToday}/{totalHabits}</span>
              </div>
              <div className="space-y-2">
                {habitStats.map(h => (
                  <button key={h.id} onClick={() => toggleHabitToday(h.id)} className="w-full flex items-center gap-3 py-1.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${h.checkedToday ? 'bg-primary' : 'bg-secondary'}`}>
                      <Check className={`w-4 h-4 ${h.checkedToday ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`text-sm flex-1 text-left ${h.checkedToday ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>{h.name}</span>
                    {h.streak > 0 && <span className="text-[10px] text-primary font-medium">🔥{h.streak}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Reflection */}
          {!todayReflection && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <p className="text-sm font-semibold text-foreground mb-2">✍️ {randomPrompt}</p>
              <textarea placeholder="Write anything..." value={reflText} onChange={e => setReflText(e.target.value)} className={`${inputCls} resize-none min-h-[60px] mb-2`} />
              {reflText && <button onClick={addReflection} className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Save Reflection</button>}
            </div>
          )}

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <p className="text-2xl font-bold text-foreground">{avgMood > 0 ? avgMood.toFixed(1) : '—'}</p>
              <p className="text-[10px] text-muted-foreground">Avg Mood (7d)</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <p className="text-2xl font-bold text-foreground">{goodDays}</p>
              <p className="text-[10px] text-muted-foreground">Positive Days</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <p className="text-2xl font-bold text-foreground">{longestStreak}</p>
              <p className="text-[10px] text-muted-foreground">Longest Streak</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <p className="text-2xl font-bold text-foreground">{reflections.length}</p>
              <p className="text-[10px] text-muted-foreground">Reflections</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Reflection', icon: '✍️', t: 'reflect' as Tab },
              { label: 'Goal', icon: '🎯', t: 'goals' as Tab },
              { label: 'Habit', icon: '🔥', t: 'habits' as Tab },
            ].map(a => (
              <button key={a.label} onClick={() => { setTab(a.t); setShowForm(true); }}
                className="bg-card rounded-2xl p-3 shadow-card text-center hover:bg-secondary transition-colors">
                <p className="text-lg">{a.icon}</p>
                <p className="text-xs font-medium text-foreground mt-1">+ {a.label}</p>
              </button>
            ))}
          </div>

          {/* Smart Insights */}
          {insights.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card border border-primary/10">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">Growth Coach</span>
              </div>
              {insights.slice(0, 5).map((tip, i) => (
                <p key={i} className="text-xs text-foreground py-0.5">{tip}</p>
              ))}
            </div>
          )}

          {/* Weekly Overview */}
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <p className="text-xs font-semibold text-foreground mb-2">📊 Weekly Overview</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-bold text-foreground">{recentMoods.length}</p>
                <p className="text-[10px] text-muted-foreground">Mood logs</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{habitsCheckedToday}/{totalHabits}</p>
                <p className="text-[10px] text-muted-foreground">Habits today</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{goals.length}</p>
                <p className="text-[10px] text-muted-foreground">Active goals</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{reflections.filter(r => {
                  const d = (Date.now() - new Date(r.date).getTime()) / 86400000;
                  return d <= 7;
                }).length}</p>
                <p className="text-[10px] text-muted-foreground">Reflections (7d)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MOOD TAB ===== */}
      {tab === 'mood' && (
        <div className="space-y-3">
          {showForm || !todayMood ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <p className="text-sm font-semibold text-foreground">How are you feeling?</p>
              <div className="text-center">
                <span className="text-5xl">{moodEmoji(moodVal)}</span>
                <p className="text-sm text-muted-foreground mt-1">{moodVal}/10</p>
              </div>
              <input type="range" min="1" max="10" value={moodVal} onChange={e => setMoodVal(parseInt(e.target.value))} className="w-full accent-primary" />
              <input type="text" placeholder="What's on your mind?" value={moodNote} onChange={e => setMoodNote(e.target.value)} className={inputCls} />
              <div className="flex gap-2">
                {todayMood && <button onClick={() => setShowForm(false)} className={secondaryBtn}>Cancel</button>}
                <button onClick={addMood} className={primaryBtn}>Log Mood</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-primary">
              + Log Another Mood
            </button>
          )}

          {/* Mood Pattern Card */}
          {moodPatterns.length > 0 && (
            <div className="bg-primary/5 rounded-xl px-3 py-2">
              {moodPatterns.map((p, i) => (
                <p key={i} className="text-xs text-primary font-medium">{p}</p>
              ))}
            </div>
          )}

          {moods.sort((a, b) => b.date.localeCompare(a.date)).map(m => (
            <div key={m.id} className="bg-card rounded-2xl p-3 shadow-card flex justify-between items-center animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-lg">{moodEmoji(m.value)}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{m.value}/10</p>
                  {m.note && <p className="text-xs text-muted-foreground">{m.note}</p>}
                  <p className="text-[10px] text-muted-foreground">{m.date}</p>
                </div>
              </div>
              <button onClick={() => { const u = moods.filter(x => x.id !== m.id); saveMoodEntries(u); setMoods(u); }} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ===== HABITS TAB ===== */}
      {tab === 'habits' && (
        <div className="space-y-3">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <p className="text-sm font-semibold text-foreground">New Habit</p>
              <input type="text" placeholder="Habit name (e.g. Drink water, Read, Meditate)" value={habitName} onChange={e => setHabitName(e.target.value)} className={inputCls} />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className={secondaryBtn}>Cancel</button>
                <button onClick={addHabit} className={primaryBtn}>Add Habit</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-primary">
              <Plus className="w-4 h-4 inline mr-1" />Add Habit
            </button>
          )}

          {habitStats.map(h => (
            <div key={h.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleHabitToday(h.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${h.checkedToday ? 'bg-primary' : 'bg-secondary'}`}>
                  <Check className={`w-5 h-5 ${h.checkedToday ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${h.checkedToday ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{h.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {h.streak > 0 && <span className="text-[10px] text-primary font-semibold">🔥 {h.streak}-day streak</span>}
                    <span className="text-[10px] text-muted-foreground">{h.totalDays} total days</span>
                    {h.missedRecently && <span className="text-[10px] text-warning">Not done today</span>}
                  </div>
                </div>
                <button onClick={() => deleteHabit(h.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {habits.length === 0 && !showForm && (
            <div className="bg-card rounded-2xl p-6 shadow-card text-center">
              <p className="text-sm text-muted-foreground">No habits yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Start with something small — consistency beats intensity.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== GOALS TAB ===== */}
      {tab === 'goals' && (
        <div className="space-y-3">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <p className="text-sm font-semibold text-foreground">New Goal</p>
              <input type="text" placeholder="Goal (e.g. Lose 5kg, Read 12 books)" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} className={inputCls} />
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-3">
                <p className="text-xs text-primary font-medium mb-1">💡 Break into smaller steps</p>
                <p className="text-[10px] text-muted-foreground">Write one step per line — makes big goals manageable</p>
              </div>
              <textarea placeholder="Steps (one per line)&#10;e.g. Research diet plan&#10;Start walking daily&#10;Join gym" value={goalSteps} onChange={e => setGoalSteps(e.target.value)} className={`${inputCls} resize-none min-h-[100px]`} />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className={secondaryBtn}>Cancel</button>
                <button onClick={addGoal} className={primaryBtn}>Create Goal</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-primary">
              <Target className="w-4 h-4 inline mr-1" />New Goal
            </button>
          )}

          {goals.map(g => {
            const done = g.completedSteps.filter(Boolean).length;
            const total = g.targetSteps.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={g.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{g.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">{pct}%</span>
                    <button onClick={() => deleteGoal(g.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                {g.targetSteps.map((step, i) => (
                  <button key={i} onClick={() => toggleGoalStep(g.id, i)} className="flex items-center gap-2 w-full text-left py-1.5">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${g.completedSteps[i] ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                      {g.completedSteps[i] && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className={`text-xs ${g.completedSteps[i] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{step}</span>
                  </button>
                ))}
                {pct === 100 && (
                  <p className="text-xs text-primary font-semibold mt-2 text-center">🎉 Goal completed!</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== REFLECTIONS TAB ===== */}
      {tab === 'reflect' && (
        <div className="space-y-3">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <p className="text-sm font-semibold text-foreground">{randomPrompt}</p>
              <textarea placeholder="Write anything…" value={reflText} onChange={e => setReflText(e.target.value)} className={`${inputCls} resize-none min-h-[120px]`} />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className={secondaryBtn}>Cancel</button>
                <button onClick={addReflection} className={primaryBtn}>Save</button>
              </div>
            </div>
          ) : (
            <div>
              <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-primary mb-3">
                <PenLine className="w-4 h-4 inline mr-1" />Daily Reflection
              </button>
              {!todayReflection && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-foreground font-medium">You haven't reflected today.</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Take 30 seconds — it compounds.</p>
                </div>
              )}
            </div>
          )}

          {/* Win of the day */}
          {todayReflection && (
            <div className="bg-primary/5 rounded-xl px-3 py-2">
              <p className="text-xs text-primary font-medium">✨ Today's reflection saved</p>
            </div>
          )}

          {reflections.sort((a, b) => b.date.localeCompare(a.date)).map(r => (
            <div key={r.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground mb-1">{r.date}</p>
                  <p className="text-sm text-foreground">{r.text}</p>
                </div>
                <button onClick={() => { const u = reflections.filter(x => x.id !== r.id); saveReflections(u); setReflections(u); }} className="text-muted-foreground hover:text-destructive ml-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GrowthCategory;
