import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { BrandHeader, StatusDot } from '../../components/QuietSignal';
import { SignalMark } from '../../brand/SignalMark';
import { useTheme } from '../../core/ThemeProvider';
import { radius, space, type } from '../../design/tokens';

export function ProfileScreen({ onLearning, onAlerts }: { onLearning: () => void; onAlerts: () => void }) {
  const { theme, mode, setMode } = useTheme();
  const c = theme.colors;
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: c.canvas }]}>
    <BrandHeader label="Profile & preferences" />
    <View style={styles.intro}><Text style={[styles.eyebrow, { color: c.forest }]}>YOUR CYBERSHIELD</Text><Text style={[styles.title, { color: c.ink }]}>Private by default. Clear by design.</Text><Text style={[styles.copy, { color: c.inkMuted }]}>Your assessment history stays on this device. CyberShield has no account, no analytics SDK, and no connected threat-intelligence provider in this build.</Text></View>
    <View style={styles.section}><Text style={[styles.sectionTitle, { color: c.ink }]}>Appearance</Text><View style={[styles.preference, { borderTopColor: c.line, borderBottomColor: c.line }]}><View style={styles.preferenceBody}><Text style={[styles.preferenceTitle, { color: c.ink }]}>Use dark monitoring surfaces</Text><Text style={[styles.preferenceCopy, { color: c.inkMuted }]}>A considered dark theme for low-light use and the monitoring workspace.</Text></View><Switch value={mode === 'dark'} onValueChange={(value) => setMode(value ? 'dark' : 'light')} trackColor={{ false: c.surfaceStrong, true: c.forest }} thumbColor={mode === 'dark' ? c.white : c.surface} /></View></View>
    <View style={styles.section}><Text style={[styles.sectionTitle, { color: c.ink }]}>Privacy boundaries</Text><PreferenceRow title="Link assessment" value="ON-DEVICE" detail="Address structure only" state="available" /><PreferenceRow title="File assessment" value="METADATA ONLY" detail="No content execution or upload" state="available" /><PreferenceRow title="Network monitoring" value="NOT CONNECTED" detail="No traffic collection" state="configuration" /></View>
    <View style={styles.section}><Text style={[styles.sectionTitle, { color: c.ink }]}>Explore</Text><ActionRow title="Security field notes" copy="Short guides for everyday digital safety." onPress={onLearning} /><ActionRow title="Alerts centre" copy="A focused view of items that need attention." onPress={onAlerts} /></View>
    <View style={[styles.about, { backgroundColor: c.surfaceMuted }]}><SignalMark size={35} /><View style={styles.aboutBody}><Text style={[styles.aboutName, { color: c.ink }]}>CyberShield</Text><Text style={[styles.aboutTagline, { color: c.inkMuted }]}>Your digital life. Under your protection.</Text><Text style={[styles.aboutVersion, { color: c.inkMuted }]}>VERSION 0.3.0 · LOCAL-FIRST</Text></View></View>
    <View style={styles.bottomSpace} />
  </ScrollView>;
}

export function LearningScreen({ onBack }: { onBack: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const notes = [
    ['Pause before the tap', 'Unexpected urgency is a common social-engineering tactic. Verify the sender through a channel you already trust.'],
    ['Read the registered domain', 'A familiar word in a link is not enough. Check the actual domain before entering credentials or payment details.'],
    ['Treat installs deliberately', 'Use trusted stores, review sensitive permissions, and remove apps you no longer use.'],
    ['Protect recovery paths', 'A password manager and phishing-resistant multi-factor authentication reduce the impact of a compromised password.'],
  ];
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: c.canvas }]}><Pressable onPress={onBack} style={styles.back}><Text style={[styles.backText, { color: c.ink }]}>Back</Text></Pressable><Text style={[styles.learningTitle, { color: c.ink }]}>Field notes for calmer decisions.</Text><Text style={[styles.copy, { color: c.inkMuted }]}>Small habits that make everyday digital risks easier to spot.</Text><View style={styles.notes}>{notes.map(([title, copy], index) => <View key={title} style={[styles.note, { borderLeftColor: index % 2 ? c.signal : c.forest, backgroundColor: c.surface }]}><Text style={[styles.noteIndex, { color: c.inkMuted }]}>0{index + 1}</Text><Text style={[styles.noteTitle, { color: c.ink }]}>{title}</Text><Text style={[styles.noteCopy, { color: c.inkMuted }]}>{copy}</Text></View>)}</View></ScrollView>;
}

