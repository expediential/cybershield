import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Vibration,
} from 'react-native';
import { color, radius, space } from './src/design/tokens';
import { scanUrl } from './src/domain/urlScanner';
import { loadHistory, saveHistory } from './src/services/history';
import type { Finding, ScanHistoryItem, Severity, UrlScanResult, Verdict } from './src/types/security';
import { ModuleStatus, RadialMonitor, ScanRadar, SeverityTag, SignalMark, TelemetryBackdrop, Waveform, severityColor } from './src/components/Visuals';

type Screen =
  | 'home'
  | 'protection'
  | 'scan'
  | 'activity'
  | 'settings'
  | 'monitor'
  | 'history'
  | 'alerts'
  | 'learning'
  | 'modules'
  | 'onboarding';

type ModuleName = 'App security' | 'Wi-Fi security' | 'Bluetooth visibility' | 'Network monitor';
type ScanMode = 'overview' | 'url' | 'file';
type DeviceScanPhase = 'idle' | 'scanning' | 'complete';

const alertSeed = [
  { id: 'alert-1', title: 'Link needs review', description: 'A local URL assessment found a shortened link.', severity: 'warning' as Severity, time: 'Now', unread: true },
  { id: 'alert-2', title: 'Monitoring is sample-only', description: 'VPN traffic visibility is not enabled on this device.', severity: 'info' as Severity, time: 'Today', unread: false },
];

const moduleItems: { name: ModuleName; symbol: string; status: 'Active' | 'Permission needed' | 'Not configured' | 'Sample mode'; detail: string }[] = [
  { name: 'App security', symbol: 'AP', status: 'Permission needed', detail: 'Package visibility needs an Android permission flow in a development build.' },
  { name: 'Wi-Fi security', symbol: 'WF', status: 'Permission needed', detail: 'Connection metadata is available only after location / nearby Wi-Fi permission.' },
  { name: 'Bluetooth visibility', symbol: 'BT', status: 'Permission needed', detail: 'Nearby and paired-device checks require explicit Android approval.' },
  { name: 'Network monitor', symbol: 'NM', status: 'Sample mode', detail: 'Local VPN inspection is not included in this Expo MVP build.' },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [url, setUrl] = useState('');
  const [urlPhase, setUrlPhase] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [urlResult, setUrlResult] = useState<UrlScanResult | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('overview');
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleName>('App security');
  const [deviceScanPhase, setDeviceScanPhase] = useState<DeviceScanPhase>('idle');
  const [deviceScanProgress, setDeviceScanProgress] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;
  const screenMotion = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadHistory().then((items) => {
      setHistory(items);
      setHistoryReady(true);
    });
  }, []);

  useEffect(() => {
    if (historyReady) saveHistory(history);
  }, [history, historyReady]);

  useEffect(() => {
    if (!isMonitoring) {
      spin.stopAnimation();
      spin.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 7800, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [isMonitoring, spin]);

  useEffect(() => {
    screenMotion.setValue(0);
    const animation = Animated.timing(screenMotion, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [screen, screenMotion]);

  const score = useMemo(() => {
    const flagged = history.filter((item) => item.verdict === 'suspicious' || item.verdict === 'malicious').length;
    return Math.max(46, 68 - flagged * 6);
  }, [history]);

  const submitUrl = () => {
    setUrlPhase('scanning');
    Vibration.vibrate(12);
    setTimeout(() => {
      const result = scanUrl(url);
      const item: ScanHistoryItem = {
        id: 'url-' + Date.now(),
        kind: 'url',
        subject: result.normalized || result.input,
        verdict: result.verdict,
        score: result.score,
        createdAt: result.checkedAt,
        detail: result.coverage,
      };
      setUrlResult(result);
      setHistory((items) => [item, ...items.filter((entry) => entry.subject !== item.subject)].slice(0, 30));
      setUrlPhase('complete');
      Vibration.vibrate(result.verdict === 'safe' ? 10 : [0, 22, 60, 22]);
    }, 950);
  };

  const chooseFile = async () => {
    try {
      const selection = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false, type: '*/*', multiple: false });
      if (selection.canceled || !selection.assets[0]) return;
      const asset = selection.assets[0];
      const name = asset.name || 'Unnamed file';
      const size = asset.size || 0;
      const dangerous = /\.(apk|exe|msi|bat|cmd|scr|js|vbs)$/i.test(name);
      const scoreValue = dangerous ? 36 : 4;
      const verdict: Verdict = dangerous ? 'suspicious' : 'safe';
      const note = dangerous
        ? name + ' is an executable or installable file. Metadata review cannot determine whether it is malware; send it only to a configured isolated scanner.'
        : name + ' was selected. This MVP reviewed file metadata only; no antivirus engine is configured.';
      setFileNote(note);
      const item: ScanHistoryItem = {
        id: 'file-' + Date.now(),
        kind: 'file',
        subject: name,
        verdict,
        score: scoreValue,
        createdAt: new Date().toISOString(),
        detail: size ? Math.ceil(size / 1024) + ' KB · metadata assessment only' : 'Metadata assessment only',
      };
      setHistory((items) => [item, ...items].slice(0, 30));
      Vibration.vibrate(dangerous ? [0, 20, 50, 20] : 10);
    } catch {
      Alert.alert('Could not select a file', 'The system picker did not return a file. Try again, or use a device build with document access enabled.');
    }
  };

  const startDeviceScan = () => {
    if (deviceScanPhase === 'scanning') return;
    setDeviceScanProgress(0);
    setDeviceScanPhase('scanning');
    Vibration.vibrate(10);
    [12, 28, 47, 66, 82, 100].forEach((progress, index) => {
      setTimeout(() => {
        setDeviceScanProgress(progress);
        if (progress === 100) {
          setDeviceScanPhase('complete');
          Vibration.vibrate([0, 10, 56, 10]);
        }
      }, (index + 1) * 440);
    });
  };

  const openModule = (name: ModuleName) => {
    setActiveModule(name);
    setScreen('modules');
  };

  const primaryScreen = ['home', 'protection', 'scan', 'activity', 'settings'].includes(screen);
  const back = () => setScreen(screen === 'monitor' ? 'protection' : screen === 'modules' ? 'protection' : screen === 'history' || screen === 'alerts' ? 'activity' : screen === 'learning' || screen === 'onboarding' ? 'settings' : 'home');
  const screenTranslate = screenMotion.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <Animated.View style={[styles.screenTransition, { opacity: screenMotion, transform: [{ translateY: screenTranslate }] }]}>
        {screen === 'home' && <HomeScreen score={score} history={history} onScan={() => setScreen('scan')} onNavigate={setScreen} onModule={openModule} />}
        {screen === 'protection' && <ProtectionScreen onMonitor={() => setScreen('monitor')} onModule={openModule} />}
        {screen === 'scan' && <ScanScreen url={url} setUrl={setUrl} urlPhase={urlPhase} result={urlResult} submitUrl={submitUrl} mode={scanMode} setMode={setScanMode} chooseFile={chooseFile} fileNote={fileNote} onHistory={() => setScreen('history')} deviceScanPhase={deviceScanPhase} deviceScanProgress={deviceScanProgress} startDeviceScan={startDeviceScan} />}
        {screen === 'activity' && <ActivityScreen history={history} onHistory={() => setScreen('history')} onAlerts={() => setScreen('alerts')} />}
        {screen === 'settings' && <SettingsScreen onLearning={() => setScreen('learning')} onOnboarding={() => setScreen('onboarding')} />}
        {screen === 'monitor' && <MonitorScreen spin={spin} isMonitoring={isMonitoring} setIsMonitoring={setIsMonitoring} />}
        {screen === 'history' && <HistoryScreen history={history} />}
        {screen === 'alerts' && <AlertsScreen />}
        {screen === 'learning' && <LearningScreen />}
        {screen === 'modules' && <ModuleDetailScreen module={moduleItems.find((item) => item.name === activeModule)!} />}
        {screen === 'onboarding' && <OnboardingScreen />}
        {!primaryScreen && <BackHeader onBack={back} title={screen === 'modules' ? activeModule : screen === 'monitor' ? 'Real-time monitoring' : screen === 'history' ? 'Scan history' : screen === 'alerts' ? 'Alerts centre' : screen === 'learning' ? 'Security field notes' : 'Welcome to CyberShield'} />}
        {primaryScreen && <BottomNavigation active={screen} onNavigate={setScreen} />}
      </Animated.View>
    </View>
  );
}

