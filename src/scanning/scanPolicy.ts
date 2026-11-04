import type { AutomaticScanSettings } from '../types/scanning';

export type AutomaticRunEnvironment = {
  batteryLevel: number | null;
  isCharging: boolean | null;
  networkType: string | null;
};

export function intervalMinutes(cadence: AutomaticScanSettings['cadence']) { return cadence === 'weekly' ? 7 * 24 * 60 : 24 * 60; }

export function automaticRunDeferral(settings: AutomaticScanSettings, environment: AutomaticRunEnvironment): string | null {
  if (!settings.enabled) return 'Automatic Scan is off.';
  if (settings.batteryConscious && environment.batteryLevel !== null && environment.batteryLevel >= 0 && environment.batteryLevel < 0.2 && environment.isCharging === false) return 'Automatic scan deferred because the battery level is below 20%.';
  if (settings.wifiOnly && environment.networkType !== 'WIFI') return 'Automatic scan deferred because Wi-Fi-only mode is enabled and Android did not report Wi-Fi.';
  return null;
}
