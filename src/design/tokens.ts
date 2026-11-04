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
    canvas: '#02141C',
    surface: '#07222A',
    surfaceMuted: '#0A2A32',
    surfaceStrong: '#0D343C',
    ink: '#F4FBFA',
    inkMuted: '#9AB6BA',
    line: '#1A4D56',
    forest: '#B9FF52',
    signal: '#36E5D0',
    signalSoft: '#0B3E3D',
    amber: '#FFC857',
    amberSoft: '#493C18',
    danger: '#FF7370',
    dangerSoft: '#4B292C',
    white: '#F7FFFF',
    onForest: '#071617',
    onForestMuted: '#DDFDB8',
    onForestLine: '#6AAE3B',
    monitoringSurface: '#031923',
    monitoringLine: '#1D6872',
    monitoringMuted: '#A7C9CC',
    monitoringQuiet: '#062931',
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
