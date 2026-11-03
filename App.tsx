import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, StyleSheet, View } from 'react-native';
import { ThemeProvider, useTheme } from './src/core/ThemeProvider';
import { isPrimaryScreen, type PrimaryScreen, type Screen } from './src/core/navigation';
import { BottomNavigation } from './src/components/QuietSignal';
import { capabilities, type Capability } from './src/domain/capabilities';
import { ActivityScreen, HistoryScreen } from './src/features/activity/ActivityScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { MonitoringScreen } from './src/features/monitoring/MonitoringScreen';
import { AlertsScreen, LearningScreen, ProfileScreen } from './src/features/profile/ProfileScreen';
import { CapabilityDetailScreen, ProtectionScreen } from './src/features/protection/ProtectionScreen';
import { ScanScreen } from './src/features/scanner/ScanScreen';
import { loadHistory, saveHistory } from './src/services/history';
import type { ScanHistoryItem } from './src/types/security';

export default function App() {
  return <ThemeProvider><CyberShieldApp /></ThemeProvider>;
}

function CyberShieldApp() {
  const { theme } = useTheme();
  const [screen, setScreen] = useState<Screen>('home');
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [selectedCapability, setSelectedCapability] = useState<Capability>(capabilities[0]);
  const [scanRequest, setScanRequest] = useState<'link' | 'file'>('link');
  const motion = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadHistory().then((items) => {
      setHistory(items);
      setHistoryReady(true);
    });
  }, []);

  useEffect(() => {
    if (historyReady) saveHistory(history).catch(() => undefined);
  }, [history, historyReady]);

  useEffect(() => {
    motion.setValue(0);
    const transition = Animated.timing(motion, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    transition.start();
    return () => transition.stop();
  }, [motion, screen]);

  const navigate = useCallback((next: Screen) => setScreen(next), []);
  const openScan = (tool: 'link' | 'file' = 'link') => {
    setScanRequest(tool);
    navigate('scan');
  };
  const openCapability = (capability: Capability) => {
    if (capability.id === 'link') return openScan('link');
    if (capability.id === 'file') return openScan('file');
    setSelectedCapability(capability);
    navigate('module');
  };
  const saveItem = (item: ScanHistoryItem) => setHistory((items) => [item, ...items.filter((entry) => entry.subject !== item.subject)].slice(0, 30));
  const back = useCallback(() => {
    if (screen === 'monitor' || screen === 'module') navigate('protection');
    else if (screen === 'history') navigate('activity');
    else if (screen === 'alerts' || screen === 'learning') navigate('profile');
    else navigate('home');
  }, [navigate, screen]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home') return false;
      back();
      return true;
    });
    return () => subscription.remove();
  }, [back, screen]);
  const translateY = motion.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const primary = isPrimaryScreen(screen);

  return <View style={[styles.app, { backgroundColor: theme.colors.canvas }]}>
    <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
    <Animated.View style={[styles.stage, { opacity: motion, transform: [{ translateY }] }]}>
      {screen === 'home' && <HomeScreen history={history} onScan={() => openScan('link')} onFileScan={() => openScan('file')} onProtection={() => navigate('protection')} onActivity={() => navigate('activity')} onProfile={() => navigate('profile')} onMonitor={() => navigate('monitor')} onCapability={openCapability} />}
      {screen === 'protection' && <ProtectionScreen onProfile={() => navigate('profile')} onCapability={openCapability} onMonitor={() => navigate('monitor')} />}
      {screen === 'scan' && <ScanScreen key={scanRequest} initialTool={scanRequest} onProfile={() => navigate('profile')} onHistory={() => navigate('history')} onSave={saveItem} />}
      {screen === 'activity' && <ActivityScreen history={history} onProfile={() => navigate('profile')} onHistory={() => navigate('history')} />}
      {screen === 'profile' && <ProfileScreen onLearning={() => navigate('learning')} onAlerts={() => navigate('alerts')} />}
      {screen === 'monitor' && <MonitoringScreen onBack={back} />}
      {screen === 'history' && <HistoryScreen history={history} onBack={back} />}
      {screen === 'alerts' && <AlertsScreen alertCount={history.filter((item) => item.verdict === 'suspicious' || item.verdict === 'malicious').length} onBack={back} />}
      {screen === 'learning' && <LearningScreen onBack={back} />}
      {screen === 'module' && <CapabilityDetailScreen capability={selectedCapability} onBack={back} onAction={() => openScan(selectedCapability.id === 'file' ? 'file' : 'link')} />}
    </Animated.View>
    {primary ? <BottomNavigation active={screen as PrimaryScreen} onNavigate={navigate} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  stage: { flex: 1 },
});
