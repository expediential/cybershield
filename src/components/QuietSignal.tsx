import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../core/ThemeProvider';
import type { PrimaryScreen } from '../core/navigation';
import { SignalMark } from '../brand/SignalMark';
import { capabilityLabel, type Capability, type CapabilityState, type ModuleId } from '../domain/capabilities';
import { motion, radius, space, type } from '../design/tokens';
import type { Severity, Verdict } from '../types/security';

type EventSignal = { id: string; title: string; detail: string; severity: Severity; time: string; source: string };
type ScanPhase = 'idle' | 'preparing' | 'analyzing' | 'complete' | 'error';

/** Lightweight animated depth used behind premium surfaces; it is disabled by Reduce Motion. */
export function AmbientBackdrop() {
  const { theme, reducedMotion } = useTheme();
  const c = theme.colors;
  const drift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) { drift.stopAnimation(); drift.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([Animated.timing(drift, { toValue: 1, duration: 11000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(drift, { toValue: 0, duration: 11000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [drift, reducedMotion]);
  const left = drift.interpolate({ inputRange: [0, 1], outputRange: [-24, 24] });
  const right = drift.interpolate({ inputRange: [0, 1], outputRange: [18, -22] });
  return <View pointerEvents="none" style={styles.ambient}><Animated.View style={[styles.ambientAura, styles.ambientTeal, { backgroundColor: c.signal, transform: [{ translateX: left }] }]} /><Animated.View style={[styles.ambientAura, styles.ambientLime, { backgroundColor: c.forest, transform: [{ translateX: right }] }]} /><View style={[styles.ambientLine, { borderColor: c.monitoringLine }]} /></View>;
}

export function BrandHeader({ label, onProfile }: { label?: string; onProfile?: () => void }) {
  const { theme, demoMode } = useTheme();
  const c = theme.colors;
  return <View style={styles.brandHeader}><View style={styles.brandIdentity}><SignalMark size={33} /><View><Text style={[styles.wordmark, { color: c.ink }]}>CYBERSHIELD</Text><View style={styles.subline}>{label ? <Text style={[styles.brandLabel, { color: c.inkMuted }]}>{label}</Text> : null}{demoMode ? <DemoBadge /> : null}</View></View></View>{onProfile ? <Pressable accessibilityRole="button" accessibilityLabel="Open profile and settings" onPress={onProfile} style={[styles.profileButton, { borderColor: c.line }]}><View style={[styles.profileHead, { borderColor: c.signal }]} /><View style={[styles.profileBody, { backgroundColor: c.signal }]} /></Pressable> : <View style={styles.headerSpacer} />}</View>;
}

export function DemoBadge() {
  const { theme } = useTheme();
  return <View style={[styles.demoBadge, { backgroundColor: theme.colors.amberSoft, borderColor: theme.colors.amber }]}><Text style={[styles.demoText, { color: theme.colors.amber }]}>DEMO</Text></View>;
}

export function BackButton({ onPress, label = 'Back' }: { onPress: () => void; label?: string }) {
  const { theme } = useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.back}><ArrowIcon color={theme.colors.ink} back /><Text style={[styles.backText, { color: theme.colors.ink }]}>{label}</Text></Pressable>;
}

export function StatusDot({ state, size = 8 }: { state: CapabilityState | Severity; size?: number }) {
  const { theme } = useTheme();
  const color = state === 'ready' || state === 'safe' ? theme.colors.forest : state === 'permission' || state === 'warning' ? theme.colors.amber : state === 'danger' ? theme.colors.danger : state === 'demo' ? theme.colors.signal : theme.colors.inkMuted;
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, flexShrink: 0 }} />;
}

export function StatusPill({ state }: { state: CapabilityState }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const color = state === 'ready' ? c.forest : state === 'permission' ? c.amber : state === 'demo' ? c.signal : c.inkMuted;
  const backgroundColor = state === 'ready' ? c.signalSoft : state === 'permission' ? c.amberSoft : c.surfaceMuted;
  return <View style={[styles.statusPill, { backgroundColor }]}><StatusDot state={state} size={6} /><Text style={[styles.statusPillText, { color }]}>{capabilityLabel(state)}</Text></View>;
}

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const { theme } = useTheme();
  const severity: Severity = verdict === 'safe' ? 'safe' : verdict === 'suspicious' ? 'warning' : verdict === 'malicious' ? 'danger' : 'info';
  const label = verdict === 'safe' ? 'CLEAR LOCALLY' : verdict === 'suspicious' ? 'REVIEW' : verdict === 'malicious' ? 'BLOCK' : 'UNVERIFIED';
  const c = theme.colors;
  const color = severity === 'safe' ? c.forest : severity === 'warning' ? c.amber : severity === 'danger' ? c.danger : c.inkMuted;
  const backgroundColor = severity === 'safe' ? c.signalSoft : severity === 'warning' ? c.amberSoft : severity === 'danger' ? c.dangerSoft : c.surfaceMuted;
  return <View style={[styles.verdictPill, { backgroundColor }]}><StatusDot state={severity} size={6} /><Text style={[styles.verdictText, { color }]}>{label}</Text></View>;
}

export function ModuleGlyph({ id, size = 32, tone = 'default' }: { id: ModuleId; size?: number; tone?: 'default' | 'active' | 'warning' }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const color = tone === 'warning' ? c.amber : tone === 'active' ? c.signal : c.ink;
  const stroke = Math.max(1.2, size * 0.055);
  const common = { borderColor: color, borderWidth: stroke };
  return <View accessibilityElementsHidden style={[styles.glyph, { width: size, height: size }]}>
    {id === 'phishing' ? <><View style={[styles.glyphLens, common, { width: size * 0.56, height: size * 0.56, borderRadius: size * 0.28 }]} /><View style={[styles.glyphHandle, { width: size * 0.34, height: stroke, backgroundColor: color, right: size * 0.02, bottom: size * 0.13, transform: [{ rotate: '45deg' }] }]} /><View style={[styles.glyphBite, { width: size * 0.2, height: size * 0.2, borderRadius: size * 0.1, backgroundColor: c.surface }]} /></> : null}
    {id === 'file' ? <><View style={[styles.glyphFile, common, { width: size * 0.58, height: size * 0.74, borderRadius: size * 0.08 }]} /><View style={[styles.glyphFold, { width: size * 0.2, height: size * 0.2, borderLeftWidth: stroke, borderBottomWidth: stroke, borderColor: color, top: size * 0.13, right: size * 0.21 }]} /><View style={[styles.glyphScanLine, { width: size * 0.3, backgroundColor: color }]} /></> : null}
    {id === 'apps' ? <View style={styles.glyphGrid}>{[0, 1, 2, 3].map((cell) => <View key={cell} style={[styles.glyphCell, { width: size * 0.25, height: size * 0.25, borderColor: color, borderWidth: stroke }]} />)}</View> : null}
    {id === 'wifi' ? <><View style={[styles.wifiArcLarge, common, { width: size * 0.82, height: size * 0.42, borderTopLeftRadius: size, borderTopRightRadius: size }]} /><View style={[styles.wifiArcSmall, common, { width: size * 0.52, height: size * 0.28, borderTopLeftRadius: size, borderTopRightRadius: size }]} /><View style={[styles.wifiDot, { width: size * 0.13, height: size * 0.13, borderRadius: size, backgroundColor: color }]} /></> : null}
    {id === 'network' ? <><View style={[styles.networkLineOne, { width: size * 0.55, height: stroke, backgroundColor: color, transform: [{ rotate: '28deg' }] }]} /><View style={[styles.networkLineTwo, { width: size * 0.55, height: stroke, backgroundColor: color, transform: [{ rotate: '-28deg' }] }]} />{[{ top: size * 0.08, left: size * 0.08 }, { bottom: size * 0.08, left: size * 0.08 }, { top: size * 0.38, right: size * 0.04 }].map((position, index) => <View key={index} style={[styles.networkNode, position, { width: size * 0.22, height: size * 0.22, borderRadius: size, borderColor: color, borderWidth: stroke }]} />)}</> : null}
    {id === 'bluetooth' ? <><View style={[styles.btStem, { height: size * 0.76, width: stroke, backgroundColor: color }]} /><View style={[styles.btLeftTop, { width: size * 0.38, height: stroke, backgroundColor: color, transform: [{ rotate: '43deg' }] }]} /><View style={[styles.btLeftBottom, { width: size * 0.38, height: stroke, backgroundColor: color, transform: [{ rotate: '-43deg' }] }]} /><View style={[styles.btRightTop, { width: size * 0.38, height: stroke, backgroundColor: color, transform: [{ rotate: '-43deg' }] }]} /><View style={[styles.btRightBottom, { width: size * 0.38, height: stroke, backgroundColor: color, transform: [{ rotate: '43deg' }] }]} /></> : null}
  </View>;
}

export function SentinelCore({ items, posture, onPress }: { items: Capability[]; posture: 'insufficient' | 'limited' | 'attention'; onPress?: () => void }) {
  const { theme, reducedMotion } = useTheme();
  const c = theme.colors;
  const phase = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) { phase.stopAnimation(); phase.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(phase, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [phase, reducedMotion]);
  const rotate = phase.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const positions = [{ top: 7, left: 116 }, { top: 48, right: 18 }, { bottom: 34, right: 38 }, { bottom: 5, left: 116 }, { bottom: 34, left: 38 }, { top: 48, left: 18 }];
  const coreColor = posture === 'attention' ? c.danger : posture === 'limited' ? c.signal : c.inkMuted;
  return <Pressable onPress={onPress} style={[styles.sentinel, { borderColor: c.line, backgroundColor: c.surface }]}><View style={[styles.sentinelGrid, { borderColor: c.line }]} /><Animated.View style={[styles.sentinelOrbit, { borderColor: c.monitoringLine, transform: [{ rotate }] }]}><View style={[styles.sentinelOrbitNode, { backgroundColor: c.signal }]} /></Animated.View><View style={[styles.sentinelRing, { borderColor: c.line }]} /><View style={[styles.sentinelCore, { borderColor: coreColor, backgroundColor: c.monitoringSurface }]}><SignalMark size={52} inverse /><Text style={[styles.sentinelLabel, { color: c.white }]}>{posture === 'attention' ? 'REVIEW' : posture === 'limited' ? 'LIMITED' : 'SETUP'}</Text></View>{items.map((item, index) => <View key={item.id} style={[styles.sentinelNode, positions[index], { backgroundColor: c.surfaceStrong, borderColor: item.state === 'ready' ? c.forest : item.state === 'permission' ? c.amber : c.line }]}><ModuleGlyph id={item.id} size={19} tone={item.state === 'ready' ? 'active' : item.state === 'permission' ? 'warning' : 'default'} /></View>)}</Pressable>;
}

export function ThreatConstellation({ events, demo = false }: { events: EventSignal[]; demo?: boolean }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const visible = events.slice(0, 4);
  return <View style={[styles.constellation, { backgroundColor: c.monitoringSurface, borderColor: c.monitoringLine }]}><View style={styles.constellationHeader}><View><Text style={[styles.constellationKicker, { color: c.signal }]}>THREAT CONSTELLATION</Text><Text style={[styles.constellationTitle, { color: c.white }]}>{events.length ? 'Recorded security signals' : 'No recorded security signals'}</Text></View>{demo ? <DemoBadge /> : null}</View><View style={styles.constellationField}>{visible.length ? <><View style={[styles.constellationLinkA, { backgroundColor: c.monitoringLine }]} /><View style={[styles.constellationLinkB, { backgroundColor: c.monitoringLine }]} />{visible.map((event, index) => <View key={event.id} style={[styles.constellationNode, [{ top: 16, left: 34 }, { top: 68, right: 38 }, { bottom: 18, left: 104 }, { bottom: 45, right: 18 }][index], { borderColor: event.severity === 'danger' ? c.danger : event.severity === 'warning' ? c.amber : c.signal, backgroundColor: c.monitoringQuiet }]}><StatusDot state={event.severity} size={8} /><Text numberOfLines={1} style={[styles.constellationNodeText, { color: c.white }]}>{event.title}</Text></View>)}</> : <View style={styles.constellationEmpty}><StatusDot state="info" size={8} /><Text style={[styles.constellationEmptyText, { color: c.monitoringMuted }]}>Events appear here after a local assessment records a finding.</Text></View>}</View></View>;
}

export function ScanTrace({ phase, progress = 0, label }: { phase: ScanPhase; progress?: number; label?: string }) {
  const { theme, reducedMotion } = useTheme();
  const c = theme.colors;
  const flicker = useRef(new Animated.Value(0.35)).current;
  const active = phase === 'preparing' || phase === 'analyzing';
  useEffect(() => {
    if (!active || reducedMotion) { flicker.stopAnimation(); flicker.setValue(active ? 0.7 : 1); return; }
    const loop = Animated.loop(Animated.sequence([Animated.timing(flicker, { toValue: 1, duration: motion.scanStage, useNativeDriver: true }), Animated.timing(flicker, { toValue: 0.35, duration: motion.scanStage, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [active, flicker, reducedMotion]);
  const stages = ['Normalize', 'Inspect', 'Explain'];
  const activeIndex = phase === 'preparing' ? 0 : phase === 'analyzing' ? Math.min(2, Math.floor(progress / 34)) : phase === 'complete' ? 3 : 0;
  return <View style={[styles.scanTrace, { borderColor: c.line, backgroundColor: c.surface }]}><View style={styles.scanTraceHeader}><Text style={[styles.scanTraceLabel, { color: c.inkMuted }]}>{label ?? 'LOCAL SCAN TRACE'}</Text><Text style={[styles.scanTraceValue, { color: active ? c.signal : c.inkMuted }]}>{phase === 'complete' ? 'COMPLETE' : phase === 'error' ? 'CHECK INPUT' : active ? `${Math.round(progress)}%` : 'READY'}</Text></View><View style={styles.traceRail}>{stages.map((stage, index) => <View key={stage} style={styles.traceStage}><Animated.View style={[styles.traceDot, { opacity: index <= activeIndex ? flicker : 1, backgroundColor: index < activeIndex || phase === 'complete' ? c.forest : index === activeIndex && active ? c.signal : c.surfaceStrong, borderColor: c.line }]} />{index < stages.length - 1 ? <View style={[styles.traceLine, { backgroundColor: index < activeIndex || phase === 'complete' ? c.signal : c.line }]} /> : null}</View>)}</View><Text style={[styles.scanTraceCopy, { color: c.inkMuted }]}>{phase === 'idle' ? 'No assessment has started.' : phase === 'preparing' ? 'Normalizing the input you provided.' : phase === 'analyzing' ? 'Checking the available local signals.' : phase === 'complete' ? 'Local assessment is ready to review.' : 'The address needs correction before it can be assessed.'}</Text></View>;
}

export function SecurityTimeline({ events, emptyCopy = 'No security events have been recorded.' }: { events: EventSignal[]; emptyCopy?: string }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return <View style={[styles.timeline, { borderLeftColor: c.line }]}>{events.length ? events.map((event, index) => <View key={event.id} style={styles.timelineRow}><View style={styles.timelineRail}><StatusDot state={event.severity} size={9} />{index < events.length - 1 ? <View style={[styles.timelineStem, { backgroundColor: c.line }]} /> : null}</View><View style={styles.timelineBody}><View style={styles.timelineTop}><Text style={[styles.timelineSource, { color: c.inkMuted }]}>{event.source}</Text><Text style={[styles.timelineTime, { color: c.inkMuted }]}>{event.time}</Text></View><Text style={[styles.timelineTitle, { color: c.ink }]}>{event.title}</Text><Text style={[styles.timelineDetail, { color: c.inkMuted }]}>{event.detail}</Text></View></View>) : <View style={[styles.timelineEmpty, { backgroundColor: c.surfaceMuted }]}><Text style={[styles.timelineEmptyText, { color: c.inkMuted }]}>{emptyCopy}</Text></View>}</View>;
}

export function PrimaryButton({ label, onPress, disabled = false, quiet = false }: { label: string; onPress: () => void; disabled?: boolean; quiet?: boolean }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return <Pressable disabled={disabled} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.primaryButton, { backgroundColor: quiet ? c.surfaceStrong : c.forest, borderColor: quiet ? c.line : c.forest, opacity: disabled ? 0.45 : pressed ? 0.82 : 1, transform: [{ scale: pressed && !disabled ? 0.98 : 1 }] }]}><Text style={[styles.primaryButtonText, { color: quiet ? c.ink : c.onForest }]}>{label}</Text><ArrowIcon color={quiet ? c.ink : c.onForest} /></Pressable>;
}

export function ArrowIcon({ color, back = false }: { color: string; back?: boolean }) {
  return <View style={[styles.arrow, back && { transform: [{ rotate: '180deg' }] }]}><View style={[styles.arrowStem, { backgroundColor: color }]} /><View style={[styles.arrowHead, { borderRightColor: color, borderTopColor: color }]} /></View>;
}

export function BottomNavigation({ active, onNavigate }: { active: PrimaryScreen; onNavigate: (screen: PrimaryScreen) => void }) {
  const { theme, reducedMotion } = useTheme();
  const c = theme.colors;
  const indicator = useRef(new Animated.Value(['home', 'protection', 'scan', 'activity', 'profile'].indexOf(active))).current;
  const tabs: { id: PrimaryScreen; label: string }[] = [{ id: 'home', label: 'Home' }, { id: 'protection', label: 'Protect' }, { id: 'scan', label: 'Scan' }, { id: 'activity', label: 'Activity' }, { id: 'profile', label: 'Profile' }];
  useEffect(() => { Animated.timing(indicator, { toValue: tabs.findIndex((tab) => tab.id === active), duration: reducedMotion ? 0 : motion.quick, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [active, indicator, reducedMotion]);
  const navStep = Dimensions.get('window').width / tabs.length;
  const translateX = indicator.interpolate({ inputRange: [0, 4], outputRange: [0, navStep * 4] });
  return <View style={[styles.nav, { backgroundColor: c.surface, borderTopColor: c.line }]}><Animated.View pointerEvents="none" style={[styles.navIndicator, { width: navStep, backgroundColor: c.forest, transform: [{ translateX }] }]} />{tabs.map((tab) => { const selected = tab.id === active; const glyph: ModuleId = tab.id === 'home' ? 'network' : tab.id === 'protection' ? 'apps' : tab.id === 'scan' ? 'phishing' : tab.id === 'activity' ? 'file' : 'bluetooth'; return <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onNavigate(tab.id)} style={styles.navItem}><ModuleGlyph id={glyph} size={17} tone={selected ? 'active' : 'default'} /><Text style={[styles.navText, { color: selected ? c.forest : c.inkMuted }]}>{tab.label}</Text></Pressable>; })}</View>;
}

const styles = StyleSheet.create({
  ambient: { position: 'absolute', top: 0, left: 0, right: 0, height: 380, overflow: 'hidden' },
  ambientAura: { position: 'absolute', width: 300, height: 180, borderRadius: 160, opacity: 0.09 },
  ambientTeal: { top: -104, left: -84, transform: [{ rotate: '-16deg' }] },
  ambientLime: { top: 178, right: -162, opacity: 0.055, transform: [{ rotate: '24deg' }] },
  ambientLine: { position: 'absolute', width: 500, height: 235, borderWidth: 1, borderRadius: 250, top: -124, right: -175, opacity: 0.34, transform: [{ rotate: '18deg' }] },
  brandHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42 },
  brandIdentity: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmark: { fontFamily: type.display, fontSize: 15, letterSpacing: 1.35, fontWeight: '800' },
  subline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  brandLabel: { fontFamily: type.body, fontSize: 10 },
  headerSpacer: { width: 36 },
  profileButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  profileHead: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.4 },
  profileBody: { width: 15, height: 7, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 3 },
  demoBadge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 5, paddingVertical: 1 },
  demoText: { fontFamily: type.mono, fontSize: 7, letterSpacing: 0.6, fontWeight: '800' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 42, alignSelf: 'flex-start' },
  backText: { fontFamily: type.body, fontSize: 13, fontWeight: '700' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.pill, flexShrink: 0 },
  statusPillText: { fontFamily: type.body, fontSize: 9, fontWeight: '800' },
  verdictPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius.pill, alignSelf: 'flex-start' },
  verdictText: { fontFamily: type.mono, fontSize: 9, letterSpacing: 0.3, fontWeight: '800' },
  glyph: { alignItems: 'center', justifyContent: 'center' },
  glyphLens: { position: 'absolute', left: '8%', top: '6%' }, glyphHandle: { position: 'absolute' }, glyphBite: { position: 'absolute', top: '27%', left: '28%' },
  glyphFile: { position: 'absolute', left: '21%', top: '12%' }, glyphFold: { position: 'absolute' }, glyphScanLine: { position: 'absolute', bottom: '29%', left: '35%', height: 1.5 },
  glyphGrid: { flexDirection: 'row', width: '72%', flexWrap: 'wrap', gap: 3 }, glyphCell: { borderRadius: 2 },
  wifiArcLarge: { position: 'absolute', top: '11%', borderBottomWidth: 0 }, wifiArcSmall: { position: 'absolute', top: '33%', borderBottomWidth: 0 }, wifiDot: { position: 'absolute', bottom: '14%' },
  networkLineOne: { position: 'absolute' }, networkLineTwo: { position: 'absolute' }, networkNode: { position: 'absolute' },
  btStem: { position: 'absolute' }, btLeftTop: { position: 'absolute', left: '29%', top: '28%' }, btLeftBottom: { position: 'absolute', left: '29%', bottom: '28%' }, btRightTop: { position: 'absolute', right: '29%', top: '28%' }, btRightBottom: { position: 'absolute', right: '29%', bottom: '28%' },
  sentinel: { height: 286, borderWidth: 1, overflow: 'hidden', marginTop: space.lg, alignItems: 'center', justifyContent: 'center' },
  sentinelGrid: { position: 'absolute', width: 234, height: 234, borderWidth: 1, transform: [{ rotate: '45deg' }], opacity: 0.35 },
  sentinelOrbit: { width: 244, height: 244, borderRadius: 122, borderWidth: 1, alignItems: 'center', paddingTop: 1 }, sentinelOrbitNode: { width: 6, height: 6, borderRadius: 3 },
  sentinelRing: { position: 'absolute', width: 168, height: 168, borderRadius: 84, borderWidth: 1 }, sentinelCore: { width: 114, height: 114, borderRadius: 57, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, sentinelLabel: { fontFamily: type.mono, fontSize: 8, letterSpacing: 1.1, marginTop: 7, fontWeight: '800' },
  sentinelNode: { position: 'absolute', width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  constellation: { borderWidth: 1, padding: 16, minHeight: 246 }, constellationHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, constellationKicker: { fontFamily: type.mono, fontSize: 9, letterSpacing: 0.7 }, constellationTitle: { fontFamily: type.display, fontSize: 17, marginTop: 5, fontWeight: '700' },
  constellationField: { height: 144, marginTop: 14, position: 'relative' }, constellationLinkA: { position: 'absolute', height: 1, width: 130, left: 63, top: 62, transform: [{ rotate: '22deg' }] }, constellationLinkB: { position: 'absolute', height: 1, width: 124, left: 87, top: 85, transform: [{ rotate: '-28deg' }] },
  constellationNode: { position: 'absolute', maxWidth: 123, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderRadius: radius.sm }, constellationNodeText: { fontFamily: type.body, fontSize: 9, fontWeight: '700', flexShrink: 1 },
  constellationEmpty: { height: '100%', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 32 }, constellationEmptyText: { fontFamily: type.body, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  scanTrace: { borderWidth: 1, padding: 14, marginTop: space.lg }, scanTraceHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, scanTraceLabel: { fontFamily: type.mono, fontSize: 9, letterSpacing: 0.55 }, scanTraceValue: { fontFamily: type.mono, fontSize: 9, letterSpacing: 0.55, fontWeight: '800' },
  traceRail: { flexDirection: 'row', alignItems: 'center', marginTop: 16 }, traceStage: { flex: 1, flexDirection: 'row', alignItems: 'center' }, traceDot: { width: 11, height: 11, borderRadius: 6, borderWidth: 1 }, traceLine: { height: 1, flex: 1 }, scanTraceCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 12 },
  timeline: { borderLeftWidth: 1, paddingLeft: 14, marginTop: 12 }, timelineRow: { flexDirection: 'row', gap: 12, minHeight: 104 }, timelineRail: { width: 10, alignItems: 'center', marginLeft: -20, paddingTop: 3 }, timelineStem: { width: 1, flex: 1, marginTop: 6 }, timelineBody: { flex: 1, paddingBottom: 18 }, timelineTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, timelineSource: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.5 }, timelineTime: { fontFamily: type.body, fontSize: 9 }, timelineTitle: { fontFamily: type.body, fontSize: 13, fontWeight: '700', marginTop: 5 }, timelineDetail: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 3 }, timelineEmpty: { padding: 17, marginLeft: 3 }, timelineEmptyText: { fontFamily: type.body, fontSize: 12, lineHeight: 18 },
  primaryButton: { minHeight: 54, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryButtonText: { fontFamily: type.body, fontSize: 14, fontWeight: '800' },
  arrow: { width: 20, height: 14, justifyContent: 'center' }, arrowStem: { height: 1.5, width: 17, borderRadius: 1 }, arrowHead: { position: 'absolute', right: 1, width: 7, height: 7, borderRightWidth: 1.5, borderTopWidth: 1.5, transform: [{ rotate: '45deg' }] },
  nav: { position: 'absolute', height: 74, bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, overflow: 'hidden' }, navIndicator: { position: 'absolute', top: 0, left: 0, height: 2 }, navItem: { flex: 1, alignItems: 'center', gap: 4, minHeight: 54 }, navText: { fontFamily: type.body, fontSize: 9, fontWeight: '700' },
});
