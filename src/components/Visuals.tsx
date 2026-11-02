import { Animated, StyleSheet, Text, View } from 'react-native';
import { color, radius, space } from '../design/tokens';
import type { Severity, Verdict } from '../types/security';

export function SignalMark({ severity = 'safe', size = 8 }: { severity?: Severity; size?: number }) {
  return <View style={[styles.signal, { width: size, height: size, borderRadius: size / 2, backgroundColor: severityColor(severity) }]} />;
}

export function SeverityTag({ verdict }: { verdict: Verdict }) {
  const label = verdict === 'safe' ? 'CLEAR' : verdict === 'suspicious' ? 'REVIEW' : verdict === 'malicious' ? 'BLOCK' : 'UNKNOWN';
  const severity: Severity = verdict === 'safe' ? 'safe' : verdict === 'suspicious' ? 'warning' : verdict === 'malicious' ? 'danger' : 'info';
  return (
    <View style={[styles.tag, { borderColor: severityColor(severity) + '99' }]}>
      <SignalMark severity={severity} size={6} />
      <Text style={[styles.tagText, { color: severityColor(severity) }]}>{label}</Text>
    </View>
  );
}

export function Waveform() {
  const bars = [15, 32, 19, 45, 22, 26, 16, 40, 18, 34, 25, 50, 19, 17, 38, 27, 47, 21, 32, 14, 28, 18, 36, 16];
  return (
    <View style={styles.wave}>
      {bars.map((height, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              height,
              opacity: index % 5 === 0 ? 1 : 0.42 + (index % 3) * 0.16,
              backgroundColor: index % 5 === 0 ? color.accent : color.soft,
            },
          ]}
        />
      ))}
    </View>
  );
}

export function RadialMonitor({ spin }: { spin: Animated.Value }) {
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={styles.radarWrap}>
      <View style={styles.outerTicks} />
      <Animated.View style={[styles.sweep, { transform: [{ rotate }] }]} />
      <View style={styles.ringLarge} />
      <View style={styles.ringMid} />
      <View style={styles.ringInner} />
      <View style={styles.radarCore}>
        <Text style={styles.radarNumber}>10</Text>
        <Text style={styles.radarSuffix}>/13</Text>
        <Text style={styles.radarCaption}>SIGNALS RESOLVED</Text>
      </View>
      <View style={[styles.radarMarker, { top: 38, right: 52 }]}>
        <SignalMark severity="danger" />
        <Text style={styles.markerText}>01</Text>
      </View>
      <View style={[styles.radarMarker, { bottom: 34, left: 38 }]}>
        <SignalMark severity="warning" />
        <Text style={styles.markerText}>03</Text>
      </View>
    </View>
  );
}

export function ModuleStatus({ status }: { status: 'Active' | 'Permission needed' | 'Not configured' | 'Sample mode' }) {
  const severity: Severity = status === 'Active' ? 'safe' : status === 'Permission needed' ? 'warning' : 'info';
  return (
    <View style={styles.moduleStatus}>
      <SignalMark severity={severity} size={7} />
      <Text style={styles.moduleText}>{status}</Text>
    </View>
  );
}

export function severityColor(severity: Severity): string {
  return severity === 'safe' ? color.accent : severity === 'warning' ? color.warning : severity === 'danger' ? color.danger : color.muted;
}

const styles = StyleSheet.create({
  signal: { flexShrink: 0 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingHorizontal: 9, height: 27, borderWidth: 1, borderRadius: 3 },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  wave: { height: 57, flexDirection: 'row', alignItems: 'center', gap: 3, overflow: 'hidden' },
  bar: { width: 6, borderRadius: 1 },
  radarWrap: { width: 300, height: 300, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginVertical: 8 },
  outerTicks: { position: 'absolute', width: 290, height: 290, borderRadius: 145, borderWidth: 14, borderStyle: 'dashed', borderColor: '#405047' },
  sweep: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderTopWidth: 2, borderRightWidth: 2, borderColor: color.accent + 'AA' },
  ringLarge: { position: 'absolute', width: 244, height: 244, borderRadius: 122, borderWidth: 1, borderColor: '#415047' },
  ringMid: { position: 'absolute', width: 186, height: 186, borderRadius: 93, borderWidth: 1, borderColor: '#35443C' },
  ringInner: { position: 'absolute', width: 128, height: 128, borderRadius: 64, borderWidth: 1, borderColor: color.accent + '88', borderLeftColor: color.accent, borderLeftWidth: 4 },
  radarCore: { alignItems: 'center', justifyContent: 'center' },
  radarNumber: { fontSize: 44, letterSpacing: -2, color: color.text, fontWeight: '300', fontVariant: ['tabular-nums'] },
  radarSuffix: { position: 'absolute', top: 14, left: 55, fontSize: 16, color: color.muted, fontVariant: ['tabular-nums'] },
  radarCaption: { fontSize: 8, letterSpacing: 0.8, color: color.muted, marginTop: 1 },
  radarMarker: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: color.surface3, paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.md },
  markerText: { color: color.text, fontSize: 11, fontWeight: '700' },
  moduleStatus: { flexDirection: 'row', gap: 7, alignItems: 'center' },
  moduleText: { color: color.muted, fontSize: 11 },
});
