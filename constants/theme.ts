export const colors = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EFE8',
  border: '#E5DFD3',
  text: '#1F1B16',
  textMuted: '#6B645A',
  textSubtle: '#9B948A',
  accent: '#2D5F3F',
  accentMuted: '#E6EFE9',
  again: '#B84A3F',
  hard: '#C67E3F',
  good: '#3F8B5F',
  easy: '#3F7AB8',
  danger: '#B84A3F',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, fontWeight: '600' as const },
  small: { fontSize: 14, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 1, textTransform: 'uppercase' as const },
} as const;
