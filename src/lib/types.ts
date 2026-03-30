export type Category = 
  | 'life'
  | 'work'
  | 'health'
  | 'family'
  | 'money'
  | 'growth';

export interface CategoryInfo {
  id: Category;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'life', label: 'Life', icon: 'BookOpen', color: 'bg-primary', description: 'Notes, lists & reminders' },
  { id: 'work', label: 'Work & Productivity', icon: 'Briefcase', color: 'bg-accent', description: 'Work log, ideas & meetings' },
  { id: 'health', label: 'Health & Fitness', icon: 'Heart', color: 'bg-success', description: 'Workouts, sleep & tracking' },
  { id: 'family', label: 'Family & Personal', icon: 'Users', color: 'bg-warning', description: 'Events, dates & family' },
  { id: 'money', label: 'Money', icon: 'DollarSign', color: 'bg-info', description: 'Expenses, income & savings' },
  { id: 'growth', label: 'Personal Growth', icon: 'TrendingUp', color: 'bg-primary', description: 'Goals, habits & reflection' },
];

// ===== LIFE =====
export type NoteType = 'note' | 'task' | 'reminder';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: Category;
  noteType: NoteType;
  pinned: boolean;
  archived: boolean;
  color: string;
  checklist: ChecklistItem[];
  tags: string[];
  linkedNoteIds: string[];
  reminderDate?: string;
  reminderTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

// ===== MONEY =====
export interface MoneyEntry {
  id: string;
  type: 'expense' | 'income' | 'bill' | 'savings-deposit' | 'savings-withdraw' | 'transfer';
  amount: number;
  categoryTag: string;
  note: string;
  date: string;
  paymentMethod?: 'cash' | 'card' | 'other';
  recurring?: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'yearly';
  billDueDate?: string;
  billPaid?: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt: string;
}

// ===== HEALTH =====
export const WORKOUT_TYPES = ['Strength', 'Cardio', 'Running', 'HIIT', 'Walking', 'Yoga', 'Swimming'] as const;

export interface WorkoutEntry {
  id: string;
  type: string;
  duration: number;
  intensity?: 'low' | 'medium' | 'high';
  notes: string;
  date: string;
}

export interface WeightEntry {
  id: string;
  value: number;
  date: string;
}

export interface SleepEntry {
  id: string;
  rating: number; // 1-5
  hours?: number;
  notes?: string;
  date: string;
}

export interface ReadinessEntry {
  id: string;
  energy: number; // 1-5
  sleepQuality: number; // 1-5
  stress: number; // 1-5
  score: number; // calculated 1-10
  date: string;
}

export interface CustomHealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  date: string;
}

export interface ActivityEntry {
  id: string;
  type: 'walking' | 'steps' | 'general';
  value: number;
  notes: string;
  date: string;
}

// ===== WORK =====
export interface WorkEntry {
  id: string;
  subcategory: string;
  title: string;
  notes: string;
  tag: string;
  priority?: 'low' | 'medium' | 'high';
  date: string;
}

// ===== FAMILY =====
export interface FamilyEvent {
  id: string;
  subcategory: string;
  title: string;
  notes: string;
  date: string;
  importance: 'normal' | 'important' | 'critical';
  recurring?: boolean;
}

// ===== GROWTH =====
export interface MoodEntry {
  id: string;
  value: number; // 1-10
  note: string;
  date: string;
}

export interface GoalEntry {
  id: string;
  title: string;
  targetSteps: string[];
  completedSteps: boolean[];
  createdAt: string;
}

export interface HabitEntry {
  id: string;
  name: string;
  dates: string[]; // dates completed (YYYY-MM-DD)
}

export interface ReflectionEntry {
  id: string;
  text: string;
  date: string;
}

// ===== Expense Categories =====
export const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Education', 'Fuel', 'Rent', 'Other'
] as const;
