import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { themes, type themes as themeMap } from '@/lib/themes';
import { getSettings, saveSettings } from '@/lib/storage';
import { setNativeStatusBarStyle } from '@/lib/nativeSettings';
import type { ThemeId, ThemeColors } from '@/types';

interface ThemeContextValue {
  themeId: ThemeId;
  theme: typeof themeMap[ThemeId];
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => getSettings().theme);

  const theme = themes[themeId];

  useEffect(() => {
    const root = document.documentElement;
    const colors: ThemeColors = theme.colors;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--c-${key}`, value);
    });
    root.style.setProperty('color-scheme', theme.id === 'nordic' ? 'light' : 'dark');
    setNativeStatusBarStyle(theme.id === 'nordic');
  }, [themeId, theme]);

  function setTheme(id: ThemeId) {
    setThemeId(id);
    saveSettings({ theme: id });
  }

  return (
    <ThemeContext.Provider value={{ themeId, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
