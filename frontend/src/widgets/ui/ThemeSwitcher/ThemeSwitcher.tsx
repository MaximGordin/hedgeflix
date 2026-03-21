'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { useThemeStore } from '@shared/model';

type ThemeSwitcherProps = {
  className?: string;
};

const Themes = [
  { code: 'dark', title: 'Dark', Icon: Moon },
  { code: 'light', title: 'Light', Icon: Sun },
  { code: 'system', title: 'System', Icon: Monitor },
] as const;

export const ThemeSwitcher = ({className}: ThemeSwitcherProps) => {
  const currentTheme = useThemeStore((s) => s.theme);
  const setCurrentTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    function apply() {
      const applied = currentTheme === 'system' ? (media.matches ? 'dark' : 'light') : currentTheme;
      document.documentElement.setAttribute('data-theme', applied);
    }

    apply();
    if (currentTheme === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [currentTheme]);

  return (
    <div className={className}>
      {Themes.map((theme) => {
        return (
          <div
            key={theme.code}
            className={`flex items-center justify-center gap-1 px-3 text-muted cursor-pointer rounded-sm ${currentTheme === theme.code ? 'bg-accent text-white' : ''}`}
            onClick={() => {
              setCurrentTheme(theme.code);
            }}
          >
            <theme.Icon size={16} />
            <span className="text-sm font-semibold">{theme.title}</span>
          </div>
        );
      })}
    </div>
  );
}
