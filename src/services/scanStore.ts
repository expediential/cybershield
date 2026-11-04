import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AutomaticScanSettings, ScanRun } from '../types/scanning';
import { defaultAutomaticScanSettings } from '../types/scanning';

const runsKey = '@cybershield/scan-runs/v1';
const settingsKey = '@cybershield/automatic-scan/v1';

export async function loadScanRuns(): Promise<ScanRun[]> {
  try { const raw = await AsyncStorage.getItem(runsKey); return raw ? JSON.parse(raw) as ScanRun[] : []; } catch { return []; }
}

export async function saveScanRuns(runs: ScanRun[]): Promise<void> { await AsyncStorage.setItem(runsKey, JSON.stringify(runs.slice(0, 40))); }

export async function appendScanRun(run: ScanRun): Promise<ScanRun[]> {
  const existing = await loadScanRuns();
  const next = [run, ...existing.filter((item) => item.id !== run.id)].slice(0, 40);
  await saveScanRuns(next);
  return next;
}

export async function loadAutomaticScanSettings(): Promise<AutomaticScanSettings> {
  try {
    const raw = await AsyncStorage.getItem(settingsKey);
    if (!raw) return defaultAutomaticScanSettings;
    const saved = JSON.parse(raw) as Partial<AutomaticScanSettings>;
    return { ...defaultAutomaticScanSettings, ...saved, categories: saved.categories?.length ? saved.categories : defaultAutomaticScanSettings.categories };
  } catch { return defaultAutomaticScanSettings; }
}

export async function saveAutomaticScanSettings(settings: AutomaticScanSettings): Promise<void> { await AsyncStorage.setItem(settingsKey, JSON.stringify(settings)); }
