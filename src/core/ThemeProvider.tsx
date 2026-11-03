import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { themeFor, type Theme, type ThemeMode } from '../design/tokens';

type ThemeContextValue = {
  mode: ThemeMode;
  theme: Theme;
  setMode: (mode: ThemeMode) => void;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  ready: boolean;
};

const preferenceKey = '@cybershield/theme/v1';
const demoKey = '@cybershield/demo-mode/v1';
const reducedMotionKey = '@cybershield/reduced-motion/v1';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [demoMode, setDemoModeState] = useState(false);
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(preferenceKey), AsyncStorage.getItem(demoKey), AsyncStorage.getItem(reducedMotionKey)])
      .then(([storedTheme, storedDemo, storedReducedMotion]) => {
        if (storedTheme === 'light' || storedTheme === 'dark') setModeState(storedTheme);
        setDemoModeState(storedDemo === 'true');
        setReducedMotionState(storedReducedMotion === 'true');
      })
      .finally(() => setReady(true));
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(preferenceKey, nextMode).catch(() => undefined);
  };

  const setDemoMode = (enabled: boolean) => {
    setDemoModeState(enabled);
    AsyncStorage.setItem(demoKey, String(enabled)).catch(() => undefined);
  };

  const setReducedMotion = (enabled: boolean) => {
    setReducedMotionState(enabled);
    AsyncStorage.setItem(reducedMotionKey, String(enabled)).catch(() => undefined);
  };

  const value = useMemo(() => ({ mode, theme: themeFor(mode), setMode, demoMode, setDemoMode, reducedMotion, setReducedMotion, ready }), [mode, demoMode, reducedMotion, ready]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