function HomeScreen({ score, history, onScan, onNavigate, onModule }: { score: number; history: ScanHistoryItem[]; onScan: () => void; onNavigate: (screen: Screen) => void; onModule: (module: ModuleName) => void }) {
  const actionable = history.filter((item) => item.verdict === 'suspicious' || item.verdict === 'malicious').length;
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.topStatus}>
        <View style={styles.brandMark}><View style={styles.brandDot} /><View style={styles.brandDot} /><View style={styles.brandDot} /><View style={styles.brandDot} /></View>
        <View style={styles.connection}><SignalMark /><Text style={styles.connectionText}>LOCAL MODE</Text></View>
        <Text style={styles.bell}>◌</Text>
      </View>
      <Text style={styles.eyebrow}>DEVICE PROTECTION</Text>
      <Text style={styles.greeting}>SECURITY AT A GLANCE</Text>
      <Text style={styles.subtle}>A clear view of the local checks, signals, and permissions available on this device.</Text>

      <View style={styles.dashboardGrid}>
        <Pressable style={[styles.gridCell, styles.activeCell]} onPress={() => onNavigate('monitor')}>
          <View style={styles.rowBetween}><Text style={styles.cellLabel} numberOfLines={2}>ACTIVE MONITORING</Text><View style={styles.powerCircle}><Text style={styles.powerGlyph}>◔</Text></View></View>
          <Text style={styles.cellFoot}>Sample mode</Text>
        </Pressable>
        <Pressable style={styles.counterCell} onPress={() => onNavigate('alerts')}>
          <Text style={styles.counterValue}>{String(actionable).padStart(2, '0')}</Text><Text style={styles.counterText} numberOfLines={2}>THREATS TO REVIEW</Text>
        </Pressable>
        <Pressable style={styles.scoreCell} onPress={() => onNavigate('activity')}>
          <Text style={styles.scoreLabel} numberOfLines={2}>SECURITY ASSESSMENT</Text>
          <Text style={styles.bigScore}>{score}</Text>
          <Text style={styles.scoreCaption}>LIMITED COVERAGE</Text>
        </Pressable>
        <Pressable style={styles.counterCell} onPress={() => onNavigate('alerts')}>
          <Text style={styles.counterValue}>02</Text><Text style={styles.counterText} numberOfLines={2}>ACTIVE NOTICES</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>LOCAL SIGNAL TRACE</Text><Text style={styles.meta}>24H</Text></View>
      <View style={styles.tracePanel}><Waveform /><Text style={styles.traceCaption}>No continuous traffic collection. Trace reflects on-device scan activity only.</Text></View>

      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>NEXT ACTIONS</Text><Pressable onPress={() => onNavigate('alerts')}><Text style={styles.actionText}>VIEW ALL</Text></Pressable></View>
      <FindingRow severity={actionable ? 'warning' : 'safe'} title={actionable ? 'Review local scan results' : 'Start your first security assessment'} description={actionable ? 'A link or file needs a closer look.' : 'Run a link or file assessment from Scan Centre.'} />
      <FindingRow severity="info" title="Coverage is limited" description="Network, Wi-Fi, Bluetooth and app inventory require device permissions or native modules." />

      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>PROTECTION MODULES</Text><Pressable onPress={() => onNavigate('protection')}><Text style={styles.actionText}>OPEN</Text></Pressable></View>
      <View style={styles.miniModules}>
        {moduleItems.slice(0, 3).map((module) => <Pressable key={module.name} style={styles.miniModule} onPress={() => onModule(module.name)}><Text style={styles.miniSymbol}>{module.symbol}</Text><Text style={styles.miniTitle}>{module.name}</Text><SignalMark severity={module.status === 'Active' ? 'safe' : module.status === 'Permission needed' ? 'warning' : 'info'} /></Pressable>)}
      </View>
      <View style={{ height: 96 }} />
      <Pressable style={styles.floatingScan} onPress={onScan}><Text style={styles.floatingScanText}>SCAN</Text><Text style={styles.floatingScanArrow}>↗</Text></Pressable>
    </ScrollView>
  );
}

