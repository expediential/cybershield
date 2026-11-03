export type PrimaryScreen = 'home' | 'protection' | 'scan' | 'activity' | 'profile';
export type Screen = PrimaryScreen | 'apps' | 'wifi' | 'network' | 'bluetooth' | 'history' | 'alerts' | 'analytics' | 'learning' | 'privacy' | 'onboarding';

export const isPrimaryScreen = (screen: Screen): screen is PrimaryScreen => ['home', 'protection', 'scan', 'activity', 'profile'].includes(screen);
