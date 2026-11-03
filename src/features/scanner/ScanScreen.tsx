import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Vibration } from 'react-native';
import { BrandHeader, ModuleGlyph, PrimaryButton, ScanTrace, StatusDot, VerdictPill } from '../../components/QuietSignal';
import { useTheme } from '../../core/ThemeProvider';
import { motion, radius, space, type } from '../../design/tokens';
import { scanUrl } from '../../domain/urlScanner';
import { needsAttention } from '../../domain/productState';
import type { FileAssessment, ScanHistoryItem, UrlScanResult, Verdict } from '../../types/security';

type Tool = 'link' | 'file';
type ScanPhase = 'idle' | 'preparing' | 'analyzing' | 'complete' | 'error';

type Props = { onProfile: () => void; onHistory: () => void; onSave: (item: ScanHistoryItem) => void; initialTool?: Tool };

export function ScanScreen({ onProfile, onHistory, onSave, initialTool = 'link' }: Props) {
  const { theme, reducedMotion } = useTheme();
  const c = theme.colors;
  const [tool, setTool] = useState<Tool>(initialTool);
  const [url, setUrl] = useState('');
  const [urlResult, setUrlResult] = useState<UrlScanResult | null>(null);
  const [fileResult, setFileResult] = useState<FileAssessment | null>(null);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [progress, setProgress] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const queue = (callback: () => void, delay: number) => { timers.current.push(setTimeout(callback, reducedMotion ? 0 : delay)); };
  const resetTool = (next: Tool) => { timers.current.forEach(clearTimeout); timers.current = []; setTool(next); setPhase('idle'); setProgress(0); };

  const runUrlCheck = () => {
    setUrlResult(null); setPhase('preparing'); setProgress(20); Vibration.vibrate(8);
    queue(() => { setPhase('analyzing'); setProgress(64); }, motion.scanStage);
    queue(() => {
      const result = scanUrl(url);
      setUrlResult(result); setProgress(100); setPhase(result.verdict === 'unknown' ? 'error' : 'complete');
      onSave({ id: `url-${Date.now()}`, kind: 'url', subject: result.normalized || result.input || 'Invalid address', verdict: result.verdict, score: result.score, createdAt: result.checkedAt, detail: result.coverage, read: !needsAttention(result.verdict), source: 'local-heuristics' });
      Vibration.vibrate(result.verdict === 'safe' ? 8 : [0, 18, 50, 18]);
    }, motion.scanStage * 2);
  };

  const chooseFile = async () => {
    try {
      const selection = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false, type: '*/*', multiple: false });
      if (selection.canceled || !selection.assets[0]) return;
      const asset = selection.assets[0];
      setFileResult(null); setPhase('preparing'); setProgress(24); Vibration.vibrate(8);
      queue(() => { setPhase('analyzing'); setProgress(66); }, motion.scanStage);
      queue(() => {
        const name = asset.name || 'Unnamed file';
        const bytes = asset.size || 0;
        const installable = /\.(apk|exe|msi|bat|cmd|scr|js|vbs)$/i.test(name);
        const verdict: Verdict = installable ? 'suspicious' : 'unknown';
        const summary = installable ? 'This is an executable or installer. The metadata inspector cannot determine whether it is malicious; do not treat this as an antivirus verdict.' : 'CyberShield read only the metadata shared by Android. No antivirus or YARA engine ran, so this is not a clean result.';
        const result: FileAssessment = { name, bytes, mimeType: asset.mimeType || null, verdict, createdAt: new Date().toISOString(), summary, engine: 'metadata-only' };
        setFileResult(result); setProgress(100); setPhase('complete');
        onSave({ id: `file-${Date.now()}`, kind: 'file', subject: name, verdict, score: installable ? 24 : 0, createdAt: result.createdAt, detail: bytes ? `${formatBytes(bytes)} · metadata inspection` : 'Metadata inspection', read: !needsAttention(verdict), source: 'metadata-only' });
        Vibration.vibrate(installable ? [0, 16, 48, 16] : 8);
      }, motion.scanStage * 2);
    } catch { Alert.alert('File not selected', 'Android did not return a file from the picker. Try again.'); }
  };

  return <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: c.canvas }]}>
    <BrandHeader label="Scan centre" onProfile={onProfile} />
    <View style={styles.intro}><Text style={[styles.eyebrow, { color: c.signal }]}>LOCAL SECURITY CHECKS</Text><Text style={[styles.title, { color: c.ink }]}>{tool === 'link' ? 'Check a suspicious link before opening it.' : 'Inspect a file before you trust it.'}</Text><Text style={[styles.copy, { color: c.inkMuted }]}>{tool === 'link' ? 'Phishing Protection inspects URL structure on this device. It does not visit the address.' : 'File Security reads only Android-provided metadata. It does not execute or upload the file.'}</Text></View>
    <View style={[styles.toolTabs, { borderColor: c.line }]}><ToolTab active={tool === 'link'} label="Phishing Protection" glyph="phishing" onPress={() => resetTool('link')} /><ToolTab active={tool === 'file'} label="File Security" glyph="file" onPress={() => resetTool('file')} /></View>
    {tool === 'link' ? <LinkWorkflow url={url} setUrl={setUrl} result={urlResult} phase={phase} progress={progress} onCheck={runUrlCheck} onHistory={onHistory} /> : <FileWorkflow result={fileResult} phase={phase} progress={progress} onPick={chooseFile} onHistory={onHistory} />}
    <Pressable onPress={onHistory} style={[styles.historyEntry, { borderTopColor: c.line, borderBottomColor: c.line }]}><View><Text style={[styles.historyTitle, { color: c.ink }]}>Scan history</Text><Text style={[styles.historyCopy, { color: c.inkMuted }]}>Saved locally on this device</Text></View><Text style={[styles.historyAction, { color: c.signal }]}>Open</Text></Pressable>
    <View style={styles.bottomSpace} />
  </ScrollView>;
}

