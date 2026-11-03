import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { color, radius } from '../design/tokens';
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

function useLoopingValue(enabled: boolean, duration: number) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) {
      value.stopAnimation();
      value.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(value, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [duration, enabled, value]);

  return value;
}

function SignalBar({ height, index, active }: { height: number; index: number; active: boolean }) {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0.45);
      return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.delay(index * 54),
      Animated.timing(pulse, { toValue: 1, duration: 520 + (index % 4) * 90, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.32, duration: 660 + (index % 3) * 110, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [active, index, pulse]);

  return <Animated.View style={[styles.bar, { height, opacity: pulse, backgroundColor: index % 5 === 0 ? color.accent : color.soft, transform: [{ scaleY: pulse }] }]} />;
}

export function Waveform({ active = true }: { active?: boolean }) {
  const bars = [15, 32, 19, 45, 22, 26, 16, 40, 18, 34, 25, 50, 19, 17, 38, 27, 47, 21, 32, 14, 28, 18, 36, 16];
  return <View style={styles.wave}>{bars.map((height, index) => <SignalBar key={index} height={height} index={index} active={active} />)}</View>;
}

export function TelemetryBackdrop({ active = true }: { active?: boolean }) {
  const drift = useLoopingValue(active, 12000);
  const counterDrift = useLoopingValue(active, 16000);
  const scanLine = drift.interpolate({ inputRange: [0, 1], outputRange: [-140, 210] });
  const orbit = drift.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const counterOrbit = counterDrift.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  return (
    <View pointerEvents="none" style={styles.telemetryBackdrop}>
      <Animated.View style={[styles.telemetryOrbitLarge, { transform: [{ rotate: orbit }] }]}><View style={styles.orbitNode} /></Animated.View>
      <Animated.View style={[styles.telemetryOrbitSmall, { transform: [{ rotate: counterOrbit }] }]}><View style={styles.orbitNodeSmall} /></Animated.View>
      <View style={styles.telemetryRingOne} />
      <View style={styles.telemetryRingTwo} />
      <View style={styles.telemetryArc} />
      <Animated.View style={[styles.telemetryScanLine, { transform: [{ translateY: scanLine }] }]} />
      <View style={styles.telemetryGridVertical} />
    </View>
  );
}

