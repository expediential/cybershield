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
export const radius = { sm: 10, md: 16, lg: 22, xl: 30, pill: 999 } as const;
export const motion = { instant: 110, quick: 180, standard: 280, deliberate: 460, scanStage: 340 } as const;

export const type = {
  display: Platform.select({ ios: 'Avenir Next Demi Bold', android: 'sans-serif-medium', default: 'System' }),
  body: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    canvas: '#05080A',
    surface: '#0C171D',
    surfaceMuted: '#101D24',
    surfaceStrong: '#12232B',
    ink: '#F8FAFC',
    inkMuted: '#94A3B8',
    line: '#23404B',
    forest: '#B6FF3B',
    signal: '#36EAF5',
    signalSoft: '#0C343B',
    amber: '#F59E0B',
    amberSoft: '#473317',
    danger: '#FB7185',
    dangerSoft: '#4A242D',
    white: '#FFFFFF',
    onForest: '#091107',
    onForestMuted: '#E2FFB8',
    onForestLine: '#7EA93E',
    monitoringSurface: '#071217',
    monitoringLine: '#1C5863',
    monitoringMuted: '#9CB4C0',
    monitoringQuiet: '#091C23',
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
