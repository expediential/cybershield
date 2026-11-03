import { StyleSheet, View } from 'react-native';
import { useTheme } from '../core/ThemeProvider';

export function SignalMark({ size = 32, inverse = false }: { size?: number; inverse?: boolean }) {
  const { theme } = useTheme();
  const color = inverse ? theme.colors.signal : theme.colors.forest;
  const fill = inverse ? theme.colors.surface : theme.colors.surfaceMuted;
  const border = inverse ? theme.colors.signal : theme.colors.forest;
  const scale = size / 32;

  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: fill, borderColor: border }]}>
      <View style={[styles.aperture, { width: 18 * scale, height: 18 * scale, borderRadius: 6 * scale, borderColor: color }]}>
        <View style={[styles.beam, { width: 11 * scale, height: 3 * scale, borderRadius: 2 * scale, backgroundColor: color }]} />
      </View>
      <View style={[styles.node, styles.nodeA, { width: 4 * scale, height: 4 * scale, borderRadius: 2 * scale, backgroundColor: color }]} />
      <View style={[styles.node, styles.nodeB, { width: 4 * scale, height: 4 * scale, borderRadius: 2 * scale, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  aperture: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  beam: { transform: [{ rotate: '-45deg' }] },
  node: { position: 'absolute' },
  nodeA: { top: '17%', right: '17%' },
  nodeB: { bottom: '17%', left: '17%' },
});
