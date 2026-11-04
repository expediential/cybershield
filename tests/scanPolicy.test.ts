import assert from 'node:assert/strict';
import { automaticRunDeferral, intervalMinutes } from '../src/scanning/scanPolicy.ts';
import { defaultAutomaticScanSettings } from '../src/types/scanning.ts';

assert.equal(intervalMinutes('daily'), 1440);
assert.equal(intervalMinutes('weekly'), 10080);
assert.equal(automaticRunDeferral(defaultAutomaticScanSettings, { batteryLevel: 0.9, isCharging: false, networkType: 'WIFI' }), 'Automatic Scan is off.');

const enabled = { ...defaultAutomaticScanSettings, enabled: true };
assert.equal(automaticRunDeferral(enabled, { batteryLevel: 0.1, isCharging: false, networkType: 'WIFI' }), 'Automatic scan deferred because the battery level is below 20%.');
assert.equal(automaticRunDeferral({ ...enabled, wifiOnly: true }, { batteryLevel: 0.9, isCharging: false, networkType: 'CELLULAR' }), 'Automatic scan deferred because Wi-Fi-only mode is enabled and Android did not report Wi-Fi.');
assert.equal(automaticRunDeferral({ ...enabled, wifiOnly: true }, { batteryLevel: 0.9, isCharging: false, networkType: 'WIFI' }), null);
assert.equal(automaticRunDeferral(enabled, { batteryLevel: null, isCharging: null, networkType: null }), null);

console.log('scanPolicy: 7 assertions passed');