export function ScanRadar({ phase, progress }: { phase: 'idle' | 'scanning' | 'complete'; progress: number }) {
  const scanning = phase === 'scanning';
  const rotation = useLoopingValue(scanning, 3300);
  const pulse = useRef(new Animated.Value(0.68)).current;
  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  useEffect(() => {
    if (!scanning) {
      pulse.stopAnimation();
      pulse.setValue(phase === 'complete' ? 1 : 0.68);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.55, duration: 620, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [phase, pulse, scanning]);

  const headline = phase === 'scanning' ? 'ASSESSING' : phase === 'complete' ? 'REVIEW READY' : 'SYSTEM READY';
  const detail = phase === 'scanning' ? 'LOCAL CAPABILITY REVIEW' : phase === 'complete' ? 'LOCAL COVERAGE MAPPED' : 'TAP TO START REVIEW';

  return (
    <View style={styles.scanRadar}>
      <View style={styles.scanRadarTicks} />
      <Animated.View style={[styles.scanRadarSweep, { opacity: pulse, transform: [{ rotate }] }]} />
      <Animated.View style={[styles.scanRadarHalo, { opacity: pulse, transform: [{ scale: pulse }] }]} />
      <View style={styles.scanRadarRingOuter} />
      <View style={styles.scanRadarRingInner} />
      <View style={styles.scanRadarCore}>
        <Text style={styles.scanRadarNumber}>{phase === 'idle' ? '00' : String(progress).padStart(2, '0')}</Text>
        <Text style={styles.scanRadarPercent}>%</Text>
        <Text style={styles.scanRadarHeadline}>{headline}</Text>
        <Text style={styles.scanRadarDetail}>{detail}</Text>
      </View>
      <Animated.View style={[styles.scanNodeTop, { opacity: pulse }]}><SignalMark severity={phase === 'complete' ? 'safe' : 'info'} /><Text style={styles.scanNodeText}>URL</Text></Animated.View>
      <Animated.View style={[styles.scanNodeBottom, { opacity: pulse }]}><SignalMark severity="warning" /><Text style={styles.scanNodeText}>MODULES</Text></Animated.View>
    </View>
  );
}

export function RadialMonitor({ spin, isMonitoring = false }: { spin: Animated.Value; isMonitoring?: boolean }) {
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const pulse = useRef(new Animated.Value(isMonitoring ? 1 : 0.52)).current;

  useEffect(() => {
    if (!isMonitoring) {
      pulse.stopAnimation();
      pulse.setValue(0.52);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.45, duration: 940, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 940, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isMonitoring, pulse]);

  return (
    <View style={styles.radarWrap}>
      <View style={styles.outerTicks} />
      <Animated.View style={[styles.sweep, { opacity: pulse, transform: [{ rotate }] }]} />
      <View style={styles.ringLarge} />
      <View style={styles.ringMid} />
      <View style={styles.ringInner} />
      <View style={styles.radarCore}>
        <Text style={styles.radarNumber}>{isMonitoring ? '10' : '00'}</Text>
        <Text style={styles.radarSuffix}>/13</Text>
        <Text style={styles.radarCaption}>{isMonitoring ? 'SIGNALS RESOLVED' : 'AWAITING SESSION'}</Text>
      </View>
      <Animated.View style={[styles.radarMarker, { top: 38, right: 52, opacity: pulse }]}>
        <SignalMark severity="danger" />
        <Text style={styles.markerText}>01</Text>
      </Animated.View>
      <Animated.View style={[styles.radarMarker, { bottom: 34, left: 38, opacity: pulse }]}>
        <SignalMark severity="warning" />
        <Text style={styles.markerText}>03</Text>
      </Animated.View>
    </View>
  );
}

export function ModuleStatus({ status }: { status: 'Active' | 'Permission needed' | 'Not configured' | 'Sample mode' }) {
  const severity: Severity = status === 'Active' ? 'safe' : status === 'Permission needed' ? 'warning' : 'info';
  return <View style={styles.moduleStatus}><SignalMark severity={severity} size={7} /><Text style={styles.moduleText}>{status}</Text></View>;
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
  telemetryBackdrop: { ...StyleSheet.absoluteFill, overflow: 'hidden', opacity: 0.72 },
  telemetryOrbitLarge: { position: 'absolute', width: 330, height: 330, borderRadius: 165, borderWidth: 1, borderColor: '#315143', top: -126, right: -92, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 9 },
  telemetryOrbitSmall: { position: 'absolute', width: 218, height: 218, borderRadius: 109, borderWidth: 1, borderColor: '#244436', left: -108, bottom: -93, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 8 },
  orbitNode: { width: 7, height: 7, borderRadius: 4, backgroundColor: color.accent, shadowColor: color.accent, shadowOpacity: 0.85, shadowRadius: 8, elevation: 4 },
  orbitNodeSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: color.warning },
  telemetryRingOne: { position: 'absolute', width: 290, height: 290, borderRadius: 145, borderWidth: 1, borderColor: '#173D2E', right: -150, top: 24 },
  telemetryRingTwo: { position: 'absolute', width: 192, height: 192, borderRadius: 96, borderWidth: 1, borderStyle: 'dashed', borderColor: '#2C5845', right: -96, top: 73 },
  telemetryArc: { position: 'absolute', width: 470, height: 224, borderRadius: 235, borderTopWidth: 1, borderColor: '#426D58', bottom: -104, left: -64 },
  telemetryScanLine: { position: 'absolute', height: 1, left: 0, right: 0, backgroundColor: color.accent + '77', shadowColor: color.accent, shadowOpacity: 0.85, shadowRadius: 5 },
  telemetryGridVertical: { position: 'absolute', top: 0, bottom: 0, right: '26%', width: 1, backgroundColor: '#234332' },
  scanRadar: { width: 244, height: 244, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginTop: 3 },
  scanRadarTicks: { position: 'absolute', width: 234, height: 234, borderRadius: 117, borderWidth: 10, borderStyle: 'dashed', borderColor: '#466254' },
  scanRadarSweep: { position: 'absolute', width: 186, height: 186, borderRadius: 93, borderTopWidth: 2, borderRightWidth: 2, borderColor: color.accent },
  scanRadarHalo: { position: 'absolute', width: 142, height: 142, borderRadius: 71, borderWidth: 1, borderColor: color.accent + '88' },
  scanRadarRingOuter: { position: 'absolute', width: 198, height: 198, borderRadius: 99, borderWidth: 1, borderColor: '#355547' },
  scanRadarRingInner: { position: 'absolute', width: 122, height: 122, borderRadius: 61, borderWidth: 1, borderColor: color.accent + '99', borderLeftColor: color.accent, borderLeftWidth: 4 },
  scanRadarCore: { alignItems: 'center', justifyContent: 'center' },
  scanRadarNumber: { color: color.text, fontSize: 42, fontWeight: '300', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  scanRadarPercent: { position: 'absolute', top: 10, left: 49, color: color.muted, fontSize: 14, fontWeight: '700' },
  scanRadarHeadline: { color: color.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.15, marginTop: 2 },
  scanRadarDetail: { color: color.muted, fontSize: 7, letterSpacing: 0.55, marginTop: 5 },
  scanNodeTop: { position: 'absolute', top: 15, right: 19, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 5, borderRadius: radius.md, backgroundColor: color.surface3 },
  scanNodeBottom: { position: 'absolute', bottom: 15, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 5, borderRadius: radius.md, backgroundColor: color.surface3 },
  scanNodeText: { color: color.text, fontSize: 8, letterSpacing: 0.5, fontWeight: '800' },
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
