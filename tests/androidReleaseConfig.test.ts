import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'app.json'), 'utf8')) as {
  expo: { version: string; android: { versionCode: number; permissions: string[] }; plugins: Array<string | [string, { android?: { extraProguardRules?: string } }]> };
};

const buildProperties = appConfig.expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties');
assert.ok(Array.isArray(buildProperties), 'expo-build-properties must be configured for Android release builds');
const rules = buildProperties[1].android?.extraProguardRules ?? '';
assert.match(rules, /extends androidx\.room\.RoomDatabase \{ <init>\(\); \}/, 'Room database constructors must survive R8');
assert.match(rules, /extends androidx\.work\.InputMerger \{ <init>\(\); \}/, 'WorkManager input-merger constructors must survive R8');
assert.ok(appConfig.expo.android.permissions.includes('android.permission.BLUETOOTH_CONNECT'), 'Bluetooth permission must be declared for the paired-device audit');
assert.ok(appConfig.expo.android.permissions.includes('android.permission.ACCESS_WIFI_STATE'), 'Wi-Fi state permission must be declared for the local diagnostics');
assert.equal(appConfig.expo.version, '0.7.2');
assert.equal(appConfig.expo.android.versionCode, 10, 'Android versionCode must advance so the APK can update a 0.7.1 installation');

console.log('androidReleaseConfig: 7 assertions passed');
