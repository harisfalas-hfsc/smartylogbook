import { Note, Expense, WorkoutEntry } from './types';

const KEYS = {
  notes: 'smarty_notes',
  expenses: 'smarty_expenses',
  workouts: 'smarty_workouts',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getNotes(): Note[] { return get(KEYS.notes, []); }
export function saveNotes(notes: Note[]) { set(KEYS.notes, notes); }

export function getExpenses(): Expense[] { return get(KEYS.expenses, []); }
export function saveExpenses(expenses: Expense[]) { set(KEYS.expenses, expenses); }

export function getWorkouts(): WorkoutEntry[] { return get(KEYS.workouts, []); }
export function saveWorkouts(workouts: WorkoutEntry[]) { set(KEYS.workouts, workouts); }
