import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const theme = {
  colors: {
    // 主色调 - 现代红色
    primary: '#ef4444',
    primaryLight: '#f87171',
    primaryDark: '#dc2626',
    
    // 背景色
    background: '#0a0a0a',
    backgroundSecondary: '#1a1a1a',
    backgroundTertiary: '#2a2a2a',
    
    // 表面色
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceLight: 'rgba(255, 255, 255, 0.1)',
    surfaceHeavy: 'rgba(255, 255, 255, 0.15)',
    
    // 文本色
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.8)',
    textTertiary: 'rgba(255, 255, 255, 0.6)',
    textQuaternary: 'rgba(255, 255, 255, 0.4)',
    
    // 状态色
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // 边框色
    border: 'rgba(255, 255, 255, 0.1)',
    borderLight: 'rgba(255, 255, 255, 0.05)',
    
    // 阴影色
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowHeavy: 'rgba(0, 0, 0, 0.5)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
  },
  
  dimensions: {
    screen: {
      width,
      height,
    },
    bottomTabHeight: 80,
    bottomPlayerHeight: 80,
    headerHeight: 60,
  },
  
  animation: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      easeIn: 'cubic-bezier(0.55, 0.06, 0.68, 0.19)',
      easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
    },
  },
  
  // 毛玻璃效果预设
  blur: {
    light: {
      intensity: 20,
      tint: 'default' as const,
    },
    medium: {
      intensity: 50,
      tint: 'dark' as const,
    },
    heavy: {
      intensity: 100,
      tint: 'dark' as const,
    },
  },
} as const;

export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = typeof theme.spacing;