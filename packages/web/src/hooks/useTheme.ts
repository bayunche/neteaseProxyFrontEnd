import { useEffect, useState } from 'react';
import { usePlayerStore } from "@music-player/shared/stores";

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeHook {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * 主题管理Hook
 */
export const useTheme = (): ThemeHook => {
  const { ui, setTheme: setStoreTheme } = usePlayerStore();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // 设置初始值
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // 监听变化
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 应用主题到DOM
  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = ui.theme === 'auto' ? systemTheme : ui.theme;
    
    if (effectiveTheme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }

    // 更新meta主题色
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', effectiveTheme === 'dark' ? '#0a0a0a' : '#ffffff');
    }
  }, [ui.theme, systemTheme]);

  const toggleTheme = () => {
    const currentTheme = ui.theme;
    const nextTheme: Theme = currentTheme === 'light' ? 'dark' : 
                            currentTheme === 'dark' ? 'auto' : 'light';
    setStoreTheme(nextTheme);
  };

  const isDark = ui.theme === 'auto' ? systemTheme === 'dark' : ui.theme === 'dark';

  return {
    theme: ui.theme,
    isDark,
    toggleTheme,
    setTheme: setStoreTheme
  };
};