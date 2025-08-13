import { createStitches } from '@stitches/react';

export const {
  styled,
  css,
  globalCss,
  keyframes,
  getCssText,
  theme,
  createTheme,
  config,
} = createStitches({
  theme: {
    colors: {
      // 现代化主色调（替代网易云红色）
      primary50: '#fef2f2',
      primary100: '#fee2e2',
      primary200: '#fecaca',
      primary300: '#fca5a5',
      primary400: '#f87171',
      primary500: '#ef4444', // 现代红色主色调
      primary600: '#dc2626',
      primary700: '#b91c1c',
      primary800: '#991b1b',
      primary900: '#7f1d1d',

      // 毛玻璃效果专用色彩
      glassLight: 'rgba(255, 255, 255, 0.1)',
      glassMedium: 'rgba(255, 255, 255, 0.2)',
      glassHeavy: 'rgba(255, 255, 255, 0.3)',
      glassLightDark: 'rgba(0, 0, 0, 0.1)',
      glassMediumDark: 'rgba(0, 0, 0, 0.2)',
      glassHeavyDark: 'rgba(0, 0, 0, 0.3)',

      // 背景渐变
      backgroundLight: '#ffffff',
      backgroundDark: '#000000',
      backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      backgroundGradientAlt: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',

      // 中性色系
      gray50: '#f9fafb',
      gray100: '#f3f4f6',
      gray200: '#e5e7eb',
      gray300: '#d1d5db',
      gray400: '#9ca3af',
      gray500: '#6b7280',
      gray600: '#4b5563',
      gray700: '#374151',
      gray800: '#1f2937',
      gray900: '#111827',

      // 透明度变体
      white: '#ffffff',
      black: '#000000',
      transparent: 'transparent',

      // 语义化颜色
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    space: {
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
    },
    sizes: {
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      10: '2.5rem',
      12: '3rem',
      16: '4rem',
      20: '5rem',
      full: '100%',
    },
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fonts: {
      sans: 'PingFang SC, Microsoft YaHei, Helvetica Neue, Arial, sans-serif',
      mono: 'Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    letterSpacings: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
    },
    borderWidths: {
      0: '0px',
      1: '1px',
      2: '2px',
      4: '4px',
    },
    borderRadius: {
      none: '0px',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      glass: '0 8px 32px rgba(0, 0, 0, 0.1)',
      glassHeavy: '0 16px 64px rgba(0, 0, 0, 0.15)',
    },
    transitions: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  media: {
    bp1: '(min-width: 520px)',
    bp2: '(min-width: 768px)',
    bp3: '(min-width: 1024px)',
    bp4: '(min-width: 1280px)',
    motion: '(prefers-reduced-motion: no-preference)',
    hover: '(hover: hover)',
    dark: '(prefers-color-scheme: dark)',
  },
  utils: {
    // 边距和内边距快捷方式
    p: (value: string | number) => ({
      padding: value,
    }),
    pt: (value: string | number) => ({
      paddingTop: value,
    }),
    pr: (value: string | number) => ({
      paddingRight: value,
    }),
    pb: (value: string | number) => ({
      paddingBottom: value,
    }),
    pl: (value: string | number) => ({
      paddingLeft: value,
    }),
    px: (value: string | number) => ({
      paddingLeft: value,
      paddingRight: value,
    }),
    py: (value: string | number) => ({
      paddingTop: value,
      paddingBottom: value,
    }),
    
    m: (value: string | number) => ({
      margin: value,
    }),
    mt: (value: string | number) => ({
      marginTop: value,
    }),
    mr: (value: string | number) => ({
      marginRight: value,
    }),
    mb: (value: string | number) => ({
      marginBottom: value,
    }),
    ml: (value: string | number) => ({
      marginLeft: value,
    }),
    mx: (value: string | number) => ({
      marginLeft: value,
      marginRight: value,
    }),
    my: (value: string | number) => ({
      marginTop: value,
      marginBottom: value,
    }),

    // 毛玻璃效果快捷方式
    glass: (intensity: 'light' | 'medium' | 'heavy') => {
      const backgrounds = {
        light: '$glassLight',
        medium: '$glassMedium',
        heavy: '$glassHeavy',
      };
      
      const blurs = {
        light: '10px',
        medium: '20px',
        heavy: '40px',
      };

      return {
        backgroundColor: backgrounds[intensity],
        backdropFilter: `blur(${blurs[intensity]})`,
        WebkitBackdropFilter: `blur(${blurs[intensity]})`,
        borderRadius: '$xl',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '$glass',
      };
    },

    // 渐变背景
    gradient: (direction: string = '135deg') => ({
      background: `linear-gradient(${direction}, $colors$primary500 0%, $colors$primary700 100%)`,
    }),
    
    // 尺寸快捷方式
    size: (value: string | number) => ({
      width: value,
      height: value,
    }),
  },
});

// 深色主题
export const darkTheme = createTheme('dark-theme', {
  colors: {
    // 深色模式下的毛玻璃效果
    glassLight: 'rgba(255, 255, 255, 0.05)',
    glassMedium: 'rgba(255, 255, 255, 0.1)',
    glassHeavy: 'rgba(255, 255, 255, 0.15)',
    
    // 深色模式背景
    backgroundLight: '#111827',
    backgroundDark: '#000000',
    backgroundGradient: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
  },
});

// 全局样式
export const globalStyles = globalCss({
  '*, *::before, *::after': {
    boxSizing: 'border-box',
  },
  
  body: {
    margin: 0,
    padding: 0,
    fontFamily: '$sans',
    fontSize: '$base',
    lineHeight: '$normal',
    color: '$gray900',
    backgroundColor: '$backgroundLight',
    background: '$backgroundGradient',
    minHeight: '100vh',
    '-webkit-font-smoothing': 'antialiased',
    '-moz-osx-font-smoothing': 'grayscale',
  },

  '#root': {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  // 滚动条样式
  '::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  
  '::-webkit-scrollbar-track': {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
  },
  
  '::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
  },

  // 深色模式滚动条
  '.dark-theme': {
    '::-webkit-scrollbar-track': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    
    '::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
      },
    },

    body: {
      color: '$gray100',
      backgroundColor: '$backgroundDark',
    },
  },
});