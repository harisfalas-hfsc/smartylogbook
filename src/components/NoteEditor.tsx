import { useState } from 'react';
import { ArrowLeft, Check, Plus, X } from 'lucide-react';
import { Note, ChecklistItem } from '@/lib/types';

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onCancel: () => void;
}

const NoteEditor = ({ note, onSave, onCancel }: NoteEditorProps) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(note.checklist);
  const [newItem, setNewItem] = useState('');

  const handleSave = () => {
    onSave({
      ...note,
      title,
      content,
      checklist,
      updatedAt: new Date().toISOString(),
    });
  };

  const addChecklistItem = () => {
    if (!newItem.trim()) return;
    setChecklist([...checklist, { id: crypto.randomUUID(), text: newItem.trim(), checked: false }]);
    setNewItem('');
  };

  const toggleItem = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const removeItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-1"
        >
          <Check className="w-4 h-4" /> Save
        </button>
      </div>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-4 text-foreground"
      />

      <textarea
        placeholder="Write something..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full min-h-[120px] bg-transparent border-none outline-none resize-none text-sm placeholder:text-muted-foreground/50 text-foreground leading-relaxed"
      />

      <div className="mt-6">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Checklist</p>
        <div className="space-y-2">
          {checklist.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-card">
              <button onClick={() => toggleItem(item.id)}>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  item.checked ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                }`}>
                  {item.checked && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
              </button>
              <span className={`flex-1 text-sm ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {item.text}
              </span>
              <button onClick={() => removeItem(item.id)} className="text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Add item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
            className="flex-1 bg-card rounded-xl p-3 text-sm border-none outline-none shadow-card placeholder:text-muted-foreground/50 text-foreground"
          />
          <button
            onClick={addChecklistItem}
            className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
