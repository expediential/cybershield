import * as Network from 'expo-network';
import { inspectPickedFile } from '../domain/fileScanner';
import { scanUrl } from '../domain/urlScanner';
import type { ModuleId } from '../domain/capabilities';
import { deviceSecurity } from '../native/deviceSecurity';
import { needsAttention } from '../domain/productState';
import type { Finding, ScanHistoryItem, Severity, Verdict } from '../types/security';
import type { FileScanInput, ModuleScanStatus, ScanMode, ScanModuleResult, ScanProgress, ScanRun, ScanState } from '../types/scanning';

export type ScanRequest = {
  mode: ScanMode;
  selectedModules: ModuleId[];
  urls?: string[];
  file?: FileScanInput;
  signal?: AbortSignal;
  onProgress?: (progress: ScanProgress) => void;
};

export type ScanModule = {
  moduleId: ModuleId;
  displayName: string;
  requiredPermissions: string[];
  availability: (request: ScanRequest) => { available: boolean; reason?: string };
  execute: (request: ScanRequest) => Promise<ScanModuleResult>;
};

const empty = (moduleId: ModuleId, displayName: string, status: ModuleScanStatus, summary: string, recommendations: string[] = []): ScanModuleResult => ({ moduleId, displayName, status, summary, findings: [], recommendations });
const highest = (findings: Finding[]): Severity => findings.some((item) => item.severity === 'danger') ? 'danger' : findings.some((item) => item.severity === 'warning') ? 'warning' : findings.some((item) => item.severity === 'info') ? 'info' : 'safe';
const uniqueUrls = (urls: string[]) => [...new Set(urls.map((url) => url.trim()).filter(Boolean))].slice(0, 10);
const stagePause = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const urlModule: ScanModule = {
  moduleId: 'phishing', displayName: 'Phishing Protection', requiredPermissions: [],
  availability: (request) => request.urls?.some((url) => url.trim()) ? { available: true } : { available: false, reason: 'A web address is required. Automatic scans only re-check URLs you previously saved locally.' },
  async execute(request) {
    const urls = uniqueUrls(request.urls ?? []);
    if (!urls.length) return empty('phishing', 'Phishing Protection', 'skipped', 'No URL was provided for structural analysis.', ['Add a link in Manual Scan, or save link assessments so Automatic Scan can re-check them.']);
    const results = urls.map((url) => scanUrl(url));
    const findings = results.flatMap((result) => result.findings.map((finding) => ({ ...finding, detail: `${result.normalized || result.input}: ${finding.detail}` })));
    const historyItems: ScanHistoryItem[] = results.map((result, index) => ({ id: `url-${Date.now()}-${index}`, kind: 'url', subject: result.normalized || result.input || 'Invalid address', verdict: result.verdict, score: result.score, createdAt: result.checkedAt, detail: result.coverage, read: !needsAttention(result.verdict), source: 'local-heuristics' }));
    const attention = results.filter((result) => needsAttention(result.verdict));
    const unassessed = results.filter((result) => result.verdict === 'unknown');
    const summary = unassessed.length === results.length
      ? 'No valid web address could be structurally assessed.'
      : attention.length
        ? `${attention.length} of ${results.length} link assessment${results.length === 1 ? '' : 's'} needs review.`
        : `${results.length} link assessment${results.length === 1 ? '' : 's'} completed with no high-risk local signal.`;
    return { moduleId: 'phishing', displayName: 'Phishing Protection', status: 'completed', summary, findings, recommendations: results.map((result) => result.recommendation), historyItems, detail: results.map((result) => result.coverage).join(' · ') };
  },
};

const fileModule: ScanModule = {
  moduleId: 'file', displayName: 'File Security', requiredPermissions: ['User-selected file access'],
  availability: (request) => request.file ? { available: true } : { available: false, reason: 'Choose a file with Android’s system picker before running this module.' },
  async execute(request) {
    if (!request.file) return empty('file', 'File Security', 'skipped', 'No file was selected. Android file access is always user initiated.', ['Choose a file in Manual Scan. Automatic scans never access files in storage.']);
    const result = await inspectPickedFile(request.file);
    const history: ScanHistoryItem = { id: `file-${Date.now()}`, kind: 'file', subject: result.name, verdict: result.verdict, score: result.verdict === 'malicious' ? 60 : result.verdict === 'suspicious' ? 28 : 0, createdAt: result.createdAt, detail: `${result.bytes ? formatBytes(result.bytes) : 'Unknown size'} · ${result.fingerprintStatus === 'computed' ? 'SHA-256 calculated' : 'metadata only'}`, read: !needsAttention(result.verdict), source: 'metadata-and-fingerprint' };
    return { moduleId: 'file', displayName: 'File Security', status: 'completed', summary: result.summary, findings: result.findings, recommendations: [result.recommendation], historyItems: [history], detail: result.sha256 ? `SHA-256 ${result.sha256}` : 'SHA-256 unavailable from the Android document provider' };
  },
};