function ProtectionScreen({ onMonitor, onModule }: { onMonitor: () => void; onModule: (module: ModuleName) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <TopTitle kicker="PROTECTION" title="DEVICE SIGNALS" description="Each capability tells you exactly what is available, missing, or illustrative." />
      <Pressable style={styles.monitorPreview} onPress={onMonitor}>
        <View style={styles.previewDisc}><Text style={styles.previewValue}>04</Text><Text style={styles.previewLabel}>INPUTS</Text></View>
        <View style={{ flex: 1 }}><Text style={styles.cardKicker}>REAL-TIME MONITORING</Text><Text style={styles.previewTitle}>Observe current protection state</Text><Text style={styles.previewCopy}>Sample event feed • no VPN traffic interception</Text></View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>MODULE MATRIX</Text><Text style={styles.meta}>04</Text></View>
      {moduleItems.map((module) => (
        <Pressable key={module.name} style={styles.moduleRow} onPress={() => onModule(module.name)}>
          <View style={styles.moduleSymbol}><Text style={styles.moduleSymbolText}>{module.symbol}</Text></View>
          <View style={styles.moduleMiddle}><Text style={styles.moduleName}>{module.name}</Text><Text style={styles.moduleDetail} numberOfLines={2}>{module.detail}</Text><ModuleStatus status={module.status} /></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
      <View style={styles.factStrip}><Text style={styles.factNumber}>0</Text><Text style={styles.factText}>Android permissions requested{'\n'}in this Expo build</Text><Text style={styles.factEnd}>HONEST BY DEFAULT</Text></View>
      <View style={{ height: 95 }} />
    </ScrollView>
  );
}

function ScanScreen({ url, setUrl, urlPhase, result, submitUrl, mode, setMode, chooseFile, fileNote, onHistory, deviceScanPhase, deviceScanProgress, startDeviceScan }: {
  url: string; setUrl: (value: string) => void; urlPhase: 'idle' | 'scanning' | 'complete'; result: UrlScanResult | null; submitUrl: () => void; mode: ScanMode; setMode: (mode: ScanMode) => void; chooseFile: () => void; fileNote: string | null; onHistory: () => void; deviceScanPhase: DeviceScanPhase; deviceScanProgress: number; startDeviceScan: () => void;
}) {
  const reviewCopy = deviceScanPhase === 'scanning'
    ? 'Reviewing the local engines, file inspector, and Android permission boundaries.'
    : deviceScanPhase === 'complete'
      ? 'The available coverage has been mapped. Open a module below to perform a supported check.'
      : 'Review every security surface this build can access, then drill into a supported check.';

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <TopTitle kicker="SCAN CENTRE" title="FULL SECURITY REVIEW" description="One calm place to understand your device coverage, assess links, inspect files, and open protection modules." />

      <View style={styles.scanHero}>
        <TelemetryBackdrop active={deviceScanPhase !== 'complete'} />
        <View style={styles.scanHeroContent}>
          <View style={styles.scanHeroTopline}><View style={styles.scanLivePill}><SignalMark severity={deviceScanPhase === 'complete' ? 'safe' : deviceScanPhase === 'scanning' ? 'warning' : 'info'} /><Text style={styles.scanLiveText}>{deviceScanPhase === 'scanning' ? 'REVIEW IN PROGRESS' : deviceScanPhase === 'complete' ? 'LOCAL REVIEW COMPLETE' : 'LOCAL-FIRST REVIEW'}</Text></View><Text style={styles.scanHeroCount}>06 SURFACES</Text></View>
          <ScanRadar phase={deviceScanPhase} progress={deviceScanProgress} />
          <Text style={styles.scanHeroTitle}>{deviceScanPhase === 'complete' ? 'Coverage map updated' : 'Run a device review'}</Text>
          <Text style={styles.scanHeroCopy}>{reviewCopy}</Text>
          <Pressable disabled={deviceScanPhase === 'scanning'} style={[styles.reviewButton, deviceScanPhase === 'scanning' && styles.buttonDisabled]} onPress={startDeviceScan}>
            <Text style={styles.reviewButtonText}>{deviceScanPhase === 'scanning' ? `REVIEWING ${deviceScanProgress}%` : deviceScanPhase === 'complete' ? 'RUN REVIEW AGAIN' : 'RUN DEVICE REVIEW'}</Text>
            <Text style={styles.reviewButtonGlyph}>{deviceScanPhase === 'scanning' ? '◌' : '↗'}</Text>
          </Pressable>
          <Text style={styles.scanBoundary}>This maps local capabilities and permissions. It does not claim a device-wide antivirus or network scan.</Text>
        </View>
      </View>

      <View style={styles.scanModeBar}>
        <Pressable style={[styles.scanMode, mode === 'overview' && styles.scanModeActive]} onPress={() => setMode('overview')}><Text style={[styles.scanModeText, mode === 'overview' && styles.scanModeTextActive]}>OVERVIEW</Text></Pressable>
        <Pressable style={[styles.scanMode, mode === 'url' && styles.scanModeActive]} onPress={() => setMode('url')}><Text style={[styles.scanModeText, mode === 'url' && styles.scanModeTextActive]}>LINK</Text></Pressable>
        <Pressable style={[styles.scanMode, mode === 'file' && styles.scanModeActive]} onPress={() => setMode('file')}><Text style={[styles.scanModeText, mode === 'file' && styles.scanModeTextActive]}>FILE</Text></Pressable>
      </View>

      {mode === 'overview' && <ScanOverview />}
      {mode === 'url' && (
        <View style={styles.scanToolPanel}>
          <Text style={styles.toolKicker}>LINK / MESSAGE CHECK</Text>
          <Text style={styles.toolTitle}>Assess a destination before opening it</Text>
          <View style={styles.urlInputWrap}>
            <Text style={styles.inputPrefix}>https://</Text>
            <TextInput value={url} onChangeText={setUrl} placeholder="example.net or pasted message link" placeholderTextColor="#66736C" autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.urlInput} />
          </View>
          <Pressable disabled={urlPhase === 'scanning'} style={[styles.primaryButton, urlPhase === 'scanning' && styles.buttonDisabled]} onPress={submitUrl}>
            <Text style={styles.primaryButtonText}>{urlPhase === 'scanning' ? 'ANALYSING STRUCTURE…' : 'ASSESS LINK'}</Text><Text style={styles.buttonGlyph}>{urlPhase === 'scanning' ? '◌' : '↗'}</Text>
          </Pressable>
          <Text style={styles.disclaimer}>Structural analysis is performed locally. “Clear” means no high-risk local signals, not a guarantee that a site is safe.</Text>
          {result && <UrlResult result={result} />}
        </View>
      )}
      {mode === 'file' && (
        <View style={styles.scanToolPanel}>
          <Text style={styles.toolKicker}>FILE INSPECTOR</Text>
          <Text style={styles.toolTitle}>Review a file without uploading it</Text>
          <View style={styles.fileDrop}>
            <Text style={styles.fileGlyph}>＋</Text><Text style={styles.fileTitle}>CHOOSE A FILE</Text><Text style={styles.fileCopy}>The file stays on this device. This build performs a metadata assessment only; a configured backend can provide isolated ClamAV and YARA scanning.</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={chooseFile}><Text style={styles.primaryButtonText}>SELECT FILE</Text><Text style={styles.buttonGlyph}>↗</Text></Pressable>
          {fileNote && <View style={styles.fileResult}><SignalMark severity={fileNote.includes('executable') ? 'warning' : 'info'} /><Text style={styles.fileResultText}>{fileNote}</Text></View>}
          <View style={styles.engineLine}><Text style={styles.engineLabel}>ENGINE STATUS</Text><Text style={styles.engineValue}>OFFLINE METADATA · BACKEND NOT CONFIGURED</Text></View>
        </View>
      )}
      <Pressable style={styles.historyLink} onPress={onHistory}><Text style={styles.historyLinkTitle}>SCAN HISTORY</Text><Text style={styles.historyLinkCopy}>Review locally stored link and file assessments</Text><Text style={styles.chevron}>›</Text></Pressable>
      <View style={{ height: 94 }} />
    </ScrollView>
  );
}

function ScanOverview() {
  const surfaces: { name: string; state: string; detail: string; severity: Severity }[] = [
    { name: 'Link & message guard', state: 'READY', detail: 'On-device structural checks', severity: 'safe' },
    { name: 'File inspector', state: 'READY', detail: 'Metadata review only', severity: 'safe' },
    { name: 'App security', state: 'PERMISSION', detail: 'Needs native Android consent', severity: 'warning' },
    { name: 'Wi-Fi & Bluetooth', state: 'PERMISSION', detail: 'Needs nearby-device access', severity: 'warning' },
    { name: 'Network monitor', state: 'SAMPLE', detail: 'No VPN interception', severity: 'info' },
    { name: 'Threat intelligence', state: 'OFFLINE', detail: 'No provider configured', severity: 'info' },
  ];

  return (
    <View style={styles.overviewPanel}>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>PROTECTION SURFACES</Text><Text style={styles.meta}>06 MAPPED</Text></View>
      <Text style={styles.overviewIntro}>Open a focused tool when you want to act. Statuses stay explicit so the visual layer never overstates protection.</Text>
      <View style={styles.surfaceGrid}>{surfaces.map((surface) => <ScanSurfaceCard key={surface.name} {...surface} />)}</View>
      <View style={styles.overviewNote}><SignalMark severity="info" /><Text style={styles.overviewNoteText}>Device-wide malware scanning, live Wi-Fi analysis, and network capture require additional native modules and explicit Android permissions.</Text></View>
    </View>
  );
}

function ScanSurfaceCard({ name, state, detail, severity }: { name: string; state: string; detail: string; severity: Severity }) {
  return <View style={styles.surfaceCard}><View style={styles.surfaceCardTop}><SignalMark severity={severity} /><Text style={[styles.surfaceState, { color: severityColor(severity) }]}>{state}</Text></View><Text style={styles.surfaceName} numberOfLines={2}>{name}</Text><Text style={styles.surfaceDetail} numberOfLines={2}>{detail}</Text></View>;
}

function UrlResult({ result }: { result: UrlScanResult }) {
  const resultName = result.verdict === 'safe' ? 'NO HIGH-RISK LOCAL SIGNALS' : result.verdict === 'suspicious' ? 'REVIEW BEFORE OPENING' : result.verdict === 'malicious' ? 'LOCAL THREAT MATCH' : 'UNABLE TO ASSESS';
  return (
    <View style={styles.resultBox}>
      <View style={styles.rowBetween}><View><Text style={styles.resultKicker}>ASSESSMENT RESULT</Text><Text style={[styles.resultName, { color: severityColor(result.verdict === 'safe' ? 'safe' : result.verdict === 'suspicious' ? 'warning' : result.verdict === 'malicious' ? 'danger' : 'info') }]}>{resultName}</Text></View><SeverityTag verdict={result.verdict} /></View>
      <View style={styles.normalized}><Text style={styles.normalizedLabel}>NORMALIZED ADDRESS</Text><Text style={styles.normalizedText} numberOfLines={2}>{result.normalized || '—'}</Text></View>
      {result.findings.map((item, index) => <FindingRow key={index} severity={item.severity} title={item.label} description={item.detail} compact />)}
      <View style={styles.recommendation}><Text style={styles.recommendationLabel}>RECOMMENDATION</Text><Text style={styles.recommendationText}>{result.recommendation}</Text></View>
      <Text style={styles.coverageText}>{result.coverage}</Text>
    </View>
  );
}

function ActivityScreen({ history, onHistory, onAlerts }: { history: ScanHistoryItem[]; onHistory: () => void; onAlerts: () => void }) {
  const recent = history.slice(0, 3);
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <TopTitle kicker="ACTIVITY" title="EVIDENCE, NOT NOISE" description="A concise, local record of actions and signals that need your attention." />
      <Pressable style={styles.alertBanner} onPress={onAlerts}><SignalMark severity="warning" /><View style={{ flex: 1 }}><Text style={styles.alertBannerTitle}>02 ACTIVE NOTICES</Text><Text style={styles.alertBannerCopy}>One link assessment awaits review.</Text></View><Text style={styles.chevron}>›</Text></Pressable>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>RECENT ASSESSMENTS</Text><Pressable onPress={onHistory}><Text style={styles.actionText}>HISTORY</Text></Pressable></View>
      {recent.length ? recent.map((item) => <HistoryRow key={item.id} item={item} />) : <EmptyState title="No local assessments yet" description="Use Scan Centre to inspect a link or select a file." />}
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>ASSESSMENT COVERAGE</Text><Text style={styles.meta}>TODAY</Text></View>
      <View style={styles.analyticsCard}>
        <View style={styles.analyticsHeading}><Text style={styles.analyticsNumber}>{history.length}</Text><Text style={styles.analyticsLabel}>LOCAL SCANS{'\n'}STORED ON DEVICE</Text></View>
        <Waveform />
        <View style={styles.coverageGrid}><Metric number="01" label="URL ENGINE" status="AVAILABLE" /><Metric number="00" label="FILE ENGINES" status="CONFIGURE" /><Metric number="00" label="VPN EVENTS" status="OFF" /></View>
      </View>
      <View style={{ height: 95 }} />
    </ScrollView>
  );
}

