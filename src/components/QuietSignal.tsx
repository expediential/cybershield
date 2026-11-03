import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../core/ThemeProvider';
import type { PrimaryScreen } from '../core/navigation';
import { SignalMark } from '../brand/SignalMark';
import type { Capability, CapabilityState } from '../domain/capabilities';
import { capabilityLabel } from '../domain/capabilities';
import { radius, space, type } from '../design/tokens';
import type { Severity, Verdict } from '../types/security';

export function BrandHeader({ label, onProfile }: { label?: string; onProfile?: () => void }) {
  const { theme } = useTheme();
  return <View style={styles.brandHeader}><View style={styles.brandIdentity}><SignalMark size={34} /><View><Text style={[styles.wordmark, { color: theme.colors.ink }]}>CyberShield</Text>{label ? <Text style={[styles.brandLabel, { color: theme.colors.inkMuted }]}>{label}</Text> : null}</View></View>{onProfile ? <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={onProfile} style={[styles.profileButton, { borderColor: theme.colors.line }]}><View style={[styles.profileHead, { borderColor: theme.colors.forest }]} /><View style={[styles.profileBody, { backgroundColor: theme.colors.forest }]} /></Pressable> : <View style={styles.headerSpacer} />}</View>;
}

export function StatusDot({ state, size = 8 }: { state: CapabilityState | Severity; size?: number }) {
  const { theme } = useTheme();
  const color = state === 'available' || state === 'safe' ? theme.colors.forest : state === 'permission' || state === 'warning' ? theme.colors.amber : state === 'danger' ? theme.colors.danger : theme.colors.inkMuted;
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, flexShrink: 0 }} />;
}

export function StatusPill({ state }: { state: CapabilityState }) {
  const { theme } = useTheme();
  const color = state === 'available' ? theme.colors.forest : state === 'permission' ? theme.colors.amber : theme.colors.inkMuted;
  const backgroundColor = state === 'available' ? theme.colors.signalSoft : state === 'permission' ? theme.colors.amberSoft : theme.colors.surfaceMuted;
  return <View style={[styles.statusPill, { backgroundColor }]}><StatusDot state={state} size={6} /><Text style={[styles.statusPillText, { color }]}>{capabilityLabel(state)}</Text></View>;
}

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const { theme } = useTheme();
  const severity: Severity = verdict === 'safe' ? 'safe' : verdict === 'suspicious' ? 'warning' : verdict === 'malicious' ? 'danger' : 'info';
  const label = verdict === 'safe' ? 'No high-risk signal' : verdict === 'suspicious' ? 'Needs review' : verdict === 'malicious' ? 'Do not open' : 'Unverified';
  const color = severity === 'safe' ? theme.colors.forest : severity === 'warning' ? theme.colors.amber : severity === 'danger' ? theme.colors.danger : theme.colors.inkMuted;
  const backgroundColor = severity === 'safe' ? theme.colors.signalSoft : severity === 'warning' ? theme.colors.amberSoft : severity === 'danger' ? theme.colors.dangerSoft : theme.colors.surfaceMuted;
  return <View style={[styles.verdictPill, { backgroundColor }]}><StatusDot state={severity} size={6} /><Text style={[styles.verdictText, { color }]}>{label}</Text></View>;
}

export function SignalTrace({ active = false, compact = false }: { active?: boolean; compact?: boolean }) {
  const { theme } = useTheme();
  const phase = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      phase.stopAnimation();
      phase.setValue(0.16);
      return;
    }
    const loop = Animated.loop(Animated.timing(phase, { toValue: 1, duration: 4200, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [active, phase]);
  const travel = phase.interpolate({ inputRange: [0, 1], outputRange: [-12, compact ? 210 : 310] });
  const fade = phase.interpolate({ inputRange: [0, 0.08, 0.86, 1], outputRange: [0, 1, 1, 0] });
  const bars = compact ? [15, 30, 18, 38, 22, 32, 19, 42, 24, 34, 17, 29] : [15, 34, 21, 44, 26, 36, 19, 48, 25, 40, 17, 33, 22, 46, 28, 37];

  return <View style={[styles.trace, compact && styles.traceCompact]}><View style={[styles.traceBaseline, { backgroundColor: theme.colors.line }]} />{bars.map((height, index) => <View key={index} style={[styles.traceBar, { height, opacity: index % 4 === 0 ? 1 : 0.52, backgroundColor: index % 4 === 0 ? theme.colors.forest : theme.colors.surfaceStrong }]} />)}<Animated.View style={[styles.traceCursor, { opacity: active ? fade : 0, backgroundColor: theme.colors.signal, transform: [{ translateX: travel }] }]} /></View>;
}

export function CoverageMap({ items, onSelect }: { items: Capability[]; onSelect?: (item: Capability) => void }) {
  const { theme } = useTheme();
  return <View style={[styles.coverageMap, { borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}>{items.map((item, index) => <Pressable key={item.id} disabled={!onSelect} onPress={() => onSelect?.(item)} style={[styles.coverageRow, index < items.length - 1 && { borderBottomColor: theme.colors.line, borderBottomWidth: StyleSheet.hairlineWidth }]}><View style={[styles.coverageLine, { backgroundColor: index === items.length - 1 ? 'transparent' : theme.colors.line }]}><StatusDot state={item.state} size={10} /></View><View style={styles.coverageBody}><Text style={[styles.coverageTitle, { color: theme.colors.ink }]}>{item.title}</Text><Text style={[styles.coverageSummary, { color: theme.colors.inkMuted }]} numberOfLines={2}>{item.summary}</Text></View><StatusPill state={item.state} /><ArrowIcon color={theme.colors.inkMuted} /></Pressable>)}</View>;
}

export function PrimaryButton({ label, onPress, disabled = false, quiet = false }: { label: string; onPress: () => void; disabled?: boolean; quiet?: boolean }) {
  const { theme } = useTheme();
  const backgroundColor = quiet ? theme.colors.surfaceMuted : theme.colors.forest;
  const textColor = quiet ? theme.colors.ink : theme.colors.white;
  return <Pressable disabled={disabled} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.primaryButton, { backgroundColor, opacity: disabled ? 0.45 : pressed ? 0.84 : 1 }]}><Text style={[styles.primaryButtonText, { color: textColor }]}>{label}</Text><ArrowIcon color={textColor} /></Pressable>;
}

export function ArrowIcon({ color, back = false }: { color: string; back?: boolean }) {
  return <View style={[styles.arrow, back && { transform: [{ rotate: '180deg' }] }]}><View style={[styles.arrowStem, { backgroundColor: color }]} /><View style={[styles.arrowHead, { borderRightColor: color, borderTopColor: color }]} /></View>;
}

export function BottomNavigation({ active, onNavigate }: { active: PrimaryScreen; onNavigate: (screen: PrimaryScreen) => void }) {
  const { theme } = useTheme();
  const tabs: { id: PrimaryScreen; label: string }[] = [{ id: 'home', label: 'Home' }, { id: 'protection', label: 'Protect' }, { id: 'scan', label: 'Scan' }, { id: 'activity', label: 'Activity' }, { id: 'profile', label: 'Profile' }];
  return <View style={[styles.nav, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.line }]}>{tabs.map((tab) => { const selected = tab.id === active; return <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onNavigate(tab.id)} style={styles.navItem}><NavMark kind={tab.id} selected={selected} /><Text style={[styles.navText, { color: selected ? theme.colors.forest : theme.colors.inkMuted }]}>{tab.label}</Text></Pressable>; })}</View>;
}

