import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const moduleRoot = resolve(process.cwd(), 'modules', 'cybershield-device-security');
const config = JSON.parse(readFileSync(resolve(moduleRoot, 'expo-module.config.json'), 'utf8')) as { android?: { modules?: string[] } };
const manifest = readFileSync(resolve(moduleRoot, 'android', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
const source = readFileSync(resolve(moduleRoot, 'android', 'src', 'main', 'java', 'expo', 'modules', 'cybershielddevicesecurity', 'CyberShieldDeviceSecurityModule.kt'), 'utf8');

assert.deepEqual(config.android?.modules, ['expo.modules.cybershielddevicesecurity.CyberShieldDeviceSecurityModule']);
assert.match(manifest, /android\.permission\.BLUETOOTH_CONNECT/);
assert.match(manifest, /<queries>/);
assert.match(manifest, /android\.intent\.category\.LAUNCHER/);
assert.doesNotMatch(manifest, /<uses-permission[^>]+QUERY_ALL_PACKAGES/);
assert.match(source, /"launcher-activities-only"/);
assert.match(source, /does not request QUERY_ALL_PACKAGES/);
assert.match(source, /Device addresses and nearby discovery results are not collected/);

console.log('androidDeviceModule: 8 assertions passed');