function MonitorScreen({ spin, isMonitoring, setIsMonitoring }: { spin: Animated.Value; isMonitoring: boolean; setIsMonitoring: (value: boolean) => void }) {
  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 80 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.monitorHeader}><View><Text style={styles.eyebrow}>LOCAL OBSERVATORY</Text><Text style={styles.monitorTitle}>{isMonitoring ? 'MONITORING' : 'PAUSED'}</Text></View><Switch value={isMonitoring} onValueChange={setIsMonitoring} trackColor={{ false: color.surface3, true: color.accent + '99' }} thumbColor={isMonitoring ? color.text : color.muted} /></View>
      <RadialMonitor spin={spin} isMonitoring={isMonitoring} />
      <View style={styles.monitorExplain}><SignalMark severity={isMonitoring ? 'safe' : 'info'} /><Text style={styles.monitorExplainText}>{isMonitoring ? 'Animated sample telemetry is running. No network traffic is captured.' : 'Enable to view illustrative events and radial activity. This does not start a VPN.'}</Text></View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>LIVE EVENT FEED</Text><Text style={styles.meta}>{isMonitoring ? 'SAMPLE' : 'PAUSED'}</Text></View>
      {isMonitoring ? <>
        <EventRow severity="warning" title="Background signal anomaly" detail="Illustrative event · a native network monitor is not enabled." />
        <EventRow severity="info" title="Permission boundary respected" detail="No installed-app or packet data was collected." />
        <EventRow severity="safe" title="Local scanner standing by" detail="URL structure assessment is available on demand." />
      </> : <EmptyState title="Monitoring is paused" description="Enable sample mode to preview the event interface. Native VPN monitoring must be built and explicitly authorized separately." />}
      <View style={styles.privacyCallout}><Text style={styles.privacyCalloutTitle}>PRIVACY BOUNDARY</Text><Text style={styles.privacyCalloutCopy}>CyberShield never starts traffic interception silently. A production VPN monitor requires a clear Android system consent screen and an always-visible stop control.</Text></View>
    </ScrollView>
  );
}

function HistoryScreen({ history }: { history: ScanHistoryItem[] }) {
  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 80 }]} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenIntro}>Results stay in local app storage with no cloud sync. This MVP does not store credentials or secrets in scan history.</Text>
      {history.length ? history.map((item) => <HistoryRow key={item.id} item={item} />) : <EmptyState title="No scan history" description="Your assessments will appear here after you use Scan Centre." />}
    </ScrollView>
  );
}

function AlertsScreen() {
  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 80 }]} showsVerticalScrollIndicator={false}>
      {alertSeed.map((alert) => <EventRow key={alert.id} severity={alert.severity} title={alert.title} detail={alert.description + ' · ' + alert.time} unread={alert.unread} />)}
      <View style={styles.privacyCallout}><Text style={styles.privacyCalloutTitle}>NOTIFICATION POLICY</Text><Text style={styles.privacyCalloutCopy}>This MVP does not schedule background notifications. A production notification module should be opt-in, rate-limited, and useful.</Text></View>
    </ScrollView>
  );
}

