import {
  Activity, Apple, Brain, Briefcase, Camera, CreditCard, Dumbbell, FileText,
  Heart, Home, Image, Lightbulb, MapPin, Mic, NotebookPen, Receipt, Search,
  Smile, Sparkles, Timer, Utensils, Wallet, CheckSquare, Bell, Stethoscope,
  User, Settings, BarChart3, Clock, Plus, CalendarClock, Inbox,
} from 'lucide-react';

export type ModuleId =
  | 'health' | 'fitness' | 'nutrition' | 'finance' | 'business' | 'documents' | 'personal';

export interface ModuleInfo {
  id: ModuleId;
  label: string;
  icon: typeof Heart;
  color: string;
  tint: string;
  description: string;
  topics: string[];
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'health', label: 'Health', icon: Stethoscope, color: 'text-mod-health', tint: 'bg-mod-health/10',
    description: 'Medical history, reports & symptoms',
    topics: ['Medical history', 'Blood tests', 'Medication', 'Appointments', 'Symptoms', 'Vaccinations', 'Reports'],
  },
  {
    id: 'fitness', label: 'Fitness', icon: Dumbbell, color: 'text-mod-fitness', tint: 'bg-mod-fitness/10',
    description: 'Training, records & recovery',
    topics: ['Workout history', 'Personal records', 'Body measurements', 'Recovery', 'Heart rate', 'Calories'],
  },
  {
    id: 'nutrition', label: 'Nutrition', icon: Utensils, color: 'text-mod-nutrition', tint: 'bg-mod-nutrition/10',
    description: 'Meals, macros & hydration',
    topics: ['Meals', 'Macros', 'Water', 'Supplements'],
  },
  {
    id: 'finance', label: 'Finance', icon: Wallet, color: 'text-mod-finance', tint: 'bg-mod-finance/10',
    description: 'Money in, money out, goals',
    topics: ['Income', 'Expenses', 'Subscriptions', 'Receipts', 'Budgets', 'Goals'],
  },
  {
    id: 'business', label: 'Business', icon: Briefcase, color: 'text-mod-business', tint: 'bg-mod-business/10',
    description: 'Clients, meetings & projects',
    topics: ['Clients', 'Meetings', 'Projects', 'Invoices', 'Contracts'],
  },
  {
    id: 'documents', label: 'Documents', icon: FileText, color: 'text-mod-documents', tint: 'bg-mod-documents/10',
    description: 'Everything important, one vault',
    topics: ['Passport', 'Insurance', 'Certificates', 'Photos', 'PDF files', 'Receipts'],
  },
  {
    id: 'personal', label: 'Personal', icon: Heart, color: 'text-mod-personal', tint: 'bg-mod-personal/10',
    description: 'Ideas, journal, travel & more',
    topics: ['Ideas', 'Journal', 'Travel', 'Books', 'Movies', 'Important dates', 'Wishlist'],
  },
];

export const getModule = (id: string): ModuleInfo =>
  MODULES.find((m) => m.id === id) ?? MODULES[MODULES.length - 1];

export type CaptureKind =
  | 'text' | 'voice' | 'photo' | 'receipt' | 'document' | 'medical' | 'workout'
  | 'meal' | 'expense' | 'task' | 'reminder' | 'idea' | 'journal' | 'mood' | 'location';

export const CAPTURE_KINDS: { id: CaptureKind; label: string; icon: typeof Heart }[] = [
  { id: 'text', label: 'Note', icon: NotebookPen },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'photo', label: 'Photo', icon: Camera },
  { id: 'receipt', label: 'Receipt', icon: Receipt },
  { id: 'document', label: 'Document', icon: FileText },
  { id: 'medical', label: 'Medical', icon: Stethoscope },
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'meal', label: 'Meal', icon: Utensils },
  { id: 'expense', label: 'Expense', icon: CreditCard },
  { id: 'task', label: 'Task', icon: CheckSquare },
  { id: 'reminder', label: 'Reminder', icon: Bell },
  { id: 'idea', label: 'Idea', icon: Lightbulb },
  { id: 'journal', label: 'Journal', icon: NotebookPen },
  { id: 'mood', label: 'Mood', icon: Smile },
  { id: 'location', label: 'Place', icon: MapPin },
];

export const kindIcon = (kind: string) =>
  CAPTURE_KINDS.find((k) => k.id === kind)?.icon ?? Sparkles;

export const NAV_TABS = [
  { path: '/app', icon: Home, label: 'Home' },
  { path: '/app/timeline', icon: Clock, label: 'Timeline' },
  { path: '/app/capture', icon: Plus, label: 'Capture' },
  { path: '/app/assistant', icon: Sparkles, label: 'Assistant' },
  { path: '/app/insights', icon: BarChart3, label: 'Insights' },
];

export const MORE_LINKS = [
  { path: '/app/ai', icon: Brain, label: 'Ask your logbook' },
  { path: '/app/search', icon: Search, label: 'Search' },
  { path: '/app/calendar', icon: CalendarClock, label: 'Calendar' },
  { path: '/app/messages', icon: Inbox, label: 'Messages' },
  { path: '/app/reminders', icon: Bell, label: 'Reminders' },
  { path: '/app/modules', icon: Activity, label: 'Modules' },
  { path: '/app/settings', icon: Settings, label: 'Settings' },
];

