import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'app.json'), 'utf8')) as {
  expo: { plugins: Array<string | [string, { android?: { extraProguardRules?: string } }]> };
};

const buildProperties = appConfig.expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties');
assert.ok(Array.isArray(buildProperties), 'expo-build-properties must be configured for Android release builds');
const rules = buildProperties[1].android?.extraProguardRules ?? '';
assert.match(rules, /extends androidx\.room\.RoomDatabase \{ <init>\(\); \}/, 'Room database constructors must survive R8');
assert.match(rules, /extends androidx\.work\.InputMerger \{ <init>\(\); \}/, 'WorkManager input-merger constructors must survive R8');

console.log('androidReleaseConfig: 3 assertions passed');
