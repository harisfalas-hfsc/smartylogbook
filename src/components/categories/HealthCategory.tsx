import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, Flame } from 'lucide-react';
import { WorkoutEntry, WeightEntry, SleepEntry, WORKOUT_TYPES } from '@/lib/types';
import { getWorkouts, saveWorkouts, getWeightEntries, saveWeightEntries, getSleepEntries, saveSleepEntries } from '@/lib/store';

type Tab = 'workouts' | 'weight' | 'sleep';

const HealthCategory = () => {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [sleeps, setSleeps] = useState<SleepEntry[]>([]);
  const [tab, setTab] = useState<Tab>('workouts');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [wType, setWType] = useState(WORKOUT_TYPES[0] as string);
  const [wDuration, setWDuration] = useState('');
  const [wIntensity, setWIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [wNotes, setWNotes] = useState('');
  const [weightVal, setWeightVal] = useState('');
  const [sleepRating, setSleepRating] = useState(3);
  const [sleepHours, setSleepHours] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { setWorkouts(getWorkouts()); setWeights(getWeightEntries()); setSleeps(getSleepEntries()); }, []);

  // Smart insights
  const last7 = workouts.filter(w => (Date.now() - new Date(w.date).getTime()) / 86400000 <= 7);
  const prev7 = workouts.filter(w => { const d = (Date.now() - new Date(w.date).getTime()) / 86400000; return d > 7 && d <= 14; });
  const smartTips: string[] = [];
  smartTips.push(`🏋️ ${last7.length} workouts this week`);
  if (last7.length > prev7.length) smartTips.push('📈 Activity improved vs last week!');
  else if (last7.length < prev7.length && prev7.length > 0) smartTips.push('📉 Less active than last week');
  if (weights.length >= 2) {
    const trend = weights[weights.length - 1].value - weights[weights.length - 2].value;
    smartTips.push(trend > 0 ? `⚖️ Weight trending up (+${trend.toFixed(1)})` : trend < 0 ? `⚖️ Weight trending down (${trend.toFixed(1)})` : '⚖️ Weight stable');
  }
  if (!workouts.some(w => w.date === today)) smartTips.push('🏃 No workout logged today');

  const addWorkout = () => {
    if (!wDuration) return;
    const entry: WorkoutEntry = { id: crypto.randomUUID(), type: wType, duration: parseInt(wDuration), intensity: wIntensity, notes: wNotes, date: today };
    const updated = [...workouts, entry]; saveWorkouts(updated); setWorkouts(updated);
    setWDuration(''); setWNotes(''); setShowForm(false);
  };

  const addWeight = () => {
    if (!weightVal) return;
    const entry: WeightEntry = { id: crypto.randomUUID(), value: parseFloat(weightVal), date: today };
    const updated = [...weights, entry]; saveWeightEntries(updated); setWeights(updated);
    setWeightVal(''); setShowForm(false);
  };

  const addSleep = () => {
    const entry: SleepEntry = { id: crypto.randomUUID(), rating: sleepRating, hours: sleepHours ? parseFloat(sleepHours) : undefined, date: today };
    const updated = [...sleeps, entry]; saveSleepEntries(updated); setSleeps(updated);
    setSleepHours(''); setShowForm(false);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'workouts', label: 'Workouts' }, { key: 'weight', label: 'Weight' }, { key: 'sleep', label: 'Sleep' },
  ];

  return (
    <div>
      {smartTips.length > 0 && (
        <div className="bg-card rounded-2xl p-3 shadow-card border border-primary/10 mb-4">
          <div className="flex items-center gap-1.5 mb-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-semibold text-primary">Health Coach</span></div>
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

      {tab === 'workouts' && (
        <div className="space-y-2">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <select value={wType} onChange={e => setWType(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground">
                {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" placeholder="Duration (min)" value={wDuration} onChange={e => setWDuration(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(i => (
                  <button key={i} onClick={() => setWIntensity(i)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium ${wIntensity === i ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {i}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Notes (optional)" value={wNotes} onChange={e => setWNotes(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
                <button onClick={addWorkout} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Log</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ Log Workout</button>
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
                <button onClick={() => { saveWorkouts(workouts.filter(x => x.id !== w.id)); setWorkouts(workouts.filter(x => x.id !== w.id)); }} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'weight' && (
        <div className="space-y-2">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <input type="number" placeholder="Weight (kg/lbs)" value={weightVal} onChange={e => setWeightVal(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
                <button onClick={addWeight} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Log</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ Log Weight</button>
          )}
          {weights.sort((a, b) => b.date.localeCompare(a.date)).map(w => (
            <div key={w.id} className="bg-card rounded-2xl p-3 shadow-card flex justify-between items-center animate-fade-in">
              <div><p className="text-sm font-semibold text-foreground">{w.value}</p><p className="text-xs text-muted-foreground">{w.date}</p></div>
              <button onClick={() => { saveWeightEntries(weights.filter(x => x.id !== w.id)); setWeights(weights.filter(x => x.id !== w.id)); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'sleep' && (
        <div className="space-y-2">
          {showForm ? (
            <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Sleep quality: {sleepRating}/5</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} onClick={() => setSleepRating(v)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium ${sleepRating === v ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <input type="number" placeholder="Hours slept (optional)" value={sleepHours} onChange={e => setSleepHours(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
                <button onClick={addSleep} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Log</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ Log Sleep</button>
          )}
          {sleeps.sort((a, b) => b.date.localeCompare(a.date)).map(s => (
            <div key={s.id} className="bg-card rounded-2xl p-3 shadow-card flex justify-between items-center animate-fade-in">
              <div><p className="text-sm font-semibold text-foreground">{'⭐'.repeat(s.rating)}</p><p className="text-xs text-muted-foreground">{s.hours ? `${s.hours}h • ` : ''}{s.date}</p></div>
              <button onClick={() => { saveSleepEntries(sleeps.filter(x => x.id !== s.id)); setSleeps(sleeps.filter(x => x.id !== s.id)); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthCategory;
