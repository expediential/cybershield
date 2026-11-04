import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

export type AuditedApplication = {
  label: string;
  packageName: string;
  versionName: string;
  targetSdk: number;
  systemApp: boolean;
  debuggable: boolean;
  sensitivePermissions: string[];
  reviewSignals: string[];
};

export type ApplicationAudit = {
  apps: AuditedApplication[];
  visibleAppCount: number;
  visibility: 'launcher-activities-only';
  privacyNote: string;
};

export type WifiSnapshot = {
  supported: boolean;
  wifiEnabled?: boolean;
  connected?: boolean;
  ssid?: string | null;
  identityVisible?: boolean;
  rssi?: number;
  frequencyMhz?: number;
  securityType?: number;
  securityLabel?: string;
  privacyNote?: string;
  reason?: string;
};

export type PairedBluetoothDevice = { name: string; type: string; bondState: string };
export type BluetoothSnapshot = {
  supported: boolean;
  enabled?: boolean;
  permissionGranted?: boolean;
  pairedDevices: PairedBluetoothDevice[];
  pairedDeviceCount?: number;
  privacyNote?: string;
  reason?: string;
};

type PermissionResponse = { granted?: boolean; status?: string; canAskAgain?: boolean };
type DeviceSecurityNativeModule = {
  getApplicationAuditAsync: () => Promise<ApplicationAudit>;
  getWifiSnapshotAsync: () => Promise<WifiSnapshot>;
  getBluetoothSnapshotAsync: () => Promise<BluetoothSnapshot>;
  requestBluetoothAccessAsync: () => Promise<PermissionResponse>;
  getBluetoothAccessAsync: () => Promise<PermissionResponse>;
};

function loadNativeModule(): DeviceSecurityNativeModule | null {
  if (Platform.OS !== 'android') return null;
  try {
    return requireNativeModule<DeviceSecurityNativeModule>('CyberShieldDeviceSecurity');
  } catch {
    return null;
  }
}

const nativeModule = loadNativeModule();

function unavailable(): never {
  throw new Error('CyberShield device diagnostics are available only in the installed Android build. Reinstall the current APK after updating.');
}

export const deviceSecurity = {
  isAvailable: () => nativeModule !== null,
  auditApplications: async () => nativeModule ? nativeModule.getApplicationAuditAsync() : unavailable(),
  wifiSnapshot: async () => nativeModule ? nativeModule.getWifiSnapshotAsync() : unavailable(),
  bluetoothSnapshot: async () => nativeModule ? nativeModule.getBluetoothSnapshotAsync() : unavailable(),
  requestBluetoothAccess: async () => nativeModule ? nativeModule.requestBluetoothAccessAsync() : unavailable(),
  bluetoothAccess: async () => nativeModule ? nativeModule.getBluetoothAccessAsync() : unavailable(),
};
