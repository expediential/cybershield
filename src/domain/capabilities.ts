export type ModuleId = 'phishing' | 'file' | 'apps' | 'wifi' | 'network' | 'bluetooth';
export type CapabilityState = 'ready' | 'permission' | 'configuration' | 'demo';

export type Capability = {
  id: ModuleId;
  title: string;
  shortTitle: string;
  summary: string;
  state: CapabilityState;
  action: string;
};

export const capabilities: Capability[] = [
  { id: 'phishing', title: 'Phishing Protection', shortTitle: 'Phishing', summary: 'Local URL checks identify structural phishing signals before you open a link.', state: 'ready', action: 'Check a suspicious link' },
  { id: 'file', title: 'File Security', shortTitle: 'Files', summary: 'Inspect the name, type, and size Android shares without opening the file.', state: 'ready', action: 'Inspect a file' },
  { id: 'apps', title: 'Application Security', shortTitle: 'Apps', summary: 'Permission auditing needs a native PackageManager integration.', state: 'permission', action: 'Open app security' },
  { id: 'wifi', title: 'Wi-Fi Security', shortTitle: 'Wi-Fi', summary: 'Connection diagnostics need an Android Wi-Fi and permission adapter.', state: 'permission', action: 'Open Wi-Fi security' },
  { id: 'network', title: 'Network Monitor', shortTitle: 'Network', summary: 'Live connection monitoring requires a consented Android VPN service.', state: 'configuration', action: 'Open network monitor' },
  { id: 'bluetooth', title: 'Bluetooth Security', shortTitle: 'Bluetooth', summary: 'Nearby-device visibility needs Android Bluetooth access.', state: 'permission', action: 'Open Bluetooth security' },
];

export function capabilityLabel(state: CapabilityState) {
  return state === 'ready' ? 'Ready' : state === 'permission' ? 'Permission required' : state === 'configuration' ? 'Setup required' : 'Demo available';
}

export function capabilityById(id: ModuleId): Capability {
  return capabilities.find((item) => item.id === id) ?? capabilities[0];
}
