import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, Plus, X, Bold, List, Palette, Hash, Clock, Sparkles } from 'lucide-react';
import { Note, ChecklistItem, NoteType } from '@/lib/types';
import { detectSmartSuggestions, convertTextToChecklist, extractTags, SmartSuggestion } from '@/lib/smartFeatures';

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onCancel: () => void;
}

const NOTE_COLORS = ['', '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3', '#f3e8ff', '#fed7aa'];

const NoteEditor = ({ note, onSave, onCancel }: NoteEditorProps) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(note.checklist);
  const [newItem, setNewItem] = useState('');
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [newTag, setNewTag] = useState('');
  const [color, setColor] = useState(note.color);
  const [showColors, setShowColors] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [noteType, setNoteType] = useState<NoteType>(note.noteType || 'note');
  const [reminderDate, setReminderDate] = useState(note.reminderDate || '');
  const [reminderTime, setReminderTime] = useState(note.reminderTime || '');
  const [showReminder, setShowReminder] = useState(false);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Smart detection on content change
  useEffect(() => {
    const text = `${title} ${content}`;
    const detected = detectSmartSuggestions(text).filter(s => !dismissedSuggestions.has(s.type));
    setSuggestions(detected);
  }, [title, content, dismissedSuggestions]);

  // Auto-save indicator
  useEffect(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      // Auto-save silently
    }, 2000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [title, content, checklist, tags, color]);

  const handleSave = () => {
    const detectedTags = extractTags(content);
    const allTags = [...new Set([...tags, ...detectedTags])];
    onSave({
      ...note,
      title,
      content,
      checklist,
      tags: allTags,
      color,
      noteType,
      reminderDate: reminderDate || undefined,
      reminderTime: reminderTime || undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  const addChecklistItem = () => {
    if (!newItem.trim()) return;
    setChecklist([...checklist, { id: crypto.randomUUID(), text: newItem.trim(), checked: false }]);
    setNewItem('');
  };

  const toggleItem = (id: string) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const removeItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const addTag = () => {
    const t = newTag.startsWith('#') ? newTag : `#${newTag}`;
    if (t.length > 1 && !tags.includes(t.toLowerCase())) {
      setTags([...tags, t.toLowerCase()]);
    }
    setNewTag('');
  };

  const handleConvertToChecklist = () => {
    const items = convertTextToChecklist(content);
    setChecklist([...checklist, ...items]);
    setContent('');
    setDismissedSuggestions(prev => new Set(prev).add('checklist'));
  };

  const handleSuggestionAction = (suggestion: SmartSuggestion) => {
    if (suggestion.type === 'checklist') {
      handleConvertToChecklist();
    } else if (suggestion.type === 'reminder') {
      setShowReminder(true);
      setNoteType('reminder');
      setDismissedSuggestions(prev => new Set(prev).add('reminder'));
    } else if (suggestion.type === 'money') {
      setDismissedSuggestions(prev => new Set(prev).add('money'));
      // Could navigate to money category - for now just tag it
      if (!tags.includes('#money')) setTags([...tags, '#money']);
    }
  };

  const dismissSuggestion = (type: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(type));
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto" style={color ? { backgroundColor: color } : undefined}>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-secondary/80 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          {/* Note type selector */}
          <div className="flex bg-secondary/80 rounded-xl p-0.5">
            {(['note', 'task', 'reminder'] as NoteType[]).map(t => (
              <button key={t} onClick={() => setNoteType(t)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-colors ${
                  noteType === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-1">
            <Check className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {suggestions.map(s => (
            <div key={s.type} className="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-xl p-2.5">
              <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <p className="text-xs text-foreground flex-1">💡 {s.message}</p>
              <button onClick={() => handleSuggestionAction(s)}
                className="px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-[10px] font-medium whitespace-nowrap">
                {s.action}
              </button>
              <button onClick={() => dismissSuggestion(s.type)} className="text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 mb-1 text-foreground"
      />

      {/* Tags display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-[10px] font-medium">
              {tag}
              <button onClick={() => setTags(tags.filter(t => t !== tag))}><X className="w-2.5 h-2.5" /></button>
            </span>
          ))}
        </div>
      )}

      {/* Reminder UI */}
      {(showReminder || noteType === 'reminder') && (
        <div className="flex gap-2 mb-3">
          <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)}
            className="flex-1 bg-secondary/80 rounded-xl p-2.5 text-xs outline-none text-foreground" />
          <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)}
            className="flex-1 bg-secondary/80 rounded-xl p-2.5 text-xs outline-none text-foreground" />
        </div>
      )}

      {/* Content */}
      <textarea
        ref={contentRef}
        placeholder="Write something..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full min-h-[150px] bg-transparent border-none outline-none resize-none text-sm placeholder:text-muted-foreground/40 text-foreground leading-relaxed"
      />

      {/* Checklist */}
      {(checklist.length > 0 || noteType === 'task') && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            Checklist {checklist.length > 0 && `(${checklist.filter(c => c.checked).length}/${checklist.length})`}
          </p>
          <div className="space-y-1.5">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-card/80 rounded-xl p-3 shadow-sm">
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
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
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
              className="flex-1 bg-card/80 rounded-xl p-3 text-sm border-none outline-none shadow-sm placeholder:text-muted-foreground/40 text-foreground"
            />
            <button onClick={addChecklistItem} className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Toolbar */}
      <div className="fixed bottom-20 left-0 right-0 z-40">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-elevated p-2 flex items-center gap-1">
            <button onClick={() => { if (checklist.length === 0 && noteType !== 'task') setNoteType('task'); }}
              className="p-2 rounded-xl text-muted-foreground hover:bg-secondary"><List className="w-5 h-5" /></button>
            <button onClick={() => setShowColors(!showColors)}
              className="p-2 rounded-xl text-muted-foreground hover:bg-secondary"><Palette className="w-5 h-5" /></button>
            <button onClick={() => setShowTags(!showTags)}
              className="p-2 rounded-xl text-muted-foreground hover:bg-secondary"><Hash className="w-5 h-5" /></button>
            <button onClick={() => { setShowReminder(!showReminder); if (!showReminder) setNoteType('reminder'); }}
              className="p-2 rounded-xl text-muted-foreground hover:bg-secondary"><Clock className="w-5 h-5" /></button>
          </div>

          {/* Color picker */}
          {showColors && (
            <div className="bg-card rounded-2xl shadow-elevated p-3 mt-1 flex gap-2">
              {NOTE_COLORS.map(c => (
                <button key={c || 'none'} onClick={() => { setColor(c); setShowColors(false); }}
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-primary' : 'border-transparent'}`}
                  style={{ backgroundColor: c || 'hsl(var(--background))' }} />
              ))}
            </div>
          )}

          {/* Tag input */}
          {showTags && (
            <div className="bg-card rounded-2xl shadow-elevated p-3 mt-1 flex gap-2">
              <input type="text" placeholder="#tag" value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                className="flex-1 bg-secondary rounded-xl p-2.5 text-xs outline-none text-foreground" />
              <button onClick={addTag} className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium">Add</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
