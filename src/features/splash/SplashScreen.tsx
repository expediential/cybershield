import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SignalMark } from '../../brand/SignalMark';
import { AmbientBackdrop } from '../../components/QuietSignal';
import { useTheme } from '../../core/ThemeProvider';
import { type } from '../../design/tokens';

/** A brief, deliberate launch handoff before the persisted workspace is shown. */
export function SplashScreen() {
  const { theme, reducedMotion } = useTheme();
  const c = theme.colors;
  const mark = useRef(new Animated.Value(0)).current;
  const greeting = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    if (reducedMotion) { mark.setValue(1); greeting.setValue(1); pulse.setValue(0.7); return; }
    const enter = Animated.sequence([
      Animated.timing(mark, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(greeting, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    const breathe = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.48, duration: 850, useNativeDriver: true }),
    ]));
    enter.start(); breathe.start();
    return () => { enter.stop(); breathe.stop(); };
  }, [greeting, mark, pulse, reducedMotion]);

  const markScale = mark.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const greetingY = greeting.interpolate({ inputRange: [0, 1], outputRange: [15, 0] });
  return <View style={[styles.root, { backgroundColor: c.monitoringSurface }]}>
    <AmbientBackdrop />
    <Animated.View pointerEvents="none" style={[styles.halo, { backgroundColor: c.signal, opacity: pulse, transform: [{ scale: markScale }] }]} />
    <Animated.View style={[styles.markGroup, { opacity: mark, transform: [{ scale: markScale }] }]}>
      <SignalMark size={70} inverse />
      <Text style={[styles.brand, { color: c.white }]}>Cyber<Text style={{ color: c.forest }}>Shield</Text></Text>
    </Animated.View>
    <Animated.View style={[styles.greetingGroup, { opacity: greeting, transform: [{ translateY: greetingY }] }]}>
      <Text style={[styles.greetingKicker, { color: c.monitoringMuted }]}>GOOD TO SEE YOU</Text>
      <Text style={[styles.greeting, { color: c.white }]}>Hello, James</Text>
      <Text style={[styles.detail, { color: c.signal }]}>Protection Centre is ready</Text>
    </Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  halo: { position: 'absolute', width: 205, height: 205, borderRadius: 104, opacity: 0.1 },
  markGroup: { alignItems: 'center', marginTop: -46 },
  brand: { fontFamily: type.display, fontSize: 28, fontWeight: '800', letterSpacing: -0.75, marginTop: 16 },
  greetingGroup: { position: 'absolute', bottom: 116, alignItems: 'center' },
  greetingKicker: { fontFamily: type.mono, fontSize: 9, letterSpacing: 1.1, fontWeight: '800' },
  greeting: { fontFamily: type.display, fontSize: 29, letterSpacing: -0.7, fontWeight: '800', marginTop: 8 },
  detail: { fontFamily: type.body, fontSize: 12, fontWeight: '700', marginTop: 5 },
});