function NavMark({ kind, selected }: { kind: PrimaryScreen; selected: boolean }) {
  const { theme } = useTheme();
  const color = selected ? theme.colors.forest : theme.colors.inkMuted;
  return <View style={[styles.navMark, { borderColor: color, opacity: selected ? 1 : 0.72 }]}>{kind === 'scan' ? <View style={[styles.navScanMark, { borderColor: color }]}><View style={[styles.navScanCore, { backgroundColor: color }]} /></View> : kind === 'activity' ? <View style={styles.navBars}>{[7, 12, 9].map((height, index) => <View key={index} style={{ width: 3, height, backgroundColor: color, borderRadius: 2 }} />)}</View> : kind === 'profile' ? <><View style={[styles.navProfileHead, { borderColor: color }]} /><View style={[styles.navProfileBody, { backgroundColor: color }]} /></> : kind === 'protection' ? <View style={[styles.navShield, { borderColor: color }]} /> : <View style={[styles.navHome, { borderColor: color }]} />}</View>;
}

const styles = StyleSheet.create({
  brandHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  brandIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontFamily: type.display, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  brandLabel: { fontFamily: type.body, fontSize: 11, marginTop: 1 },
  headerSpacer: { width: 36 },
  profileButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  profileHead: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
  profileBody: { width: 15, height: 7, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.pill, flexShrink: 0 },
  statusPillText: { fontFamily: type.body, fontSize: 10, fontWeight: '700' },
  verdictPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.pill, alignSelf: 'flex-start' },
  verdictText: { fontFamily: type.body, fontSize: 11, fontWeight: '700' },
  trace: { height: 74, overflow: 'hidden', flexDirection: 'row', alignItems: 'flex-end', gap: 5, paddingHorizontal: 4, paddingBottom: 12 },
  traceCompact: { height: 52, gap: 4, paddingBottom: 9 },
  traceBaseline: { position: 'absolute', bottom: 12, left: 0, right: 0, height: 1 },
  traceBar: { width: 5, borderRadius: 3 },
  traceCursor: { position: 'absolute', width: 8, height: 8, borderRadius: 4, bottom: 8 },
  coverageMap: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  coverageRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 12 },
  coverageLine: { alignSelf: 'stretch', width: 36, alignItems: 'center', paddingTop: 21 },
  coverageBody: { flex: 1, paddingVertical: 12 },
  coverageTitle: { fontFamily: type.body, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  coverageSummary: { fontFamily: type.body, fontSize: 11, lineHeight: 15, marginTop: 3 },
  primaryButton: { minHeight: 52, borderRadius: radius.md, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButtonText: { fontFamily: type.body, fontSize: 14, fontWeight: '700' },
  arrow: { width: 20, height: 14, justifyContent: 'center' },
  arrowStem: { height: 1.5, width: 17, borderRadius: 1 },
  arrowHead: { position: 'absolute', right: 1, width: 7, height: 7, borderRightWidth: 1.5, borderTopWidth: 1.5, transform: [{ rotate: '45deg' }] },
  nav: { position: 'absolute', height: 74, bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  navItem: { flex: 1, alignItems: 'center', gap: 4, minHeight: 52 },
  navText: { fontFamily: type.body, fontSize: 10, fontWeight: '600' },
  navMark: { width: 20, height: 20, borderWidth: 0, alignItems: 'center', justifyContent: 'center' },
  navHome: { width: 13, height: 13, borderWidth: 1.5, borderTopLeftRadius: 4, borderTopRightRadius: 4, transform: [{ rotate: '45deg' }] },
  navShield: { width: 14, height: 16, borderWidth: 1.5, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 8, transform: [{ rotate: '45deg' }] },
  navScanMark: { width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  navScanCore: { width: 5, height: 5, borderRadius: 3 },
  navBars: { height: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  navProfileHead: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.25 },
  navProfileBody: { width: 13, height: 6, borderTopLeftRadius: 7, borderTopRightRadius: 7, marginTop: 2 },
});
