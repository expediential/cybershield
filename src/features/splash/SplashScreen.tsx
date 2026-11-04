import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SignalMark } from '../../brand/SignalMark';
import { AmbientBackdrop } from '../../components/QuietSignal';
import { useTheme } from '../../core/ThemeProvider';
import { motion, type } from '../../design/tokens';

/** Shown only while persisted app state is being read; it never delays navigation. */
export function SplashScreen() {
  const { theme, reducedMotion } = useTheme();
  const c = theme.colors;
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(reveal, { toValue: 1, duration: reducedMotion ? 0 : motion.deliberate, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, reveal]);

  const scale = reveal.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });
  return <View style={[styles.root, { backgroundColor: c.monitoringSurface }]}><AmbientBackdrop /><Animated.View style={[styles.content, { opacity: reveal, transform: [{ scale }] }]}><SignalMark size={68} inverse /><Text style={[styles.wordmark, { color: c.white }]}>Cyber<Text style={{ color: c.forest }}>Shield</Text></Text><Text style={[styles.subtitle, { color: c.monitoringMuted }]}>LOCAL SECURITY COMPANION</Text></Animated.View></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  content: { alignItems: 'center' },
  wordmark: { fontFamily: type.display, fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginTop: 18 },
  subtitle: { fontFamily: type.mono, fontSize: 9, letterSpacing: 1.15, marginTop: 8 },
});
