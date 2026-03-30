import { 
  Note, MoneyEntry, SavingsGoal, WorkoutEntry, WeightEntry, SleepEntry, 
  WorkEntry, FamilyEvent, MoodEntry, GoalEntry, HabitEntry, ReflectionEntry,
  ReadinessEntry, CustomHealthMetric, ActivityEntry
} from './types';

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

// Notes
export function getNotes(): Note[] { return get('smarty_notes', []); }
export function saveNotes(notes: Note[]) { set('smarty_notes', notes); }

// Money
export function getMoneyEntries(): MoneyEntry[] { return get('smarty_money', []); }
export function saveMoneyEntries(entries: MoneyEntry[]) { set('smarty_money', entries); }
export function getSavingsGoals(): SavingsGoal[] { return get('smarty_savings_goals', []); }
export function saveSavingsGoals(goals: SavingsGoal[]) { set('smarty_savings_goals', goals); }

// Health
export function getWorkouts(): WorkoutEntry[] { return get('smarty_workouts', []); }
export function saveWorkouts(workouts: WorkoutEntry[]) { set('smarty_workouts', workouts); }
export function getWeightEntries(): WeightEntry[] { return get('smarty_weight', []); }
export function saveWeightEntries(entries: WeightEntry[]) { set('smarty_weight', entries); }
export function getSleepEntries(): SleepEntry[] { return get('smarty_sleep', []); }
export function saveSleepEntries(entries: SleepEntry[]) { set('smarty_sleep', entries); }

// Work
export function getWorkEntries(): WorkEntry[] { return get('smarty_work', []); }
export function saveWorkEntries(entries: WorkEntry[]) { set('smarty_work', entries); }

// Family
export function getFamilyEvents(): FamilyEvent[] { return get('smarty_family', []); }
export function saveFamilyEvents(events: FamilyEvent[]) { set('smarty_family', events); }

// Growth
export function getMoodEntries(): MoodEntry[] { return get('smarty_mood', []); }
export function saveMoodEntries(entries: MoodEntry[]) { set('smarty_mood', entries); }
export function getGoals(): GoalEntry[] { return get('smarty_goals', []); }
export function saveGoals(goals: GoalEntry[]) { set('smarty_goals', goals); }
export function getHabits(): HabitEntry[] { return get('smarty_habits', []); }
export function saveHabits(habits: HabitEntry[]) { set('smarty_habits', habits); }
export function getReflections(): ReflectionEntry[] { return get('smarty_reflections', []); }
export function saveReflections(entries: ReflectionEntry[]) { set('smarty_reflections', entries); }