async function connectionSnapshot() {
  const [state, airplaneMode] = await Promise.all([Network.getNetworkStateAsync(), Network.isAirplaneModeEnabledAsync().catch(() => false)]);
  let ip = 'Unavailable';
  try { ip = await Network.getIpAddressAsync(); } catch { /* Connection details are unavailable on some devices. */ }
  return { state, airplaneMode, ip };
}

const wifiModule: ScanModule = {
  moduleId: 'wifi', displayName: 'Wi-Fi Security', requiredPermissions: ['ACCESS_NETWORK_STATE', 'ACCESS_WIFI_STATE'],
  availability: () => ({ available: true }),
  async execute() {
    try {
      const [{ state, airplaneMode, ip }, nativeWifi] = await Promise.all([connectionSnapshot(), deviceSecurity.wifiSnapshot().catch(() => null)]);
      const findings: Finding[] = [];
      if (airplaneMode) findings.push({ label: 'Airplane mode enabled', detail: 'Android reports airplane mode is enabled; Wi-Fi state may be unavailable or intentionally isolated.', severity: 'info' });
      if (state.type === Network.NetworkStateType.WIFI) {
        findings.push({ label: 'Wi-Fi connection detected', detail: nativeWifi?.ssid ? `Android exposed the current Wi-Fi identity as “${nativeWifi.ssid}”.` : ip === 'Unavailable' || ip === '0.0.0.0' ? 'Android reported Wi-Fi, but did not expose a usable IPv4 address.' : `Android exposed the local IPv4 address ${ip}.`, severity: 'safe' });
        if (nativeWifi?.securityLabel === 'Open' || nativeWifi?.securityLabel === 'WEP') findings.push({ label: 'Legacy or open Wi-Fi security', detail: `Android reports ${nativeWifi.securityLabel}. Avoid sensitive sign-ins until you can verify the network.`, severity: 'warning' });
        else if (nativeWifi?.securityLabel && nativeWifi.securityLabel !== 'Not exposed by Android') findings.push({ label: 'Wi-Fi security type reported', detail: `Android reports ${nativeWifi.securityLabel}. This does not inspect traffic, DNS, or the router configuration.`, severity: 'info' });
      } else findings.push({ label: 'No active Wi-Fi connection', detail: `Android reports ${String(state.type ?? 'an unknown connection type')}.`, severity: 'info' });
      if (state.isConnected && state.isInternetReachable === false) findings.push({ label: 'Internet not validated', detail: 'Android sees an active connection but cannot validate Internet reachability.', severity: 'warning' });
      return { moduleId: 'wifi', displayName: 'Wi-Fi Security', status: 'completed', summary: state.type === Network.NetworkStateType.WIFI ? 'Current Wi-Fi state and Android-exposed security information were reviewed.' : 'No active Wi-Fi connection was reported by Android.', findings, recommendations: [state.type === Network.NetworkStateType.WIFI ? 'Treat public Wi-Fi as untrusted. This module does not capture traffic, DNS content, BSSID, or gateway addresses.' : 'Connect to a trusted Wi-Fi network before running a Wi-Fi connectivity review.'], detail: `Connection type: ${String(state.type ?? 'unknown')} · ${nativeWifi?.securityLabel ?? 'Wi-Fi security type not exposed'}` };
    } catch {
      return empty('wifi', 'Wi-Fi Security', 'failed', 'Android did not provide a network-state response.', ['Check device connectivity and try again.']);
    }
  },
};

const networkModule: ScanModule = {
  moduleId: 'network', displayName: 'Network Security', requiredPermissions: ['ACCESS_NETWORK_STATE'],
  availability: () => ({ available: true }),
  async execute() {
    try {
      const { state, airplaneMode, ip } = await connectionSnapshot();
      const findings: Finding[] = [];
      if (state.type === Network.NetworkStateType.VPN) findings.push({ label: 'VPN transport active', detail: 'Android reports a VPN transport. CyberShield did not create, inspect, or decrypt this connection.', severity: 'safe' });
      else findings.push({ label: 'Connection state read', detail: `Android reports ${String(state.type ?? 'an unknown connection type')}; local IPv4: ${ip}.`, severity: 'info' });
      if (!state.isConnected) findings.push({ label: 'No active network', detail: 'No active network was reported, so connection metadata could not be reviewed.', severity: 'info' });
      if (state.isConnected && state.isInternetReachable === false) findings.push({ label: 'Internet not validated', detail: 'Android reports a connection but not validated Internet access.', severity: 'warning' });
      if (airplaneMode) findings.push({ label: 'Airplane mode enabled', detail: 'Android reports airplane mode is enabled.', severity: 'info' });
      return { moduleId: 'network', displayName: 'Network Security', status: 'completed', summary: 'Connectivity metadata was read from Android. No traffic, packets, DNS payloads, or TLS content were captured.', findings, recommendations: ['Use a user-authorized VPN monitor only if you need connection-level visibility. This build does not inspect traffic.'], detail: `Connection type: ${String(state.type ?? 'unknown')}` };
    } catch {
      return empty('network', 'Network Security', 'failed', 'Android did not provide a network-state response.', ['Check device connectivity and try again.']);
    }
  },
};

