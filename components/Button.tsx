import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, spacing, type } from '../constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'primary', disabled, style }: Props) {
  const containerStyle: ViewStyle = {
    ...styles.base,
    ...(variant === 'primary' && { backgroundColor: colors.accent }),
    ...(variant === 'secondary' && {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    }),
    ...(variant === 'ghost' && { backgroundColor: 'transparent' }),
    ...(variant === 'danger' && { backgroundColor: colors.danger }),
    ...(disabled && { opacity: 0.4 }),
    ...style,
  };

  const labelStyle: TextStyle = {
    ...type.bodyStrong,
    color:
      variant === 'primary' || variant === 'danger'
        ? '#fff'
        : variant === 'ghost'
        ? colors.accent
        : colors.text,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [containerStyle, pressed && !disabled && { opacity: 0.7 }]}
    >
      <Text style={labelStyle}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
