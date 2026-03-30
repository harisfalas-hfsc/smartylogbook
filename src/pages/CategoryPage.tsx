import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pin, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CATEGORIES, Note } from '@/lib/types';
import { getNotes, saveNotes } from '@/lib/store';
import NoteEditor from '@/components/NoteEditor';

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const category = CATEGORIES.find(c => c.id === id);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setNotes(getNotes().filter(n => n.category === id && !n.archived));
  }, [id]);

  if (!category) {
    navigate('/');
    return null;
  }

  const handleSave = (note: Note) => {
    const all = getNotes();
    const idx = all.findIndex(n => n.id === note.id);
    if (idx >= 0) all[idx] = note;
    else all.push(note);
    saveNotes(all);
    setNotes(all.filter(n => n.category === id && !n.archived));
    setEditingNote(null);
    setCreating(false);
  };

  const handleDelete = (noteId: string) => {
    const all = getNotes().filter(n => n.id !== noteId);
    saveNotes(all);
    setNotes(all.filter(n => n.category === id && !n.archived));
  };

  const togglePin = (noteId: string) => {
    const all = getNotes();
    const note = all.find(n => n.id === noteId);
    if (note) {
      note.pinned = !note.pinned;
      saveNotes(all);
      setNotes(all.filter(n => n.category === id && !n.archived));
    }
  };

  const newNote: Note = {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    category: id as Note['category'],
    pinned: false,
    archived: false,
    color: '',
    checklist: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (creating || editingNote) {
    return (
      <NoteEditor
        note={editingNote || newNote}
        onSave={handleSave}
        onCancel={() => { setEditingNote(null); setCreating(false); }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{category.label}</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{category.description}</p>

      {notes.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 shadow-card text-center">
          <p className="text-muted-foreground text-sm">No entries yet.</p>
          <button
            onClick={() => setCreating(true)}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
          >
            Create First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <div
              key={note.id}
              className="bg-card rounded-2xl p-4 shadow-card animate-fade-in cursor-pointer"
              onClick={() => setEditingNote(note)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{note.title || 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{note.content}</p>
                  {note.checklist.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✓ {note.checklist.filter(c => c.checked).length}/{note.checklist.length}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(note.id); }}
                    className={`p-1.5 rounded-lg ${note.pinned ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setCreating(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-fab flex items-center justify-center"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
};

export default CategoryPage;
