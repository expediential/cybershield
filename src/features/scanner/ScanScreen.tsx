import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Vibration } from 'react-native';
import { BrandHeader, PrimaryButton, StatusDot, VerdictPill } from '../../components/QuietSignal';
import { useTheme } from '../../core/ThemeProvider';
import { radius, space, type } from '../../design/tokens';
import { scanUrl } from '../../domain/urlScanner';
import type { FileAssessment, ScanHistoryItem, UrlScanResult, Verdict } from '../../types/security';

type Tool = 'link' | 'file';

type Props = {
  onProfile: () => void;
  onHistory: () => void;
  onSave: (item: ScanHistoryItem) => void;
  initialTool?: Tool;
};

export function ScanScreen({ onProfile, onHistory, onSave, initialTool = 'link' }: Props) {
  const { theme } = useTheme();
  const [tool, setTool] = useState<Tool>(initialTool);
  const [url, setUrl] = useState('');
  const [urlResult, setUrlResult] = useState<UrlScanResult | null>(null);
  const [fileResult, setFileResult] = useState<FileAssessment | null>(null);

  const checkUrl = () => {
    const result = scanUrl(url);
    setUrlResult(result);
    const item: ScanHistoryItem = { id: `url-${Date.now()}`, kind: 'url', subject: result.normalized || result.input || 'Invalid address', verdict: result.verdict, score: result.score, createdAt: result.checkedAt, detail: result.coverage };
    onSave(item);
    Vibration.vibrate(result.verdict === 'safe' ? 8 : [0, 18, 55, 18]);
  };

  const chooseFile = async () => {
    try {
      const selection = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false, type: '*/*', multiple: false });
      if (selection.canceled || !selection.assets[0]) return;
      const asset = selection.assets[0];
      const name = asset.name || 'Unnamed file';
      const bytes = asset.size || 0;
      const installable = /\.(apk|exe|msi|bat|cmd|scr|js|vbs)$/i.test(name);
      const verdict: Verdict = installable ? 'suspicious' : 'unknown';
      const summary = installable ? 'This is an executable or installer. CyberShield has not run an antivirus engine, so do not treat this as a malware verdict.' : 'Only file metadata is available in this build. No antivirus engine ran and no clean verdict is implied.';
      const result: FileAssessment = { name, bytes, mimeType: asset.mimeType || null, verdict, createdAt: new Date().toISOString(), summary, engine: 'metadata-only' };
      setFileResult(result);
      onSave({ id: `file-${Date.now()}`, kind: 'file', subject: name, verdict, score: installable ? 24 : 0, createdAt: result.createdAt, detail: bytes ? `${formatBytes(bytes)} · metadata only` : 'Metadata only' });
      Vibration.vibrate(installable ? [0, 16, 48, 16] : 8);
    } catch {
      Alert.alert('File not selected', 'The Android file picker did not return a file. Please try again.');
    }
  };

  return <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { backgroundColor: theme.colors.canvas }]}>
    <BrandHeader label="Manual checks" onProfile={onProfile} />
    <View style={styles.intro}><Text style={[styles.eyebrow, { color: theme.colors.forest }]}>SCAN CENTRE</Text><Text style={[styles.title, { color: theme.colors.ink }]}>Check the thing that made you pause.</Text><Text style={[styles.copy, { color: theme.colors.inkMuted }]}>Choose a link or a file. The available checks stay on this device and their limits stay visible.</Text></View>
    <View style={[styles.toolSwitch, { backgroundColor: theme.colors.surfaceMuted }]}><ToolTab active={tool === 'link'} label="Link or message" onPress={() => setTool('link')} /><ToolTab active={tool === 'file'} label="A file" onPress={() => setTool('file')} /></View>
    {tool === 'link' ? <LinkCheck url={url} setUrl={setUrl} result={urlResult} onCheck={checkUrl} /> : <FileCheck result={fileResult} onPick={chooseFile} />}
    <Pressable onPress={onHistory} style={[styles.historyLink, { borderTopColor: theme.colors.line, borderBottomColor: theme.colors.line }]}><View><Text style={[styles.historyLinkTitle, { color: theme.colors.ink }]}>Assessment history</Text><Text style={[styles.historyLinkCopy, { color: theme.colors.inkMuted }]}>Stored only on this device</Text></View><Text style={[styles.historyArrow, { color: theme.colors.forest }]}>View</Text></Pressable>
    <View style={styles.bottomSpace} />
  </ScrollView>;
}

function ToolTab({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { theme } = useTheme();
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.toolTab, active && { backgroundColor: theme.colors.surface }]}><Text style={[styles.toolTabText, { color: active ? theme.colors.ink : theme.colors.inkMuted }]}>{label}</Text></Pressable>;
}

