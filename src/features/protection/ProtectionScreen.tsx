import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandHeader, CoverageMap, SignalTrace, StatusDot } from '../../components/QuietSignal';
import { capabilities, type Capability } from '../../domain/capabilities';
import { useTheme } from '../../core/ThemeProvider';
import { radius, space, type } from '../../design/tokens';

export function ProtectionScreen({ onProfile, onCapability, onMonitor }: { onProfile: () => void; onCapability: (capability: Capability) => void; onMonitor: () => void }) {
  const { theme } = useTheme();
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: theme.colors.canvas }]}>
    <BrandHeader label="Protection centre" onProfile={onProfile} />
    <View style={styles.intro}><Text style={[styles.title, { color: theme.colors.ink }]}>A clear view of what can help today.</Text><Text style={[styles.copy, { color: theme.colors.inkMuted }]}>CyberShield separates available checks from those that need your permission, configuration, or a native connection.</Text></View>
    <View style={[styles.explainer, { backgroundColor: theme.colors.surfaceMuted }]}><View style={[styles.explainerMark, { borderColor: theme.colors.forest }]}><StatusDot state="available" size={8} /></View><View style={styles.explainerBody}><Text style={[styles.explainerTitle, { color: theme.colors.ink }]}>Protection is a set of honest signals</Text><Text style={[styles.explainerCopy, { color: theme.colors.inkMuted }]}>A ready check can run now. Other areas are shown only when the device can support them.</Text></View></View>
    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.colors.ink }]}>Your coverage map</Text><Text style={[styles.sectionMeta, { color: theme.colors.inkMuted }]}>6 AREAS</Text></View>
    <CoverageMap items={capabilities} onSelect={onCapability} />
    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.colors.ink }]}>Monitoring workspace</Text></View>
    <Pressable onPress={onMonitor} style={[styles.monitorEntry, { backgroundColor: theme.colors.surface, borderColor: theme.colors.line }]}><View style={styles.monitorTop}><View><Text style={[styles.monitorKicker, { color: theme.colors.forest }]}>NETWORK ACTIVITY</Text><Text style={[styles.monitorTitle, { color: theme.colors.ink }]}>Not connected yet</Text></View><StatusDot state="configuration" size={9} /></View><Text style={[styles.monitorCopy, { color: theme.colors.inkMuted }]}>Explore the dedicated workspace to see the privacy and Android requirements for meaningful monitoring.</Text><SignalTrace compact /><View style={[styles.monitorBottom, { borderTopColor: theme.colors.line }]}><Text style={[styles.monitorBottomText, { color: theme.colors.inkMuted }]}>No VPN session is active.</Text><Text style={[styles.openLabel, { color: theme.colors.forest }]}>Open workspace</Text></View></Pressable>
    <View style={styles.bottomSpace} />
  </ScrollView>;
}