function ToolTab({ active, label, glyph, onPress }: { active: boolean; label: string; glyph: 'phishing' | 'file'; onPress: () => void }) {
  const { theme } = useTheme(); const c = theme.colors;
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.toolTab, active && { backgroundColor: c.surfaceStrong }]}><ModuleGlyph id={glyph} size={20} tone={active ? 'active' : 'default'} /><Text style={[styles.toolTabText, { color: active ? c.ink : c.inkMuted }]}>{label}</Text></Pressable>;
}

function LinkWorkflow({ url, setUrl, result, phase, progress, onCheck, onHistory }: { url: string; setUrl: (value: string) => void; result: UrlScanResult | null; phase: ScanPhase; progress: number; onCheck: () => void; onHistory: () => void }) {
  const { theme } = useTheme(); const c = theme.colors;
  return <View style={styles.workflow}><View style={styles.workflowHeading}><ModuleGlyph id="phishing" size={30} tone="active" /><View><Text style={[styles.workflowTitle, { color: c.ink }]}>URL inspection</Text><Text style={[styles.workflowMeta, { color: c.inkMuted }]}>STRUCTURAL ANALYSIS · NO PAGE VISIT</Text></View></View><Text style={[styles.workflowCopy, { color: c.inkMuted }]}>Paste the complete address or domain. CyberShield checks URL structure and the reserved local demonstration blocklist.</Text><View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.line }]}><Text style={[styles.inputPrefix, { color: c.signal }]}>//</Text><TextInput value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="example.com or pasted link" placeholderTextColor={c.inkMuted} style={[styles.input, { color: c.ink }]} /></View><PrimaryButton label="Inspect this link" onPress={onCheck} /><Text style={[styles.disclaimer, { color: c.inkMuted }]}>Clear locally means no high-risk signal was found by the available checks. It does not prove the website is safe.</Text><ScanTrace phase={phase} progress={progress} label="PHISHING INSPECTION TRACE" />{result ? <UrlResult result={result} onHistory={onHistory} /> : null}</View>;
}

