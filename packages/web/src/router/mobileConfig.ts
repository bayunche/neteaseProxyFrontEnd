import React from 'react';
import { getPlatformRoutes } from './index';

/**
 * Mobile平台路由配置
 * 为React Native准备，使用React Navigation
 * 此文件为框架代码，实际实现需要在React Native环境中完成
 */

// React Native路由配置接口
interface MobileRouteConfig {
  name: string;
  component: React.ComponentType;
  options?: {
    title?: string;
    headerShown?: boolean;
    tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
  };
}

/**
 * 将通用路由配置转换为React Navigation格式
 */
export const getMobileRouteConfig = (): MobileRouteConfig[] => {
  const mobileRoutes = getPlatformRoutes('mobile');
  
  return mobileRoutes.map(route => ({
    name: route.path === '/' ? 'Home' : route.path.replace('/', ''),
    component: route.component,
    options: {
      title: route.title,
      headerShown: !route.path.includes('lyrics'), // 歌词页面隐藏头部
      // tabBarIcon 在实际React Native项目中实现
    }
  }));
};

/**
 * Tab导航配置
 */
export const getTabRoutes = () => {
  return [
    { name: 'Home', title: '首页', icon: 'home' },
    { name: 'library', title: '我的音乐', icon: 'library-music' },
    { name: 'search', title: '搜索', icon: 'search' },
    { name: 'recent', title: '最近播放', icon: 'history' },
    { name: 'stats', title: '统计', icon: 'bar-chart' }
  ];
};

/**
 * 模态页面配置（全屏显示）
 */
export const getModalRoutes = () => {
  return [
    { name: 'lyrics', title: '歌词', component: 'LyricsPage' },
    { name: 'playlist', title: '歌单详情', component: 'PlaylistDetailPage' },
    { name: 'settings', title: '设置', component: 'SettingsPage' }
  ];
};