function LinkCheck({ url, setUrl, result, onCheck }: { url: string; setUrl: (value: string) => void; result: UrlScanResult | null; onCheck: () => void }) {
  const { theme } = useTheme();
  return <View style={styles.workflow}>
    <Text style={[styles.workflowTitle, { color: theme.colors.ink }]}>Paste a web address</Text><Text style={[styles.workflowCopy, { color: theme.colors.inkMuted }]}>CyberShield examines the address structure. It does not open the link, visit its page, or use an external reputation service.</Text>
    <View style={[styles.inputWrap, { borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}><Text style={[styles.inputPrefix, { color: theme.colors.forest }]}>https://</Text><TextInput value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="example.com or a pasted link" placeholderTextColor={theme.colors.inkMuted} style={[styles.input, { color: theme.colors.ink }]} /></View>
    <PrimaryButton label="Check this link" onPress={onCheck} />
    <Text style={[styles.disclaimer, { color: theme.colors.inkMuted }]}>A clear result means no high-risk signal was found by the checks available here. It is not a guarantee that a website is safe.</Text>
    {result ? <UrlResultView result={result} /> : null}
  </View>;
}

function UrlResultView({ result }: { result: UrlScanResult }) {
  const { theme } = useTheme();
  const heading = result.verdict === 'safe' ? 'No high-risk signal found' : result.verdict === 'suspicious' ? 'Take a closer look before opening' : result.verdict === 'malicious' ? 'Do not open this link' : 'This link could not be checked';
  return <View style={[styles.result, { borderTopColor: result.verdict === 'safe' ? theme.colors.forest : result.verdict === 'suspicious' ? theme.colors.amber : result.verdict === 'malicious' ? theme.colors.danger : theme.colors.line }]}><VerdictPill verdict={result.verdict} /><Text style={[styles.resultTitle, { color: theme.colors.ink }]}>{heading}</Text><Text style={[styles.resultAddress, { color: theme.colors.inkMuted }]} numberOfLines={2}>{result.normalized || result.input}</Text><View style={[styles.findingBlock, { borderTopColor: theme.colors.line }]}>{result.findings.map((finding, index) => <View key={`${finding.label}-${index}`} style={[styles.finding, { borderBottomColor: theme.colors.line }]}><StatusDot state={finding.severity} size={8} /><View style={styles.findingBody}><Text style={[styles.findingTitle, { color: theme.colors.ink }]}>{finding.label}</Text><Text style={[styles.findingCopy, { color: theme.colors.inkMuted }]}>{finding.detail}</Text></View></View>)}</View><View style={[styles.recommendation, { backgroundColor: theme.colors.surfaceMuted }]}><Text style={[styles.recommendationLabel, { color: theme.colors.inkMuted }]}>WHAT TO DO NEXT</Text><Text style={[styles.recommendationCopy, { color: theme.colors.ink }]}>{result.recommendation}</Text></View><Text style={[styles.coverage, { color: theme.colors.inkMuted }]}>{result.coverage}</Text></View>;
}

function FileCheck({ result, onPick }: { result: FileAssessment | null; onPick: () => void }) {
  const { theme } = useTheme();
  return <View style={styles.workflow}>
    <Text style={[styles.workflowTitle, { color: theme.colors.ink }]}>Choose a file to assess</Text><Text style={[styles.workflowCopy, { color: theme.colors.inkMuted }]}>This build reads only the identity and metadata that Android shares with the picker. It never executes your file or calls that an antivirus scan.</Text>
    <Pressable onPress={onPick} style={[styles.fileWell, { borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}><View style={[styles.fileAperture, { borderColor: theme.colors.forest }]}><View style={[styles.fileApertureLine, { backgroundColor: theme.colors.forest }]} /></View><Text style={[styles.fileWellTitle, { color: theme.colors.ink }]}>Choose a file</Text><Text style={[styles.fileWellCopy, { color: theme.colors.inkMuted }]}>Use the Android file picker. Nothing is uploaded.</Text><Text style={[styles.fileWellAction, { color: theme.colors.forest }]}>Browse files</Text></Pressable>
    {result ? <FileResultView result={result} /> : <View style={[styles.engineNote, { backgroundColor: theme.colors.surfaceMuted }]}><StatusDot state="configuration" size={8} /><Text style={[styles.engineNoteText, { color: theme.colors.inkMuted }]}>Deep scanning needs a separately configured, isolated antivirus or rule engine.</Text></View>}
  </View>;
}

function FileResultView({ result }: { result: FileAssessment }) {
  const { theme } = useTheme();
  return <View style={[styles.fileResult, { borderTopColor: result.verdict === 'suspicious' ? theme.colors.amber : theme.colors.line }]}><VerdictPill verdict={result.verdict} /><Text style={[styles.resultTitle, { color: theme.colors.ink }]} numberOfLines={2}>{result.name}</Text><View style={styles.fileFacts}><Fact label="TYPE" value={result.mimeType || 'Unknown'} /><Fact label="SIZE" value={result.bytes ? formatBytes(result.bytes) : 'Not reported'} /><Fact label="ENGINE" value="Metadata only" /></View><Text style={[styles.fileSummary, { color: theme.colors.inkMuted }]}>{result.summary}</Text></View>;
}

function Fact({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return <View style={styles.fact}><Text style={[styles.factLabel, { color: theme.colors.inkMuted }]}>{label}</Text><Text numberOfLines={2} style={[styles.factValue, { color: theme.colors.ink }]}>{value}</Text></View>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  content: { paddingTop: 58, paddingHorizontal: space.md, paddingBottom: 104, minHeight: '100%' },
  intro: { marginTop: space.xxl, maxWidth: 345 },
  eyebrow: { fontFamily: type.body, fontSize: 11, fontWeight: '800', letterSpacing: 0.45 },
  title: { fontFamily: type.display, fontSize: 30, lineHeight: 37, letterSpacing: -1, fontWeight: '700', marginTop: 9 },
  copy: { fontFamily: type.body, fontSize: 14, lineHeight: 21, marginTop: 10 },
  toolSwitch: { marginTop: space.xl, padding: 4, borderRadius: radius.md, flexDirection: 'row', gap: 4 },
  toolTab: { flex: 1, minHeight: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  toolTabText: { fontFamily: type.body, fontSize: 12, fontWeight: '700' },
  workflow: { marginTop: space.xl },
  workflowTitle: { fontFamily: type.display, fontSize: 21, lineHeight: 27, fontWeight: '700' },
  workflowCopy: { fontFamily: type.body, fontSize: 12, lineHeight: 18, marginTop: 7, maxWidth: 335 },
  inputWrap: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, marginTop: 18 },
  inputPrefix: { fontFamily: type.mono, fontSize: 12, fontWeight: '700' },
  input: { flex: 1, height: '100%', paddingHorizontal: 4, fontFamily: type.body, fontSize: 13 },
  disclaimer: { fontFamily: type.body, fontSize: 10, lineHeight: 15, marginTop: 11 },
  result: { marginTop: space.xl, borderTopWidth: 2, paddingTop: 15 },
  resultTitle: { fontFamily: type.display, fontSize: 20, lineHeight: 26, fontWeight: '700', marginTop: 11 },
  resultAddress: { fontFamily: type.mono, fontSize: 10, lineHeight: 15, marginTop: 7 },
  findingBlock: { marginTop: 18, borderTopWidth: StyleSheet.hairlineWidth },
  finding: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  findingBody: { flex: 1 },
  findingTitle: { fontFamily: type.body, fontSize: 13, fontWeight: '700' },
  findingCopy: { fontFamily: type.body, fontSize: 11, lineHeight: 16, marginTop: 3 },
  recommendation: { padding: 14, borderRadius: radius.md, marginTop: 16 },
  recommendationLabel: { fontFamily: type.mono, fontSize: 9, letterSpacing: 0.5 },
  recommendationCopy: { fontFamily: type.body, fontSize: 12, lineHeight: 18, marginTop: 6, fontWeight: '600' },
  coverage: { fontFamily: type.body, fontSize: 10, lineHeight: 15, marginTop: 13 },
  fileWell: { minHeight: 206, borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', padding: 20, marginTop: 18 },
  fileAperture: { width: 42, height: 42, borderWidth: 1.5, borderRadius: 13, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  fileApertureLine: { width: 22, height: 3, borderRadius: 3, transform: [{ rotate: '-45deg' }] },
  fileWellTitle: { fontFamily: type.body, fontSize: 15, fontWeight: '700', marginTop: 18 },
  fileWellCopy: { fontFamily: type.body, fontSize: 11, marginTop: 5, textAlign: 'center' },
  fileWellAction: { fontFamily: type.body, fontSize: 12, fontWeight: '700', marginTop: 16 },
  engineNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: radius.md, marginTop: 14 },
  engineNoteText: { fontFamily: type.body, fontSize: 11, lineHeight: 16, flex: 1 },
  fileResult: { marginTop: space.xl, borderTopWidth: 2, paddingTop: 15 },
  fileFacts: { flexDirection: 'row', gap: 7, marginTop: 17 },
  fact: { flex: 1 },
  factLabel: { fontFamily: type.mono, fontSize: 8, letterSpacing: 0.5 },
  factValue: { fontFamily: type.body, fontSize: 10, lineHeight: 14, fontWeight: '700', marginTop: 4 },
  fileSummary: { fontFamily: type.body, fontSize: 12, lineHeight: 18, marginTop: 17 },
  historyLink: { minHeight: 71, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: space.xl },
  historyLinkTitle: { fontFamily: type.body, fontSize: 14, fontWeight: '700' },
  historyLinkCopy: { fontFamily: type.body, fontSize: 11, marginTop: 4 },
  historyArrow: { fontFamily: type.body, fontSize: 12, fontWeight: '700' },
  bottomSpace: { height: 22 },
});
