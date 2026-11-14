import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, StyleSheet, View } from 'react-native';
import { ThemeProvider, useTheme } from './src/core/ThemeProvider';
import { isPrimaryScreen, type PrimaryScreen, type Screen } from './src/core/navigation';
import { BottomNavigation } from './src/components/QuietSignal';
import { type Capability } from './src/domain/capabilities';
import { addHistoryItem } from './src/domain/productState';
import { ActivityScreen, HistoryScreen } from './src/features/activity/ActivityScreen';
import { AlertsScreen } from './src/features/alerts/AlertsScreen';
import { AnalyticsScreen } from './src/features/analytics/AnalyticsScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { AppSecurityScreen, BluetoothSecurityScreen, NetworkMonitorScreen, WifiSecurityScreen } from './src/features/modules/ModuleScreens';
import { ProfileScreen, LearningScreen, OnboardingScreen, PrivacyScreen } from './src/features/profile/ProfileScreen';
import { ProtectionScreen } from './src/features/protection/ProtectionScreen';
import { ScanScreen } from './src/features/scanner/ScanScreen';
import { SplashScreen } from './src/features/splash/SplashScreen';
import { loadHistory, saveHistory } from './src/services/history';
import { completeOnboarding, hasCompletedOnboarding } from './src/services/onboarding';
import { appendScanRun, loadAutomaticScanSettings, loadScanRuns } from './src/services/scanStore';
import type { ScanHistoryItem } from './src/types/security';
import type { AutomaticScanSettings, ScanRun } from './src/types/scanning';
import './src/scanning/backgroundTask';

export default function App() { return <ThemeProvider><CyberShieldApp /></ThemeProvider>; }

