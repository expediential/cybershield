import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowIcon, SignalTrace, StatusDot } from '../../components/QuietSignal';
import { useTheme } from '../../core/ThemeProvider';
import { radius, space, type } from '../../design/tokens';

export function MonitoringScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: c.canvas }]}>
    <Pressable onPress={onBack} style={styles.back}><ArrowIcon color={c.ink} back /><Text style={[styles.backText, { color: c.ink }]}>Back</Text></Pressable>
    <View style={[styles.workspace, { backgroundColor: c.monitoringSurface }]}>
      <View style={styles.workspaceHeader}><Text style={[styles.kicker, { color: c.signal }]}>MONITORING WORKSPACE</Text><View style={[styles.unavailable, { borderColor: c.monitoringLine }]}><StatusDot state="configuration" size={6} /><Text style={[styles.unavailableText, { color: c.onForestMuted }]}>Not connected</Text></View></View>
      <Text style={[styles.title, { color: c.white }]}>Continuous awareness, when it is genuinely available.</Text>
      <Text style={[styles.copy, { color: c.monitoringMuted }]}>Network monitoring needs a dedicated Android VPN capability, system consent, and a visible stop control. None is active in this build.</Text>
      <View style={[styles.readout, { borderColor: c.monitoringLine }]}><Readout value="—" label="Events captured" /><Readout value="—" label="Network details" /><Readout value="0" label="Active sessions" /></View>
      <View style={[styles.traceFrame, { backgroundColor: c.monitoringQuiet }]}><SignalTrace active={false} /></View>
      <Text style={[styles.traceCaption, { color: c.monitoringMuted }]}>Signal space is intentionally quiet until a real, user-authorized monitor is connected.</Text>
    </View>
    <View style={styles.section}><Text style={[styles.sectionTitle, { color: c.ink }]}>What would be needed</Text><Requirement state="A native monitor" copy="A Kotlin Android VpnService implementation, separate from this Expo MVP." /><Requirement state="Your permission" copy="A clear Android system consent prompt started only after you choose to enable monitoring." /><Requirement state="Visible control" copy="An always-available stop action, privacy explanation, and no fabricated network events." /></View>
    <View style={[styles.genuine, { backgroundColor: c.surfaceMuted }]}><Text style={[styles.genuineTitle, { color: c.ink }]}>What CyberShield can do now</Text><Text style={[styles.genuineCopy, { color: c.inkMuted }]}>It can assess the structure of a link locally and record that assessment on this device. Those functions remain separate from network monitoring.</Text></View>
  </ScrollView>;
}

function Readout({ value, label }: { value: string; label: string }) {
  const { theme } = useTheme();
  return <View style={styles.readoutItem}><Text style={[styles.readoutValue, { color: theme.colors.white }]}>{value}</Text><Text style={[styles.readoutLabel, { color: theme.colors.monitoringMuted }]}>{label}</Text></View>;
}

function Requirement({ state, copy }: { state: string; copy: string }) {
  const { theme } = useTheme();
  return <View style={[styles.requirement, { borderTopColor: theme.colors.line }]}><StatusDot state="info" size={7} /><View style={styles.requirementBody}><Text style={[styles.requirementTitle, { color: theme.colors.ink }]}>{state}</Text><Text style={[styles.requirementCopy, { color: theme.colors.inkMuted }]}>{copy}</Text></View></View>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 52, paddingHorizontal: space.md, paddingBottom: space.xxl, minHeight: '100%' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 },
  backText: { fontFamily: type.body, fontSize: 13, fontWeight: '700' },
  workspace: { marginTop: space.xl, padding: 18, borderRadius: radius.xl, overflow: 'hidden' },
  workspaceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  kicker: { fontFamily: type.mono, fontSize: 9, letterSpacing: 0.65 },
  unavailable: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1 },
  unavailableText: { fontFamily: type.body, fontSize: 9, fontWeight: '700' },
  title: { fontFamily: type.display, fontSize: 26, lineHeight: 33, letterSpacing: -0.8, fontWeight: '700', marginTop: 24, maxWidth: 315 },
  copy: { fontFamily: type.body, fontSize: 12, lineHeight: 18, marginTop: 10 },
  readout: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 24, paddingVertical: 13 },
  readoutItem: { flex: 1 },
  readoutValue: { fontFamily: type.display, fontSize: 19, fontWeight: '700' },
  readoutLabel: { fontFamily: type.body, fontSize: 9, lineHeight: 13, marginTop: 3 },
  traceFrame: { marginTop: 16, borderRadius: radius.md, paddingHorizontal: 10 },
  traceCaption: { fontFamily: type.body, fontSize: 10, lineHeight: 15, marginTop: 8 },
  section: { marginTop: space.xl },
  sectionTitle: { fontFamily: type.display, fontSize: 21, fontWeight: '700', marginBottom: 5 },
  requirement: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 14, flexDirection: 'row', gap: 10 },
  requirementBody: { flex: 1 },
  requirementTitle: { fontFamily: type.body, fontSize: 13, fontWeight: '700' },
  requirementCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 3 },
  genuine: { padding: 16, borderRadius: radius.md, marginTop: 6 },
  genuineTitle: { fontFamily: type.body, fontSize: 14, fontWeight: '700' },
  genuineCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 17, marginTop: 5 },
});
