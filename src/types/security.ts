export type Severity = 'safe' | 'info' | 'warning' | 'danger';
export type Verdict = 'safe' | 'suspicious' | 'malicious' | 'unknown';

export type Finding = {
  label: string;
  detail: string;
  severity: Severity;
};

export type UrlScanResult = {
  input: string;
  normalized: string;
  verdict: Verdict;
  score: number;
  findings: Finding[];
  checkedAt: string;
  coverage: string;
  recommendation: string;
};

export type ScanHistoryItem = {
  id: string;
  kind: 'url' | 'file';
  subject: string;
  verdict: Verdict;
  score: number;
  createdAt: string;
  detail: string;
};