function UrlResult({ result, onHistory }: { result: UrlScanResult; onHistory: () => void }) {
  const { theme } = useTheme(); const c = theme.colors;
  const heading = result.verdict === 'safe' ? 'No high-risk local signal found' : result.verdict === 'suspicious' ? 'Review this link before opening it' : result.verdict === 'malicious' ? 'Do not open this link' : 'The link could not be assessed';
  return <View style={[styles.result, { borderTopColor: result.verdict === 'safe' ? c.forest : result.verdict === 'malicious' ? c.danger : c.amber }]}><View style={styles.resultTop}><VerdictPill verdict={result.verdict} /><Text style={[styles.resultSource, { color: c.inkMuted }]}>LOCAL HEURISTICS</Text></View><Text style={[styles.resultTitle, { color: c.ink }]}>{heading}</Text><Text style={[styles.resultAddress, { color: c.inkMuted }]}>{result.normalized || result.input}</Text><View style={[styles.providerRow, { backgroundColor: c.surfaceMuted }]}><StatusDot state="configuration" size={7} /><Text style={[styles.providerText, { color: c.inkMuted }]}>External reputation provider: not configured</Text></View><View style={[styles.findingList, { borderTopColor: c.line }]}>{result.findings.map((finding, index) => <View key={`${finding.label}-${index}`} style={[styles.finding, { borderBottomColor: c.line }]}><StatusDot state={finding.severity} size={8} /><View style={styles.findingBody}><Text style={[styles.findingTitle, { color: c.ink }]}>{finding.label}</Text><Text style={[styles.findingCopy, { color: c.inkMuted }]}>{finding.detail}</Text></View></View>)}</View><View style={[styles.recommendation, { backgroundColor: c.surfaceStrong }]}><Text style={[styles.recommendationLabel, { color: c.signal }]}>RECOMMENDED ACTION</Text><Text style={[styles.recommendationCopy, { color: c.ink }]}>{result.recommendation}</Text></View><Pressable onPress={onHistory} style={[styles.resultHistory, { borderColor: c.line }]}><Text style={[styles.resultHistoryText, { color: c.ink }]}>View saved result</Text><Text style={[styles.resultHistoryLink, { color: c.signal }]}>History</Text></Pressable></View>;
}

function FileWorkflow({ result, phase, progress, onPick, onHistory }: { result: FileAssessment | null; phase: ScanPhase; progress: number; onPick: () => void; onHistory: () => void }) {
  const { theme } = useTheme(); const c = theme.colors;
  return <View style={styles.workflow}><View style={styles.workflowHeading}><ModuleGlyph id="file" size={30} tone="active" /><View><Text style={[styles.workflowTitle, { color: c.ink }]}>File metadata inspection</Text><Text style={[styles.workflowMeta, { color: c.inkMuted }]}>SYSTEM PICKER · NO EXECUTION</Text></View></View><Text style={[styles.workflowCopy, { color: c.inkMuted }]}>Choose a file from Android storage. The inspector records its name, type, size, and whether it is an installer or executable file type.</Text><Pressable onPress={onPick} style={[styles.fileWell, { borderColor: c.line, backgroundColor: c.surface }]}><View style={[styles.fileTarget, { borderColor: c.signal }]}><ModuleGlyph id="file" size={34} tone="active" /></View><Text style={[styles.fileWellTitle, { color: c.ink }]}>Choose a file to inspect</Text><Text style={[styles.fileWellCopy, { color: c.inkMuted }]}>The Android picker decides which metadata it shares.</Text><Text style={[styles.fileWellAction, { color: c.signal }]}>Browse device storage</Text></Pressable><ScanTrace phase={phase} progress={progress} label="METADATA INSPECTION TRACE" />{result ? <FileResult result={result} onHistory={onHistory} /> : <View style={[styles.engineBoundary, { backgroundColor: c.amberSoft }]}><StatusDot state="warning" size={8} /><Text style={[styles.engineBoundaryText, { color: c.inkMuted }]}>Malware scanning is not configured. ClamAV or YARA must run in an isolated backend worker before this can provide engine verdicts.</Text></View>}</View>;
}

function FileResult({ result, onHistory }: { result: FileAssessment; onHistory: () => void }) {
  const { theme } = useTheme(); const c = theme.colors;
  return <View style={[styles.result, { borderTopColor: result.verdict === 'suspicious' ? c.amber : c.line }]}><View style={styles.resultTop}><VerdictPill verdict={result.verdict} /><Text style={[styles.resultSource, { color: c.inkMuted }]}>METADATA ONLY</Text></View><Text numberOfLines={2} style={[styles.resultTitle, { color: c.ink }]}>{result.name}</Text><View style={[styles.fileFacts, { borderTopColor: c.line, borderBottomColor: c.line }]}><Fact label="TYPE" value={result.mimeType || 'Not reported'} /><Fact label="SIZE" value={result.bytes ? formatBytes(result.bytes) : 'Not reported'} /><Fact label="ENGINE" value="None" /></View><Text style={[styles.fileSummary, { color: c.inkMuted }]}>{result.summary}</Text><Pressable onPress={onHistory} style={[styles.resultHistory, { borderColor: c.line }]}><Text style={[styles.resultHistoryText, { color: c.ink }]}>View saved result</Text><Text style={[styles.resultHistoryLink, { color: c.signal }]}>History</Text></Pressable></View>;
}

