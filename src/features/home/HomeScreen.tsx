import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AmbientBackdrop, BrandHeader, ModuleGlyph, StatusDot } from '../../components/QuietSignal';
import { useTheme } from '../../core/ThemeProvider';
import { capabilities, type Capability } from '../../domain/capabilities';
import { radius, space, type } from '../../design/tokens';
import { needsAttention } from '../../domain/productState';
import type { ScanHistoryItem } from '../../types/security';
import type { AutomaticScanSettings, ScanRun } from '../../types/scanning';

type Props = {
  history: ScanHistoryItem[];
  scanRuns: ScanRun[];
  automaticScan: AutomaticScanSettings | null;
  onScan: () => void;
  onAutomaticScan: () => void;
  onFileScan: () => void;
  onProtection: () => void;
  onActivity: () => void;
  onProfile: () => void;
  onAlerts: () => void;
  onCapability: (capability: Capability) => void;
};

/** The home surface is intentionally short and visual: status, action, modules. */
export function HomeScreen({ history, scanRuns, automaticScan, onScan, onAutomaticScan, onFileScan, onProtection, onActivity, onProfile, onAlerts, onCapability }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const readyModules = capabilities.filter((module) => module.state === 'ready').length;
  const attention = history.filter((item) => needsAttention(item.verdict));
  const lastRun = scanRuns[0];
  const deviceBaselineModules = ['apps', 'wifi', 'network', 'bluetooth'] as const;
  const baseline = scanRuns.find((item) => item.mode === 'manual' && deviceBaselineModules.every((moduleId) => item.results.some((result) => result.moduleId === moduleId && result.status === 'completed')));
  const protectedState = attention.length === 0 && Boolean(baseline);
  const needsReview = attention.length > 0;
  const statusTitle = needsReview ? 'Review needed' : protectedState ? 'Protected' : 'Ready to scan';
  const statusCopy = needsReview
    ? `${attention.length} saved assessment${attention.length === 1 ? '' : 's'} needs your review`
    : protectedState
      ? 'Your latest device baseline has no review items'
      : 'Run a full device scan to create your baseline';
  const monitoringEnabled = Boolean(automaticScan?.enabled);

  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: c.canvas }]}>
    <AmbientBackdrop />
    <BrandHeader label="Protection Centre" onProfile={onProfile} />

    <View style={styles.welcomeRow}>
      <View>
        <Text style={[styles.welcomeKicker, { color: c.inkMuted }]}>Welcome back,</Text>
        <Text style={[styles.welcomeName, { color: c.ink }]}>Security admin</Text>
      </View>
      <View style={[styles.devicePill, { borderColor: c.monitoringLine, backgroundColor: c.monitoringQuiet }]}>
        <StatusDot state="safe" size={6} />
        <Text style={[styles.devicePillText, { color: c.signal }]}>THIS DEVICE</Text>
      </View>
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="Open protection modules" onPress={onProtection} style={[styles.statusHero, { backgroundColor: c.surfaceStrong, borderColor: c.monitoringLine }]}>
      <HeroWaves tone={needsReview ? c.amber : protectedState ? c.forest : c.signal} />
      <ProtectionEmblem protectedState={protectedState} needsReview={needsReview} />
      <View style={styles.statusCopy}>
        <Text style={[styles.statusKicker, { color: c.monitoringMuted }]}>DEVICE STATUS</Text>
        <Text style={[styles.statusTitle, { color: needsReview ? c.amber : protectedState ? c.forest : c.signal }]}>{statusTitle}</Text>
        <Text numberOfLines={2} style={[styles.statusSubtitle, { color: c.white }]}>{statusCopy}</Text>
        <View style={styles.statusFootnote}>
          <StatusDot state={protectedState ? 'safe' : needsReview ? 'warning' : 'info'} size={7} />
          <Text style={[styles.statusFootnoteText, { color: c.monitoringMuted }]}>{readyModules} security modules ready</Text>
        </View>
      </View>
    </Pressable>

    <View style={[styles.metrics, { backgroundColor: c.surface, borderColor: c.line }]}>
      <Metric value={String(readyModules)} label="Security modules" glyph="network" />
      <View style={[styles.metricDivider, { backgroundColor: c.line }]} />
      <Metric value={String(attention.length)} label="Issues found" glyph="phishing" warning={attention.length > 0} />
      <View style={[styles.metricDivider, { backgroundColor: c.line }]} />
      <Metric value={lastRun ? formatDate(lastRun.completedAt) : '—'} label="Last scan" glyph="file" compact />
    </View>

    <View style={[styles.quickCard, { backgroundColor: c.surface, borderColor: c.line }]}>
      <View style={styles.quickHeading}>
        <View>
          <Text style={[styles.sectionTitle, { color: c.ink }]}>Quick Scan</Text>
          <Text style={[styles.sectionSubtitle, { color: c.inkMuted }]}>Run a security check now</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onScan}><Text style={[styles.viewAll, { color: c.forest }]}>Open scan →</Text></Pressable>
      </View>
      <View style={styles.quickActions}>
        <Pressable accessibilityRole="button" onPress={onScan} style={({ pressed }) => [styles.manualAction, { backgroundColor: c.forest, opacity: pressed ? 0.88 : 1 }]}>
          <View style={[styles.playCircle, { backgroundColor: c.onForest }]}><Text style={[styles.playIcon, { color: c.forest }]}>▶</Text></View>
          <View><Text style={[styles.manualActionTitle, { color: c.onForest }]}>Manual Scan</Text><Text style={[styles.manualActionCopy, { color: c.onForestMuted }]}>All 6 modules</Text></View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onAutomaticScan} style={({ pressed }) => [styles.autoAction, { borderColor: c.monitoringLine, backgroundColor: c.monitoringQuiet, opacity: pressed ? 0.88 : 1 }]}>
          <View style={[styles.autoCalendar, { borderColor: c.signal }]}><View style={[styles.calendarTop, { backgroundColor: c.signal }]} /><View style={[styles.calendarDot, { backgroundColor: c.signal }]} /></View>
          <View><Text style={[styles.autoActionTitle, { color: c.ink }]}>Auto Scan</Text><Text style={[styles.autoActionCopy, { color: monitoringEnabled ? c.signal : c.inkMuted }]}>{monitoringEnabled ? 'Scheduled' : 'Set up'}</Text></View>
        </Pressable>
      </View>
    </View>

    <Pressable accessibilityRole="button" onPress={onAutomaticScan} style={[styles.monitoringStrip, { borderColor: c.monitoringLine, backgroundColor: c.monitoringQuiet }]}>
      <LiveBeacon active={monitoringEnabled} />
      <View style={styles.monitoringCopy}>
        <Text style={[styles.monitoringTitle, { color: c.ink }]}>Ongoing protection</Text>
        <Text numberOfLines={1} style={[styles.monitoringSubtitle, { color: c.monitoringMuted }]}>{monitoringEnabled ? 'Automatic local checks are scheduled.' : 'Set an automatic local-check schedule.'}</Text>
      </View>
      <Text style={[styles.monitoringAction, { color: monitoringEnabled ? c.forest : c.signal }]}>{monitoringEnabled ? 'Active' : 'Set up'} ›</Text>
    </Pressable>

    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: c.ink }]}>Security Modules</Text>
      <Pressable accessibilityRole="button" onPress={onProtection}><Text style={[styles.viewAll, { color: c.forest }]}>View all →</Text></Pressable>
    </View>
    <View style={styles.moduleGrid}>{capabilities.map((module) => <Pressable accessibilityRole="button" key={module.id} onPress={() => onCapability(module)} style={({ pressed }) => [styles.moduleCard, { backgroundColor: c.surface, borderColor: c.line, opacity: pressed ? 0.82 : 1 }]}>
      <View style={styles.moduleTop}>
        <View style={[styles.moduleGlyphWrap, { backgroundColor: c.monitoringQuiet }]}><ModuleGlyph id={module.id} size={24} tone="active" /></View>
        <View style={[styles.checkMark, { backgroundColor: c.forest }]}><Text style={[styles.checkText, { color: c.onForest }]}>✓</Text></View>
      </View>
      <Text numberOfLines={2} style={[styles.moduleTitle, { color: c.ink }]}>{module.title.replace('Application', 'App')}</Text>
      <Text style={[styles.moduleState, { color: c.signal }]}>Ready</Text>
    </Pressable>)}</View>

    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: c.ink }]}>Recent Activity</Text>
      <Pressable accessibilityRole="button" onPress={attention.length ? onAlerts : onActivity}><Text style={[styles.viewAll, { color: c.forest }]}>View all →</Text></Pressable>
    </View>
    <Pressable accessibilityRole="button" onPress={attention.length ? onAlerts : onActivity} style={[styles.activityCard, { backgroundColor: c.surface, borderColor: c.line }]}>
      <View style={[styles.activityIcon, { backgroundColor: attention.length ? c.amberSoft : c.signalSoft }]}><StatusDot state={attention.length ? 'warning' : baseline ? 'safe' : 'info'} size={10} /></View>
      <View style={styles.activityCopy}>
        <Text numberOfLines={1} style={[styles.activityTitle, { color: c.ink }]}>{attention.length ? `${attention.length} item${attention.length === 1 ? '' : 's'} needs attention` : baseline ? 'No local findings need attention' : 'No completed full scan yet'}</Text>
        <Text numberOfLines={1} style={[styles.activitySubtitle, { color: c.inkMuted }]}>{attention.length ? attention[0].subject : lastRun ? lastRun.summary : 'Run a full-device scan to create your first report.'}</Text>
      </View>
      <Text style={[styles.activityChevron, { color: c.inkMuted }]}>›</Text>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={onFileScan} style={styles.fileShortcut}><ModuleGlyph id="file" size={16} tone="active" /><Text style={[styles.fileShortcutText, { color: c.monitoringMuted }]}>Inspect a file</Text><Text style={[styles.fileShortcutLink, { color: c.signal }]}>Choose file →</Text></Pressable>
    <View style={styles.bottomSpace} />
  </ScrollView>;
}

