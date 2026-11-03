export type CapabilityState = 'available' | 'permission' | 'configuration' | 'limited';

export type Capability = {
  id: 'link' | 'file' | 'apps' | 'wifi' | 'network' | 'bluetooth';
  title: string;
  summary: string;
  state: CapabilityState;
  action: string;
};

export const capabilities: Capability[] = [
  { id: 'link', title: 'Suspicious links and websites', summary: 'Checks web-address structure on this device.', state: 'available', action: 'Check a link' },
  { id: 'file', title: 'Files you choose', summary: 'Records metadata without opening or uploading the file.', state: 'available', action: 'Assess a file' },
  { id: 'apps', title: 'Installed apps', summary: 'Needs a native Android capability and your approval.', state: 'permission', action: 'Learn about access' },
  { id: 'wifi', title: 'Wi-Fi connection', summary: 'Connection diagnostics are not connected in this build.', state: 'permission', action: 'View availability' },
  { id: 'network', title: 'Network activity', summary: 'A user-authorized VPN monitor has not been connected.', state: 'configuration', action: 'View monitoring' },
  { id: 'bluetooth', title: 'Nearby devices', summary: 'Needs Android nearby-device access before it can check.', state: 'permission', action: 'View availability' },
];

export function capabilityLabel(state: CapabilityState) {
  return state === 'available' ? 'Available' : state === 'permission' ? 'Needs permission' : state === 'configuration' ? 'Not connected' : 'Limited';
}
