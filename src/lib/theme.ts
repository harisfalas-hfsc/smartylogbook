import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const KEY = 'smarty-theme';

const apply = (theme: Theme) => {
  const root = document.documentElement;
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', dark);
};

export const initTheme = () => {
  const stored = (localStorage.getItem(KEY) as Theme | null) ?? 'system';
  apply(stored);
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(KEY) as Theme | null) ?? 'system'
  );

  useEffect(() => {
    apply(theme);
    localStorage.setItem(KEY, theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => apply('system');
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [theme]);

  return { theme, setTheme: setThemeState };
};
