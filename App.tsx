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
import { loadHistory, saveHistory } from './src/services/history';
import type { ScanHistoryItem } from './src/types/security';

export default function App() { return <ThemeProvider><CyberShieldApp /></ThemeProvider>; }

function CyberShieldApp() {
  const { theme, reducedMotion } = useTheme();
  const [screen, setScreen] = useState<Screen>('home');
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [scanRequest, setScanRequest] = useState<'link' | 'file'>('link');
  const motion = useRef(new Animated.Value(1)).current;

  useEffect(() => { loadHistory().then((items) => { setHistory(items); setHistoryReady(true); }); }, []);
  useEffect(() => { if (historyReady) saveHistory(history).catch(() => undefined); }, [history, historyReady]);
  useEffect(() => { motion.setValue(reducedMotion ? 1 : 0); const transition = Animated.timing(motion, { toValue: 1, duration: reducedMotion ? 0 : 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }); transition.start(); return () => transition.stop(); }, [motion, reducedMotion, screen]);

  const navigate = useCallback((next: Screen) => setScreen(next), []);
  const openScan = (tool: 'link' | 'file' = 'link') => { setScanRequest(tool); navigate('scan'); };
  const openModule = (capability: Capability) => {
    if (capability.id === 'phishing') return openScan('link');
    if (capability.id === 'file') return openScan('file');
    navigate(capability.id);
  };
  const saveItem = (item: ScanHistoryItem) => setHistory((items) => addHistoryItem(items, item));
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

  return <View style={[styles.app, { backgroundColor: theme.colors.canvas }]}><StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} /><Animated.View style={[styles.stage, { opacity: motion, transform: [{ translateY }] }]}>
    {screen === 'home' && <HomeScreen history={history} onScan={() => openScan('link')} onFileScan={() => openScan('file')} onProtection={() => navigate('protection')} onActivity={() => navigate('activity')} onProfile={openSettings} onAlerts={() => navigate('alerts')} onCapability={openModule} />}
    {screen === 'protection' && <ProtectionScreen onProfile={openSettings} onModule={openModule} />}
    {screen === 'scan' && <ScanScreen key={scanRequest} initialTool={scanRequest} onProfile={openSettings} onHistory={() => navigate('history')} onSave={saveItem} />}
    {screen === 'activity' && <ActivityScreen history={history} onProfile={openSettings} onHistory={() => navigate('history')} onAnalytics={() => navigate('analytics')} />}
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
    {screen === 'onboarding' && <OnboardingScreen onFinish={() => navigate('home')} />}
  </Animated.View>{primary ? <BottomNavigation active={screen as PrimaryScreen} onNavigate={navigate} /> : null}</View>;
}

const styles = StyleSheet.create({ app: { flex: 1 }, stage: { flex: 1 } });
