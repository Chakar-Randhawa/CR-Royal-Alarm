import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { themes, type themes as themeMap } from '@/lib/themes';
import type { ThemeId, ThemeColors } from '@/types';

interface ThemeContextValue {
  themeId: ThemeId;
  theme: typeof themeMap[ThemeId];
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('amoled');

  const theme = themes[themeId];

  useEffect(() => {
    const root = document.documentElement;
    const colors: ThemeColors = theme.colors;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--c-${key}`, value);
    });
    root.style.setProperty('color-scheme', theme.id === 'nordic' ? 'light' : 'dark');
  }, [themeId, theme]);

  return (
    <ThemeContext.Provider value={{ themeId, theme, setTheme: setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
