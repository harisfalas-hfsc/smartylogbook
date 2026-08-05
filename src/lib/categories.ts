import { useCallback, useMemo } from 'react';
import {
  Folder, Car, Home, GraduationCap, PawPrint, Plane, Gift, Music, Camera,
  Palette, ShoppingBag, Wrench, Baby, Leaf, Star, BookOpen,
} from 'lucide-react';
import { MODULES, ModuleInfo } from '@/lib/constants';
import { usePreferences } from '@/lib/preferences';

export interface CustomCategory {
  id: string;
  label: string;
  icon?: string;
}

/** Icons a user can pick for their own category. */
export const CATEGORY_ICONS: { id: string; icon: typeof Folder }[] = [
  { id: 'folder', icon: Folder },
  { id: 'car', icon: Car },
  { id: 'home', icon: Home },
  { id: 'study', icon: GraduationCap },
  { id: 'pet', icon: PawPrint },
  { id: 'travel', icon: Plane },
  { id: 'gift', icon: Gift },
  { id: 'music', icon: Music },
  { id: 'photo', icon: Camera },
  { id: 'art', icon: Palette },
  { id: 'shopping', icon: ShoppingBag },
  { id: 'tools', icon: Wrench },
  { id: 'family', icon: Baby },
  { id: 'garden', icon: Leaf },
  { id: 'star', icon: Star },
  { id: 'book', icon: BookOpen },
];

export const categoryIcon = (id?: string) =>
  CATEGORY_ICONS.find((i) => i.id === id)?.icon ?? Folder;

export const customToModule = (c: CustomCategory): ModuleInfo => ({
  id: c.id as ModuleInfo['id'],
  label: c.label,
  icon: categoryIcon(c.icon),
  color: 'text-primary',
  tint: 'bg-primary/10',
  description: 'Your own category',
  topics: [],
});

const slugify = (label: string) =>
  'c-' +
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);

/** Built-in categories plus any categories the user created themselves. */
export const useCategories = () => {
  const { prefs, loading, update } = usePreferences();

  const custom = useMemo<CustomCategory[]>(() => {
    const raw = (prefs as unknown as { custom_categories?: CustomCategory[] })?.custom_categories;
    return Array.isArray(raw) ? raw.filter((c) => c && c.id && c.label) : [];
  }, [prefs]);

  const categories = useMemo<ModuleInfo[]>(
    () => [...MODULES, ...custom.map(customToModule)],
    [custom]
  );

  const save = useCallback(
    (next: CustomCategory[]) => update({ custom_categories: next } as never),
    [update]
  );

  const addCategory = useCallback(
    async (label: string, icon = 'folder') => {
      const clean = label.trim().slice(0, 28);
      if (!clean) return { error: new Error('Name required') };
      const id = slugify(clean);
      if (!id || categories.some((c) => c.id === id)) return { error: new Error('That category already exists') };
      return save([...custom, { id, label: clean, icon }]);
    },
    [categories, custom, save]
  );

  const updateCategory = useCallback(
    async (id: string, patch: { label?: string; icon?: string }) => {
      const clean = patch.label?.trim().slice(0, 28);
      if (patch.label !== undefined && !clean) return { error: new Error('Name required') };
      return save(
        custom.map((c) => (c.id === id ? { ...c, ...(clean ? { label: clean } : {}), ...(patch.icon ? { icon: patch.icon } : {}) } : c))
      );
    },
    [custom, save]
  );

  const removeCategory = useCallback(
    async (id: string) => save(custom.filter((c) => c.id !== id)),
    [custom, save]
  );

  const getCategory = useCallback(
    (id: string): ModuleInfo =>
      categories.find((c) => c.id === id) ?? MODULES[MODULES.length - 1],
    [categories]
  );

  return { categories, custom, loading, addCategory, updateCategory, removeCategory, getCategory };
};
