// Base colors that don't change between themes
export const BASE_COLORS = {
  primary: '#4F46E5',      // Azul principal
  secondary: '#06B6D4',    // Cyan
  accent: '#8B5CF6',       // Púrpura
  success: '#10B981',      // Verde
  warning: '#F59E0B',      // Amarillo
  error: '#EF4444',        // Rojo

  // Categorías (same in both themes)
  categories: {
    comida: '#FF6B6B',
    transporte: '#4ECDC4',
    entretenimiento: '#45B7D1',
    salud: '#96CEB4',
    compras: '#FECA57',
    servicios: '#FF9FF3',
    trabajo: '#54A0FF',
    otros: '#95A5A6'
  }
};

// Light theme colors
export const LIGHT_THEME = {
  ...BASE_COLORS,

  // Grises y neutrales
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Background y superficie
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceVariant: '#F3F4F6',
  cardBackground: '#FFFFFF',

  // Texto
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
};

// Dark theme colors
export const DARK_THEME = {
  ...BASE_COLORS,

  // Grises y neutrales (invertidos)
  gray50: '#111827',
  gray100: '#1F2937',
  gray200: '#374151',
  gray300: '#4B5563',
  gray400: '#6B7280',
  gray500: '#9CA3AF',
  gray600: '#D1D5DB',
  gray700: '#E5E7EB',
  gray800: '#F3F4F6',
  gray900: '#F9FAFB',

  // Background y superficie
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  cardBackground: '#1E293B',

  // Texto
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textLight: '#94A3B8',

  // Borders
  border: '#334155',
  borderLight: '#475569',
};

// Default export (will be replaced by theme context)
export const COLORS = LIGHT_THEME;

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};