export function AlertsScreen({ alertCount, onBack }: { alertCount: number; onBack: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: c.canvas }]}><Pressable onPress={onBack} style={styles.back}><Text style={[styles.backText, { color: c.ink }]}>Back</Text></Pressable><Text style={[styles.learningTitle, { color: c.ink }]}>Alerts</Text><Text style={[styles.copy, { color: c.inkMuted }]}>{alertCount ? `${alertCount} saved assessment${alertCount > 1 ? 's need' : ' needs'} your attention.` : 'Nothing needs your attention right now.'}</Text>{alertCount ? <View style={[styles.alertCard, { backgroundColor: c.amberSoft }]}><StatusDot state="warning" size={9} /><View style={styles.alertBody}><Text style={[styles.alertTitle, { color: c.ink }]}>Review a recent assessment</Text><Text style={[styles.alertCopy, { color: c.inkMuted }]}>A link or file recorded a signal worth checking before you continue.</Text></View></View> : <View style={[styles.alertCard, { backgroundColor: c.signalSoft }]}><StatusDot state="safe" size={9} /><View style={styles.alertBody}><Text style={[styles.alertTitle, { color: c.ink }]}>No saved alerts</Text><Text style={[styles.alertCopy, { color: c.inkMuted }]}>CyberShield only surfaces a notice when an assessment records something that needs review.</Text></View></View>}</ScrollView>;
}

function PreferenceRow({ title, value, detail, state }: { title: string; value: string; detail: string; state: 'available' | 'configuration' }) {
  const { theme } = useTheme();
  return <View style={[styles.preferenceRow, { borderTopColor: theme.colors.line }]}><StatusDot state={state} size={8} /><View style={styles.preferenceRowBody}><Text style={[styles.preferenceTitle, { color: theme.colors.ink }]}>{title}</Text><Text style={[styles.preferenceCopy, { color: theme.colors.inkMuted }]}>{detail}</Text></View><Text style={[styles.preferenceValue, { color: state === 'available' ? theme.colors.forest : theme.colors.inkMuted }]}>{value}</Text></View>;
}

function ActionRow({ title, copy, onPress }: { title: string; copy: string; onPress: () => void }) {
  const { theme } = useTheme();
  return <Pressable onPress={onPress} style={[styles.action, { borderTopColor: theme.colors.line }]}><View style={styles.actionBody}><Text style={[styles.preferenceTitle, { color: theme.colors.ink }]}>{title}</Text><Text style={[styles.preferenceCopy, { color: theme.colors.inkMuted }]}>{copy}</Text></View><Text style={[styles.actionArrow, { color: theme.colors.forest }]}>Open</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 58, paddingHorizontal: space.md, paddingBottom: 104, minHeight: '100%' },
  intro: { marginTop: space.xxl, maxWidth: 350 },
  eyebrow: { fontFamily: type.body, fontSize: 10, letterSpacing: 0.55, fontWeight: '800' },
  title: { fontFamily: type.display, fontSize: 29, lineHeight: 36, letterSpacing: -0.9, fontWeight: '700', marginTop: 9 },
  copy: { fontFamily: type.body, fontSize: 13, lineHeight: 20, marginTop: 9 },
  section: { marginTop: space.xl },
  sectionTitle: { fontFamily: type.display, fontSize: 19, fontWeight: '700', marginBottom: 7 },
  preference: { minHeight: 75, flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 13 },
  preferenceBody: { flex: 1 },
  preferenceTitle: { fontFamily: type.body, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  preferenceCopy: { fontFamily: type.body, fontSize: 10, lineHeight: 15, marginTop: 3 },
  preferenceRow: { minHeight: 69, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  preferenceRowBody: { flex: 1 },
  preferenceValue: { width: 86, textAlign: 'right', fontFamily: type.mono, fontSize: 8, lineHeight: 12, letterSpacing: 0.35 },
  action: { minHeight: 72, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  actionBody: { flex: 1 },
  actionArrow: { fontFamily: type.body, fontSize: 11, fontWeight: '700' },
  about: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: space.xl, padding: 15, borderRadius: radius.md },
  aboutBody: { flex: 1 },
  aboutName: { fontFamily: type.display, fontSize: 17, fontWeight: '700' },
  aboutTagline: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 2 },
  aboutVersion: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.45, marginTop: 8 },
  bottomSpace: { height: 16 },
  back: { minHeight: 40, justifyContent: 'center' },
  backText: { fontFamily: type.body, fontSize: 13, fontWeight: '700' },
  learningTitle: { fontFamily: type.display, fontSize: 30, lineHeight: 37, letterSpacing: -0.9, fontWeight: '700', marginTop: space.xxl, maxWidth: 335 },
  notes: { marginTop: space.xl, gap: 9 },
  note: { padding: 16, borderLeftWidth: 3, borderRadius: radius.sm },
  noteIndex: { fontFamily: type.mono, fontSize: 9 },
  noteTitle: { fontFamily: type.display, fontSize: 18, fontWeight: '700', marginTop: 8 },
  noteCopy: { fontFamily: type.body, fontSize: 12, lineHeight: 18, marginTop: 5 },
  alertCard: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: radius.md, marginTop: space.xl },
  alertBody: { flex: 1 },
  alertTitle: { fontFamily: type.body, fontSize: 14, fontWeight: '700' },
  alertCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 4 },
});
