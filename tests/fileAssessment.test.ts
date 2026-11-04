import assert from 'node:assert/strict';
import { assessFile, extensionFor, signatureFor } from '../src/domain/fileAssessment.ts';

const fixedTime = new Date('2026-11-04T08:00:00.000Z');

assert.equal(extensionFor('Report.PDF'), 'pdf');
assert.equal(extensionFor('no-extension'), '');
assert.equal(signatureFor(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])), 'PDF document');
assert.equal(signatureFor(new Uint8Array([0x4d, 0x5a, 0x90, 0x00])), 'Windows executable (MZ)');

const ordinary = assessFile({ name: 'notes.pdf', bytes: 1024, mimeType: 'application/pdf' }, { sha256: 'a'.repeat(64), signature: 'PDF document', fingerprintStatus: 'computed' }, fixedTime);
assert.equal(ordinary.verdict, 'unknown');
assert.equal(ordinary.sha256, 'a'.repeat(64));
assert.ok(ordinary.findings.some((finding) => finding.label === 'SHA-256 fingerprint'));

const disguised = assessFile({ name: 'invoice.pdf.exe', bytes: 20, mimeType: 'application/octet-stream' }, { sha256: null, signature: 'Windows executable (MZ)', fingerprintStatus: 'unavailable' }, fixedTime);
assert.equal(disguised.verdict, 'malicious');
assert.ok(disguised.findings.some((finding) => finding.label === 'Double-extension filename'));
assert.ok(disguised.findings.some((finding) => finding.label === 'Executable file header'));

const mismatched = assessFile({ name: 'photo.png', bytes: 20, mimeType: 'application/pdf' }, { sha256: null, signature: 'PDF document', fingerprintStatus: 'unavailable' }, fixedTime);
assert.equal(mismatched.verdict, 'suspicious');
assert.ok(mismatched.findings.some((finding) => finding.label === 'Type mismatch'));

console.log('fileAssessment: 12 assertions passed');