const appModule: ScanModule = {
  moduleId: 'apps', displayName: 'Application Security', requiredPermissions: ['Android launcher-app visibility'],
  availability: () => deviceSecurity.isAvailable() ? { available: true } : { available: false, reason: 'The installed build does not include the CyberShield Android diagnostics module. Install the latest APK and try again.' },
  async execute() {
    if (!deviceSecurity.isAvailable()) return empty('apps', 'Application Security', 'skipped', 'The Android diagnostics module is unavailable in this installed build.', ['Install the current CyberShield APK, then run the app audit again.']);
    const audit = await deviceSecurity.auditApplications();
    const reviewApps = audit.apps.filter((app) => app.reviewSignals.length > 0);
    const findings: Finding[] = [{ label: 'Launcher-app audit completed', detail: `${audit.visibleAppCount} launchable app${audit.visibleAppCount === 1 ? '' : 's'} were visible to Android. The audit does not request broad QUERY_ALL_PACKAGES access.`, severity: 'safe' }];
    reviewApps.slice(0, 4).forEach((app) => findings.push({ label: `${app.label} needs review`, detail: app.reviewSignals.join(' · '), severity: 'warning' }));
    return { moduleId: 'apps', displayName: 'Application Security', status: 'completed', summary: `Audited ${audit.visibleAppCount} launchable app${audit.visibleAppCount === 1 ? '' : 's'} and their declared sensitive-permission signals.`, findings, recommendations: reviewApps.length ? ['Review the flagged app in Android Settings. A declared permission or debuggable flag is context, not a malware verdict.'] : ['No elevated review signals were found in the launchable-app set. This is not a malware scan.'], detail: audit.privacyNote };
  },
};

const bluetoothModule: ScanModule = {
  moduleId: 'bluetooth', displayName: 'Bluetooth Security', requiredPermissions: ['BLUETOOTH_CONNECT / Nearby devices'],
  availability: () => deviceSecurity.isAvailable() ? { available: true } : { available: false, reason: 'The installed build does not include the CyberShield Android diagnostics module. Install the latest APK and try again.' },
  async execute() {
    if (!deviceSecurity.isAvailable()) return empty('bluetooth', 'Bluetooth Security', 'skipped', 'The Android diagnostics module is unavailable in this installed build.', ['Install the current CyberShield APK, then run the paired-device audit again.']);
    const permission = await deviceSecurity.requestBluetoothAccess();
    const snapshot = await deviceSecurity.bluetoothSnapshot();
    if (!permission.granted || !snapshot.permissionGranted) return empty('bluetooth', 'Bluetooth Security', 'permission-required', snapshot.reason ?? 'Nearby devices permission was not granted.', ['Allow Nearby devices access to review paired Bluetooth-device names and connection types. CyberShield does not run nearby-device discovery.']);
    const findings: Finding[] = [];
    if (!snapshot.enabled) findings.push({ label: 'Bluetooth disabled', detail: 'Android reports Bluetooth is currently off, so paired-device state cannot be actively used.', severity: 'info' });
    else findings.push({ label: 'Paired-device audit completed', detail: `${snapshot.pairedDeviceCount ?? snapshot.pairedDevices.length} paired device${(snapshot.pairedDeviceCount ?? snapshot.pairedDevices.length) === 1 ? '' : 's'} are configured on this phone. Device addresses and nearby scan results were not collected.`, severity: 'safe' });
    return { moduleId: 'bluetooth', displayName: 'Bluetooth Security', status: 'completed', summary: snapshot.enabled ? `Reviewed ${snapshot.pairedDeviceCount ?? snapshot.pairedDevices.length} paired Bluetooth device${(snapshot.pairedDeviceCount ?? snapshot.pairedDevices.length) === 1 ? '' : 's'}.` : 'Bluetooth is disabled; no paired-device communication is active.', findings, recommendations: [snapshot.enabled ? 'Remove pairings you no longer recognize in Android Bluetooth settings. A device name alone is not a threat verdict.' : 'Enable Bluetooth only when you need it, then review the paired-device list again.'], detail: snapshot.privacyNote ?? 'Paired-device audit completed.' };
  },
};

