import { MODULES } from '@/lib/constants';

export interface ParsedQuery {
  range: 'today' | 'week' | 'month' | 'year' | 'all' | null;
  module: string | null;
  keywords: string;
  matched: boolean;
}

const RANGE_PATTERNS: { re: RegExp; range: ParsedQuery['range'] }[] = [
  { re: /\b(today|to ?day|this morning|tonight)\b/i, range: 'today' },
  { re: /\b(this week|last week|past week|7 days|week)\b/i, range: 'week' },
  { re: /\b(this month|last month|past month|30 days|month)\b/i, range: 'month' },
  { re: /\b(this year|last year|past year|12 months|year)\b/i, range: 'year' },
  { re: /\b(ever|all time|everything|always)\b/i, range: 'all' },
];

const MODULE_WORDS: Record<string, string[]> = {
  health: ['health', 'medical', 'doctor', 'symptom', 'blood', 'medication', 'clinic'],
  fitness: ['fitness', 'workout', 'training', 'gym', 'run', 'session', 'exercise'],
  nutrition: ['nutrition', 'meal', 'food', 'ate', 'eat', 'diet', 'water', 'calories'],
  finance: ['finance', 'money', 'spend', 'spent', 'expense', 'expenses', 'bill', 'bills', 'receipt', 'paid', 'cost'],
  business: ['business', 'work', 'client', 'meeting', 'project', 'invoice'],
  documents: ['document', 'documents', 'file', 'files', 'passport', 'insurance', 'contract'],
  personal: ['personal', 'journal', 'idea', 'ideas', 'travel', 'mood', 'book', 'movie'],
};

const STOP_WORDS = new Set([
  'show', 'me', 'my', 'the', 'a', 'an', 'all', 'of', 'from', 'in', 'on', 'for',
  'what', 'did', 'i', 'was', 'were', 'have', 'has', 'find', 'list', 'give',
  'please', 'about', 'and', 'to', 'with', 'any', 'this', 'last', 'past',
  'today', 'week', 'month', 'year', 'days', 'everything', 'ever',
]);

/** Turns "show me my expenses last month" into concrete timeline filters. */
export const parsePlainLanguage = (input: string): ParsedQuery => {
  const q = input.trim();
  if (!q) return { range: null, module: null, keywords: '', matched: false };

  let range: ParsedQuery['range'] = null;
  for (const p of RANGE_PATTERNS) {
    if (p.re.test(q)) {
      range = p.range;
      break;
    }
  }

  let module: string | null = null;
  const lower = q.toLowerCase();
  for (const m of MODULES) {
    const words = MODULE_WORDS[m.id] ?? [m.id];
    if (words.some((w) => new RegExp(`\\b${w}\\b`, 'i').test(lower))) {
      module = m.id;
      break;
    }
  }

  const keywords = lower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w) && !Object.values(MODULE_WORDS).flat().includes(w))
    .join(' ');

  return { range, module, keywords, matched: Boolean(range || module || keywords) };
};

export const describeQuery = (p: ParsedQuery) => {
  const bits: string[] = [];
  if (p.module) bits.push(MODULES.find((m) => m.id === p.module)?.label ?? p.module);
  if (p.keywords) bits.push(`“${p.keywords}”`);
  if (p.range && p.range !== 'all') bits.push(p.range === 'today' ? 'today' : `this ${p.range}`);
  return bits.length ? `Showing ${bits.join(' · ')}` : 'Showing everything';
};
