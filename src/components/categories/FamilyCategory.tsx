import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, Star } from 'lucide-react';
import { FamilyEvent } from '@/lib/types';
import { getFamilyEvents, saveFamilyEvents } from '@/lib/store';

const DEFAULT_SUBS = ['Important Dates', 'Kids', 'Personal Notes'];

const FamilyCategory = () => {
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('smarty_family_subs');
    return saved ? JSON.parse(saved) : DEFAULT_SUBS;
  });
  const [activeSub, setActiveSub] = useState(DEFAULT_SUBS[0]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [importance, setImportance] = useState<'normal' | 'important' | 'critical'>('normal');

  useEffect(() => { setEvents(getFamilyEvents()); }, []);

  const filtered = events.filter(e => e.subcategory === activeSub);

  // Upcoming events
  const today = new Date();
  const upcoming = events.filter(e => new Date(e.date) >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  const add = () => {
    if (!title) return;
    const event: FamilyEvent = { id: crypto.randomUUID(), subcategory: activeSub, title, notes, date, importance };
    const updated = [...events, event]; saveFamilyEvents(updated); setEvents(updated);
    setTitle(''); setNotes(''); setShowForm(false);
  };

  const del = (id: string) => { const u = events.filter(e => e.id !== id); saveFamilyEvents(u); setEvents(u); };

  const addSub = () => {
    const name = prompt('New subcategory name:');
    if (name && !subcategories.includes(name)) {
      const u = [...subcategories, name];
      setSubcategories(u);
      localStorage.setItem('smarty_family_subs', JSON.stringify(u));
    }
  };

  const importanceIcon = (imp: string) => {
    if (imp === 'critical') return <AlertTriangle className="w-3.5 h-3.5 text-destructive" />;
    if (imp === 'important') return <Star className="w-3.5 h-3.5 text-warning" />;
    return null;
  };

  return (
    <div>
      {upcoming.length > 0 && (
        <div className="bg-card rounded-2xl p-3 shadow-card border border-warning/20 mb-4">
          <p className="text-xs font-semibold text-warning mb-1.5">📅 Upcoming</p>
          {upcoming.map(e => (
            <p key={e.id} className="text-xs text-foreground">{e.date} — {e.title}</p>
          ))}
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
            <input type="text" placeholder="Event / Note title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
            <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground resize-none min-h-[60px]" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground" />
            <div className="flex gap-2">
              {(['normal', 'important', 'critical'] as const).map(i => (
                <button key={i} onClick={() => setImportance(i)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize ${importance === i ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  {i}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground">Cancel</button>
              <button onClick={add} className="flex-1 py-2.5 bg-primary rounded-xl text-sm font-medium text-primary-foreground">Add</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)} className="w-full bg-card rounded-2xl p-4 shadow-card text-center text-sm font-medium text-primary">+ Add Event</button>
        )}
        {filtered.sort((a, b) => b.date.localeCompare(a.date)).map(e => (
          <div key={e.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">{importanceIcon(e.importance)}{e.title}</p>
                {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{e.date}</p>
              </div>
              <button onClick={() => del(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FamilyCategory;