function CyberShieldApp() {
  const { theme, reducedMotion, ready: themeReady } = useTheme();
  const [screen, setScreen] = useState<Screen>('home');
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [scanRuns, setScanRuns] = useState<ScanRun[]>([]);
  const [automaticScan, setAutomaticScan] = useState<AutomaticScanSettings | null>(null);
  const [historyReady, setHistoryReady] = useState(false);
  const [bootReady, setBootReady] = useState(false);
  const [launchSequenceDone, setLaunchSequenceDone] = useState(false);
  const [scanStartTab, setScanStartTab] = useState<'manual' | 'automatic'>('manual');
  const motion = useRef(new Animated.Value(1)).current;

  useEffect(() => { let active = true; Promise.all([loadHistory(), loadScanRuns(), loadAutomaticScanSettings(), hasCompletedOnboarding()]).then(([items, storedRuns, storedAutomatic, onboardingComplete]) => { if (!active) return; setHistory(items); setScanRuns(storedRuns); setAutomaticScan(storedAutomatic); setScreen(onboardingComplete ? 'home' : 'onboarding'); setHistoryReady(true); }).finally(() => { if (active) setBootReady(true); }); return () => { active = false; }; }, []);
  useEffect(() => { if (historyReady) saveHistory(history).catch(() => undefined); }, [history, historyReady]);
  useEffect(() => {
    if (!themeReady || !bootReady) return;
    const handle = setTimeout(() => setLaunchSequenceDone(true), reducedMotion ? 0 : 1250);
    return () => clearTimeout(handle);
  }, [bootReady, reducedMotion, themeReady]);
  useEffect(() => { motion.setValue(reducedMotion ? 1 : 0); const transition = Animated.timing(motion, { toValue: 1, duration: reducedMotion ? 0 : 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }); transition.start(); return () => transition.stop(); }, [motion, reducedMotion, screen]);

  const navigate = useCallback((next: Screen) => setScreen(next), []);
  const openScan = (tab: 'manual' | 'automatic' = 'manual') => { setScanStartTab(tab); navigate('scan'); };
  const openModule = (capability: Capability) => {
    if (capability.id === 'phishing' || capability.id === 'file') return openScan();
    navigate(capability.id);
  };
  const saveManualRun = (run: ScanRun, items: ScanHistoryItem[]) => {
    setHistory((existing) => items.reduce((next, item) => addHistoryItem(next, item), existing));
    setScanRuns((existing) => [run, ...existing.filter((item) => item.id !== run.id)].slice(0, 40));
    appendScanRun(run).catch(() => undefined);
  };
  const saveAutomaticRun = (run: ScanRun, items: ScanHistoryItem[]) => {
    setHistory((existing) => items.reduce((next, item) => addHistoryItem(next, item), existing));
    setScanRuns((existing) => [run, ...existing.filter((item) => item.id !== run.id)].slice(0, 40));
  };
  const markRead = (id: string) => setHistory((items) => items.map((item) => item.id === id ? { ...item, read: true } : item));
  const dismissAlert = (id: string) => setHistory((items) => items.map((item) => item.id === id ? { ...item, dismissed: true } : item));
  const clearHistory = () => setHistory([]);
  const back = useCallback(() => {
    if (screen === 'apps' || screen === 'wifi' || screen === 'network' || screen === 'bluetooth') navigate('protection');
    else if (screen === 'history' || screen === 'analytics') navigate('activity');
    else if (screen === 'alerts') navigate('home');
    else if (screen === 'learning' || screen === 'privacy' || screen === 'onboarding') navigate('profile');
    else navigate('home');
  }, [navigate, screen]);
  useEffect(() => { const subscription = BackHandler.addEventListener('hardwareBackPress', () => { if (screen === 'home') return false; back(); return true; }); return () => subscription.remove(); }, [back, screen]);

  const translateY = motion.interpolate({ inputRange: [0, 1], outputRange: [reducedMotion ? 0 : 14, 0] });
  const primary = isPrimaryScreen(screen);
  const openSettings = () => navigate('profile');
  const finishOnboarding = () => { completeOnboarding().catch(() => undefined); navigate('home'); };

  if (!themeReady || !bootReady || !launchSequenceDone) return <View style={[styles.app, { backgroundColor: theme.colors.monitoringSurface }]}><StatusBar style="light" /><SplashScreen /></View>;

  return <View style={[styles.app, { backgroundColor: theme.colors.canvas }]}><StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} /><Animated.View style={[styles.stage, { opacity: motion, transform: [{ translateY }] }]}>
    {screen === 'home' && <HomeScreen history={history} scanRuns={scanRuns} automaticScan={automaticScan} onScan={() => openScan()} onAutomaticScan={() => openScan('automatic')} onFileScan={() => openScan()} onProtection={() => navigate('protection')} onActivity={() => navigate('activity')} onProfile={openSettings} onAlerts={() => navigate('alerts')} onCapability={openModule} />}
    {screen === 'protection' && <ProtectionScreen onProfile={openSettings} onModule={openModule} />}
    {screen === 'scan' && <ScanScreen key={scanStartTab} initialTab={scanStartTab} onBack={() => navigate('home')} onProfile={openSettings} onHistory={() => navigate('history')} history={history} onManualRun={saveManualRun} onAutomaticRun={saveAutomaticRun} onSettingsChanged={setAutomaticScan} />}
    {screen === 'activity' && <ActivityScreen history={history} scanRuns={scanRuns} onProfile={openSettings} onHistory={() => navigate('history')} onAnalytics={() => navigate('analytics')} />}
    {screen === 'profile' && <ProfileScreen onLearning={() => navigate('learning')} onAlerts={() => navigate('alerts')} onOnboarding={() => navigate('onboarding')} onPrivacy={() => navigate('privacy')} />}
    {screen === 'apps' && <AppSecurityScreen onBack={back} onOpenSettings={openSettings} />}
    {screen === 'wifi' && <WifiSecurityScreen onBack={back} onOpenSettings={openSettings} />}
    {screen === 'network' && <NetworkMonitorScreen onBack={back} onOpenSettings={openSettings} />}
    {screen === 'bluetooth' && <BluetoothSecurityScreen onBack={back} onOpenSettings={openSettings} />}
    {screen === 'history' && <HistoryScreen history={history} onBack={back} onClear={clearHistory} />}
    {screen === 'alerts' && <AlertsScreen history={history} onBack={back} onMarkRead={markRead} onDismiss={dismissAlert} />}
    {screen === 'analytics' && <AnalyticsScreen history={history} onBack={back} />}
    {screen === 'learning' && <LearningScreen onBack={back} />}
    {screen === 'privacy' && <PrivacyScreen onBack={back} />}
    {screen === 'onboarding' && <OnboardingScreen onFinish={finishOnboarding} />}
  </Animated.View>{primary ? <BottomNavigation active={screen as PrimaryScreen} onNavigate={navigate} /> : null}</View>;
}

const styles = StyleSheet.create({ app: { flex: 1 }, stage: { flex: 1 } });
