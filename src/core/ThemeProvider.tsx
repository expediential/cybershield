import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { themeFor, type Theme, type ThemeMode } from '../design/tokens';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  ready: boolean;
};

const preferenceKey = '@cybershield/theme/v1';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(preferenceKey)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark') setModeState(stored);
      })
      .finally(() => setReady(true));
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(preferenceKey, nextMode).catch(() => undefined);
  };

  const value = useMemo(() => ({ mode, theme: themeFor(mode), setMode, ready }), [mode, ready]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
