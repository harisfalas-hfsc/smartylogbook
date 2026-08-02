import { useCallback, useMemo } from 'react';
import { Folder } from 'lucide-react';
import { MODULES, ModuleInfo } from '@/lib/constants';
import { usePreferences } from '@/lib/preferences';

export interface CustomCategory {
  id: string;
  label: string;
}

export const customToModule = (c: CustomCategory): ModuleInfo => ({
  id: c.id as ModuleInfo['id'],
  label: c.label,
  icon: Folder,
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

/** Built-in modules plus any categories the user created themselves. */
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

  const addCategory = useCallback(
    async (label: string) => {
      const clean = label.trim().slice(0, 28);
      if (!clean) return { error: new Error('Name required') };
      const id = slugify(clean);
      if (!id || categories.some((c) => c.id === id)) return { error: new Error('That category already exists') };
      return update({ custom_categories: [...custom, { id, label: clean }] } as never);
    },
    [categories, custom, update]
  );

  const removeCategory = useCallback(
    async (id: string) => update({ custom_categories: custom.filter((c) => c.id !== id) } as never),
    [custom, update]
  );

  const getCategory = useCallback(
    (id: string): ModuleInfo =>
      categories.find((c) => c.id === id) ?? MODULES[MODULES.length - 1],
    [categories]
  );

  return { categories, custom, loading, addCategory, removeCategory, getCategory };
};
