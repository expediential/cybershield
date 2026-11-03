import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandHeader, CoverageMap, PrimaryButton, SignalTrace, StatusDot, VerdictPill } from '../../components/QuietSignal';
import { capabilities, type Capability } from '../../domain/capabilities';
import { radius, space, type } from '../../design/tokens';
import { useTheme } from '../../core/ThemeProvider';
import type { ScanHistoryItem } from '../../types/security';

type Props = {
  history: ScanHistoryItem[];
  onScan: () => void;
  onFileScan: () => void;
  onProtection: () => void;
  onActivity: () => void;
  onProfile: () => void;
  onMonitor: () => void;
  onCapability: (capability: Capability) => void;
};

export function HomeScreen({ history, onScan, onFileScan, onProtection, onActivity, onProfile, onMonitor, onCapability }: Props) {
  const { theme } = useTheme();
  const attention = history.filter((item) => item.verdict === 'suspicious' || item.verdict === 'malicious');
  const latest = history[0];
  const available = capabilities.filter((item) => item.state === 'available').length;
  const needsSetup = capabilities.length - available;
  const headline = attention.length > 0 ? `${attention.length} item${attention.length > 1 ? 's' : ''} needs attention` : latest ? 'Your latest checks are clear' : 'Your protection picture is ready';
  const description = attention.length > 0 ? 'Review the latest link or file result before acting on it.' : latest ? 'CyberShield has not found a high-risk local signal in your most recent check.' : 'Start with a link or file whenever something feels off.';

  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: theme.colors.canvas }]}>
    <BrandHeader label="Your digital life, in view" onProfile={onProfile} />
    <View style={styles.hero}><Text style={[styles.eyebrow, { color: theme.colors.forest }]}>TODAY’S OVERVIEW</Text><Text style={[styles.heroTitle, { color: theme.colors.ink }]}>{headline}</Text><Text style={[styles.heroCopy, { color: theme.colors.inkMuted }]}>{description}</Text></View>

    <Pressable onPress={onProtection} style={[styles.coverageIntro, { backgroundColor: theme.colors.forest }]}>
      <View style={styles.coverageTopline}><Text style={[styles.coverageLabel, { color: theme.colors.signal }]}>YOUR COVERAGE</Text><Text style={[styles.coverageAction, { color: theme.colors.white }]}>View protection</Text></View>
      <View style={styles.coverageFigure}><Text style={[styles.coverageNumber, { color: theme.colors.white }]}>{available}</Text><View><Text style={[styles.coverageStatement, { color: theme.colors.white }]}>checks are ready</Text><Text style={[styles.coverageSupporting, { color: theme.colors.onForestMuted }]}>{needsSetup} capabilities need setup or access</Text></View></View>
      <View style={[styles.coverageRule, { backgroundColor: theme.colors.onForestLine }]}><View style={[styles.coverageFill, { backgroundColor: theme.colors.signal, width: `${(available / capabilities.length) * 100}%` }]} /></View>
    </Pressable>

    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.colors.ink }]}>Start a check</Text><Text style={[styles.sectionMeta, { color: theme.colors.inkMuted }]}>ON YOUR TERMS</Text></View>
    <View style={styles.actionRow}><Pressable onPress={onScan} style={[styles.actionTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.line }]}><View style={[styles.actionSignal, { backgroundColor: theme.colors.signalSoft }]}><StatusDot state="available" size={10} /></View><Text style={[styles.actionTitle, { color: theme.colors.ink }]}>Check a link</Text><Text style={[styles.actionCopy, { color: theme.colors.inkMuted }]}>Inspect a suspicious URL before you open it.</Text></Pressable><Pressable onPress={onFileScan} style={[styles.actionTile, { backgroundColor: theme.colors.surfaceMuted }]}><View style={[styles.actionSignal, { backgroundColor: theme.colors.amberSoft }]}><StatusDot state="warning" size={10} /></View><Text style={[styles.actionTitle, { color: theme.colors.ink }]}>Assess a file</Text><Text style={[styles.actionCopy, { color: theme.colors.inkMuted }]}>Review metadata without uploading its contents.</Text></Pressable></View>

    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.colors.ink }]}>Quiet signal</Text><Pressable onPress={onMonitor}><Text style={[styles.inlineLink, { color: theme.colors.forest }]}>Monitoring</Text></Pressable></View>
    <Pressable onPress={onMonitor} style={[styles.signalPanel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.line }]}><View style={styles.signalPanelHeader}><View><Text style={[styles.signalHeadline, { color: theme.colors.ink }]}>Network monitoring isn’t connected yet</Text><Text style={[styles.signalDescription, { color: theme.colors.inkMuted }]}>Preview the monitoring workspace and see what it needs to become available.</Text></View><StatusDot state="configuration" size={9} /></View><SignalTrace compact /><View style={[styles.signalFooter, { borderTopColor: theme.colors.line }]}><Text style={[styles.signalFooterText, { color: theme.colors.inkMuted }]}>No network traffic is being collected.</Text><Text style={[styles.inlineLink, { color: theme.colors.forest }]}>Open</Text></View></Pressable>

    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.colors.ink }]}>Recent activity</Text><Pressable onPress={onActivity}><Text style={[styles.inlineLink, { color: theme.colors.forest }]}>See all</Text></Pressable></View>
    {latest ? <Pressable onPress={onActivity} style={[styles.recentRow, { borderTopColor: theme.colors.line, borderBottomColor: theme.colors.line }]}><View style={[styles.historyKind, { backgroundColor: theme.colors.surfaceMuted }]}><Text style={[styles.historyKindText, { color: theme.colors.forest }]}>{latest.kind === 'url' ? 'LINK' : 'FILE'}</Text></View><View style={styles.recentBody}><Text numberOfLines={1} style={[styles.recentSubject, { color: theme.colors.ink }]}>{latest.subject}</Text><Text numberOfLines={1} style={[styles.recentDetail, { color: theme.colors.inkMuted }]}>{latest.detail}</Text></View><VerdictPill verdict={latest.verdict} /></Pressable> : <View style={[styles.emptyRecent, { backgroundColor: theme.colors.surfaceMuted }]}><Text style={[styles.emptyRecentTitle, { color: theme.colors.ink }]}>Nothing checked yet</Text><Text style={[styles.emptyRecentCopy, { color: theme.colors.inkMuted }]}>Your verified link and file assessments will appear here.</Text><PrimaryButton label="Run your first check" onPress={onScan} quiet /></View>}

    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.colors.ink }]}>What’s available</Text><Pressable onPress={onProtection}><Text style={[styles.inlineLink, { color: theme.colors.forest }]}>Protection centre</Text></Pressable></View>
    <CoverageMap items={capabilities.slice(0, 3)} onSelect={onCapability} />
    <View style={styles.bottomSpace} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 58, paddingHorizontal: space.md, paddingBottom: 104, minHeight: '100%' },
  hero: { marginTop: space.xxl, maxWidth: 340 },
  eyebrow: { fontFamily: type.body, fontSize: 11, fontWeight: '700', letterSpacing: 0.35 },
  heroTitle: { fontFamily: type.display, fontSize: 32, lineHeight: 38, letterSpacing: -1.1, fontWeight: '700', marginTop: 9 },
  heroCopy: { fontFamily: type.body, fontSize: 14, lineHeight: 21, marginTop: 10 },
  coverageIntro: { marginTop: space.xl, padding: 18, borderRadius: radius.lg },
  coverageTopline: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  coverageLabel: { fontFamily: type.body, fontSize: 10, fontWeight: '800', letterSpacing: 0.75 },
  coverageAction: { fontFamily: type.body, fontSize: 11, fontWeight: '700' },
  coverageFigure: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  coverageNumber: { fontFamily: type.display, fontSize: 48, lineHeight: 52, fontWeight: '700', fontVariant: ['tabular-nums'] },
  coverageStatement: { fontFamily: type.body, fontSize: 16, fontWeight: '700' },
  coverageSupporting: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 3 },
  coverageRule: { height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 20 },
  coverageFill: { height: '100%', borderRadius: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: space.xl, marginBottom: space.sm },
  sectionTitle: { fontFamily: type.display, fontSize: 19, fontWeight: '700', letterSpacing: -0.3 },
  sectionMeta: { fontFamily: type.mono, fontSize: 9, letterSpacing: 0.45 },
  inlineLink: { fontFamily: type.body, fontSize: 12, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionTile: { flex: 1, minHeight: 164, padding: 14, borderRadius: radius.md, borderWidth: 1, justifyContent: 'space-between' },
  actionSignal: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: type.body, fontSize: 14, fontWeight: '700', marginTop: 15 },
  actionCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 5 },
  signalPanel: { borderWidth: 1, padding: 15, borderRadius: radius.md },
  signalPanelHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  signalHeadline: { flex: 1, fontFamily: type.body, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  signalDescription: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 4, maxWidth: 290 },
  signalFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  signalFooterText: { fontFamily: type.body, fontSize: 10, flex: 1 },
  recentRow: { minHeight: 76, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  historyKind: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  historyKindText: { fontFamily: type.mono, fontSize: 9, fontWeight: '700' },
  recentBody: { flex: 1 },
  recentSubject: { fontFamily: type.body, fontSize: 13, fontWeight: '700' },
  recentDetail: { fontFamily: type.body, fontSize: 10, marginTop: 4 },
  emptyRecent: { padding: 16, borderRadius: radius.md },
  emptyRecentTitle: { fontFamily: type.body, fontSize: 15, fontWeight: '700' },
  emptyRecentCopy: { fontFamily: type.body, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 14 },
  bottomSpace: { height: 20 },
});