export function CapabilityDetailScreen({ capability, onBack, onAction }: { capability: Capability; onBack: () => void; onAction: () => void }) {
  const { theme } = useTheme();
  const ready = capability.state === 'available';
  const explanation = ready ? 'This check is ready on this device. CyberShield describes exactly what it can examine before you begin.' : capability.state === 'permission' ? 'This area needs a native Android adapter and a clear permission request at the moment you choose to use it.' : 'This area is not connected in this build. It is shown so you can understand the coverage boundary, not as a claim of protection.';
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: theme.colors.canvas }]}>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}><View style={[styles.backLine, { backgroundColor: theme.colors.ink }]} /><Text style={[styles.backText, { color: theme.colors.ink }]}>Back to protection</Text></Pressable>
    <View style={styles.detailHero}><View style={[styles.detailIndex, { backgroundColor: ready ? theme.colors.signalSoft : theme.colors.surfaceMuted }]}><StatusDot state={capability.state} size={12} /></View><Text style={[styles.detailTitle, { color: theme.colors.ink }]}>{capability.title}</Text><Text style={[styles.detailSummary, { color: theme.colors.inkMuted }]}>{capability.summary}</Text></View>
    <View style={[styles.detailBlock, { borderTopColor: theme.colors.line, borderBottomColor: theme.colors.line }]}><Text style={[styles.detailLabel, { color: theme.colors.inkMuted }]}>CURRENT STATUS</Text><View style={styles.detailStatus}><StatusDot state={capability.state} size={9} /><Text style={[styles.detailStatusText, { color: theme.colors.ink }]}>{ready ? 'Ready for a focused local check' : capability.state === 'permission' ? 'Not available without device access' : 'Not connected or configured'}</Text></View></View>
    <View style={styles.detailNote}><Text style={[styles.detailLabel, { color: theme.colors.inkMuted }]}>WHAT THIS MEANS</Text><Text style={[styles.detailBody, { color: theme.colors.ink }]}>{explanation}</Text></View>
    <View style={[styles.detailCallout, { backgroundColor: theme.colors.surfaceMuted }]}><Text style={[styles.detailCalloutTitle, { color: theme.colors.ink }]}>No hidden access</Text><Text style={[styles.detailCalloutCopy, { color: theme.colors.inkMuted }]}>CyberShield does not silently inspect apps, nearby devices, Wi-Fi details, or network traffic. Those capabilities need dedicated Android integrations and your direct approval.</Text></View>
    {ready ? <Pressable onPress={onAction} style={[styles.detailAction, { backgroundColor: theme.colors.forest }]}><Text style={[styles.detailActionText, { color: theme.colors.white }]}>{capability.action}</Text></Pressable> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 58, paddingHorizontal: space.md, paddingBottom: 104, minHeight: '100%' },
  intro: { marginTop: space.xxl, maxWidth: 350 },
  title: { fontFamily: type.display, fontSize: 29, lineHeight: 36, letterSpacing: -0.9, fontWeight: '700' },
  copy: { fontFamily: type.body, fontSize: 14, lineHeight: 21, marginTop: 10 },
  explainer: { flexDirection: 'row', gap: 12, padding: 15, borderRadius: radius.md, marginTop: space.xl },
  explainerMark: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  explainerBody: { flex: 1 },
  explainerTitle: { fontFamily: type.body, fontSize: 13, fontWeight: '700' },
  explainerCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginTop: space.xl, marginBottom: space.sm },
  sectionTitle: { fontFamily: type.display, fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  sectionMeta: { fontFamily: type.mono, fontSize: 9, letterSpacing: 0.4 },
  monitorEntry: { borderWidth: 1, borderRadius: radius.lg, padding: 16 },
  monitorTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  monitorKicker: { fontFamily: type.body, fontSize: 10, letterSpacing: 0.55, fontWeight: '800' },
  monitorTitle: { fontFamily: type.display, fontSize: 20, fontWeight: '700', marginTop: 5 },
  monitorCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 8 },
  monitorBottom: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  monitorBottomText: { fontFamily: type.body, fontSize: 10 },
  openLabel: { fontFamily: type.body, fontSize: 11, fontWeight: '700' },
  bottomSpace: { height: 20 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 },
  backLine: { width: 15, height: 1.5 },
  backText: { fontFamily: type.body, fontSize: 13, fontWeight: '700' },
  detailHero: { marginTop: space.xxl, alignItems: 'flex-start', maxWidth: 340 },
  detailIndex: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontFamily: type.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.8, fontWeight: '700', marginTop: 18 },
  detailSummary: { fontFamily: type.body, fontSize: 14, lineHeight: 21, marginTop: 8 },
  detailBlock: { marginTop: space.xl, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 15 },
  detailLabel: { fontFamily: type.mono, fontSize: 9, letterSpacing: 0.55 },
  detailStatus: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 9 },
  detailStatusText: { fontFamily: type.body, fontSize: 14, fontWeight: '700', flex: 1 },
  detailNote: { marginTop: space.xl },
  detailBody: { fontFamily: type.body, fontSize: 15, lineHeight: 23, marginTop: 9 },
  detailCallout: { padding: 16, borderRadius: radius.md, marginTop: space.xl },
  detailCalloutTitle: { fontFamily: type.body, fontSize: 14, fontWeight: '700' },
  detailCalloutCopy: { fontFamily: type.body, fontSize: 12, lineHeight: 18, marginTop: 6 },
  detailAction: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: space.xl },
  detailActionText: { fontFamily: type.body, fontSize: 14, fontWeight: '700' },
});