export const scanModules: ScanModule[] = [urlModule, fileModule, appModule, wifiModule, networkModule, bluetoothModule];

export async function runScan(request: ScanRequest): Promise<ScanRun> {
  const startedAt = new Date().toISOString();
  const selectedModules = [...new Set(request.selectedModules)];
  const total = selectedModules.length;
  const results: ScanModuleResult[] = [];
  const emit = (state: ScanState, completed: number, currentLabel: string, currentModule?: ModuleId, findings = 0) => request.onProgress?.({ state, total, completed, currentModule, currentLabel, findings, moduleStates: Object.fromEntries(results.map((result) => [result.moduleId, result.status])) });
  emit('preparing', 0, request.mode === 'manual' ? 'Preparing the selected modules' : 'Preparing scheduled local checks');
  if (!total) {
    const completedAt = new Date().toISOString();
    return { id: `scan-${Date.now()}`, mode: request.mode, state: 'failed', startedAt, completedAt, selectedModules, results: [], findingCount: 0, highestSeverity: 'info', summary: 'No scan modules were selected.' };
  }
  emit('checking-permissions', 0, 'Checking each module’s available access');
  let findings = 0;
  for (let index = 0; index < selectedModules.length; index += 1) {
    const moduleId = selectedModules[index];
    const module = scanModules.find((candidate) => candidate.moduleId === moduleId);
    if (!module) continue;
    if (request.signal?.aborted) {
      results.push(empty(moduleId, module.displayName, 'cancelled', 'The scan was cancelled before this module started.'));
      break;
    }
    const availability = module.availability(request);
    if (!availability.available) {
      const stageStartedAt = Date.now();
      const result = await module.execute(request);
      result.summary = availability.reason ?? result.summary;
      if (request.mode === 'manual') await stagePause(Math.max(0, 420 - (Date.now() - stageStartedAt)));
      results.push(result);
      emit('permission-required', index + 1, result.summary, moduleId, findings);
      continue;
    }
    emit('scanning', index, `Checking ${module.displayName}`, moduleId, findings);
    const stageStartedAt = Date.now();
    try {
      const result = await module.execute(request);
      // This is presentation pacing only. The result comes from the real module
      // first; we hold the completed state briefly so users can follow each row.
      if (request.mode === 'manual') await stagePause(Math.max(0, 420 - (Date.now() - stageStartedAt)));
      results.push(result);
      findings += result.findings.filter((finding) => finding.severity === 'warning' || finding.severity === 'danger').length;
      emit(findings ? 'findings-detected' : 'scanning', index + 1, result.summary, moduleId, findings);
    } catch {
      const result = empty(moduleId, module.displayName, 'failed', `${module.displayName} did not complete.`, ['Try the module again after checking the device state.']);
      results.push(result);
      emit('failed', index + 1, result.summary, moduleId, findings);
    }
  }
  const hasFailed = results.some((result) => result.status === 'failed');
  const hasSkipped = results.some((result) => result.status === 'skipped' || result.status === 'permission-required');
  const cancelled = request.signal?.aborted || results.some((result) => result.status === 'cancelled');
  const state: ScanRun['state'] = cancelled ? 'cancelled' : hasFailed && results.every((result) => result.status === 'failed') ? 'failed' : hasSkipped || hasFailed ? 'partially-completed' : 'completed';
  const allFindings = results.flatMap((result) => result.findings);
  const completedAt = new Date().toISOString();
  const summary = state === 'completed' ? `Completed ${results.length} selected module${results.length === 1 ? '' : 's'}.` : state === 'cancelled' ? 'The scan was cancelled. Completed module results are saved.' : `Completed ${results.filter((result) => result.status === 'completed').length} of ${selectedModules.length} selected modules; unavailable modules are listed below.`;
  emit(state, results.length, summary, undefined, findings);
  return { id: `scan-${Date.now()}`, mode: request.mode, state, startedAt, completedAt, selectedModules, results, findingCount: findings, highestSeverity: highest(allFindings), summary };
}

export function historyItemsFromRun(run: ScanRun) { return run.results.flatMap((result) => result.historyItems ?? []); }
export function urlsFromHistory(history: ScanHistoryItem[]) { return [...new Set(history.filter((item) => item.kind === 'url').map((item) => item.subject))].slice(0, 10); }
function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`; return `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
