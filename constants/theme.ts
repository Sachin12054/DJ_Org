export const Colors = {
  // Backgrounds
  background: '#0D0B14',
  surface: '#13112A',
  card: '#1A1735',
  cardAlt: '#211E3A',
  cardBorder: '#2D2850',

  // Brand
  primary: '#E94560',
  primaryDark: '#C73652',
  primaryLight: '#FF6B85',
  primaryGlow: 'rgba(233,69,96,0.15)',

  secondary: '#7B61FF',
  secondaryGlow: 'rgba(123,97,255,0.15)',

  accent: '#00D4FF',

  // Priority
  priorityHigh: '#FF4757',
  priorityHighBg: 'rgba(255,71,87,0.15)',
  priorityMedium: '#FFA502',
  priorityMediumBg: 'rgba(255,165,2,0.15)',
  priorityLow: '#2ED573',
  priorityLowBg: 'rgba(46,213,115,0.15)',

  // Status
  success: '#2ED573',
  successBg: 'rgba(46,213,115,0.12)',
  warning: '#FFA502',
  warningBg: 'rgba(255,165,2,0.12)',
  error: '#FF4757',
  errorBg: 'rgba(255,71,87,0.12)',

  // Text
  text: '#FFFFFF',
  textSecondary: '#9B97BA',
  textMuted: '#5C5880',
  textOnPrimary: '#FFFFFF',

  // Borders & Dividers
  border: '#252245',
  divider: '#1E1B35',

  // Overlay
  overlay: 'rgba(13,11,20,0.9)',
  modalBackground: 'rgba(13,11,20,0.85)',

  // Tab bar
  tabActive: '#E94560',
  tabInactive: '#5C5880',
  tabBackground: '#0F0D1E',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  primary: {
    shadowColor: '#E94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  secondary: {
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
};
