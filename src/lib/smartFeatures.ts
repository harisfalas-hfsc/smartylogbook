import { Note, ChecklistItem, Category } from './types';

// ===== Note Type Detection =====

export interface SmartSuggestion {
  type: 'money' | 'reminder' | 'checklist' | 'task';
  message: string;
  action: string;
}

export function detectSmartSuggestions(text: string): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];
  const lower = text.toLowerCase();

  // Money detection
  if (/[\$€£]\s?\d+|\d+\s?(dollars|euros|usd|eur)|\bpay\b.*\d+|\bcost\b.*\d+|\bprice\b|\bbill\b.*\d+|\brent\b.*\d+/i.test(text)) {
    suggestions.push({
      type: 'money',
      message: 'Mentions money — add to Money category?',
      action: 'Add to Money',
    });
  }

  // Reminder / date detection
  if (/\b(tomorrow|tonight|next\s+(week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i.test(text) ||
      /\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/.test(text) ||
      /\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/i.test(text)) {
    suggestions.push({
      type: 'reminder',
      message: 'Contains a date/time — set a reminder?',
      action: 'Set Reminder',
    });
  }

  // Checklist detection (multiple lines starting with - or *)
  const lines = text.split('\n').filter(l => l.trim());
  const listLines = lines.filter(l => /^\s*[-*•]\s/.test(l) || /^\s*\d+[.)]\s/.test(l));
  if (listLines.length >= 2) {
    suggestions.push({
      type: 'checklist',
      message: 'Looks like a list — convert to checklist?',
      action: 'Convert to Checklist',
    });
  }

  return suggestions;
}

export function convertTextToChecklist(text: string): ChecklistItem[] {
  return text
    .split('\n')
    .filter(l => l.trim())
    .map(line => ({
      id: crypto.randomUUID(),
      text: line.replace(/^\s*[-*•]\s*/, '').replace(/^\s*\d+[.)]\s*/, '').trim(),
      checked: false,
    }))
    .filter(item => item.text.length > 0);
}

// ===== Search =====
export function searchNotes(notes: Note[], query: string): Note[] {
  if (!query.trim()) return notes;
  const q = query.toLowerCase();
  return notes.filter(n =>
    n.title.toLowerCase().includes(q) ||
    n.content.toLowerCase().includes(q) ||
    n.tags?.some(t => t.toLowerCase().includes(q)) ||
    n.checklist.some(c => c.text.toLowerCase().includes(q))
  );
}

// ===== Tags =====
export function extractTags(text: string): string[] {
  const matches = text.match(/#\w+/g);
  return matches ? [...new Set(matches.map(t => t.toLowerCase()))] : [];
}

export function getAllTags(notes: Note[]): string[] {
  const tags = new Set<string>();
  notes.forEach(n => n.tags?.forEach(t => tags.add(t)));
  return [...tags].sort();
}
