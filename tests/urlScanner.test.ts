import assert from 'node:assert/strict';
import { scanUrl } from '../src/domain/urlScanner.ts';

const fixedTime = new Date('2026-11-02T08:00:00.000Z');

const ordinary = scanUrl('https://www.example.com/account', fixedTime);
assert.equal(ordinary.verdict, 'safe');
assert.equal(ordinary.score, 0);
assert.match(ordinary.coverage, /Structural analysis only/);

const shortened = scanUrl('bit.ly/3example', fixedTime);
assert.equal(shortened.verdict, 'suspicious');
assert.ok(shortened.findings.some((finding) => finding.label === 'Shortened link'));

const localThreat = scanUrl('https://malware.test/payments', fixedTime);
assert.equal(localThreat.verdict, 'malicious');
assert.ok(localThreat.findings.some((finding) => finding.label === 'Test threat match'));

const invalid = scanUrl('not a url with spaces', fixedTime);
assert.equal(invalid.verdict, 'unknown');
assert.equal(invalid.normalized, '');

console.log('urlScanner: 4 assertions passed');
