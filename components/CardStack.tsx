import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../constants/theme';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
};

export function CardStack({ size = 'md', style }: Props) {
  const dims = size === 'lg' ? { w: 160, h: 104 } : size === 'sm' ? { w: 100, h: 66 } : { w: 132, h: 86 };

  return (
    <View style={[styles.wrap, { width: dims.w + 32, height: dims.h + 32 }, style]}>
      <View style={[styles.card, styles.back, { width: dims.w, height: dims.h }]}>
        <View style={styles.line} />
        <View style={[styles.line, styles.lineShort]} />
      </View>
      <View style={[styles.card, styles.middle, { width: dims.w, height: dims.h }]}>
        <View style={styles.line} />
        <View style={[styles.line, styles.lineShort]} />
      </View>
      <View style={[styles.card, styles.front, { width: dims.w, height: dims.h }]}>
        <View style={[styles.wordBar]} />
        <View style={styles.line} />
        <View style={[styles.line, styles.lineShort]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  back: {
    transform: [{ rotate: '-6deg' }, { translateX: -14 }, { translateY: -6 }],
    backgroundColor: colors.surfaceMuted,
  },
  middle: {
    transform: [{ rotate: '4deg' }, { translateX: 12 }, { translateY: 2 }],
  },
  front: {
    transform: [{ rotate: '0deg' }],
  },
  wordBar: {
    width: 44,
    height: 10,
    backgroundColor: colors.accent,
    borderRadius: 5,
    marginBottom: 4,
  },
  line: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    width: '100%',
  },
  lineShort: {
    width: '60%',
  },
});