function HeroWaves({ tone }: { tone: string }) {
  const { reducedMotion } = useTheme();
  const travel = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) { travel.stopAnimation(); travel.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(travel, { toValue: 1, duration: 6200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(travel, { toValue: 0, duration: 6200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, travel]);
  const shift = travel.interpolate({ inputRange: [0, 1], outputRange: [-34, 26] });
  return <View pointerEvents="none" style={styles.waveField}>
    <Animated.View style={[styles.wave, styles.waveOne, { borderColor: tone, transform: [{ translateX: shift }, { rotate: '-8deg' }] }]} />
    <Animated.View style={[styles.wave, styles.waveTwo, { borderColor: tone, transform: [{ translateX: shift }, { rotate: '7deg' }] }]} />
    <View style={[styles.waveGlow, { backgroundColor: tone }]} />
  </View>;
}

function ProtectionEmblem({ protectedState, needsReview }: { protectedState: boolean; needsReview: boolean }) {
  const { theme, reducedMotion } = useTheme();
  const c = theme.colors;
  const pulse = useRef(new Animated.Value(0.65)).current;
  useEffect(() => {
    if (reducedMotion) { pulse.stopAnimation(); pulse.setValue(0.8); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1150, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.55, duration: 1150, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse, reducedMotion]);
  const tone = needsReview ? c.amber : protectedState ? c.forest : c.signal;
  return <View style={styles.emblem}>
    <Animated.View style={[styles.emblemPulse, { backgroundColor: tone, opacity: pulse }]} />
    <View style={[styles.emblemShield, { borderColor: tone, backgroundColor: c.monitoringSurface }]}>
      <Text style={[styles.emblemGlyph, { color: tone }]}>{needsReview ? '!' : protectedState ? '✓' : '⌁'}</Text>
    </View>
  </View>;
}

function LiveBeacon({ active }: { active: boolean }) {
  const { theme, reducedMotion } = useTheme();
  const ping = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    if (!active || reducedMotion) { ping.stopAnimation(); ping.setValue(active ? 0.72 : 0.32); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(ping, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(ping, { toValue: 0.35, duration: 1000, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active, ping, reducedMotion]);
  return <View style={styles.beacon}><Animated.View style={[styles.beaconHalo, { borderColor: active ? theme.colors.forest : theme.colors.signal, opacity: ping }]} /><View style={[styles.beaconDot, { backgroundColor: active ? theme.colors.forest : theme.colors.signal }]} /></View>;
}

function Metric({ value, label, glyph, warning = false, compact = false }: { value: string; label: string; glyph: 'network' | 'phishing' | 'file'; warning?: boolean; compact?: boolean }) {
  const { theme } = useTheme();
  return <View style={styles.metric}>
    <ModuleGlyph id={glyph} size={18} tone={warning ? 'warning' : 'active'} />
    <Text numberOfLines={1} style={[styles.metricValue, compact && styles.metricValueCompact, { color: warning ? theme.colors.amber : theme.colors.ink }]}>{value}</Text>
    <Text numberOfLines={1} style={[styles.metricLabel, { color: theme.colors.inkMuted }]}>{label}</Text>
  </View>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Today' : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  content: { position: 'relative', paddingTop: 52, paddingHorizontal: space.md, paddingBottom: 104, minHeight: '100%' },
  welcomeRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 27 },
  welcomeKicker: { fontFamily: type.body, fontSize: 15 },
  welcomeName: { fontFamily: type.display, fontSize: 25, letterSpacing: -0.7, fontWeight: '800', marginTop: 2 },
  devicePill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6 },
  devicePillText: { fontFamily: type.mono, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  statusHero: { minHeight: 147, marginTop: 20, borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden', padding: 18, flexDirection: 'row', alignItems: 'center' },
  waveField: { position: 'absolute', left: 0, right: 0, bottom: -36, height: 112, overflow: 'hidden' },
  wave: { position: 'absolute', width: 370, height: 118, borderWidth: 1, opacity: 0.38, borderRadius: 180 },
  waveOne: { left: -32, bottom: -82 }, waveTwo: { left: -4, bottom: -101, opacity: 0.2 },
  waveGlow: { position: 'absolute', right: -62, bottom: -100, width: 244, height: 145, opacity: 0.13, borderRadius: 140 },
  emblem: { width: 87, height: 87, alignItems: 'center', justifyContent: 'center' },
  emblemPulse: { position: 'absolute', width: 82, height: 82, borderRadius: 41, opacity: 0.1 },
  emblemShield: { width: 56, height: 62, borderWidth: 1.8, borderRadius: 19, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  emblemGlyph: { fontFamily: type.display, fontSize: 27, lineHeight: 31, fontWeight: '800', transform: [{ rotate: '-45deg' }] },
  statusCopy: { flex: 1, marginLeft: 10 },
  statusKicker: { fontFamily: type.body, fontSize: 11, fontWeight: '700' },
  statusTitle: { fontFamily: type.display, fontSize: 26, letterSpacing: -0.7, fontWeight: '800', marginTop: 3 },
  statusSubtitle: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 2, maxWidth: 214 },
  statusFootnote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  statusFootnoteText: { fontFamily: type.body, fontSize: 9 },
  metrics: { minHeight: 78, marginTop: 12, borderWidth: 1, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3 },
  metric: { flex: 1, alignItems: 'center', minWidth: 0 }, metricDivider: { width: StyleSheet.hairlineWidth, height: 38 },
  metricValue: { fontFamily: type.display, fontSize: 19, lineHeight: 22, fontWeight: '800', marginTop: 1, fontVariant: ['tabular-nums'] }, metricValueCompact: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  metricLabel: { fontFamily: type.body, fontSize: 8, marginTop: 1, textAlign: 'center' },
  quickCard: { marginTop: 15, borderWidth: 1, borderRadius: radius.lg, padding: 14 }, quickHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: type.display, fontSize: 19, letterSpacing: -0.35, fontWeight: '800' }, sectionSubtitle: { fontFamily: type.body, fontSize: 10, marginTop: 2 }, viewAll: { fontFamily: type.body, fontSize: 10, fontWeight: '800' },
  quickActions: { flexDirection: 'row', gap: 9 }, manualAction: { flex: 1.12, minHeight: 58, borderRadius: radius.md, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }, autoAction: { flex: 1, minHeight: 58, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  playCircle: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, playIcon: { fontSize: 9, marginLeft: 1 }, manualActionTitle: { fontFamily: type.body, fontSize: 12, fontWeight: '800' }, manualActionCopy: { fontFamily: type.body, fontSize: 9, marginTop: 2 },
  autoCalendar: { width: 25, height: 25, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, calendarTop: { position: 'absolute', left: 0, right: 0, top: 5, height: 1 }, calendarDot: { width: 5, height: 5, borderRadius: 3, marginTop: 4 }, autoActionTitle: { fontFamily: type.body, fontSize: 11, fontWeight: '800' }, autoActionCopy: { fontFamily: type.body, fontSize: 9, marginTop: 2 },
  monitoringStrip: { minHeight: 66, marginTop: 12, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  beacon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }, beaconHalo: { position: 'absolute', width: 30, height: 30, borderRadius: 15, borderWidth: 1.4 }, beaconDot: { width: 10, height: 10, borderRadius: 5 }, monitoringCopy: { flex: 1 }, monitoringTitle: { fontFamily: type.body, fontSize: 12, fontWeight: '800' }, monitoringSubtitle: { fontFamily: type.body, fontSize: 9, marginTop: 3 }, monitoringAction: { fontFamily: type.body, fontSize: 10, fontWeight: '800' },
  sectionHead: { marginTop: 25, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, moduleCard: { width: '31.65%', minHeight: 111, borderWidth: 1, borderRadius: radius.md, padding: 10, justifyContent: 'space-between' }, moduleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, moduleGlyphWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, checkMark: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, checkText: { fontFamily: type.body, fontSize: 9, fontWeight: '800' }, moduleTitle: { fontFamily: type.body, fontSize: 10, lineHeight: 13, fontWeight: '800', marginTop: 6 }, moduleState: { fontFamily: type.body, fontSize: 8, marginTop: 2 },
  activityCard: { minHeight: 70, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }, activityIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, activityCopy: { flex: 1 }, activityTitle: { fontFamily: type.body, fontSize: 12, fontWeight: '800' }, activitySubtitle: { fontFamily: type.body, fontSize: 9, marginTop: 3 }, activityChevron: { fontFamily: type.body, fontSize: 24, fontWeight: '300' },
  fileShortcut: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 4, paddingTop: 16 }, fileShortcutText: { fontFamily: type.body, fontSize: 10 }, fileShortcutLink: { fontFamily: type.body, fontSize: 10, fontWeight: '800' }, bottomSpace: { height: 24 },
});
