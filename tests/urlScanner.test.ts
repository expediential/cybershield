import assert from 'node:assert/strict';
import { scanUrl } from '../src/domain/urlScanner.ts';

const fixedTime = new Date('2026-11-02T08:00:00.000Z');

const ordinary = scanUrl('https://www.example.com/account', fixedTime);
assert.equal(ordinary.verdict, 'safe');
assert.equal(ordinary.score, 0);
assert.match(ordinary.coverage, /Local structural analysis/);
assert.match(ordinary.coverage, /public-suffix domain parsing/);

const shortened = scanUrl('bit.ly/3example', fixedTime);
assert.equal(shortened.verdict, 'suspicious');
assert.ok(shortened.findings.some((finding) => finding.label === 'Shortened link'));

const localThreat = scanUrl('https://malware.test/payments', fixedTime);
assert.equal(localThreat.verdict, 'malicious');
assert.ok(localThreat.findings.some((finding) => finding.label === 'Test threat match'));

const invalid = scanUrl('not a url with spaces', fixedTime);
assert.equal(invalid.verdict, 'unknown');
assert.equal(invalid.normalized, '');

const encodedRedirect = scanUrl('https://offer-example.top/go?redirect=https%3A%2F%2Fexample.test%2Flogin', fixedTime);
assert.equal(encodedRedirect.verdict, 'suspicious');
assert.ok(encodedRedirect.findings.some((finding) => finding.label === 'Encoded URL components'));
assert.ok(encodedRedirect.findings.some((finding) => finding.label === 'Redirect parameter'));

const punycode = scanUrl('https://xn--paypa1-4ve.example/login', fixedTime);
assert.equal(punycode.verdict, 'suspicious');
assert.ok(punycode.findings.some((finding) => finding.label === 'Internationalized hostname'));

const lookalike = scanUrl('https://paypal-login.accounts.example/verify', fixedTime);
assert.equal(lookalike.verdict, 'suspicious');
assert.ok(lookalike.findings.some((finding) => finding.label === 'Look-alike brand placement'));

const multiPartSuffix = scanUrl('https://paypal.signin.example.co.uk/verify', fixedTime);
assert.equal(multiPartSuffix.verdict, 'suspicious');
assert.ok(multiPartSuffix.findings.some((finding) => finding.label === 'Look-alike brand placement'));

const deceptiveBrandSubdomain = scanUrl('https://paypal.com.login.example/verify', fixedTime);
assert.equal(deceptiveBrandSubdomain.verdict, 'suspicious');
assert.ok(deceptiveBrandSubdomain.score >= 24);
assert.ok(deceptiveBrandSubdomain.findings.some((finding) => finding.label === 'Look-alike brand placement'));

const trustedBrandDomain = scanUrl('https://www.paypal.com/security', fixedTime);
assert.equal(trustedBrandDomain.verdict, 'safe');
assert.ok(!trustedBrandDomain.findings.some((finding) => finding.label === 'Look-alike brand placement'));

console.log('urlScanner: 25 assertions passed');
