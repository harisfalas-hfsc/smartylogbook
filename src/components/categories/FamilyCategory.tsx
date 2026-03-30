import { useMemo, useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, Star, Sparkles, CalendarDays, CheckCircle2, Users, NotebookPen, Repeat, Clock3, UserRound, Pencil } from 'lucide-react';
import { FamilyEvent } from '@/lib/types';
import { getFamilyEvents, saveFamilyEvents } from '@/lib/store';

const DEFAULT_TABS = ['Events', 'Tasks', 'Notes', 'People'];

type RepeatType = 'none' | 'yearly' | 'monthly' | 'weekly' | 'custom';

type AssignedTo = 'me' | 'partner' | 'kid';

const FamilyCategory = () => {
  const [entries, setEntries] = useState<FamilyEvent[]>([]);
  const [tabs, setTabs] = useState<string[]>(() => {
    const saved = localStorage.getItem('smarty_family_tabs');
    return saved ? JSON.parse(saved) : DEFAULT_TABS;
  });
  const [activeTab, setActiveTab] = useState(DEFAULT_TABS[0]);
  const [showForm, setShowForm] = useState(false);

  // Shared form
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  // Event form
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventTime, setEventTime] = useState('');
  const [importance, setImportance] = useState<'normal' | 'important' | 'critical'>('important');
  const [repeat, setRepeat] = useState<RepeatType>('none');

  // Task form
  const [assignedTo, setAssignedTo] = useState<AssignedTo>('me');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().slice(0, 10));

  // Person form
  const [relationship, setRelationship] = useState('');
  const [birthday, setBirthday] = useState('');
  const [anniversary, setAnniversary] = useState('');

  useEffect(() => {
    const raw = getFamilyEvents();

    // Backward-compatible normalization for older entries
    const normalized = raw.map((entry) => ({
      ...entry,
      type: entry.type ?? (entry.subcategory === 'Tasks' ? 'task' : entry.subcategory === 'Notes' ? 'note' : entry.subcategory === 'People' ? 'person' : 'event'),
      createdAt: entry.createdAt ?? `${entry.date}T00:00:00.000Z`,
    }));

    setEntries(normalized);
  }, []);

  const today = new Date();
  const todayStr = new Date().toISOString().slice(0, 10);

  const visibleEntries = entries
    .filter((e) => e.subcategory === activeTab)
    .sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));

  const allTimeline = entries
    .slice()
    .sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));

  const upcoming = useMemo(() => {
    const scored = entries
      .filter((e) => (e.type === 'event' || e.type === 'task') && e.date >= todayStr && !(e.type === 'task' && e.completed))
      .map((e) => {
        const d = new Date(`${e.date}T00:00:00`);
        const days = Math.max(0, Math.floor((d.getTime() - new Date(todayStr).getTime()) / 86400000));
        const importanceScore = e.importance === 'critical' ? 3 : e.importance === 'important' ? 2 : 1;
        return { e, days, score: importanceScore * 100 - days };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    // Event clustering by date
    const grouped: Record<string, FamilyEvent[]> = {};
    scored.forEach(({ e }) => {
      grouped[e.date] = grouped[e.date] || [];
      grouped[e.date].push(e);
    });

    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, items]) => ({ date, items }));
  }, [entries, todayStr]);

  const weekly = useMemo(() => {
    const start = new Date();
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    const startStr = start.toISOString().slice(0, 10);

    const eventsWeek = entries.filter((e) => e.type === 'event' && e.date >= startStr).length;
    const tasksWeek = entries.filter((e) => e.type === 'task' && e.date >= startStr);
    const tasksCompleted = tasksWeek.filter((t) => t.completed).length;
    const tasksMissed = tasksWeek.filter((t) => !t.completed && t.date < todayStr).length;
    const completionRate = tasksWeek.length ? Math.round((tasksCompleted / tasksWeek.length) * 100) : 0;

    return { eventsWeek, tasksCompleted, tasksMissed, completionRate };
  }, [entries, todayStr]);

  const insights = useMemo(() => {
    const tips: string[] = [];
    const criticalSoon = entries.filter((e) => (e.type === 'event' || e.type === 'task') && e.importance === 'critical' && e.date >= todayStr).length;
    const pending = entries.filter((e) => e.type === 'task' && !e.completed).length;
    const yearly = entries.filter((e) => e.type === 'event' && e.repeat === 'yearly').length;

    if (criticalSoon > 0) tips.push(`🚨 ${criticalSoon} critical item${criticalSoon > 1 ? 's' : ''} need stronger reminders`);
    if (pending > 0) tips.push(`⏳ ${pending} family task${pending > 1 ? 's are' : ' is'} still pending`);
    if (yearly > 0) tips.push(`🎂 ${yearly} yearly event${yearly > 1 ? 's are' : ' is'} remembered automatically`);
    if (weekly.completionRate > 0) tips.push(`✅ Reminder effectiveness: ${weekly.completionRate}% tasks completed this week`);

    return tips;
  }, [entries, todayStr, weekly.completionRate]);

  const resetForm = () => {
    setTitle('');
    setNotes('');
    setEventTime('');
    setRepeat('none');
    setRelationship('');
    setBirthday('');
    setAnniversary('');
    setShowForm(false);
  };

  const getTypeForTab = (tab: string): FamilyEvent['type'] => {
    if (tab === 'Tasks') return 'task';
    if (tab === 'Notes') return 'note';
    if (tab === 'People') return 'person';
    return 'event';
  };

  const saveAll = (updated: FamilyEvent[]) => {
    saveFamilyEvents(updated);
    setEntries(updated);
  };

  const addEntry = () => {
    if (!title.trim()) return;

    const type = getTypeForTab(activeTab);
    const now = new Date().toISOString();

    const entry: FamilyEvent = {
      id: crypto.randomUUID(),
      type,
      subcategory: activeTab,
      title: title.trim(),
      notes: notes.trim(),
      date: type === 'task' ? taskDueDate : type === 'person' ? birthday || todayStr : eventDate,
      time: type === 'event' ? eventTime || undefined : undefined,
      importance: type === 'note' ? 'normal' : importance,
      recurring: repeat !== 'none',
      repeat: type === 'event' ? repeat : 'none',
      assignedTo: type === 'task' ? assignedTo : undefined,
      completed: type === 'task' ? false : undefined,
      relationship: type === 'person' ? relationship : undefined,
      birthday: type === 'person' ? birthday || undefined : undefined,
      anniversary: type === 'person' ? anniversary || undefined : undefined,
      createdAt: now,
    };

    saveAll([...entries, entry]);
    resetForm();
  };

  const deleteEntry = (id: string) => {
    saveAll(entries.filter((e) => e.id !== id));
  };

  const toggleTask = (id: string) => {
    const updated = entries.map((e) => (e.id === id && e.type === 'task' ? { ...e, completed: !e.completed } : e));
    saveAll(updated);
  };

  const duplicateLastEvent = () => {
    const last = visibleEntries.find((e) => e.type === 'event');
    if (!last) return;
    const copy: FamilyEvent = {
      ...last,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      date: todayStr,
    };
    saveAll([...entries, copy]);
  };

  const addTab = () => {
    const name = prompt('New tab name (e.g. Travel, School):');
    if (!name?.trim()) return;
    const clean = name.trim();
    if (tabs.includes(clean)) return;
    const updated = [...tabs, clean];
    setTabs(updated);
    localStorage.setItem('smarty_family_tabs', JSON.stringify(updated));
    setActiveTab(clean);
  };

  const renameTab = () => {
    if (DEFAULT_TABS.includes(activeTab)) return;
    const name = prompt('Rename tab:', activeTab);
    if (!name?.trim()) return;
    const clean = name.trim();
    if (tabs.includes(clean)) return;

    const updatedTabs = tabs.map((t) => (t === activeTab ? clean : t));
    const updatedEntries = entries.map((e) => (e.subcategory === activeTab ? { ...e, subcategory: clean } : e));

    setTabs(updatedTabs);
    localStorage.setItem('smarty_family_tabs', JSON.stringify(updatedTabs));
    saveAll(updatedEntries);
    setActiveTab(clean);
  };

  const deleteTab = () => {
    if (DEFAULT_TABS.includes(activeTab)) return;
    if (!confirm(`Delete tab "${activeTab}" and all its entries?`)) return;

    const updatedTabs = tabs.filter((t) => t !== activeTab);
    const updatedEntries = entries.filter((e) => e.subcategory !== activeTab);

    setTabs(updatedTabs);
    localStorage.setItem('smarty_family_tabs', JSON.stringify(updatedTabs));
    saveAll(updatedEntries);
    setActiveTab(DEFAULT_TABS[0]);
  };

  const formatUrgency = (date: string) => {
    const d = new Date(`${date}T00:00:00`);
    const diff = Math.floor((d.getTime() - new Date(todayStr).getTime()) / 86400000);
    if (diff <= 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  const importanceIcon = (level: FamilyEvent['importance']) => {
    if (level === 'critical') return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    if (level === 'important') return <Star className="h-3.5 w-3.5 text-warning" />;
    return null;
  };

  const typeIcon = (type: FamilyEvent['type']) => {
    if (type === 'task') return <CheckCircle2 className="h-4 w-4" />;
    if (type === 'note') return <NotebookPen className="h-4 w-4" />;
    if (type === 'person') return <UserRound className="h-4 w-4" />;
    return <CalendarDays className="h-4 w-4" />;
  };

  const inputCls = 'w-full rounded-xl bg-secondary p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground';
  const primaryBtn = 'flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground';
  const secondaryBtn = 'flex-1 rounded-xl bg-secondary py-2.5 text-sm font-medium text-foreground';

  return (
    <div>
      {/* Top Heart Section */}
      <div className="mb-4 rounded-2xl border border-warning/20 bg-card p-3 shadow-card">
        <p className="mb-1.5 text-xs font-semibold text-warning">Upcoming important things</p>
        {upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground">No urgent family items yet.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((group) => (
              <div key={group.date} className="rounded-xl bg-secondary p-2.5">
                <p className="mb-1 text-[11px] font-semibold text-foreground">{formatUrgency(group.date)} · {group.date}</p>
                {group.items.map((item) => (
                  <p key={item.id} className="text-xs text-muted-foreground">
                    • {item.title} {item.type === 'person' ? '👤' : item.type === 'event' ? '🎉' : '✅'}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          { tab: 'Events', label: 'Event', icon: '📅' },
          { tab: 'Tasks', label: 'Task', icon: '✅' },
          { tab: 'Notes', label: 'Note', icon: '📝' },
          { tab: 'People', label: 'Person', icon: '👤' },
        ].map((q) => (
          <button
            key={q.tab}
            onClick={() => {
              setActiveTab(q.tab);
              setShowForm(true);
            }}
            className="rounded-2xl bg-card p-3 text-center shadow-card transition-colors hover:bg-secondary"
          >
            <p className="text-base">{q.icon}</p>
            <p className="mt-1 text-[11px] font-medium text-foreground">{q.label}</p>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setShowForm(false);
            }}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
        <button onClick={addTab} className="whitespace-nowrap rounded-xl bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {!DEFAULT_TABS.includes(activeTab) && (
        <div className="mb-4 flex gap-2">
          <button onClick={renameTab} className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] text-foreground">
            <Pencil className="h-3 w-3" /> Rename tab
          </button>
          <button onClick={deleteTab} className="rounded-lg bg-secondary px-2.5 py-1.5 text-[11px] text-destructive">
            Delete tab
          </button>
        </div>
      )}

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="mb-4 rounded-2xl border border-primary/10 bg-card p-3 shadow-card">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Family Organizer</span>
          </div>
          {insights.slice(0, 4).map((tip, i) => (
            <p key={i} className="text-xs text-foreground">{tip}</p>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="space-y-3">
        {showForm ? (
          <div className="rounded-2xl bg-card p-4 shadow-card space-y-3">
            <p className="text-sm font-semibold text-foreground">Add {activeTab.slice(0, -1) || activeTab}</p>
            <input
              type="text"
              placeholder={activeTab === 'People' ? 'Name' : activeTab === 'Tasks' ? 'Task name' : activeTab === 'Notes' ? 'Note title' : 'Event title'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />

            {(activeTab === 'Events' || activeTab === 'Tasks' || !DEFAULT_TABS.includes(activeTab)) && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={activeTab === 'Tasks' ? taskDueDate : eventDate}
                  onChange={(e) => (activeTab === 'Tasks' ? setTaskDueDate(e.target.value) : setEventDate(e.target.value))}
                  className={inputCls}
                />
                {activeTab === 'Events' ? (
                  <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className={inputCls} />
                ) : (
                  <input type="text" placeholder="Optional note" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
                )}
              </div>
            )}

            {activeTab === 'People' && (
              <div className="space-y-2">
                <input type="text" placeholder="Relationship (Partner, Child, Parent...)" value={relationship} onChange={(e) => setRelationship(e.target.value)} className={inputCls} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-[10px] text-muted-foreground">Birthday</p>
                    <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] text-muted-foreground">Anniversary</p>
                    <input type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Tasks' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Assign to</p>
                <div className="flex gap-2">
                  {(['me', 'partner', 'kid'] as const).map((person) => (
                    <button
                      key={person}
                      onClick={() => setAssignedTo(person)}
                      className={`flex-1 rounded-xl py-2 text-xs font-medium capitalize ${assignedTo === person ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {person}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(activeTab === 'Events' || activeTab === 'Tasks' || activeTab === 'People') && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Importance</p>
                <div className="flex gap-2">
                  {(['normal', 'important', 'critical'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setImportance(level)}
                      className={`flex-1 rounded-xl py-2 text-xs font-medium capitalize ${importance === level ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Events' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Repeat</p>
                <div className="flex flex-wrap gap-2">
                  {(['none', 'yearly', 'monthly', 'weekly'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRepeat(r)}
                      className={`rounded-xl px-3 py-2 text-xs font-medium capitalize ${repeat === r ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab !== 'People' && (
              <textarea
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${inputCls} min-h-[72px] resize-none`}
              />
            )}

            <div className="flex gap-2">
              <button onClick={resetForm} className={secondaryBtn}>Cancel</button>
              <button onClick={addEntry} className={primaryBtn}>Save</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setShowForm(true)} className="flex-1 rounded-2xl bg-card p-4 text-center text-sm font-medium text-primary shadow-card">
              + Add {activeTab.slice(0, -1) || activeTab}
            </button>
            {activeTab === 'Events' && visibleEntries.some((e) => e.type === 'event') && (
              <button onClick={duplicateLastEvent} className="rounded-2xl bg-card p-4 text-center text-sm font-medium text-muted-foreground shadow-card">
                Duplicate
              </button>
            )}
          </div>
        )}

        {/* Weekly mini insights */}
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <p className="mb-2 text-xs font-semibold text-foreground">Weekly overview</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p className="text-muted-foreground">Events this week: <span className="font-semibold text-foreground">{weekly.eventsWeek}</span></p>
            <p className="text-muted-foreground">Tasks completed: <span className="font-semibold text-foreground">{weekly.tasksCompleted}</span></p>
            <p className="text-muted-foreground">Tasks missed: <span className="font-semibold text-foreground">{weekly.tasksMissed}</span></p>
            <p className="text-muted-foreground">Effectiveness: <span className="font-semibold text-foreground">{weekly.completionRate}%</span></p>
          </div>
        </div>

        {/* Main feed (filtered by tab) */}
        {visibleEntries.map((entry) => (
          <div key={entry.id} className="rounded-2xl bg-card p-4 shadow-card animate-fade-in">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {importanceIcon(entry.importance)}
                  {typeIcon(entry.type)}
                  {entry.title}
                </p>

                {entry.notes && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{entry.notes}</p>}

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{entry.date}</span>
                  {entry.time && <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" />{entry.time}</span>}
                  {entry.repeat && entry.repeat !== 'none' && <span className="flex items-center gap-1"><Repeat className="h-3 w-3" />{entry.repeat}</span>}
                  {entry.assignedTo && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{entry.assignedTo}</span>}
                  {entry.relationship && <span>{entry.relationship}</span>}
                  {entry.completed && <span className="text-primary">Completed</span>}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {entry.type === 'task' && (
                  <button
                    onClick={() => toggleTask(entry.id)}
                    className={`rounded-lg px-2 py-1 text-[10px] font-medium ${entry.completed ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
                  >
                    {entry.completed ? 'Done' : 'Pending'}
                  </button>
                )}
                <button onClick={() => deleteEntry(entry.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {visibleEntries.length === 0 && !showForm && (
          <div className="rounded-2xl bg-card p-6 text-center shadow-card">
            <p className="text-sm text-muted-foreground">No {activeTab.toLowerCase()} yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Add one to reduce family mental load.</p>
          </div>
        )}

        {/* Unified timeline preview */}
        {allTimeline.length > 0 && (
          <div className="rounded-2xl bg-card p-4 shadow-card">
            <p className="mb-2 text-xs font-semibold text-foreground">Unified timeline</p>
            <div className="space-y-1.5">
              {allTimeline.slice(0, 6).map((item) => (
                <p key={item.id} className="text-xs text-muted-foreground">
                  • {item.title} <span className="text-foreground">({item.subcategory})</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyCategory;
