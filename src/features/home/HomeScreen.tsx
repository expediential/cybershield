import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandHeader, ModuleGlyph, PrimaryButton, SentinelCore, StatusDot, ThreatConstellation, VerdictPill } from '../../components/QuietSignal';
import { capabilities, type Capability } from '../../domain/capabilities';
import { derivePosture, needsAttention } from '../../domain/productState';
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
  onAlerts: () => void;
  onCapability: (capability: Capability) => void;
};

export function HomeScreen({ history, onScan, onFileScan, onProtection, onActivity, onProfile, onAlerts, onCapability }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const posture = derivePosture(history, capabilities.map((item) => item.state));
  const attention = history.filter((item) => needsAttention(item.verdict));
  const signals = attention.slice(0, 4).map((item) => ({ id: item.id, title: item.kind === 'url' ? 'Link assessment needs review' : 'File assessment needs review', detail: item.subject, severity: item.verdict === 'malicious' ? 'danger' as const : 'warning' as const, time: formatTime(item.createdAt), source: item.kind === 'url' ? 'PHISHING PROTECTION' : 'FILE SECURITY' }));
  const latest = history[0];

  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: c.canvas }]}>
    <BrandHeader label="Security dashboard" onProfile={onProfile} />
    <View style={styles.heroHead}><Text style={[styles.eyebrow, { color: c.signal }]}>SENTINEL STATUS</Text><Text style={[styles.heroTitle, { color: c.ink }]}>{posture.title}</Text><Text style={[styles.heroCopy, { color: c.inkMuted }]}>{posture.detail}</Text></View>
    <SentinelCore items={capabilities} posture={posture.tone} onPress={onProtection} />
    <View style={[styles.statusRail, { borderTopColor: c.line, borderBottomColor: c.line }]}><RailItem value={`${posture.availableModules}/${posture.totalModules}`} label="MODULES READY" /><RailItem value={String(posture.attentionCount)} label="NEED REVIEW" /><RailItem value={history.length ? String(history.length) : '—'} label="LOCAL CHECKS" /></View>

    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: c.ink }]}>Quick protection</Text><Text style={[styles.sectionMeta, { color: c.inkMuted }]}>ON DEVICE</Text></View>
    <View style={styles.quickActions}><Pressable onPress={onScan} style={[styles.urlAction, { backgroundColor: c.forest }]}><ModuleGlyph id="phishing" size={36} tone="default" /><View><Text style={[styles.quickKicker, { color: c.onForest }]}>PHISHING PROTECTION</Text><Text style={[styles.quickTitle, { color: c.onForest }]}>Check a suspicious link</Text></View></Pressable><Pressable onPress={onFileScan} style={[styles.fileAction, { backgroundColor: c.surfaceStrong, borderColor: c.line }]}><ModuleGlyph id="file" size={30} tone="active" /><Text style={[styles.fileActionTitle, { color: c.ink }]}>Inspect a file</Text><Text style={[styles.fileActionCopy, { color: c.inkMuted }]}>Metadata only</Text></Pressable></View>

    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: c.ink }]}>Threat alerts</Text><Pressable onPress={onAlerts}><Text style={[styles.sectionLink, { color: c.signal }]}>Open alerts</Text></Pressable></View>
    {attention.length ? <Pressable onPress={onAlerts} style={[styles.attentionStrip, { borderLeftColor: c.danger, backgroundColor: c.dangerSoft }]}><StatusDot state="danger" size={9} /><View style={styles.attentionBody}><Text style={[styles.attentionTitle, { color: c.ink }]}>{attention.length} assessment{attention.length === 1 ? '' : 's'} needs review</Text><Text numberOfLines={1} style={[styles.attentionCopy, { color: c.inkMuted }]}>{attention[0].subject}</Text></View><VerdictPill verdict={attention[0].verdict} /></Pressable> : <Pressable onPress={onAlerts} style={[styles.emptyAlert, { backgroundColor: c.surfaceMuted }]}><StatusDot state="safe" size={8} /><Text style={[styles.emptyAlertText, { color: c.inkMuted }]}>No threat alerts from saved local assessments.</Text></Pressable>}

    <ThreatConstellation events={signals} />

    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: c.ink }]}>Security modules</Text><Pressable onPress={onProtection}><Text style={[styles.sectionLink, { color: c.signal }]}>All modules</Text></Pressable></View>
    <View style={[styles.moduleRibbon, { borderTopColor: c.line, borderBottomColor: c.line }]}>{capabilities.map((item) => <Pressable key={item.id} onPress={() => onCapability(item)} style={styles.moduleEntry}><View style={[styles.moduleIcon, { backgroundColor: c.surfaceStrong }]}><ModuleGlyph id={item.id} size={23} tone={item.state === 'ready' ? 'active' : item.state === 'permission' ? 'warning' : 'default'} /></View><Text numberOfLines={1} style={[styles.moduleName, { color: c.ink }]}>{item.shortTitle}</Text><StatusDot state={item.state} size={6} /></Pressable>)}</View>

    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: c.ink }]}>Latest activity</Text><Pressable onPress={onActivity}><Text style={[styles.sectionLink, { color: c.signal }]}>View history</Text></Pressable></View>
    {latest ? <Pressable onPress={onActivity} style={[styles.latest, { borderTopColor: c.line, borderBottomColor: c.line }]}><View style={[styles.latestIcon, { backgroundColor: c.surfaceStrong }]}><ModuleGlyph id={latest.kind === 'url' ? 'phishing' : 'file'} size={24} tone={latest.verdict === 'safe' ? 'active' : 'warning'} /></View><View style={styles.latestBody}><Text style={[styles.latestType, { color: c.inkMuted }]}>{latest.kind === 'url' ? 'LINK ASSESSMENT' : 'FILE ASSESSMENT'} · {formatTime(latest.createdAt)}</Text><Text numberOfLines={1} style={[styles.latestSubject, { color: c.ink }]}>{latest.subject}</Text><Text numberOfLines={1} style={[styles.latestDetail, { color: c.inkMuted }]}>{latest.detail}</Text></View></Pressable> : <View style={[styles.latestEmpty, { backgroundColor: c.surfaceMuted }]}><Text style={[styles.latestEmptyTitle, { color: c.ink }]}>No local activity yet</Text><Text style={[styles.latestEmptyCopy, { color: c.inkMuted }]}>Use Phishing Protection or File Security to create your first assessment.</Text><PrimaryButton label="Check a suspicious link" onPress={onScan} quiet /></View>}
    <View style={styles.bottomSpace} />
  </ScrollView>;
}

