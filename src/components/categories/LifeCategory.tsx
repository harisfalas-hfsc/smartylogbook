import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Pin, Trash2, Sparkles, Search, X, Filter, StickyNote, CheckSquare, Bell, Paperclip, Clock } from 'lucide-react';
import { Note, NoteType } from '@/lib/types';
import { getNotes, saveNotes } from '@/lib/store';
import { searchNotes, getAllTags } from '@/lib/smartFeatures';
import NoteEditor from '@/components/NoteEditor';

type ViewFilter = 'all' | 'notes' | 'tasks' | 'reminders' | 'pinned';
type QuickCreate = 'note' | 'task' | null;

const LifeCategory = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Note | null>(null);
  const [creating, setCreating] = useState<QuickCreate>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Swipe state
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => setNotes(getNotes().filter(n => n.category === 'life' && !n.archived));

  const filtered = (() => {
    let result = notes;

    // View filter
    if (viewFilter === 'notes') result = result.filter(n => (n.noteType || 'note') === 'note');
    else if (viewFilter === 'tasks') result = result.filter(n => (n.noteType || 'note') === 'task' || n.checklist.length > 0);
    else if (viewFilter === 'reminders') result = result.filter(n => (n.noteType || 'note') === 'reminder' || n.reminderDate);
    else if (viewFilter === 'pinned') result = result.filter(n => n.pinned);

    // Tag filter
    if (tagFilter) result = result.filter(n => n.tags?.includes(tagFilter));

    // Search
    if (searchQuery) result = searchNotes(result, searchQuery);

    // Sort: pinned first, then by date
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  })();

  const allTags = getAllTags(notes);

  const handleSave = (note: Note) => {
    const all = getNotes();
    const idx = all.findIndex(n => n.id === note.id);
    if (idx >= 0) all[idx] = note; else all.push(note);
    saveNotes(all);
    refresh();
    setEditing(null);
    setCreating(null);
  };

  const handleDelete = (id: string) => {
    saveNotes(getNotes().filter(n => n.id !== id));
    refresh();
  };

  const togglePin = (id: string) => {
    const all = getNotes();
    const n = all.find(x => x.id === id);
    if (n) { n.pinned = !n.pinned; saveNotes(all); refresh(); }
  };

  // Swipe handlers
  const handleTouchStart = (id: string, e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    setSwipingId(id);
    setSwipeX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    if (Math.abs(dy) > Math.abs(dx)) return; // vertical scroll
    setSwipeX(dx);
  };

  const handleTouchEnd = () => {
    if (swipingId) {
      if (swipeX > 80) togglePin(swipingId);
      else if (swipeX < -80) handleDelete(swipingId);
    }
    setSwipingId(null);
    setSwipeX(0);
    touchStart.current = null;
  };

  const createNewNote = (type: NoteType): Note => ({
    id: crypto.randomUUID(),
    title: '',
    content: '',
    category: 'life',
    noteType: type,
    pinned: false,
    archived: false,
    color: '',
    checklist: [],
    tags: [],
    linkedNoteIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (creating || editing) {
    const newNote = creating ? createNewNote(creating === 'task' ? 'task' : 'note') : null;
    return (
      <NoteEditor
        note={editing || newNote!}
        onSave={handleSave}
        onCancel={() => { setEditing(null); setCreating(null); }}
      />
    );
  }

  const noteIcon = (note: Note) => {
    if (note.reminderDate) return <Clock className="w-3 h-3 text-warning" />;
    if (note.checklist.length > 0) return <CheckSquare className="w-3 h-3 text-primary" />;
    return null;
  };

  const filters: { key: ViewFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: null },
    { key: 'notes', label: 'Notes', icon: <StickyNote className="w-3 h-3" /> },
    { key: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3 h-3" /> },
    { key: 'reminders', label: 'Reminders', icon: <Bell className="w-3 h-3" /> },
    { key: 'pinned', label: 'Pinned', icon: <Pin className="w-3 h-3" /> },
  ];

  // Smart daily prompt
  const today = new Date().toISOString().slice(0, 10);
  const todayNotes = notes.filter(n => n.createdAt.startsWith(today));
  const incompleteTasks = notes.filter(n => n.checklist.length > 0 && n.checklist.some(c => !c.checked));

  return (
    <div>
      {/* Search Bar */}
      <div className="relative mb-3">
        <div className="flex items-center gap-2 bg-card rounded-2xl shadow-card p-1">
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes, tags, files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none py-2.5 text-foreground placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}><X className="w-4 h-4 text-muted-foreground" /></button>
            )}
          </div>
        </div>
      </div>

      {/* View Toggle Filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-3 pb-0.5">
        {filters.map(f => (
          <button key={f.key} onClick={() => setViewFilter(f.key)}
            className={`whitespace-nowrap flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              viewFilter === f.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}>
            {f.icon}{f.label}
          </button>
        ))}
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-3 pb-0.5">
          {tagFilter && (
            <button onClick={() => setTagFilter(null)}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-medium bg-destructive/10 text-destructive">
              Clear
            </button>
          )}
          {allTags.map(tag => (
            <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                tagFilter === tag ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
              }`}>
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Smart Daily Prompt */}
      {incompleteTasks.length > 0 && (
        <div className="bg-card rounded-2xl p-3 shadow-card border border-primary/10 mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs text-foreground">
              📝 {incompleteTasks.length} note(s) with unfinished tasks
            </p>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 shadow-card text-center">
          <p className="text-muted-foreground text-sm">
            {searchQuery ? 'No notes found.' : 'Your smart notepad is empty.'}
          </p>
          {!searchQuery && (
            <button onClick={() => setCreating('note')}
              className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
              Create First Note
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(note => (
            <div
              key={note.id}
              className="relative overflow-hidden rounded-2xl"
              onTouchStart={(e) => handleTouchStart(note.id, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Swipe backgrounds */}
              <div className="absolute inset-0 flex">
                <div className="flex-1 bg-primary/20 flex items-center pl-4">
                  <Pin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 bg-destructive/20 flex items-center justify-end pr-4">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
              </div>

              <div
                className="relative bg-card rounded-2xl p-4 shadow-card cursor-pointer transition-transform"
                style={{
                  transform: swipingId === note.id ? `translateX(${swipeX}px)` : 'translateX(0)',
                  backgroundColor: note.color || undefined,
                }}
                onClick={() => setEditing(note)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {note.pinned && <Pin className="w-3 h-3 text-primary" />}
                      {noteIcon(note)}
                      <p className="font-semibold text-foreground text-sm truncate">{note.title || 'Untitled'}</p>
                    </div>
                    {note.content && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{note.content}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {note.checklist.length > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <CheckSquare className="w-3 h-3" />
                          {note.checklist.filter(c => c.checked).length}/{note.checklist.length}
                        </span>
                      )}
                      {note.reminderDate && (
                        <span className="text-[10px] text-warning flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />{note.reminderDate}
                        </span>
                      )}
                      {note.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Create FAB */}
      <div className="fixed bottom-20 right-4 z-50">
        {showQuickMenu && (
          <div className="mb-2 bg-card rounded-2xl shadow-elevated p-2 space-y-1 animate-fade-in">
            <button onClick={() => { setCreating('note'); setShowQuickMenu(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary text-left">
              <StickyNote className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Text Note</span>
            </button>
            <button onClick={() => { setCreating('task'); setShowQuickMenu(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary text-left">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Checklist</span>
            </button>
          </div>
        )}
        <button
          onClick={() => setShowQuickMenu(!showQuickMenu)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-fab flex items-center justify-center transition-transform active:scale-95"
        >
          <Plus className={`w-7 h-7 transition-transform ${showQuickMenu ? 'rotate-45' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default LifeCategory;
