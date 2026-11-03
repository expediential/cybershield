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
    onForest: string;
    onForestMuted: string;
    onForestLine: string;
    monitoringSurface: string;
    monitoringLine: string;
    monitoringMuted: string;
    monitoringQuiet: string;
  };
};

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 44, xxxl: 60 } as const;
export const radius = { sm: 7, md: 12, lg: 18, xl: 26, pill: 999 } as const;
export const motion = { instant: 110, quick: 180, standard: 280, deliberate: 460, scanStage: 340 } as const;

export const type = {
  display: Platform.select({ ios: 'Avenir Next Demi Bold', android: 'sans-serif-medium', default: 'System' }),
  body: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    canvas: '#0A0E11',
    surface: '#12191D',
    surfaceMuted: '#172126',
    surfaceStrong: '#1B252A',
    ink: '#F1F4EF',
    inkMuted: '#9BA9A9',
    line: '#2A393E',
    forest: '#C7F36B',
    signal: '#4BD6B4',
    signalSoft: '#123B34',
    amber: '#F0B451',
    amberSoft: '#3D3018',
    danger: '#F06B69',
    dangerSoft: '#422326',
    white: '#F1F4EF',
    onForest: '#0A0E11',
    onForestMuted: '#DCEBC0',
    onForestLine: '#55703F',
    monitoringSurface: '#0D1719',
    monitoringLine: '#345057',
    monitoringMuted: '#A9C2C1',
    monitoringQuiet: '#10272A',
  },
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    canvas: '#EEF1ED',
    surface: '#FAFBF8',
    surfaceMuted: '#E3EAE6',
    surfaceStrong: '#D3DED8',
    ink: '#14211E',
    inkMuted: '#5B6D67',
    line: '#B9C8C1',
    forest: '#2E6B42',
    signal: '#137D69',
    signalSoft: '#CBEFE5',
    amber: '#9B611E',
    amberSoft: '#F5E6C9',
    danger: '#B84A4C',
    dangerSoft: '#F8DFDF',
    white: '#FFFFFF',
    onForest: '#FFFFFF',
    onForestMuted: '#DBE9D3',
    onForestLine: '#5E876B',
    monitoringSurface: '#163D38',
    monitoringLine: '#497569',
    monitoringMuted: '#D4E4DE',
    monitoringQuiet: '#0E2D2A',
  },
};

export const themeFor = (mode: ThemeMode): Theme => mode === 'dark' ? darkTheme : lightTheme;
