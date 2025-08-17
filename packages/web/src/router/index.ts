import { createLazyComponent, RoutePreloader } from '../utils/lazyload';

// 获取路由预加载器实例
const routePreloader = RoutePreloader.getInstance();

// 增强的页面组件懒加载 - 高优先级页面
const HomePage = createLazyComponent(
  () => import('../pages/HomePage'),
  { 
    preload: true, 
    priority: 'high', 
    chunkName: 'home-page',
    retryCount: 3 
  }
);

const SearchPage = createLazyComponent(
  () => import('../pages/SearchPage'),
  { 
    preload: true, 
    priority: 'high', 
    chunkName: 'search-page',
    retryCount: 3 
  }
);

// 中等优先级页面
const LibraryPage = createLazyComponent(
  () => import('../pages/LibraryPage'),
  { 
    preload: true, 
    priority: 'normal', 
    chunkName: 'library-page',
    retryCount: 2 
  }
);

const RecentPage = createLazyComponent(
  () => import('../pages/RecentPage'),
  { 
    preload: true, 
    priority: 'normal', 
    chunkName: 'recent-page',
    retryCount: 2 
  }
);

// 登录页面 - 高优先级
const LoginPage = createLazyComponent(
  () => import('../pages/Login'),
  { 
    preload: true,
    priority: 'high', 
    chunkName: 'login-page',
    retryCount: 3 
  }
);

// 低优先级页面
const PlaylistDetailPage = createLazyComponent(
  () => import('../pages/PlaylistDetailPage'),
  { 
    priority: 'low', 
    chunkName: 'playlist-detail-page',
    retryCount: 2 
  }
);

const LyricsPage = createLazyComponent(
  () => import('../pages/LyricsPage'),
  { 
    priority: 'low', 
    chunkName: 'lyrics-page',
    retryCount: 2 
  }
);

const StatsPage = createLazyComponent(
  () => import('../pages/StatsPage'),
  { 
    priority: 'low', 
    chunkName: 'stats-page',
    retryCount: 1 
  }
);

const SettingsPage = createLazyComponent(
  () => import('../pages/SettingsPage'),
  { 
    priority: 'low', 
    chunkName: 'settings-page',
    retryCount: 1 
  }
);

// 注册路由预加载器
routePreloader.registerRoute('/', HomePage.preload);
routePreloader.registerRoute('/search', SearchPage.preload);
routePreloader.registerRoute('/library', LibraryPage.preload);
routePreloader.registerRoute('/recent', RecentPage.preload);
routePreloader.registerRoute('/playlist', PlaylistDetailPage.preload);
routePreloader.registerRoute('/lyrics', LyricsPage.preload);
routePreloader.registerRoute('/stats', StatsPage.preload);
routePreloader.registerRoute('/settings', SettingsPage.preload);
routePreloader.registerRoute('/login', LoginPage.preload);

// 路由配置类型
export interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType>;
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
    path: '/login',
    component: LoginPage,
    title: '登录',
    showInNavigation: false,
    requireAuth: false
  },
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