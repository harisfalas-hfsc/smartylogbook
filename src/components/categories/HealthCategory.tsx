import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, Flame, Moon, Scale, Activity, Zap, TrendingUp, TrendingDown, Minus, ChevronRight, Copy, Heart } from 'lucide-react';
import { WorkoutEntry, WeightEntry, SleepEntry, WORKOUT_TYPES, ReadinessEntry, CustomHealthMetric, ActivityEntry } from '@/lib/types';
import {
  getWorkouts, saveWorkouts, getWeightEntries, saveWeightEntries,
  getSleepEntries, saveSleepEntries, getReadinessEntries, saveReadinessEntries,
  getCustomMetrics, saveCustomMetrics, getActivityEntries, saveActivityEntries
} from '@/lib/store';

type Tab = 'dashboard' | 'workout' | 'sleep' | 'weight' | 'activity' | 'readiness' | 'custom';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const HealthCategory = () => {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [sleeps, setSleeps] = useState<SleepEntry[]>([]);
  const [readiness, setReadiness] = useState<ReadinessEntry[]>([]);
  const [customMetrics, setCustomMetrics] = useState<CustomHealthMetric[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showForm, setShowForm] = useState(false);

  // Workout form
  const [wType, setWType] = useState(WORKOUT_TYPES[0] as string);
  const [wDuration, setWDuration] = useState('');
  const [wIntensity, setWIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [wNotes, setWNotes] = useState('');

  // Sleep form
  const [sleepRating, setSleepRating] = useState(3);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepNotes, setSleepNotes] = useState('');

  // Weight form
  const [weightVal, setWeightVal] = useState('');

  // Readiness form
  const [rEnergy, setREnergy] = useState(3);
  const [rSleep, setRSleep] = useState(3);
  const [rStress, setRStress] = useState(3);

  // Activity form
  const [actType, setActType] = useState<'walking' | 'steps' | 'general'>('walking');
  const [actValue, setActValue] = useState('');
  const [actNotes, setActNotes] = useState('');

  // Custom metric form
  const [cmName, setCmName] = useState('');
  const [cmValue, setCmValue] = useState('');
  const [cmUnit, setCmUnit] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setWorkouts(getWorkouts());
    setWeights(getWeightEntries());
    setSleeps(getSleepEntries());
    setReadiness(getReadinessEntries());
    setCustomMetrics(getCustomMetrics());
    setActivities(getActivityEntries());
  }, []);

  // ---- Derived data ----
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1);
  const weekStartStr = thisWeekStart.toISOString().slice(0, 10);

  const weekWorkouts = workouts.filter(w => w.date >= weekStartStr);
  const weekActivities = activities.filter(a => a.date >= weekStartStr);
  const lastSleep = sleeps.sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastWeight = weights.sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastReadiness = readiness.sort((a, b) => b.date.localeCompare(a.date))[0];

  // Weekly consistency bar
  const getWeekDayDates = () => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(thisWeekStart);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  };
  const weekDates = getWeekDayDates();
  const activeDays = new Set([
    ...workouts.filter(w => weekDates.includes(w.date)).map(w => w.date),
    ...activities.filter(a => weekDates.includes(a.date)).map(a => a.date),
  ]);

  // Trends
  const getTrend = (arr: { value: number }[]) => {
    if (arr.length < 2) return 'stable';
    const last = arr[arr.length - 1].value;
    const prev = arr[arr.length - 2].value;
    if (last > prev) return 'up';
    if (last < prev) return 'down';
    return 'stable';
  };

  const weightTrend = getTrend(weights.sort((a, b) => a.date.localeCompare(b.date)));
  const sleepTrendArr = sleeps.sort((a, b) => a.date.localeCompare(b.date)).map(s => ({ value: s.rating }));
  const sleepTrend = getTrend(sleepTrendArr);

  // Smart insights
  const insights: string[] = [];
  insights.push(`🏋️ ${weekWorkouts.length} workouts this week`);
  if (weekWorkouts.length >= 3) insights.push('🔥 Great consistency!');
  
  const prev7Workouts = workouts.filter(w => {
    const d = (Date.now() - new Date(w.date).getTime()) / 86400000;
    return d > 7 && d <= 14;
  });
  if (weekWorkouts.length > prev7Workouts.length) insights.push('📈 Activity improved vs last week!');
  else if (weekWorkouts.length < prev7Workouts.length && prev7Workouts.length > 0) insights.push('📉 Less active than last week');

  if (lastSleep && lastSleep.rating <= 2) insights.push('😴 Low sleep may affect your energy');
  if (!workouts.some(w => w.date === today) && !activities.some(a => a.date === today)) insights.push('🏃 You haven\'t moved today — add activity!');
  if (weightTrend === 'up') insights.push('⚖️ Weight trending up');
  if (weightTrend === 'down') insights.push('⚖️ Weight trending down');

  // Readiness calculation
  const calcReadiness = (energy: number, sleep: number, stress: number) => {
    return Math.round(((energy + sleep + (6 - stress)) / 15) * 10);
  };

  // ---- Actions ----
  const addWorkout = () => {
    if (!wDuration) return;
    const entry: WorkoutEntry = { id: crypto.randomUUID(), type: wType, duration: parseInt(wDuration), intensity: wIntensity, notes: wNotes, date: today };
    const updated = [...workouts, entry]; saveWorkouts(updated); setWorkouts(updated);
    setWDuration(''); setWNotes(''); setShowForm(false);
  };

  const duplicateLastWorkout = () => {
    const sorted = workouts.sort((a, b) => b.date.localeCompare(a.date));
    if (sorted.length === 0) return;
    const last = sorted[0];
    const entry: WorkoutEntry = { ...last, id: crypto.randomUUID(), date: today };
    const updated = [...workouts, entry]; saveWorkouts(updated); setWorkouts(updated);
  };

  const addSleep = () => {
    const entry: SleepEntry = { id: crypto.randomUUID(), rating: sleepRating, hours: sleepHours ? parseFloat(sleepHours) : undefined, notes: sleepNotes || undefined, date: today };
    const updated = [...sleeps, entry]; saveSleepEntries(updated); setSleeps(updated);
    setSleepHours(''); setSleepNotes(''); setShowForm(false);
  };

  const addWeight = () => {
    if (!weightVal) return;
    const entry: WeightEntry = { id: crypto.randomUUID(), value: parseFloat(weightVal), date: today };
    const updated = [...weights, entry]; saveWeightEntries(updated); setWeights(updated);
    setWeightVal(''); setShowForm(false);
  };

  const addReadiness = () => {
    const score = calcReadiness(rEnergy, rSleep, rStress);
    const entry: ReadinessEntry = { id: crypto.randomUUID(), energy: rEnergy, sleepQuality: rSleep, stress: rStress, score, date: today };
    const updated = [...readiness, entry]; saveReadinessEntries(updated); setReadiness(updated);
    setShowForm(false);
  };

  const addActivity = () => {
    if (!actValue) return;
    const entry: ActivityEntry = { id: crypto.randomUUID(), type: actType, value: parseFloat(actValue), notes: actNotes, date: today };
    const updated = [...activities, entry]; saveActivityEntries(updated); setActivities(updated);
    setActValue(''); setActNotes(''); setShowForm(false);
  };

  const addCustomMetric = () => {
    if (!cmName || !cmValue) return;
    const entry: CustomHealthMetric = { id: crypto.randomUUID(), name: cmName, value: parseFloat(cmValue), unit: cmUnit, date: today };
    const updated = [...customMetrics, entry]; saveCustomMetrics(updated); setCustomMetrics(updated);
    setCmValue(''); setShowForm(false);
  };

  const deleteItem = <T extends { id: string }>(items: T[], setItems: (v: T[]) => void, saveFn: (v: T[]) => void, id: string) => {
    const updated = items.filter(x => x.id !== id); saveFn(updated); setItems(updated);
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const readinessAdvice = (score: number) => {
    if (score >= 8) return '💪 Great day to push hard!';
    if (score >= 5) return '👍 Good day for moderate activity';
    return '🧘 Take it easy today';
  };

  const inputCls = "w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground placeholder:text-muted-foreground";
  const btnPrimary = "flex-1 py-2.5 bg-primary rounded-xl text-sm font-semibold text-primary-foreground";
  const btnSecondary = "flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground";

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4 overflow-x-auto no-scrollbar">
        {([
          { key: 'dashboard' as Tab, label: '📊 Overview' },
          { key: 'workout' as Tab, label: '🏋️ Workout' },
          { key: 'sleep' as Tab, label: '😴 Sleep' },
          { key: 'weight' as Tab, label: '⚖️ Weight' },
          { key: 'activity' as Tab, label: '🚶 Activity' },
          { key: 'readiness' as Tab, label: '⚡ Readiness' },
          { key: 'custom' as Tab, label: '📐 Custom' },
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
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Flame className="w-4 h-4" /><span className="text-xs font-medium">Activity</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{weekWorkouts.length + weekActivities.length}</p>
              <p className="text-xs text-muted-foreground">sessions this week</p>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Moon className="w-4 h-4" /><span className="text-xs font-medium">Sleep</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{lastSleep ? `${lastSleep.rating}/5` : '—'}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">last night <TrendIcon trend={sleepTrend} /></p>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Scale className="w-4 h-4" /><span className="text-xs font-medium">Weight</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{lastWeight ? lastWeight.value : '—'}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">latest <TrendIcon trend={weightTrend} /></p>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Zap className="w-4 h-4" /><span className="text-xs font-medium">Readiness</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{lastReadiness ? `${lastReadiness.score}/10` : '—'}</p>
              <p className="text-xs text-muted-foreground">{lastReadiness ? readinessAdvice(lastReadiness.score) : 'Not logged'}</p>
            </div>
          </div>

          {/* Weekly Consistency Bar */}
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <p className="text-xs font-semibold text-foreground mb-3">Weekly Consistency</p>
            <div className="flex justify-between gap-1">
              {weekDates.map((date, i) => (
                <div key={date} className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    activeDays.has(date)
                      ? 'bg-primary text-primary-foreground'
                      : date === today
                      ? 'bg-accent text-accent-foreground ring-2 ring-primary/30'
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {activeDays.has(date) ? '✓' : ''}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{DAYS[i]}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {activeDays.size}/7 active days
            </p>
          </div>

          {/* Today CTA */}
          {!workouts.some(w => w.date === today) && !activities.some(a => a.date === today) && (
            <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-foreground">Did you move today? 🏃</p>
              <p className="text-xs text-muted-foreground mt-1">Log a workout or activity</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setTab('workout')} className="flex-1 py-2 bg-primary rounded-xl text-xs font-semibold text-primary-foreground">+ Workout</button>
                <button onClick={() => setTab('activity')} className="flex-1 py-2 bg-secondary rounded-xl text-xs font-semibold text-foreground">+ Activity</button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Workout', icon: '🏋️', tab: 'workout' as Tab },
              { label: 'Sleep', icon: '😴', tab: 'sleep' as Tab },
              { label: 'Weight', icon: '⚖️', tab: 'weight' as Tab },
              { label: 'Activity', icon: '🚶', tab: 'activity' as Tab },
              { label: 'Readiness', icon: '⚡', tab: 'readiness' as Tab },
              { label: 'Custom', icon: '📐', tab: 'custom' as Tab },
            ].map(a => (
              <button key={a.label} onClick={() => { setTab(a.tab); setShowForm(true); }}
                className="bg-card rounded-2xl p-3 shadow-card text-center hover:bg-secondary transition-colors">
                <p className="text-lg">{a.icon}</p>
                <p className="text-xs font-medium text-foreground mt-1">{a.label}</p>
              </button>
            ))}
          </div>

          {/* Smart Insights */}
          {insights.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card border border-primary/10">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">Health Coach</span>
              </div>
              {insights.slice(0, 4).map((tip, i) => (
                <p key={i} className="text-xs text-foreground py-0.5">{tip}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== WORKOUT TAB ===== */}
      {tab === 'workout' && (
        <div className="space-y-3">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <p className="text-sm font-semibold text-foreground">Log Workout</p>
              <select value={wType} onChange={e => setWType(e.target.value)} className={inputCls}>
                {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" placeholder="Duration (minutes)" value={wDuration} onChange={e => setWDuration(e.target.value)} className={inputCls} />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Intensity</p>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(i => (
                    <button key={i} onClick={() => setWIntensity(i)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize ${wIntensity === i ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <input type="text" placeholder="Notes (optional)" value={wNotes} onChange={e => setWNotes(e.target.value)} className={inputCls} />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
                <button onClick={addWorkout} className={btnPrimary}>Save</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setShowForm(true)} className="flex-1 bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-primary">
                <Plus className="w-4 h-4 inline mr-1" />Log Workout
              </button>
              {workouts.length > 0 && (
                <button onClick={duplicateLastWorkout} className="bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-muted-foreground">
                  <Copy className="w-4 h-4 inline mr-1" />Repeat Last
                </button>
              )}
            </div>
          )}

          {/* Smart feedback */}
          {weekWorkouts.length > 0 && (
            <div className="bg-primary/5 rounded-xl px-3 py-2">
              <p className="text-xs text-primary font-medium">
                💪 That's your {weekWorkouts.length}{weekWorkouts.length === 1 ? 'st' : weekWorkouts.length === 2 ? 'nd' : weekWorkouts.length === 3 ? 'rd' : 'th'} workout this week
                {weekWorkouts.length >= 3 ? ' — you\'re on track!' : ''}
              </p>
            </div>
          )}

          {workouts.sort((a, b) => b.date.localeCompare(a.date)).map(w => (
            <div key={w.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-warning" />{w.type}
                  </p>
                  <p className="text-xs text-muted-foreground">{w.duration}min • {w.intensity} • {w.date}</p>
                  {w.notes && <p className="text-xs text-muted-foreground mt-0.5">{w.notes}</p>}
                </div>
                <button onClick={() => deleteItem(workouts, setWorkouts, saveWorkouts, w.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== SLEEP TAB ===== */}
      {tab === 'sleep' && (
        <div className="space-y-3">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <p className="text-sm font-semibold text-foreground">Log Sleep</p>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Sleep quality: {sleepRating}/5</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} onClick={() => setSleepRating(v)}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold ${sleepRating === v ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {['😫', '😕', '😐', '😊', '😴'][v - 1]}
                    </button>
                  ))}
                </div>
              </div>
              <input type="number" placeholder="Hours slept (optional)" value={sleepHours} onChange={e => setSleepHours(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Notes (optional)" value={sleepNotes} onChange={e => setSleepNotes(e.target.value)} className={inputCls} />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
                <button onClick={addSleep} className={btnPrimary}>Save</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-primary">
              <Moon className="w-4 h-4 inline mr-1" />Log Sleep
            </button>
          )}
          {sleeps.sort((a, b) => b.date.localeCompare(a.date)).map(s => (
            <div key={s.id} className="bg-card rounded-2xl p-3 shadow-card flex justify-between items-center animate-fade-in">
              <div>
                <p className="text-sm font-semibold text-foreground">{['😫', '😕', '😐', '😊', '😴'][s.rating - 1]} {s.rating}/5</p>
                <p className="text-xs text-muted-foreground">{s.hours ? `${s.hours}h • ` : ''}{s.date}</p>
                {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
              </div>
              <button onClick={() => deleteItem(sleeps, setSleeps, saveSleepEntries, s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* ===== WEIGHT TAB ===== */}
      {tab === 'weight' && (
        <div className="space-y-3">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <p className="text-sm font-semibold text-foreground">Log Weight</p>
              <input type="number" placeholder="Weight (kg/lbs)" value={weightVal} onChange={e => setWeightVal(e.target.value)} className={inputCls} />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
                <button onClick={addWeight} className={btnPrimary}>Save</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-primary">
              <Scale className="w-4 h-4 inline mr-1" />Log Weight
            </button>
          )}

          {weights.length >= 2 && (
            <div className="bg-primary/5 rounded-xl px-3 py-2 flex items-center gap-2">
              <TrendIcon trend={weightTrend} />
              <p className="text-xs text-foreground font-medium">
                Weight is {weightTrend === 'up' ? 'trending up' : weightTrend === 'down' ? 'trending down' : 'stable'}
              </p>
            </div>
          )}

          {weights.sort((a, b) => b.date.localeCompare(a.date)).map(w => (
            <div key={w.id} className="bg-card rounded-2xl p-3 shadow-card flex justify-between items-center animate-fade-in">
              <div><p className="text-sm font-semibold text-foreground">{w.value}</p><p className="text-xs text-muted-foreground">{w.date}</p></div>
              <button onClick={() => deleteItem(weights, setWeights, saveWeightEntries, w.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* ===== ACTIVITY TAB ===== */}
      {tab === 'activity' && (
        <div className="space-y-3">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <p className="text-sm font-semibold text-foreground">Log Activity</p>
              <div className="flex gap-2">
                {(['walking', 'steps', 'general'] as const).map(t => (
                  <button key={t} onClick={() => setActType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize ${actType === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <input type="number" placeholder={actType === 'steps' ? 'Number of steps' : 'Duration (minutes)'} value={actValue} onChange={e => setActValue(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Notes (optional)" value={actNotes} onChange={e => setActNotes(e.target.value)} className={inputCls} />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
                <button onClick={addActivity} className={btnPrimary}>Save</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-primary">
              <Activity className="w-4 h-4 inline mr-1" />Log Activity
            </button>
          )}
          {activities.sort((a, b) => b.date.localeCompare(a.date)).map(a => (
            <div key={a.id} className="bg-card rounded-2xl p-3 shadow-card flex justify-between items-center animate-fade-in">
              <div>
                <p className="text-sm font-semibold text-foreground capitalize">{a.type}</p>
                <p className="text-xs text-muted-foreground">{a.value}{a.type === 'steps' ? ' steps' : ' min'} • {a.date}</p>
              </div>
              <button onClick={() => deleteItem(activities, setActivities, saveActivityEntries, a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* ===== READINESS TAB ===== */}
      {tab === 'readiness' && (
        <div className="space-y-3">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-4">
              <p className="text-sm font-semibold text-foreground">How are you feeling?</p>
              {[
                { label: 'Energy', value: rEnergy, set: setREnergy, emojis: ['😩', '😔', '😐', '😊', '⚡'] },
                { label: 'Sleep Quality', value: rSleep, set: setRSleep, emojis: ['😫', '😕', '😐', '😊', '😴'] },
                { label: 'Stress Level', value: rStress, set: setRStress, emojis: ['😌', '🙂', '😐', '😟', '🤯'] },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground mb-2">{item.label}: {item.value}/5</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} onClick={() => item.set(v)}
                        className={`flex-1 py-2.5 rounded-xl text-sm ${item.value === v ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                        {item.emojis[v - 1]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="bg-secondary rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Readiness Score</p>
                <p className="text-3xl font-bold text-foreground">{calcReadiness(rEnergy, rSleep, rStress)}/10</p>
                <p className="text-xs text-primary font-medium mt-1">{readinessAdvice(calcReadiness(rEnergy, rSleep, rStress))}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
                <button onClick={addReadiness} className={btnPrimary}>Save</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-primary">
              <Zap className="w-4 h-4 inline mr-1" />Check Readiness
            </button>
          )}

          {readiness.sort((a, b) => b.date.localeCompare(a.date)).map(r => (
            <div key={r.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold text-foreground">{r.score}/10</p>
                  <p className="text-xs text-muted-foreground">Energy {r.energy} • Sleep {r.sleepQuality} • Stress {r.stress}</p>
                  <p className="text-xs text-primary font-medium">{readinessAdvice(r.score)}</p>
                  <p className="text-xs text-muted-foreground">{r.date}</p>
                </div>
                <button onClick={() => deleteItem(readiness, setReadiness, saveReadinessEntries, r.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== CUSTOM METRICS TAB ===== */}
      {tab === 'custom' && (
        <div className="space-y-3">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <p className="text-sm font-semibold text-foreground">Add Custom Metric</p>
              <input type="text" placeholder="Metric name (e.g. Body Fat, Blood Pressure)" value={cmName} onChange={e => setCmName(e.target.value)} className={inputCls} />
              <input type="number" placeholder="Value" value={cmValue} onChange={e => setCmValue(e.target.value)} className={inputCls} />
              <input type="text" placeholder="Unit (%, mmHg, etc.)" value={cmUnit} onChange={e => setCmUnit(e.target.value)} className={inputCls} />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
                <button onClick={addCustomMetric} className={btnPrimary}>Save</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-primary">
              <Plus className="w-4 h-4 inline mr-1" />Add Custom Metric
            </button>
          )}

          {/* Group by metric name */}
          {Array.from(new Set(customMetrics.map(m => m.name))).map(name => {
            const entries = customMetrics.filter(m => m.name === name).sort((a, b) => b.date.localeCompare(a.date));
            const trend = getTrend(entries.sort((a, b) => a.date.localeCompare(b.date)));
            return (
              <div key={name} className="bg-card rounded-2xl p-4 shadow-card">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <TrendIcon trend={trend} />
                </div>
                {entries.slice(0, 5).map(m => (
                  <div key={m.id} className="flex justify-between items-center py-1.5 border-b border-secondary last:border-0">
                    <p className="text-xs text-foreground">{m.value} {m.unit}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">{m.date}</p>
                      <button onClick={() => deleteItem(customMetrics, setCustomMetrics, saveCustomMetrics, m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HealthCategory;
