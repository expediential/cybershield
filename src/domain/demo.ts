import type { ModuleId } from './capabilities';

export type DemoSignal = {
  id: string;
  module: ModuleId;
  title: string;
  detail: string;
  severity: 'info' | 'warning' | 'danger';
  time: string;
};

export const demoSignals: DemoSignal[] = [
  { id: 'demo-network-dns', module: 'network', title: 'Unencrypted DNS request', detail: 'Demonstration signal from a sample monitoring session.', severity: 'warning', time: 'Demo · 10:42' },
  { id: 'demo-app-permission', module: 'apps', title: 'Sensitive permission combination', detail: 'Demonstration finding from a sample application audit.', severity: 'warning', time: 'Demo · 10:38' },
  { id: 'demo-wifi-open', module: 'wifi', title: 'Open network warning', detail: 'Demonstration finding from a sample Wi-Fi assessment.', severity: 'danger', time: 'Demo · 10:31' },
  { id: 'demo-bluetooth', module: 'bluetooth', title: 'Unknown nearby device', detail: 'Demonstration observation from a sample Bluetooth scan.', severity: 'info', time: 'Demo · 10:26' },
];
