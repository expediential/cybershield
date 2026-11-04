import * as BackgroundTask from 'expo-background-task';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';
import { runScan, urlsFromHistory } from './ScanManager';
import { appendScanRun, loadAutomaticScanSettings, saveAutomaticScanSettings } from '../services/scanStore';
import { loadHistory } from '../services/history';
import { notifyNewFindings } from '../services/notifications';
import type { AutomaticScanSettings, ScanRun } from '../types/scanning';
import { automaticRunDeferral, intervalMinutes } from './scanPolicy';
import { addHistoryItem } from '../domain/productState';
import { saveHistory } from '../services/history';
import { historyItemsFromRun } from './ScanManager';

export const automaticScanTaskName = 'cybershield-automatic-security-scan';

export async function runAutomaticScan(): Promise<ScanRun | null> {
  const settings = await loadAutomaticScanSettings();
  if (!settings.enabled) return null;
  let batteryLevel: number | null = null; let isCharging: boolean | null = null; let networkType: string | null = null;
  try { const power = await Battery.getPowerStateAsync(); batteryLevel = power.batteryLevel; isCharging = power.batteryState === Battery.BatteryState.CHARGING || power.batteryState === Battery.BatteryState.FULL; } catch { /* Continue when the platform does not expose battery information. */ }
  try { networkType = String((await Network.getNetworkStateAsync()).type ?? 'UNKNOWN'); } catch { /* Continue with local checks when connectivity data is unavailable. */ }
  const deferral = automaticRunDeferral(settings, { batteryLevel, isCharging, networkType });
  if (deferral) {
    const now = new Date().toISOString(); const run: ScanRun = { id: `scan-${Date.now()}`, mode: 'automatic', state: 'partially-completed', startedAt: now, completedAt: now, selectedModules: settings.categories, results: [], findingCount: 0, highestSeverity: 'info', summary: deferral };
    await appendScanRun(run); await saveAutomaticScanSettings({ ...settings, lastRunAt: now, lastRunState: run.state }); return run;
  }
  const history = await loadHistory();
  const run = await runScan({ mode: 'automatic', selectedModules: settings.categories, urls: urlsFromHistory(history) });
  const nextHistory = historyItemsFromRun(run).reduce((items, item) => addHistoryItem(items, item), history);
  if (nextHistory.length !== history.length) await saveHistory(nextHistory);
  await appendScanRun(run);
  const fingerprint = run.results.flatMap((result) => result.historyItems ?? []).filter((item) => item.verdict === 'suspicious' || item.verdict === 'malicious').map((item) => `${item.subject}|${item.verdict}`).sort().join('\n');
  if (settings.notifications && fingerprint && fingerprint !== settings.lastFindingFingerprint) await notifyNewFindings(run.findingCount);
  await saveAutomaticScanSettings({ ...settings, lastRunAt: run.completedAt, lastRunState: run.state, lastFindingFingerprint: fingerprint || settings.lastFindingFingerprint });
  return run;
}

export async function applyAutomaticSchedule(settings: AutomaticScanSettings): Promise<AutomaticScanSettings> {
  if (!settings.enabled) {
    try { await BackgroundTask.unregisterTaskAsync(automaticScanTaskName); } catch { /* Already absent or unavailable. */ }
    const next = { ...settings, schedulerNote: 'Automatic scans are off.' };
    await saveAutomaticScanSettings(next);
    return next;
  }
  const status = await BackgroundTask.getStatusAsync().catch(() => BackgroundTask.BackgroundTaskStatus.Restricted);
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
    const next = { ...settings, schedulerNote: 'Background scheduling is unavailable in this runtime. Install the standalone Android build and reopen CyberShield.' };
    await saveAutomaticScanSettings(next);
    return next;
  }
  try {
    await BackgroundTask.unregisterTaskAsync(automaticScanTaskName).catch(() => undefined);
    await BackgroundTask.registerTaskAsync(automaticScanTaskName, { minimumInterval: intervalMinutes(settings.cadence) });
    const next = { ...settings, lastScheduledAt: new Date().toISOString(), schedulerNote: `Android WorkManager will run eligible local checks no earlier than the ${settings.cadence} interval. The system chooses the exact time.` };
    await saveAutomaticScanSettings(next);
    return next;
  } catch {
    const next = { ...settings, schedulerNote: 'Android could not register the background worker. Check this build and try again.' };
    await saveAutomaticScanSettings(next);
    return next;
  }
}
