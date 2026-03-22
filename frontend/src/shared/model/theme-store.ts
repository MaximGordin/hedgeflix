import { create } from 'zustand/react';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system' | null;

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: null,
      setTheme: (theme) => {
        set({theme});
      },
    }),
    { name: 'theme' },
  ),
);
