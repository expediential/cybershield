export type PrimaryScreen = 'home' | 'protection' | 'scan' | 'activity' | 'profile';
export type Screen = PrimaryScreen | 'monitor' | 'history' | 'alerts' | 'learning' | 'module';

export const isPrimaryScreen = (screen: Screen): screen is PrimaryScreen => ['home', 'protection', 'scan', 'activity', 'profile'].includes(screen);
