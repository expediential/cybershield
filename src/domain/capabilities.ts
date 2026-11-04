export type ModuleId = 'phishing' | 'file' | 'apps' | 'wifi' | 'network' | 'bluetooth';
export type CapabilityState = 'ready' | 'permission' | 'configuration' | 'demo' | 'unavailable';

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
  { id: 'file', title: 'File Security', shortTitle: 'Files', summary: 'Inspect user-selected file metadata, headers, and a local SHA-256 fingerprint without executing or uploading it.', state: 'ready', action: 'Inspect a file' },
  { id: 'apps', title: 'Application Security', shortTitle: 'Apps', summary: 'Audit Android-visible launcher apps for declared sensitive-permission and review signals without broad app-list access.', state: 'ready', action: 'Run app audit' },
  { id: 'wifi', title: 'Wi-Fi Security', shortTitle: 'Wi-Fi', summary: 'Read Android-reported Wi-Fi state and any OS-exposed security type without inspecting traffic or DNS contents.', state: 'ready', action: 'Run Wi-Fi check' },
  { id: 'network', title: 'Network Security', shortTitle: 'Network', summary: 'Read Android connection-state metadata without collecting traffic, packets, DNS contents, or TLS data.', state: 'ready', action: 'Run network check' },
  { id: 'bluetooth', title: 'Bluetooth Security', shortTitle: 'Bluetooth', summary: 'With Nearby devices permission, review paired-device names and types without discovery or address collection.', state: 'ready', action: 'Review paired devices' },
];

export function capabilityLabel(state: CapabilityState) {
  return state === 'ready' ? 'Ready' : state === 'permission' ? 'Permission required' : state === 'configuration' ? 'Setup required' : state === 'unavailable' ? 'Not available in this build' : 'Demo available';
}

export function capabilityById(id: ModuleId): Capability {
  return capabilities.find((item) => item.id === id) ?? capabilities[0];
}