function RailItem({ value, label }: { value: string; label: string }) {
  const { theme } = useTheme();
  return <View style={styles.railItem}><Text style={[styles.railValue, { color: theme.colors.ink }]}>{value}</Text><Text style={[styles.railLabel, { color: theme.colors.inkMuted }]}>{label}</Text></View>;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  content: { paddingTop: 52, paddingHorizontal: space.md, paddingBottom: 104, minHeight: '100%' },
  heroHead: { marginTop: space.xl, maxWidth: 350 },
  eyebrow: { fontFamily: type.mono, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroTitle: { fontFamily: type.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.85, fontWeight: '700', marginTop: 9 },
  heroCopy: { fontFamily: type.body, fontSize: 13, lineHeight: 20, marginTop: 8 },
  statusRail: { minHeight: 74, flexDirection: 'row', marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  railItem: { flex: 1, alignItems: 'center' }, railValue: { fontFamily: type.display, fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] }, railLabel: { fontFamily: type.mono, fontSize: 7, letterSpacing: 0.45, textAlign: 'center', marginTop: 3 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginTop: space.xl, marginBottom: space.sm },
  sectionTitle: { fontFamily: type.display, fontSize: 19, fontWeight: '700', letterSpacing: -0.3 }, sectionMeta: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.55 }, sectionLink: { fontFamily: type.body, fontSize: 11, fontWeight: '800' },
  quickActions: { flexDirection: 'row', gap: 10 }, urlAction: { flex: 1.34, minHeight: 149, padding: 16, justifyContent: 'space-between' }, fileAction: { flex: 0.86, minHeight: 149, padding: 14, borderWidth: 1, justifyContent: 'space-between' },
  quickKicker: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.6, fontWeight: '800' }, quickTitle: { fontFamily: type.display, fontSize: 19, lineHeight: 23, fontWeight: '700', maxWidth: 145 }, fileActionTitle: { fontFamily: type.body, fontSize: 14, fontWeight: '800' }, fileActionCopy: { fontFamily: type.body, fontSize: 10, marginTop: 4 },
  attentionStrip: { minHeight: 82, padding: 14, borderLeftWidth: 3, flexDirection: 'row', alignItems: 'center', gap: 10 }, attentionBody: { flex: 1 }, attentionTitle: { fontFamily: type.body, fontSize: 13, fontWeight: '800' }, attentionCopy: { fontFamily: type.body, fontSize: 10, marginTop: 4 },
  emptyAlert: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14 }, emptyAlertText: { fontFamily: type.body, fontSize: 11 },
  moduleRibbon: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 13 }, moduleEntry: { flex: 1, alignItems: 'center', gap: 5, minWidth: 0 }, moduleIcon: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 18 }, moduleName: { fontFamily: type.body, fontSize: 8, fontWeight: '700', maxWidth: 49, textAlign: 'center' },
  latest: { minHeight: 90, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12 }, latestIcon: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md }, latestBody: { flex: 1 }, latestType: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.45 }, latestSubject: { fontFamily: type.body, fontSize: 13, fontWeight: '800', marginTop: 5 }, latestDetail: { fontFamily: type.body, fontSize: 10, marginTop: 3 },
  latestEmpty: { padding: 16 }, latestEmptyTitle: { fontFamily: type.body, fontSize: 14, fontWeight: '800' }, latestEmptyCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 5, marginBottom: 14 }, bottomSpace: { height: 18 },
});
