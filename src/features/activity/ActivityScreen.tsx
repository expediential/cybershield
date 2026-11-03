import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandHeader, StatusDot, VerdictPill } from '../../components/QuietSignal';
import { useTheme } from '../../core/ThemeProvider';
import { radius, space, type } from '../../design/tokens';
import type { ScanHistoryItem } from '../../types/security';

type Filter = 'all' | 'url' | 'file';

export function ActivityScreen({ history, onProfile, onHistory }: { history: ScanHistoryItem[]; onProfile: () => void; onHistory: () => void }) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const filtered = useMemo(() => history.filter((item) => filter === 'all' || item.kind === filter), [filter, history]);
  const attention = history.filter((item) => item.verdict === 'suspicious' || item.verdict === 'malicious').length;
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: theme.colors.canvas }]}>
    <BrandHeader label="Activity" onProfile={onProfile} />
    <View style={styles.intro}><Text style={[styles.eyebrow, { color: theme.colors.forest }]}>YOUR LOCAL RECORD</Text><Text style={[styles.title, { color: theme.colors.ink }]}>{history.length ? attention ? `${attention} result${attention > 1 ? 's' : ''} needs a closer look` : 'Your recent checks are clear' : 'Your activity will appear here'}</Text><Text style={[styles.copy, { color: theme.colors.inkMuted }]}>{history.length ? 'Every item below was created by a link or file assessment on this device.' : 'CyberShield keeps a compact, local record after you choose to assess a link or file.'}</Text></View>
    <View style={[styles.summary, { backgroundColor: theme.colors.surfaceMuted }]}><SummaryMetric number={String(history.length)} label="checks saved" /><View style={[styles.summaryDivider, { backgroundColor: theme.colors.line }]} /><SummaryMetric number={String(attention)} label="need review" /><View style={[styles.summaryDivider, { backgroundColor: theme.colors.line }]} /><SummaryMetric number={String(history.filter((item) => item.verdict === 'safe').length)} label="no high-risk signal" /></View>
    <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: theme.colors.ink }]}>Assessment history</Text><Pressable onPress={onHistory}><Text style={[styles.link, { color: theme.colors.forest }]}>Full history</Text></Pressable></View>
    <View style={styles.filters}><FilterButton active={filter === 'all'} label="All" onPress={() => setFilter('all')} /><FilterButton active={filter === 'url'} label="Links" onPress={() => setFilter('url')} /><FilterButton active={filter === 'file'} label="Files" onPress={() => setFilter('file')} /></View>
    {filtered.length ? <View style={[styles.timeline, { borderColor: theme.colors.line }]}>{filtered.map((item, index) => <HistoryItem key={item.id} item={item} isLast={index === filtered.length - 1} />)}</View> : <EmptyHistory filter={filter} />}
    <View style={styles.bottomSpace} />
  </ScrollView>;
}

export function HistoryScreen({ history, onBack }: { history: ScanHistoryItem[]; onBack: () => void }) {
  const { theme } = useTheme();
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: theme.colors.canvas }]}><Pressable onPress={onBack} style={styles.back}><View style={[styles.backLine, { backgroundColor: theme.colors.ink }]} /><Text style={[styles.backText, { color: theme.colors.ink }]}>Back</Text></Pressable><Text style={[styles.historyTitle, { color: theme.colors.ink }]}>All assessments</Text><Text style={[styles.copy, { color: theme.colors.inkMuted }]}>This record stays in local app storage. It contains file names and link addresses that you chose to assess.</Text>{history.length ? <View style={[styles.timeline, { borderColor: theme.colors.line, marginTop: space.xl }]}>{history.map((item, index) => <HistoryItem key={item.id} item={item} isLast={index === history.length - 1} />)}</View> : <EmptyHistory filter="all" />}</ScrollView>;
}

function SummaryMetric({ number, label }: { number: string; label: string }) {
  const { theme } = useTheme();
  return <View style={styles.summaryMetric}><Text style={[styles.summaryNumber, { color: theme.colors.ink }]}>{number}</Text><Text style={[styles.summaryLabel, { color: theme.colors.inkMuted }]}>{label}</Text></View>;
}

function FilterButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { theme } = useTheme();
  return <Pressable onPress={onPress} style={[styles.filter, { backgroundColor: active ? theme.colors.forest : theme.colors.surfaceMuted }]}><Text style={[styles.filterText, { color: active ? theme.colors.white : theme.colors.inkMuted }]}>{label}</Text></Pressable>;
}

