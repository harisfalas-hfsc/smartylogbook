import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, Lightbulb } from 'lucide-react';
import { WorkEntry } from '@/lib/types';
import { getWorkEntries, saveWorkEntries } from '@/lib/store';

const DEFAULT_SUBS = ['Work Log', 'Ideas', 'Meetings'];

const WorkCategory = () => {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('smarty_work_subs');
    return saved ? JSON.parse(saved) : DEFAULT_SUBS;
  });
  const [activeSub, setActiveSub] = useState(DEFAULT_SUBS[0]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tag, setTag] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { setEntries(getWorkEntries()); }, []);

  const filtered = entries.filter(e => e.subcategory === activeSub);

  // Smart: daily summary
  const todayEntries = entries.filter(e => e.date === today);
  const smartTips: string[] = [];
  if (todayEntries.length > 0) smartTips.push(`📊 ${todayEntries.length} entries logged today`);
  const highPri = entries.filter(e => e.priority === 'high');
  if (highPri.length > 0) smartTips.push(`🔴 ${highPri.length} high-priority item(s) need attention`);
  // Focus detection
  const tagCount = entries.reduce((acc, e) => { if (e.tag) acc[e.tag] = (acc[e.tag] || 0) + 1; return acc; }, {} as Record<string, number>);
  const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0];
  if (topTag) smartTips.push(`🎯 Most focus on: ${topTag[0]}`);

  const add = () => {
    if (!title) return;
    const entry: WorkEntry = { id: crypto.randomUUID(), subcategory: activeSub, title, notes, tag, priority, date: today };
    const updated = [...entries, entry]; saveWorkEntries(updated); setEntries(updated);
    setTitle(''); setNotes(''); setTag(''); setShowForm(false);
  };

  const del = (id: string) => { const u = entries.filter(e => e.id !== id); saveWorkEntries(u); setEntries(u); };

  const addSub = () => {
    const name = prompt('New subcategory name:');
    if (name && !subcategories.includes(name)) {
      const u = [...subcategories, name];
      setSubcategories(u);
      localStorage.setItem('smarty_work_subs', JSON.stringify(u));
    }
  };

  return (
    <div>
      {smartTips.length > 0 && (
        <div className="bg-card rounded-2xl p-3 shadow-card border border-primary/10 mb-4">
          <div className="flex items-center gap-1.5 mb-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-semibold text-primary">Productivity Insights</span></div>
          {smartTips.slice(0, 3).map((t, i) => <p key={i} className="text-xs text-foreground">{t}</p>)}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-4 pb-1">
        {subcategories.map(s => (
          <button key={s} onClick={() => { setActiveSub(s); setShowForm(false); }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${activeSub === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
            {s}
          </button>
        ))}
        <button onClick={addSub} className="whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium bg-secondary text-muted-foreground">+</button>
      </div>

      <div className="space-y-2">
        {showForm ? (
          <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
            <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
            <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground resize-none min-h-[60px]" />
            <input type="text" placeholder="Tag (project/client)" value={tag} onChange={e => setTag(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium ${priority === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
              <button onClick={add} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Add</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ Add Entry</button>
        )}
        {filtered.sort((a, b) => b.date.localeCompare(a.date)).map(e => (
          <div key={e.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  {e.priority === 'high' && <span className="w-2 h-2 rounded-full bg-destructive" />}
                  {e.title}
                </p>
                {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{e.tag && `${e.tag} • `}{e.date}</p>
              </div>
              <button onClick={() => del(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkCategory;