function ModuleDetailScreen({ module }: { module: typeof moduleItems[number] }) {
  const permissionText = module.status === 'Permission needed'
    ? 'This function needs explicit Android consent in a native development build. It is intentionally not requested by this Expo MVP.'
    : module.status === 'Sample mode'
      ? 'This interface explains the intended capability but does not inspect traffic, connections, or applications.'
      : 'The module has no configured intelligence source on this device.';
  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 80 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.moduleHero}><View style={styles.moduleHeroSymbol}><Text style={styles.moduleHeroSymbolText}>{module.symbol}</Text></View><Text style={styles.moduleHeroTitle}>{module.name.toUpperCase()}</Text><ModuleStatus status={module.status} /></View>
      <Text style={styles.moduleHeroCopy}>{module.detail}</Text>
      <View style={styles.permissionPanel}><Text style={styles.permissionPanelKicker}>CAPABILITY BOUNDARY</Text><Text style={styles.permissionPanelText}>{permissionText}</Text></View>
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>WHAT A PRODUCTION MODULE CAN DO</Text></View>
      <FindingRow severity="info" title={module.name === 'Wi-Fi security' ? 'Connection and DNS diagnostics' : module.name === 'Bluetooth visibility' ? 'Nearby-device awareness' : module.name === 'App security' ? 'Package metadata and permission review' : 'User-authorized VPN metadata'} description="Implementation is subject to Android version, permission, and Play policy restrictions." />
      <FindingRow severity="warning" title="What it cannot claim" description="No password cracking, bypassing encryption, private app memory inspection, or silent interception." />
    </ScrollView>
  );
}

function SettingsScreen({ onLearning, onOnboarding }: { onLearning: () => void; onOnboarding: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <TopTitle kicker="CONTROL ROOM" title="PRIVACY IS A FEATURE" description="Review data boundaries and configure integrations without placing secrets in the app." />
      <SettingsRow title="Local storage" value="SCAN HISTORY ON DEVICE" />
      <SettingsRow title="Reputation provider" value="NOT CONFIGURED" />
      <SettingsRow title="File scanning backend" value="NOT CONFIGURED" />
      <SettingsRow title="Notifications" value="NO BACKGROUND ALERTS" />
      <Pressable style={styles.settingAction} onPress={onLearning}><View><Text style={styles.settingActionTitle}>Security field notes</Text><Text style={styles.settingActionCopy}>Phishing, public Wi-Fi and privacy guides</Text></View><Text style={styles.chevron}>›</Text></Pressable>
      <Pressable style={styles.settingAction} onPress={onOnboarding}><View><Text style={styles.settingActionTitle}>Review privacy promise</Text><Text style={styles.settingActionCopy}>What CyberShield can and cannot see</Text></View><Text style={styles.chevron}>›</Text></Pressable>
      <View style={styles.aboutBlock}><Text style={styles.aboutWordmark}>CYBERSHIELD</Text><Text style={styles.aboutVersion}>MVP 0.2.1 · LOCAL-FIRST</Text><Text style={styles.aboutCopy}>Know your digital environment. Stay ahead of threats.</Text></View>
      <View style={{ height: 95 }} />
    </ScrollView>
  );
}

function LearningScreen() {
  const notes = [
    ['Phishing signals', 'Verify the registered domain, not just a familiar word in the address. Urgency is a pressure tactic.'],
    ['Public Wi-Fi', 'Prefer HTTPS, avoid sensitive changes on untrusted networks, and turn off auto-join when you leave.'],
    ['App installs', 'Install from trusted stores, review sensitive permissions, and remove applications you no longer use.'],
    ['Account recovery', 'Use a password manager and phishing-resistant multi-factor authentication where available.'],
  ];
  return <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 80 }]} showsVerticalScrollIndicator={false}>{notes.map(([title, copy], index) => <View key={title} style={styles.noteCard}><Text style={styles.noteIndex}>0{index + 1}</Text><Text style={styles.noteTitle}>{title}</Text><Text style={styles.noteCopy}>{copy}</Text></View>)}</ScrollView>;
}

function OnboardingScreen() {
  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 80 }]} showsVerticalScrollIndicator={false}>
      <Text style={styles.onboardWordmark}>CYBER{'\n'}SHIELD</Text><Text style={styles.onboardTagline}>Know your digital environment.{'\n'}Stay ahead of threats.</Text>
      <View style={styles.onboardRule} />
      <Text style={styles.onboardTitle}>THE HONEST{'\n'}PROTECTION PROMISE</Text>
      <FindingRow severity="safe" title="We assess what is available" description="The local URL engine works offline and explains exactly which checks ran." />
      <FindingRow severity="warning" title="We ask before accessing" description="Device inventory, Wi-Fi, Bluetooth and VPN monitoring require explicit Android permissions." />
      <FindingRow severity="info" title="We state our limits" description="A clear local assessment never means an absolute guarantee. Missing services are disclosed, not painted green." />
    </ScrollView>
  );
}

function BackHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return <View style={styles.backHeader}><Pressable onPress={onBack} hitSlop={10}><Text style={styles.backArrow}>←</Text></Pressable><Text style={styles.backTitle}>{title.toUpperCase()}</Text><View style={{ width: 22 }} /></View>;
}

function BottomNavigation({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  const tabs: { screen: Screen; icon: string; label: string }[] = [
    { screen: 'home', icon: '⌂', label: 'HOME' },
    { screen: 'protection', icon: '◫', label: 'PROTECT' },
    { screen: 'scan', icon: '⌁', label: 'SCAN' },
    { screen: 'activity', icon: '≋', label: 'ACTIVITY' },
    { screen: 'settings', icon: '◌', label: 'SETTINGS' },
  ];
  return <View style={styles.nav}>{tabs.map((tab) => <Pressable key={tab.screen} style={[styles.navItem, tab.screen === 'scan' && styles.navScan, active === tab.screen && styles.navItemActive]} onPress={() => onNavigate(tab.screen)}><Text style={[styles.navIcon, active === tab.screen && styles.navActiveText, tab.screen === 'scan' && styles.navScanText]}>{tab.icon}</Text><Text style={[styles.navLabel, active === tab.screen && styles.navActiveText, tab.screen === 'scan' && styles.navScanText]}>{tab.label}</Text></Pressable>)}</View>;
}

function TopTitle({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return <View style={styles.titleBlock}><Text style={styles.eyebrow}>{kicker}</Text><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageDescription}>{description}</Text></View>;
}

function FindingRow({ severity, title, description, compact = false }: { severity: Severity; title: string; description: string; compact?: boolean }) {
  return <View style={[styles.findingRow, compact && styles.findingRowCompact]}><View style={styles.findingStem}><SignalMark severity={severity} size={8} /><View style={[styles.stemLine, { backgroundColor: severityColor(severity) + '66' }]} /></View><View style={{ flex: 1 }}><Text style={styles.findingTitle}>{title}</Text><Text style={styles.findingDescription}>{description}</Text></View></View>;
}

function HistoryRow({ item }: { item: ScanHistoryItem }) {
  const time = new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return <View style={styles.historyRow}><View style={styles.historyKind}><Text style={styles.historyKindText}>{item.kind === 'url' ? 'URL' : 'FILE'}</Text></View><View style={{ flex: 1 }}><Text style={styles.historySubject} numberOfLines={1}>{item.subject}</Text><Text style={styles.historyDetail} numberOfLines={1}>{item.detail}</Text><Text style={styles.historyTime}>{time}</Text></View><SeverityTag verdict={item.verdict} /></View>;
}

function EventRow({ severity, title, detail, unread = false }: { severity: Severity; title: string; detail: string; unread?: boolean }) {
  return <View style={[styles.eventRow, unread && styles.eventUnread]}><SignalMark severity={severity} /><View style={{ flex: 1 }}><Text style={styles.eventTitle}>{title}</Text><Text style={styles.eventDetail}>{detail}</Text></View><Text style={styles.eventTime}>NOW</Text></View>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <View style={styles.emptyState}><Text style={styles.emptyMark}>×</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyCopy}>{description}</Text></View>;
}

