import type { ModuleId } from '../domain/capabilities';
import type { Finding, ScanHistoryItem, Severity } from './security';

export type ScanMode = 'manual' | 'automatic';
export type ScanState = 'idle' | 'preparing' | 'checking-permissions' | 'scanning' | 'findings-detected' | 'completed' | 'partially-completed' | 'permission-required' | 'failed' | 'cancelled';
export type ModuleScanStatus = 'completed' | 'skipped' | 'permission-required' | 'failed' | 'cancelled';

export type FileScanInput = {
  name: string;
  uri: string;
  bytes: number;
  mimeType: string | null;
};

export type ScanModuleResult = {
  moduleId: ModuleId;
  displayName: string;
  status: ModuleScanStatus;
  summary: string;
  findings: Finding[];
  recommendations: string[];
  detail?: string;
  historyItems?: ScanHistoryItem[];
};

export type ScanRun = {
  id: string;
  mode: ScanMode;
  state: Extract<ScanState, 'completed' | 'partially-completed' | 'permission-required' | 'failed' | 'cancelled'>;
  startedAt: string;
  completedAt: string;
  selectedModules: ModuleId[];
  results: ScanModuleResult[];
  findingCount: number;
  highestSeverity: Severity;
  summary: string;
};

export type ScanProgress = {
  state: ScanState;
  total: number;
  completed: number;
  currentModule?: ModuleId;
  currentLabel: string;
  findings: number;
  /** Outcomes received so far, allowing the live scan list to reflect real module completion. */
  moduleStates?: Partial<Record<ModuleId, ModuleScanStatus>>;
};

export type AutomaticScanSettings = {
  enabled: boolean;
  cadence: 'daily' | 'weekly';
  preferredTime: string;
  categories: ModuleId[];
  batteryConscious: true;
  wifiOnly: boolean;
  notifications: boolean;
  lastScheduledAt?: string;
  lastRunAt?: string;
  lastRunState?: ScanRun['state'];
  schedulerNote?: string;
  lastFindingFingerprint?: string;
};

export const defaultAutomaticScanSettings: AutomaticScanSettings = {
  enabled: false,
  cadence: 'daily',
  preferredTime: '09:00',
  categories: ['phishing', 'wifi', 'network'],
  batteryConscious: true,
  wifiOnly: false,
  notifications: true,
};
