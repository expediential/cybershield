import type { CapabilityState } from './capabilities';
import type { ScanHistoryItem, Verdict } from '../types/security';

export type Posture = {
  tone: 'insufficient' | 'limited' | 'attention';
  title: string;
  detail: string;
  availableModules: number;
  totalModules: number;
  attentionCount: number;
};

export type ActivityAnalytics = {
  total: number;
  links: number;
  files: number;
  clear: number;
  needsReview: number;
  byDay: number[];
};

export function needsAttention(verdict: Verdict): boolean {
  return verdict === 'suspicious' || verdict === 'malicious';
}

export function derivePosture(history: ScanHistoryItem[], states: CapabilityState[]): Posture {
  const attentionCount = history.filter((item) => needsAttention(item.verdict)).length;
  const availableModules = states.filter((state) => state === 'ready').length;
  const totalModules = states.length;
  if (attentionCount > 0) {
    return { tone: 'attention', title: `${attentionCount} item${attentionCount === 1 ? '' : 's'} needs attention`, detail: 'Review saved link or file assessments before continuing.', availableModules, totalModules, attentionCount };
  }
  if (history.length === 0) {
    return { tone: 'insufficient', title: 'Security posture needs more information', detail: `Only ${availableModules} of ${totalModules} protection modules can assess this device in the current build.`, availableModules, totalModules, attentionCount: 0 };
  }
  return { tone: 'limited', title: 'No saved assessment needs attention', detail: `This reflects ${history.length} local assessment${history.length === 1 ? '' : 's'} and ${availableModules} ready modules, not a full-device security score.`, availableModules, totalModules, attentionCount: 0 };
}

export function deriveAnalytics(history: ScanHistoryItem[], now = new Date()): ActivityAnalytics {
  const byDay = Array.from({ length: 7 }, () => 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (const item of history) {
    const itemDate = new Date(item.createdAt);
    const start = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate()).getTime();
    const offset = Math.floor((today - start) / 86400000);
    if (offset >= 0 && offset < 7) byDay[6 - offset] += 1;
  }
  return {
    total: history.length,
    links: history.filter((item) => item.kind === 'url').length,
    files: history.filter((item) => item.kind === 'file').length,
    clear: history.filter((item) => item.verdict === 'safe').length,
    needsReview: history.filter((item) => needsAttention(item.verdict)).length,
    byDay,
  };
}

export function addHistoryItem(items: ScanHistoryItem[], item: ScanHistoryItem): ScanHistoryItem[] {
  return [item, ...items.filter((entry) => entry.subject !== item.subject || entry.kind !== item.kind)].slice(0, 30);
}
