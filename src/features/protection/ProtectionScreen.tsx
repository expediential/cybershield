import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandHeader, ModuleGlyph, StatusDot, StatusPill } from '../../components/QuietSignal';
import { capabilities, type Capability } from '../../domain/capabilities';
import { radius, space, type } from '../../design/tokens';
import { useTheme } from '../../core/ThemeProvider';

export function ProtectionScreen({ onProfile, onModule }: { onProfile: () => void; onModule: (capability: Capability) => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const ready = capabilities.filter((item) => item.state === 'ready').length;
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: c.canvas }]}>
    <BrandHeader label="Protection centre" onProfile={onProfile} />
    <View style={styles.intro}><Text style={[styles.eyebrow, { color: c.signal }]}>ALL SECURITY MODULES</Text><Text style={[styles.title, { color: c.ink }]}>Choose the protection task you need.</Text><Text style={[styles.copy, { color: c.inkMuted }]}>CyberShield shows each module separately, including the ones that still need Android access or a native service.</Text></View>
    <View style={[styles.coverageStrip, { backgroundColor: c.surfaceStrong, borderLeftColor: c.forest }]}><Text style={[styles.coverageNumber, { color: c.ink }]}>{ready}</Text><View><Text style={[styles.coverageTitle, { color: c.ink }]}>modules ready now</Text><Text style={[styles.coverageCopy, { color: c.inkMuted }]}>{capabilities.length - ready} need permission or native setup before they can inspect your device.</Text></View></View>
    <View style={styles.moduleList}>{capabilities.map((item, index) => <ModuleRow key={item.id} item={item} index={index} onPress={() => onModule(item)} />)}</View>
    <View style={[styles.boundary, { borderTopColor: c.line }]}><Text style={[styles.boundaryTitle, { color: c.ink }]}>What “ready” means</Text><Text style={[styles.boundaryCopy, { color: c.inkMuted }]}>Ready modules can perform the exact local check described. Permission and setup modules are visible so their limits are clear—not to imply background protection.</Text></View>
    <View style={styles.bottomSpace} />
  </ScrollView>;
}

function ModuleRow({ item, index, onPress }: { item: Capability; index: number; onPress: () => void }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const feature = item.state === 'ready';
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.moduleRow, { borderTopColor: c.line, backgroundColor: feature && index < 2 ? c.surface : 'transparent', opacity: pressed ? 0.8 : 1 }]}>
    <View style={[styles.moduleRail, { backgroundColor: feature ? c.forest : item.state === 'permission' ? c.amber : c.signal }]} />
    <View style={[styles.moduleIcon, { backgroundColor: feature ? c.signalSoft : c.surfaceStrong }]}><ModuleGlyph id={item.id} size={32} tone={feature ? 'active' : item.state === 'permission' ? 'warning' : 'default'} /></View>
    <View style={styles.moduleBody}><View style={styles.moduleTop}><Text style={[styles.moduleIndex, { color: c.inkMuted }]}>0{index + 1}</Text><StatusPill state={item.state} /></View><Text style={[styles.moduleTitle, { color: c.ink }]}>{item.title}</Text><Text style={[styles.moduleCopy, { color: c.inkMuted }]}>{item.summary}</Text><View style={styles.moduleAction}><StatusDot state={item.state} size={7} /><Text style={[styles.moduleActionText, { color: feature ? c.signal : c.inkMuted }]}>{item.action}</Text></View></View>
  </Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 52, paddingHorizontal: space.md, paddingBottom: 104, minHeight: '100%' },
  intro: { marginTop: space.xl, maxWidth: 350 }, eyebrow: { fontFamily: type.mono, fontSize: 10, letterSpacing: 0.75, fontWeight: '800' }, title: { fontFamily: type.display, fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.9, marginTop: 9 }, copy: { fontFamily: type.body, fontSize: 13, lineHeight: 20, marginTop: 9 },
  coverageStrip: { minHeight: 90, padding: 15, borderLeftWidth: 3, flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: space.xl }, coverageNumber: { fontFamily: type.display, fontSize: 43, fontWeight: '700', fontVariant: ['tabular-nums'] }, coverageTitle: { fontFamily: type.body, fontSize: 14, fontWeight: '800' }, coverageCopy: { fontFamily: type.body, fontSize: 10, lineHeight: 15, marginTop: 4, maxWidth: 235 },
  moduleList: { marginTop: space.xl, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent' }, moduleRow: { minHeight: 143, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingRight: 10, position: 'relative', overflow: 'hidden' }, moduleRail: { width: 3, alignSelf: 'stretch' }, moduleIcon: { width: 57, height: 57, marginTop: 17, marginLeft: 13, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md }, moduleBody: { flex: 1, paddingVertical: 15, paddingLeft: 12 }, moduleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, moduleIndex: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.6 }, moduleTitle: { fontFamily: type.display, fontSize: 18, fontWeight: '700', marginTop: 7 }, moduleCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 4, maxWidth: 245 }, moduleAction: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 11 }, moduleActionText: { fontFamily: type.body, fontSize: 10, fontWeight: '800' },
  boundary: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: space.xl, paddingTop: 15 }, boundaryTitle: { fontFamily: type.body, fontSize: 14, fontWeight: '800' }, boundaryCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 17, marginTop: 5 }, bottomSpace: { height: 20 },
});
