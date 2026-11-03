import assert from 'node:assert/strict';
import { addHistoryItem, deriveAnalytics, derivePosture, needsAttention } from '../src/domain/productState.ts';
import type { ScanHistoryItem } from '../src/types/security.ts';

const items: ScanHistoryItem[] = [
  { id: 'link-1', kind: 'url', subject: 'https://malware.test', verdict: 'malicious', score: 100, createdAt: '2026-11-03T08:00:00.000Z', detail: 'Local test blocklist', source: 'local-heuristics' },
  { id: 'file-1', kind: 'file', subject: 'notes.pdf', verdict: 'unknown', score: 0, createdAt: '2026-11-02T08:00:00.000Z', detail: 'Metadata only', source: 'metadata-only' },
  { id: 'link-2', kind: 'url', subject: 'https://example.com', verdict: 'safe', score: 0, createdAt: '2026-10-29T08:00:00.000Z', detail: 'Structural analysis', source: 'local-heuristics' },
];

assert.equal(needsAttention('safe'), false);
assert.equal(needsAttention('suspicious'), true);
assert.equal(derivePosture([], ['ready', 'ready', 'permission']).tone, 'insufficient');
assert.equal(derivePosture(items, ['ready', 'ready', 'permission']).tone, 'attention');
assert.equal(derivePosture(items, ['ready', 'ready', 'permission']).attentionCount, 1);

const analytics = deriveAnalytics(items, new Date('2026-11-03T12:00:00.000Z'));
assert.equal(analytics.total, 3);
assert.equal(analytics.links, 2);
assert.equal(analytics.files, 1);
assert.equal(analytics.needsReview, 1);
assert.equal(analytics.byDay.reduce((sum, value) => sum + value, 0), 3);

const replaced = addHistoryItem(items, { ...items[0], id: 'link-new', score: 80 });
assert.equal(replaced.length, 3);
assert.equal(replaced[0].id, 'link-new');

console.log('productState: 12 assertions passed');
