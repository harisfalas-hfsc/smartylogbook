import { useState, useEffect } from 'react';
import { Plus, Pin, Trash2, Sparkles } from 'lucide-react';
import { Note } from '@/lib/types';
import { getNotes, saveNotes } from '@/lib/store';
import NoteEditor from '@/components/NoteEditor';

const LifeCategory = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setNotes(getNotes().filter(n => n.category === 'life' && !n.archived));
  }, []);

  const refresh = () => setNotes(getNotes().filter(n => n.category === 'life' && !n.archived));

  const handleSave = (note: Note) => {
    const all = getNotes();
    const idx = all.findIndex(n => n.id === note.id);
    if (idx >= 0) all[idx] = note; else all.push(note);
    saveNotes(all);
    refresh();
    setEditing(null);
    setCreating(false);
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

  // Smart detection
  const getSmartSuggestion = (note: Note): string | null => {
    const text = (note.title + ' ' + note.content).toLowerCase();
    if (/\$\d+|\€\d+|pay|bill|cost|price/.test(text)) return '💡 Mentions money — add to Money category?';
    if (/\d{1,2}[:/]\d{2}|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday/.test(text)) return '⏰ Contains a time/date — set a reminder?';
    return null;
  };

  const newNote: Note = {
    id: crypto.randomUUID(), title: '', content: '', category: 'life',
    pinned: false, archived: false, color: '', checklist: [], linkedNoteIds: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };

  if (creating || editing) {
    return <NoteEditor note={editing || newNote} onSave={handleSave} onCancel={() => { setEditing(null); setCreating(false); }} />;
  }

  return (
    <div>
      {notes.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 shadow-card text-center">
          <p className="text-muted-foreground text-sm">Your smart notepad is empty.</p>
          <button onClick={() => setCreating(true)} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
            Create First Note
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map(note => {
            const suggestion = getSmartSuggestion(note);
            return (
              <div key={note.id} className="bg-card rounded-2xl p-4 shadow-card animate-fade-in cursor-pointer" onClick={() => setEditing(note)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{note.title || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                    {note.checklist.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">✓ {note.checklist.filter(c => c.checked).length}/{note.checklist.length}</p>
                    )}
                    {suggestion && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                        <Sparkles className="w-3 h-3" />{suggestion}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={(e) => { e.stopPropagation(); togglePin(note.id); }} className={`p-1.5 rounded-lg ${note.pinned ? 'text-primary' : 'text-muted-foreground'}`}>
                      <Pin className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button onClick={() => setCreating(true)} className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-fab flex items-center justify-center">
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};

export default LifeCategory;
