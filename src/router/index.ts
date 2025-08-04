import { lazy } from 'react';

// 页面组件懒加载
const HomePage = lazy(() => import('../pages/HomePage'));
const PlaylistDetailPage = lazy(() => import('../pages/PlaylistDetailPage'));
const LyricsPage = lazy(() => import('../pages/LyricsPage'));
const StatsPage = lazy(() => import('../pages/StatsPage'));
const RecentPage = lazy(() => import('../pages/RecentPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const LibraryPage = lazy(() => import('../pages/LibraryPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

// 路由配置类型
export interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  title: string;
  icon?: string;
  showInNavigation?: boolean;
  requireAuth?: boolean;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

// 统一的路由配置 - 适用于 Web 和 Mobile
export const routes: RouteConfig[] = [
  {
    path: '/',
    component: HomePage,
    title: '首页',
    icon: 'Home',
    showInNavigation: true
  },
  {
    path: '/library',
    component: LibraryPage,
    title: '我的音乐',
    icon: 'Library',
    showInNavigation: true,
    requireAuth: true
  },
  {
    path: '/search',
    component: SearchPage,
    title: '搜索',
    icon: 'Search',
    showInNavigation: true
  },
  {
    path: '/recent',
    component: RecentPage,
    title: '最近播放',
    icon: 'Clock',
    showInNavigation: true
  },
  {
    path: '/stats',
    component: StatsPage,
    title: '统计数据',
    icon: 'BarChart',
    showInNavigation: true
  },
  {
    path: '/settings',
    component: SettingsPage,
    title: '设置',
    icon: 'Settings',
    showInNavigation: true
  },
  {
    path: '/playlist/:playlistId',
    component: PlaylistDetailPage,
    title: '歌单详情',
    showInNavigation: false
  },
  {
    path: '/lyrics',
    component: LyricsPage,
    title: '歌词',
    showInNavigation: false
  }
];

// 导航菜单项配置
export const navigationItems = routes.filter(route => route.showInNavigation);

// 获取当前平台的路由
export const getPlatformRoutes = (platform: 'web' | 'mobile') => {
  return routes.filter(route => {
    if (platform === 'web' && route.mobileOnly) return false;
    if (platform === 'mobile' && route.desktopOnly) return false;
    return true;
  });
};

// 路由元数据
export const getRouteMetadata = (path: string) => {
  return routes.find(route => {
    if (route.path.includes(':')) {
      // 动态路由匹配
      const pattern = route.path.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    }
    return route.path === path;
  });
};