function Metric({ number, label, status }: { number: string; label: string; status: string }) {
  return <View style={styles.metric}><Text style={styles.metricNumber}>{number}</Text><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricStatus}>{status}</Text></View>;
}

function SettingsRow({ title, value }: { title: string; value: string }) {
  return <View style={styles.settingsRow}><Text style={styles.settingsTitle}>{title}</Text><Text style={styles.settingsValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: color.ink },
  screenTransition: { flex: 1 },
  scrollContent: { paddingTop: Platform.select({ ios: 66, android: 44, default: 40 }), paddingHorizontal: space.md, paddingBottom: 24 },
  topStatus: { flexDirection: 'row', alignItems: 'center', minHeight: 36, marginBottom: 30 },
  brandMark: { width: 35, height: 35, backgroundColor: color.surface3, padding: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  brandDot: { width: 6, height: 6, backgroundColor: color.soft },
  connection: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 13, borderRightWidth: 1, borderRightColor: color.line },
  connectionText: { color: color.muted, fontSize: 9, letterSpacing: .8, fontWeight: '700', flexShrink: 1 },
  bell: { color: color.text, fontSize: 27, marginLeft: 13, transform: [{ rotate: '180deg' }] },
  eyebrow: { color: color.accent, fontSize: 10, letterSpacing: 1.5, fontWeight: '800' },
  greeting: { color: color.text, fontSize: 28, lineHeight: 33, letterSpacing: -1.1, fontWeight: '700', marginTop: 9 },
  subtle: { color: color.muted, fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: 330 },
  dashboardGrid: { marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderLeftWidth: 1, borderColor: color.line },
  gridCell: { width: '50%', minHeight: 111, borderBottomWidth: 1, borderRightWidth: 1, borderColor: color.line, padding: 14 },
  activeCell: { backgroundColor: color.surface3 },
  cellLabel: { color: color.accent, fontSize: 12, fontWeight: '700', lineHeight: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  powerCircle: { width: 35, height: 35, borderRadius: 18, borderWidth: 1, borderColor: color.accent, alignItems: 'center', justifyContent: 'center' },
  powerGlyph: { color: color.accent, fontSize: 19 },
  cellFoot: { color: color.muted, fontSize: 10, marginTop: 19 },
  counterCell: { width: '50%', minHeight: 111, borderBottomWidth: 1, borderRightWidth: 1, borderColor: color.line, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  counterValue: { color: color.accent, fontSize: 28, fontVariant: ['tabular-nums'], fontWeight: '300' },
  counterText: { color: color.text, fontSize: 10, fontWeight: '600', lineHeight: 14, flex: 1 },
  scoreCell: { width: '50%', minHeight: 176, borderBottomWidth: 1, borderRightWidth: 1, borderColor: color.line, padding: 14, backgroundColor: color.soft, justifyContent: 'space-between' },
  scoreLabel: { color: color.ink, fontSize: 11, lineHeight: 14, fontWeight: '800' },
  bigScore: { color: color.ink, fontSize: 68, lineHeight: 70, letterSpacing: -4, fontWeight: '800', fontVariant: ['tabular-nums'], alignSelf: 'center', marginTop: 2 },
  scoreCaption: { color: '#315443', fontSize: 8, letterSpacing: .8, alignSelf: 'center', fontWeight: '800' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 10 },
  sectionTitle: { color: color.text, fontSize: 12, fontWeight: '800', letterSpacing: .3 },
  meta: { color: color.muted, fontSize: 10, fontWeight: '700', letterSpacing: .7 },
  actionText: { color: color.accent, fontSize: 10, fontWeight: '800', letterSpacing: .6 },
  tracePanel: { padding: 13, backgroundColor: color.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line },
  traceCaption: { color: color.muted, fontSize: 10, lineHeight: 14, marginTop: 7 },
  findingRow: { flexDirection: 'row', gap: 11, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: color.line },
  findingRowCompact: { paddingVertical: 10 },
  findingStem: { alignItems: 'center', width: 10 },
  stemLine: { width: 1, flex: 1, marginTop: 7, minHeight: 14 },
  findingTitle: { color: color.text, fontSize: 13, fontWeight: '700' },
  findingDescription: { color: color.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  miniModules: { flexDirection: 'row', gap: 7 },
  miniModule: { flex: 1, minHeight: 101, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface, padding: 10, justifyContent: 'space-between' },
  miniSymbol: { color: color.soft, fontSize: 11, fontWeight: '800', letterSpacing: .5 },
  miniTitle: { color: color.text, fontSize: 10, lineHeight: 13, fontWeight: '600' },
  floatingScan: { position: 'absolute', bottom: 23, alignSelf: 'center', width: 112, height: 48, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  floatingScanText: { color: color.ink, fontWeight: '900', fontSize: 11, letterSpacing: .8 },
  floatingScanArrow: { color: color.ink, fontWeight: '900', fontSize: 15 },
  titleBlock: { marginBottom: 23 },
  pageTitle: { color: color.text, fontSize: 29, lineHeight: 34, letterSpacing: -1.1, fontWeight: '700', marginTop: 9 },
  pageDescription: { color: color.muted, fontSize: 12, lineHeight: 18, marginTop: 10, maxWidth: 350 },
  monitorPreview: { minHeight: 128, padding: 16, backgroundColor: color.surface2, borderWidth: 1, borderColor: color.line, flexDirection: 'row', gap: 14, alignItems: 'center' },
  previewDisc: { width: 78, height: 78, borderRadius: 39, borderWidth: 5, borderLeftColor: color.accent, borderTopColor: color.accent, borderBottomColor: color.line, borderRightColor: color.line, alignItems: 'center', justifyContent: 'center' },
  previewValue: { color: color.text, fontSize: 23, fontVariant: ['tabular-nums'], fontWeight: '300' },
  previewLabel: { color: color.muted, fontSize: 7, letterSpacing: .5 },
  cardKicker: { color: color.accent, fontSize: 9, fontWeight: '800', letterSpacing: .8 },
  previewTitle: { color: color.text, fontSize: 14, lineHeight: 18, fontWeight: '700', marginTop: 5 },
  previewCopy: { color: color.muted, fontSize: 10, marginTop: 5, lineHeight: 14 },
  chevron: { color: color.muted, fontSize: 26, fontWeight: '300' },
  moduleRow: { minHeight: 107, borderTopWidth: 1, borderColor: color.line, paddingVertical: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  moduleSymbol: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: color.soft + '99', justifyContent: 'center', alignItems: 'center' },
  moduleSymbolText: { color: color.soft, fontWeight: '800', fontSize: 10 },
  moduleMiddle: { flex: 1, gap: 6 },
  moduleName: { color: color.text, fontSize: 14, fontWeight: '700' },
  moduleDetail: { color: color.muted, fontSize: 10, lineHeight: 14 },
  factStrip: { marginTop: 12, backgroundColor: color.surface3, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  factNumber: { color: color.warning, fontSize: 36, fontWeight: '300', fontVariant: ['tabular-nums'] },
  factText: { color: color.text, fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 16 },
  factEnd: { color: color.muted, fontSize: 8, letterSpacing: .7, width: 57 },
  scanHero: { minHeight: 474, overflow: 'hidden', backgroundColor: '#0A100D', borderWidth: 1, borderColor: '#244432', marginBottom: 18 },
  scanHeroContent: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 16 },
  scanHeroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  scanLivePill: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: color.surface3 + 'E8', borderWidth: 1, borderColor: '#315342', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 14 },
  scanLiveText: { color: color.text, fontSize: 8, letterSpacing: .7, fontWeight: '800' },
  scanHeroCount: { color: color.muted, fontSize: 9, letterSpacing: .8, fontWeight: '800' },
  scanHeroTitle: { color: color.text, textAlign: 'center', fontSize: 18, lineHeight: 23, fontWeight: '700', marginTop: 1 },
  scanHeroCopy: { color: color.muted, textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 6, maxWidth: 300, alignSelf: 'center' },
  reviewButton: { minHeight: 52, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginTop: 15 },
  reviewButtonText: { color: color.ink, fontSize: 11, letterSpacing: .95, fontWeight: '900' },
  reviewButtonGlyph: { color: color.ink, fontSize: 17, fontWeight: '900' },
  scanBoundary: { color: '#91A79B', fontSize: 9, lineHeight: 13, textAlign: 'center', marginTop: 10, paddingHorizontal: 8 },
  scanModeBar: { flexDirection: 'row', padding: 4, backgroundColor: color.surface2, borderWidth: 1, borderColor: color.line, marginBottom: 2 },
  scanMode: { flex: 1, minHeight: 42, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  scanModeActive: { backgroundColor: color.surface3, borderBottomColor: color.accent },
  scanModeText: { color: color.muted, fontSize: 9, letterSpacing: .6, fontWeight: '800' },
  scanModeTextActive: { color: color.text },
  overviewPanel: { paddingTop: 1 },
  overviewIntro: { color: color.muted, fontSize: 11, lineHeight: 16, marginBottom: 13 },
  surfaceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  surfaceCard: { width: '48.7%', minHeight: 118, padding: 12, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line, justifyContent: 'space-between' },
  surfaceCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  surfaceState: { fontSize: 8, fontWeight: '900', letterSpacing: .55, flexShrink: 1, textAlign: 'right' },
  surfaceName: { color: color.text, fontSize: 12, lineHeight: 16, fontWeight: '700', marginTop: 13 },
  surfaceDetail: { color: color.muted, fontSize: 9, lineHeight: 13, marginTop: 5 },
  overviewNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14, padding: 13, borderLeftWidth: 2, borderLeftColor: color.accent, backgroundColor: color.surface2 },
  overviewNoteText: { color: color.muted, flex: 1, fontSize: 10, lineHeight: 15 },
  scanToolPanel: { marginTop: 22 },
  toolKicker: { color: color.accent, fontSize: 9, fontWeight: '900', letterSpacing: .9 },
  toolTitle: { color: color.text, fontSize: 17, lineHeight: 22, fontWeight: '700', marginTop: 7, marginBottom: 13 },
  modeToggle: { flexDirection: 'row', backgroundColor: color.surface2, padding: 4, marginBottom: 14 },
  modeTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  modeTabActive: { backgroundColor: color.surface3, borderBottomWidth: 2, borderBottomColor: color.accent },
  modeText: { color: color.muted, fontSize: 10, letterSpacing: .7, fontWeight: '800' },
  modeTextActive: { color: color.text },
  urlInputWrap: { flexDirection: 'row', alignItems: 'center', height: 59, backgroundColor: color.surface2, borderWidth: 1, borderColor: color.line, paddingHorizontal: 13 },
  inputPrefix: { color: color.soft, fontSize: 13 },
  urlInput: { color: color.text, fontSize: 13, flex: 1, paddingHorizontal: 3, height: '100%' },
  primaryButton: { height: 54, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 11, marginTop: 9 },
  buttonDisabled: { backgroundColor: color.soft, opacity: .7 },
  primaryButtonText: { color: color.ink, fontSize: 12, fontWeight: '900', letterSpacing: .8 },
  buttonGlyph: { color: color.ink, fontSize: 18, fontWeight: '800' },
  disclaimer: { color: color.muted, fontSize: 10, lineHeight: 14, marginTop: 12 },
  resultBox: { marginTop: 23, borderTopWidth: 2, borderColor: color.accent, paddingTop: 15 },
  resultKicker: { color: color.muted, fontSize: 9, letterSpacing: .8, fontWeight: '800' },
  resultName: { fontSize: 16, lineHeight: 20, fontWeight: '800', marginTop: 5, maxWidth: 210 },
  normalized: { marginTop: 16, backgroundColor: color.surface2, padding: 12 },
  normalizedLabel: { color: color.muted, fontSize: 8, fontWeight: '800', letterSpacing: .6 },
  normalizedText: { color: color.soft, fontSize: 11, lineHeight: 16, marginTop: 6 },
  recommendation: { marginTop: 16, borderLeftWidth: 2, borderLeftColor: color.accent, paddingLeft: 11 },
  recommendationLabel: { color: color.accent, fontSize: 9, letterSpacing: .7, fontWeight: '800' },
  recommendationText: { color: color.text, fontSize: 12, lineHeight: 17, marginTop: 5 },
  coverageText: { color: color.muted, fontSize: 9, lineHeight: 13, marginTop: 14 },
  fileDrop: { minHeight: 182, justifyContent: 'center', alignItems: 'center', padding: 22, backgroundColor: color.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: '#456455' },
  fileGlyph: { color: color.accent, fontSize: 31, fontWeight: '200' },
  fileTitle: { color: color.text, fontSize: 12, fontWeight: '800', letterSpacing: .8, marginTop: 6 },
  fileCopy: { color: color.muted, textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 8 },
  fileResult: { marginTop: 16, flexDirection: 'row', gap: 10, padding: 13, backgroundColor: color.surface2, alignItems: 'flex-start' },
  fileResultText: { color: color.text, fontSize: 11, lineHeight: 16, flex: 1 },
  engineLine: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', gap: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line, paddingVertical: 12 },
  engineLabel: { color: color.muted, fontSize: 9, fontWeight: '800' },
  engineValue: { color: color.warning, fontSize: 9, fontWeight: '800', textAlign: 'right', flex: 1 },
  historyLink: { minHeight: 69, marginTop: 25, borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line, flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyLinkTitle: { color: color.text, fontSize: 12, fontWeight: '800' },
  historyLinkCopy: { color: color.muted, fontSize: 10, flex: 1, marginLeft: 3 },
  alertBanner: { flexDirection: 'row', gap: 11, alignItems: 'center', padding: 15, backgroundColor: '#29251A', borderLeftWidth: 2, borderLeftColor: color.warning },
  alertBannerTitle: { color: color.warning, fontSize: 11, fontWeight: '800', letterSpacing: .6 },
  alertBannerCopy: { color: color.text, fontSize: 11, marginTop: 4 },
  historyRow: { minHeight: 83, borderTopWidth: 1, borderColor: color.line, flexDirection: 'row', gap: 10, paddingVertical: 13, alignItems: 'center' },
  historyKind: { width: 38, height: 38, borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center' },
  historyKindText: { color: color.soft, fontSize: 9, fontWeight: '800' },
  historySubject: { color: color.text, fontSize: 12, fontWeight: '700' },
  historyDetail: { color: color.muted, fontSize: 9, marginTop: 3 },
  historyTime: { color: '#66736C', fontSize: 9, marginTop: 3 },
  analyticsCard: { backgroundColor: color.surface2, padding: 16 },
  analyticsHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  analyticsNumber: { color: color.accent, fontSize: 42, fontVariant: ['tabular-nums'], fontWeight: '300' },
  analyticsLabel: { color: color.text, fontSize: 10, fontWeight: '700', lineHeight: 14 },
  coverageGrid: { flexDirection: 'row', borderTopWidth: 1, borderColor: color.line, paddingTop: 12, gap: 7 },
  metric: { flex: 1 },
  metricNumber: { color: color.soft, fontSize: 19, fontVariant: ['tabular-nums'] },
  metricLabel: { color: color.text, fontSize: 8, lineHeight: 11, marginTop: 2 },
  metricStatus: { color: color.muted, fontSize: 7, marginTop: 5, letterSpacing: .4 },
  backHeader: { position: 'absolute', top: Platform.select({ ios: 49, android: 27, default: 24 }), left: 16, right: 16, zIndex: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backArrow: { color: color.text, fontSize: 25 },
  backTitle: { color: color.text, fontSize: 12, fontWeight: '700' },
  monitorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monitorTitle: { color: color.text, fontSize: 20, fontWeight: '700', marginTop: 5, letterSpacing: -.8 },
  monitorExplain: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 13, borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line },
  monitorExplainText: { color: color.muted, fontSize: 11, lineHeight: 16, flex: 1 },
  eventRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderBottomWidth: 1, borderColor: color.line },
  eventUnread: { backgroundColor: color.surface2 },
  eventTitle: { color: color.text, fontSize: 12, fontWeight: '700' },
  eventDetail: { color: color.muted, fontSize: 10, lineHeight: 14, marginTop: 4 },
  eventTime: { color: '#66736C', fontSize: 8, marginTop: 2 },
  privacyCallout: { marginTop: 24, padding: 16, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface },
  privacyCalloutTitle: { color: color.soft, fontSize: 10, letterSpacing: .8, fontWeight: '800' },
  privacyCalloutCopy: { color: color.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  emptyState: { alignItems: 'center', padding: 29, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line },
  emptyMark: { color: color.muted, fontSize: 30, fontWeight: '200' },
  emptyTitle: { color: color.text, fontSize: 13, fontWeight: '700', marginTop: 5 },
  emptyCopy: { color: color.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 7, maxWidth: 260 },
  screenIntro: { color: color.muted, fontSize: 11, lineHeight: 17, marginBottom: 18 },
  moduleHero: { alignItems: 'center', paddingVertical: 16 },
  moduleHeroSymbol: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: color.accent, justifyContent: 'center', alignItems: 'center' },
  moduleHeroSymbolText: { color: color.accent, fontSize: 18, fontWeight: '800' },
  moduleHeroTitle: { color: color.text, fontSize: 20, textAlign: 'center', fontWeight: '700', marginVertical: 12, letterSpacing: -.5 },
  moduleHeroCopy: { color: color.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 9 },
  permissionPanel: { marginTop: 25, padding: 16, backgroundColor: color.surface2, borderTopWidth: 2, borderTopColor: color.warning },
  permissionPanelKicker: { color: color.warning, fontSize: 9, fontWeight: '800', letterSpacing: .7 },
  permissionPanelText: { color: color.text, fontSize: 12, lineHeight: 18, marginTop: 7 },
  settingsRow: { minHeight: 56, borderTopWidth: 1, borderColor: color.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  settingsTitle: { color: color.text, fontSize: 13, fontWeight: '600' },
  settingsValue: { color: color.muted, fontSize: 9, letterSpacing: .4, textAlign: 'right' },
  settingAction: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 75, borderTopWidth: 1, borderColor: color.line },
  settingActionTitle: { color: color.text, fontSize: 13, fontWeight: '700' },
  settingActionCopy: { color: color.muted, fontSize: 10, marginTop: 5 },
  aboutBlock: { alignItems: 'center', paddingTop: 40 },
  aboutWordmark: { color: color.text, letterSpacing: 4, fontSize: 14, fontWeight: '800' },
  aboutVersion: { color: color.accent, fontSize: 9, letterSpacing: 1, marginTop: 9 },
  aboutCopy: { color: color.muted, fontSize: 11, marginTop: 12 },
  noteCard: { padding: 18, backgroundColor: color.surface2, marginBottom: 10, borderLeftWidth: 2, borderColor: color.accent },
  noteIndex: { color: color.accent, fontSize: 11, letterSpacing: .7 },
  noteTitle: { color: color.text, fontSize: 16, fontWeight: '700', marginTop: 8 },
  noteCopy: { color: color.muted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  onboardWordmark: { color: color.text, fontSize: 42, lineHeight: 39, letterSpacing: -3, fontWeight: '800' },
  onboardTagline: { color: color.soft, fontSize: 15, lineHeight: 22, marginTop: 17 },
  onboardRule: { height: 1, backgroundColor: color.accent, marginVertical: 31 },
  onboardTitle: { color: color.text, fontSize: 22, lineHeight: 25, letterSpacing: -1, fontWeight: '700' },
  nav: { position: 'absolute', height: 67, backgroundColor: '#101311', bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: color.line, flexDirection: 'row', paddingHorizontal: 8, alignItems: 'center' },
  navItem: { flex: 1, height: 54, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navItemActive: { backgroundColor: color.surface3 },
  navScan: { alignSelf: 'flex-start', marginTop: -16, height: 65, backgroundColor: color.accent, justifyContent: 'flex-end', paddingBottom: 8, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  navIcon: { color: color.muted, fontSize: 18, lineHeight: 20 },
  navLabel: { color: color.muted, fontSize: 7, fontWeight: '800', letterSpacing: .4 },
  navActiveText: { color: color.accent },
  navScanText: { color: color.ink },
});
