import { useState, useEffect } from 'react';
import { Plus, Trash2, Sparkles, Lightbulb, Copy, Briefcase, MessageSquare, PenLine, BarChart3 } from 'lucide-react';
import { WorkEntry } from '@/lib/types';
import { getWorkEntries, saveWorkEntries } from '@/lib/store';

const DEFAULT_SUBS = ['Work Log', 'Ideas', 'Meetings'];

type Tab = 'dashboard' | 'log';

const WorkCategory = () => {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('smarty_work_subs');
    return saved ? JSON.parse(saved) : DEFAULT_SUBS;
  });
  const [activeSub, setActiveSub] = useState(DEFAULT_SUBS[0]);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tag, setTag] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [duration, setDuration] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => { setEntries(getWorkEntries()); }, []);

  const filtered = entries.filter(e => e.subcategory === activeSub);
  const todayEntries = entries.filter(e => e.date === today);

  // Focus detection
  const tagCount = entries.reduce((acc, e) => {
    if (e.tag) acc[e.tag] = (acc[e.tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0];
  const tagPercentages = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / entries.length) * 100) }));

  // Subcategory counts
  const subCounts = subcategories.reduce((acc, s) => {
    acc[s] = entries.filter(e => e.subcategory === s).length;
    return acc;
  }, {} as Record<string, number>);

  // Today stats
  const todaySessionCount = todayEntries.length;
  const todayByType: Record<string, number> = {};
  todayEntries.forEach(e => { todayByType[e.subcategory] = (todayByType[e.subcategory] || 0) + 1; });

  // Weekly comparison
  const last7 = entries.filter(e => (Date.now() - new Date(e.date).getTime()) / 86400000 <= 7);
  const prev7 = entries.filter(e => { const d = (Date.now() - new Date(e.date).getTime()) / 86400000; return d > 7 && d <= 14; });

  // Smart insights
  const insights: string[] = [];
  if (todaySessionCount > 0) insights.push(`📊 ${todaySessionCount} session${todaySessionCount > 1 ? 's' : ''} logged today`);
  if (topTag) insights.push(`🎯 Most focus on: ${topTag[0]}`);

  const highPri = entries.filter(e => e.priority === 'high' && e.subcategory === 'Ideas');
  if (highPri.length > 0) insights.push(`🔴 ${highPri.length} high-priority idea${highPri.length > 1 ? 's' : ''} need review`);

  if (last7.length > prev7.length) insights.push('📈 You were more productive this week!');
  else if (last7.length < prev7.length && prev7.length > 0) insights.push('📉 Less work logged than last week');

  // Meeting task detection
  const detectTasks = (text: string): string[] => {
    const patterns = [/send\s+\w+/gi, /follow\s*up/gi, /schedule\s+\w+/gi, /prepare\s+\w+/gi, /review\s+\w+/gi, /call\s+\w+/gi, /email\s+\w+/gi];
    const found: string[] = [];
    patterns.forEach(p => { const m = text.match(p); if (m) found.push(...m); });
    return found;
  };

  // All unique tags for autocomplete
  const allTags = Array.from(new Set(entries.map(e => e.tag).filter(Boolean)));

  const add = () => {
    if (!title) return;
    const entry: WorkEntry = { id: crypto.randomUUID(), subcategory: activeSub, title, notes, tag, priority, date: today };
    const updated = [...entries, entry]; saveWorkEntries(updated); setEntries(updated);
    setTitle(''); setNotes(''); setTag(''); setDuration(''); setShowForm(false);
  };

  const duplicateLast = () => {
    const lastEntry = filtered.sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!lastEntry) return;
    const entry: WorkEntry = { ...lastEntry, id: crypto.randomUUID(), date: today };
    const updated = [...entries, entry]; saveWorkEntries(updated); setEntries(updated);
  };

  const del = (id: string) => {
    const u = entries.filter(e => e.id !== id); saveWorkEntries(u); setEntries(u);
  };

  const addSub = () => {
    const name = prompt('New subcategory name:');
    if (name && !subcategories.includes(name)) {
      const u = [...subcategories, name];
      setSubcategories(u);
      localStorage.setItem('smarty_work_subs', JSON.stringify(u));
    }
  };

  const deleteSub = (name: string) => {
    if (DEFAULT_SUBS.includes(name)) return;
    if (!confirm(`Delete "${name}" tab?`)) return;
    const u = subcategories.filter(s => s !== name);
    setSubcategories(u);
    localStorage.setItem('smarty_work_subs', JSON.stringify(u));
    if (activeSub === name) setActiveSub(u[0]);
  };

  const inputCls = "w-full bg-secondary rounded-xl p-3 text-sm outline-none text-foreground placeholder:text-muted-foreground";
  const btnPrimary = "flex-1 py-2.5 bg-primary rounded-xl text-sm font-semibold text-primary-foreground";
  const btnSecondary = "flex-1 py-2.5 bg-secondary rounded-xl text-sm font-medium text-foreground";

  const getSubIcon = (name: string) => {
    if (name === 'Work Log') return <Briefcase className="w-3.5 h-3.5" />;
    if (name === 'Ideas') return <Lightbulb className="w-3.5 h-3.5" />;
    if (name === 'Meetings') return <MessageSquare className="w-3.5 h-3.5" />;
    return <PenLine className="w-3.5 h-3.5" />;
  };

  return (
    <div>
      {/* Main Tab Toggle */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4">
        <button onClick={() => setTab('dashboard')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'dashboard' ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground'}`}>
          📊 Dashboard
        </button>
        <button onClick={() => setTab('log')}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'log' ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground'}`}>
          📝 Log
        </button>
      </div>

      {/* ===== DASHBOARD ===== */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          {/* Today Status Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <p className="text-2xl font-bold text-foreground">{todaySessionCount}</p>
              <p className="text-[10px] text-muted-foreground">Sessions Today</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <p className="text-2xl font-bold text-foreground">{topTag ? topTag[0].slice(0, 8) : '—'}</p>
              <p className="text-[10px] text-muted-foreground">Focus Area</p>
            </div>
            <div className="bg-card rounded-2xl p-3 shadow-card text-center">
              <p className="text-2xl font-bold text-foreground">{last7.length}</p>
              <p className="text-[10px] text-muted-foreground">This Week</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2">
            {subcategories.slice(0, 3).map(s => (
              <button key={s} onClick={() => { setTab('log'); setActiveSub(s); setShowForm(true); }}
                className="bg-card rounded-2xl p-3 shadow-card text-center hover:bg-secondary transition-colors">
                <div className="flex justify-center text-primary mb-1">{getSubIcon(s)}</div>
                <p className="text-xs font-medium text-foreground">+ {s}</p>
              </button>
            ))}
          </div>

          {/* Focus Breakdown */}
          {tagPercentages.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-foreground">Focus Distribution</p>
              </div>
              {tagPercentages.map(t => (
                <div key={t.name} className="mb-2 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{t.name}</span>
                    <span className="text-muted-foreground">{t.pct}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${t.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Daily Summary */}
          {todayEntries.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card">
              <p className="text-xs font-semibold text-foreground mb-2">📋 Today's Summary</p>
              {Object.entries(todayByType).map(([type, count]) => (
                <p key={type} className="text-xs text-muted-foreground">• {count} {type.toLowerCase()}{count > 1 ? 's' : ''}</p>
              ))}
              <p className="text-xs text-primary font-medium mt-2">Total: {todayEntries.length} entries</p>
            </div>
          )}

          {/* Smart Insights */}
          {insights.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card border border-primary/10">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">Productivity Coach</span>
              </div>
              {insights.slice(0, 4).map((tip, i) => (
                <p key={i} className="text-xs text-foreground py-0.5">{tip}</p>
              ))}
            </div>
          )}

          {/* Weekly Overview */}
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <p className="text-xs font-semibold text-foreground mb-2">📊 Weekly Overview</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-bold text-foreground">{last7.length}</p>
                <p className="text-[10px] text-muted-foreground">Total sessions</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{last7.filter(e => e.subcategory === 'Ideas').length}</p>
                <p className="text-[10px] text-muted-foreground">Ideas created</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{last7.filter(e => e.subcategory === 'Meetings').length}</p>
                <p className="text-[10px] text-muted-foreground">Meetings logged</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{topTag ? topTag[0] : '—'}</p>
                <p className="text-[10px] text-muted-foreground">Top focus</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== LOG TAB ===== */}
      {tab === 'log' && (
        <div>
          {/* Subcategory Tabs */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4 pb-1">
            {subcategories.map(s => (
              <button key={s} onClick={() => { setActiveSub(s); setShowForm(false); }}
                onDoubleClick={() => deleteSub(s)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  activeSub === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                {getSubIcon(s)}{s}
                {subCounts[s] > 0 && <span className="bg-background/20 px-1.5 py-0.5 rounded-full text-[10px]">{subCounts[s]}</span>}
              </button>
            ))}
            <button onClick={addSub} className="whitespace-nowrap px-3 py-2 rounded-xl text-xs font-medium bg-secondary text-muted-foreground hover:bg-accent transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Add Entry Form */}
            {showForm ? (
              <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  {activeSub === 'Ideas' ? '💡 New Idea' : activeSub === 'Meetings' ? '🤝 New Meeting' : '📝 New Log'}
                </p>
                <input type="text" placeholder={activeSub === 'Ideas' ? 'What\'s the idea?' : activeSub === 'Meetings' ? 'Meeting title' : 'What did you work on?'}
                  value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
                <textarea placeholder={activeSub === 'Meetings' ? 'Meeting notes, action items...' : 'Notes (optional)'}
                  value={notes} onChange={e => setNotes(e.target.value)} className={`${inputCls} resize-none min-h-[80px]`} />

                {/* Tag with autocomplete suggestions */}
                <div>
                  <input type="text" placeholder="Tag (project/client)" value={tag} onChange={e => setTag(e.target.value)} className={inputCls} />
                  {tag && allTags.filter(t => t.toLowerCase().includes(tag.toLowerCase()) && t !== tag).length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {allTags.filter(t => t.toLowerCase().includes(tag.toLowerCase()) && t !== tag).slice(0, 4).map(t => (
                        <button key={t} onClick={() => setTag(t)} className="text-[10px] bg-secondary px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground">{t}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority (especially for Ideas) */}
                {activeSub === 'Ideas' && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Priority</p>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map(p => (
                        <button key={p} onClick={() => setPriority(p)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize ${priority === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                          {p === 'high' ? '🔴 ' : p === 'medium' ? '🟡 ' : '🟢 '}{p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Smart task detection for meetings */}
                {activeSub === 'Meetings' && notes && detectTasks(notes).length > 0 && (
                  <div className="bg-accent/10 border border-accent/20 rounded-xl p-3">
                    <p className="text-xs font-semibold text-primary mb-1">🔍 Detected tasks:</p>
                    {detectTasks(notes).map((task, i) => (
                      <p key={i} className="text-xs text-foreground">• {task}</p>
                    ))}
                    <p className="text-[10px] text-muted-foreground mt-1">Save these as separate work logs?</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setShowForm(false)} className={btnSecondary}>Cancel</button>
                  <button onClick={add} className={btnPrimary}>Save</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setShowForm(true)} className="flex-1 bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-primary">
                  <Plus className="w-4 h-4 inline mr-1" />Add {activeSub}
                </button>
                {filtered.length > 0 && (
                  <button onClick={duplicateLast} className="bg-card rounded-2xl p-4 shadow-card text-center text-sm font-semibold text-muted-foreground">
                    <Copy className="w-4 h-4 inline mr-1" />Repeat
                  </button>
                )}
              </div>
            )}

            {/* Entries List */}
            {filtered.sort((a, b) => b.date.localeCompare(a.date)).map(e => (
              <div key={e.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      {e.priority === 'high' && <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />}
                      {e.priority === 'medium' && <span className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />}
                      {e.title}
                    </p>
                    {e.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.notes}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      {e.tag && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{e.tag}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{e.date}</span>
                    </div>
                  </div>
                  <button onClick={() => del(e.id)} className="text-muted-foreground hover:text-destructive ml-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && !showForm && (
              <div className="bg-card rounded-2xl p-6 shadow-card text-center">
                <p className="text-muted-foreground text-sm">No {activeSub.toLowerCase()} entries yet</p>
                <p className="text-muted-foreground text-xs mt-1">Tap + to add your first one</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkCategory;