function HistoryItem({ item, isLast }: { item: ScanHistoryItem; isLast: boolean }) {
  const { theme } = useTheme();
  return <View style={styles.historyItem}><View style={styles.timelineStem}><StatusDot state={item.verdict === 'safe' ? 'safe' : item.verdict === 'suspicious' ? 'warning' : item.verdict === 'malicious' ? 'danger' : 'info'} size={9} />{!isLast ? <View style={[styles.timelineLine, { backgroundColor: theme.colors.line }]} /> : null}</View><View style={styles.historyBody}><View style={styles.historyTop}><Text style={[styles.historyType, { color: theme.colors.inkMuted }]}>{item.kind === 'url' ? 'LINK CHECK' : 'FILE METADATA'}</Text><Text style={[styles.historyTime, { color: theme.colors.inkMuted }]}>{formatDate(item.createdAt)}</Text></View><Text numberOfLines={2} style={[styles.historySubject, { color: theme.colors.ink }]}>{item.subject}</Text><Text numberOfLines={2} style={[styles.historyDetail, { color: theme.colors.inkMuted }]}>{item.detail}</Text><View style={styles.historyVerdict}><VerdictPill verdict={item.verdict} /></View></View></View>;
}

function EmptyHistory({ filter }: { filter: Filter }) {
  const { theme } = useTheme();
  return <View style={[styles.empty, { backgroundColor: theme.colors.surfaceMuted }]}><Text style={[styles.emptyTitle, { color: theme.colors.ink }]}>{filter === 'all' ? 'No assessments yet' : `No ${filter === 'url' ? 'link' : 'file'} checks yet`}</Text><Text style={[styles.emptyCopy, { color: theme.colors.inkMuted }]}>When you choose to assess something, the result will be recorded here.</Text></View>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Just now' : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  content: { paddingTop: 58, paddingHorizontal: space.md, paddingBottom: 104, minHeight: '100%' },
  intro: { marginTop: space.xxl, maxWidth: 350 },
  eyebrow: { fontFamily: type.body, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontFamily: type.display, fontSize: 29, lineHeight: 36, letterSpacing: -0.9, fontWeight: '700', marginTop: 9 },
  copy: { fontFamily: type.body, fontSize: 13, lineHeight: 20, marginTop: 9 },
  summary: { minHeight: 87, paddingHorizontal: 8, marginTop: space.xl, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center' },
  summaryMetric: { flex: 1, alignItems: 'center' },
  summaryNumber: { fontFamily: type.display, fontSize: 25, fontWeight: '700', fontVariant: ['tabular-nums'] },
  summaryLabel: { fontFamily: type.body, fontSize: 9, textAlign: 'center', lineHeight: 13, marginTop: 3 },
  summaryDivider: { width: 1, height: 33 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.sm },
  sectionTitle: { fontFamily: type.display, fontSize: 19, fontWeight: '700' },
  link: { fontFamily: type.body, fontSize: 12, fontWeight: '700' },
  filters: { flexDirection: 'row', gap: 7, marginBottom: 13 },
  filter: { minHeight: 34, paddingHorizontal: 13, borderRadius: radius.pill, justifyContent: 'center' },
  filterText: { fontFamily: type.body, fontSize: 11, fontWeight: '700' },
  timeline: { borderLeftWidth: 1, paddingLeft: 14 },
  historyItem: { flexDirection: 'row', gap: 12, minHeight: 126 },
  timelineStem: { width: 10, alignItems: 'center', paddingTop: 5, marginLeft: -20 },
  timelineLine: { width: 1, flex: 1, marginTop: 5 },
  historyBody: { flex: 1, paddingBottom: 20 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  historyType: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.5 },
  historyTime: { fontFamily: type.body, fontSize: 10 },
  historySubject: { fontFamily: type.body, fontSize: 14, lineHeight: 19, fontWeight: '700', marginTop: 6 },
  historyDetail: { fontFamily: type.body, fontSize: 10, lineHeight: 14, marginTop: 4 },
  historyVerdict: { marginTop: 8 },
  empty: { padding: 18, borderRadius: radius.md },
  emptyTitle: { fontFamily: type.body, fontSize: 15, fontWeight: '700' },
  emptyCopy: { fontFamily: type.body, fontSize: 12, lineHeight: 18, marginTop: 6 },
  bottomSpace: { height: 20 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 },
  backLine: { width: 15, height: 1.5 },
  backText: { fontFamily: type.body, fontSize: 13, fontWeight: '700' },
  historyTitle: { fontFamily: type.display, fontSize: 30, fontWeight: '700', marginTop: space.xxl },
});