function Fact({ label, value }: { label: string; value: string }) { const { theme } = useTheme(); return <View style={styles.fact}><Text style={[styles.factLabel, { color: theme.colors.inkMuted }]}>{label}</Text><Text numberOfLines={2} style={[styles.factValue, { color: theme.colors.ink }]}>{value}</Text></View>; }
function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

const styles = StyleSheet.create({
  content: { paddingTop: 52, paddingHorizontal: space.md, paddingBottom: 104, minHeight: '100%' }, intro: { marginTop: space.xl, maxWidth: 350 }, eyebrow: { fontFamily: type.mono, fontSize: 10, letterSpacing: 0.75, fontWeight: '800' }, title: { fontFamily: type.display, fontSize: 29, lineHeight: 36, fontWeight: '700', letterSpacing: -0.9, marginTop: 9 }, copy: { fontFamily: type.body, fontSize: 13, lineHeight: 20, marginTop: 9 },
  toolTabs: { marginTop: space.xl, borderWidth: 1, flexDirection: 'row', padding: 4, gap: 4 }, toolTab: { flex: 1, minHeight: 57, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, toolTabText: { fontFamily: type.body, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  workflow: { marginTop: space.xl }, workflowHeading: { flexDirection: 'row', gap: 10, alignItems: 'center' }, workflowTitle: { fontFamily: type.display, fontSize: 20, fontWeight: '700' }, workflowMeta: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.55, marginTop: 3 }, workflowCopy: { fontFamily: type.body, fontSize: 12, lineHeight: 18, marginTop: 13 },
  inputWrap: { minHeight: 57, borderWidth: 1, marginTop: 17, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }, inputPrefix: { fontFamily: type.mono, fontSize: 16, fontWeight: '800', marginRight: 6 }, input: { flex: 1, height: '100%', fontFamily: type.body, fontSize: 13 }, disclaimer: { fontFamily: type.body, fontSize: 10, lineHeight: 15, marginTop: 10 },
  result: { marginTop: space.xl, borderTopWidth: 2, paddingTop: 15 }, resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, resultSource: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.5 }, resultTitle: { fontFamily: type.display, fontSize: 21, lineHeight: 27, fontWeight: '700', marginTop: 12 }, resultAddress: { fontFamily: type.mono, fontSize: 10, lineHeight: 15, marginTop: 7 }, providerRow: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, marginTop: 14 }, providerText: { fontFamily: type.body, fontSize: 10 },
  findingList: { marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth }, finding: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth }, findingBody: { flex: 1 }, findingTitle: { fontFamily: type.body, fontSize: 13, fontWeight: '800' }, findingCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 3 }, recommendation: { padding: 14, marginTop: 16 }, recommendationLabel: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.6, fontWeight: '800' }, recommendationCopy: { fontFamily: type.body, fontSize: 12, lineHeight: 18, marginTop: 6, fontWeight: '600' }, resultHistory: { minHeight: 51, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13, marginTop: 15 }, resultHistoryText: { fontFamily: type.body, fontSize: 12, fontWeight: '800' }, resultHistoryLink: { fontFamily: type.body, fontSize: 11, fontWeight: '800' },
  fileWell: { minHeight: 220, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', padding: 18, marginTop: 17 }, fileTarget: { width: 60, height: 60, borderWidth: 1, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] }, fileWellTitle: { fontFamily: type.body, fontSize: 15, fontWeight: '800', marginTop: 22 }, fileWellCopy: { fontFamily: type.body, fontSize: 11, textAlign: 'center', marginTop: 5 }, fileWellAction: { fontFamily: type.body, fontSize: 12, fontWeight: '800', marginTop: 15 }, engineBoundary: { flexDirection: 'row', gap: 9, padding: 13, marginTop: 14 }, engineBoundaryText: { fontFamily: type.body, fontSize: 11, lineHeight: 16, flex: 1 },
  fileFacts: { flexDirection: 'row', gap: 9, marginTop: 17, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth }, fact: { flex: 1 }, factLabel: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.5 }, factValue: { fontFamily: type.body, fontSize: 10, lineHeight: 14, fontWeight: '800', marginTop: 4 }, fileSummary: { fontFamily: type.body, fontSize: 12, lineHeight: 18, marginTop: 15 },
  historyEntry: { minHeight: 69, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: space.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, historyTitle: { fontFamily: type.body, fontSize: 14, fontWeight: '800' }, historyCopy: { fontFamily: type.body, fontSize: 10, marginTop: 3 }, historyAction: { fontFamily: type.body, fontSize: 11, fontWeight: '800' }, bottomSpace: { height: 20 },
});
