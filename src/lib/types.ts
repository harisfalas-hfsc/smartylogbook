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

export interface Note {
  id: string;
  title: string;
  content: string;
  category: Category;
  pinned: boolean;
  archived: boolean;
  color: string;
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
}

export interface WorkoutEntry {
  id: string;
  type: string;
  duration: number;
  notes: string;
  date: string;
}
