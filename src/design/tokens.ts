import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export type Theme = {
  mode: ThemeMode;
  colors: {
    canvas: string;
    surface: string;
    surfaceMuted: string;
    surfaceStrong: string;
    ink: string;
    inkMuted: string;
    line: string;
    forest: string;
    signal: string;
    signalSoft: string;
    amber: string;
    amberSoft: string;
    danger: string;
    dangerSoft: string;
    white: string;
    onForestMuted: string;
    onForestLine: string;
    monitoringSurface: string;
    monitoringLine: string;
    monitoringMuted: string;
    monitoringQuiet: string;
  };
};

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 44, xxxl: 60 } as const;
export const radius = { sm: 8, md: 14, lg: 22, xl: 30, pill: 999 } as const;

export const type = {
  display: Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium', default: 'System' }),
  body: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    canvas: '#F2F4EF',
    surface: '#FAFBF7',
    surfaceMuted: '#E7ECE5',
    surfaceStrong: '#DCE6DC',
    ink: '#17251D',
    inkMuted: '#66736B',
    line: '#C9D3CA',
    forest: '#174C38',
    signal: '#B9DE58',
    signalSoft: '#EAF5C9',
    amber: '#A96525',
    amberSoft: '#F5E7D5',
    danger: '#B93D45',
    dangerSoft: '#F7E0E2',
    white: '#FFFFFF',
    onForestMuted: '#C4D5C9',
    onForestLine: '#467362',
    monitoringSurface: '#174C38',
    monitoringLine: '#47745F',
    monitoringMuted: '#C8DCD0',
    monitoringQuiet: '#113827',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    canvas: '#101A15',
    surface: '#16231C',
    surfaceMuted: '#203127',
    surfaceStrong: '#294033',
    ink: '#F1F5EF',
    inkMuted: '#A7B5AA',
    line: '#31463A',
    forest: '#B9DE58',
    signal: '#C5EB62',
    signalSoft: '#2B4528',
    amber: '#F1B66D',
    amberSoft: '#453521',
    danger: '#F18C93',
    dangerSoft: '#48272B',
    white: '#FFFFFF',
    onForestMuted: '#C7DACB',
    onForestLine: '#436653',
    monitoringSurface: '#0F1C15',
    monitoringLine: '#31463A',
    monitoringMuted: '#A7B5AA',
    monitoringQuiet: '#203127',
  },
};

export const themeFor = (mode: ThemeMode): Theme => mode === 'dark' ? darkTheme : lightTheme;
