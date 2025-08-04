import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Heart, 
  Clock, 
  Music, 
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Library,
  Settings
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';
import { navigationItems } from '../../router';

// 图标映射
const iconMap = {
  Home,
  Search,
  Heart,
  Clock,
  Music,
  Library,
  BarChart: BarChart3,
  Settings
};

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ui, user, toggleSidebar, loadUserPlaylists } = usePlayerStore();
  const { sidebarCollapsed } = ui;
  const { playlists, isLoggedIn } = user;

  // 处理歌单点击 - 导航到歌单详情页面
  const handlePlaylistClick = (playlistId: string) => {
    console.log(`导航到歌单详情页面: ${playlistId}`);
    navigate(`/playlist/${playlistId}`);
  };

  // 登录状态变化时加载歌单
  useEffect(() => {
    if (isLoggedIn && playlists.length === 0) {
      loadUserPlaylists();
    }
  }, [isLoggedIn, loadUserPlaylists, playlists.length]);

  // 检查当前路径是否激活
  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-8rem)] bg-white dark:bg-gray-900',
          'border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-20',
          sidebarCollapsed ? 'w-16' : 'w-64',
          'max-md:hidden' // Hide on mobile, will use drawer instead
        )}
      >
        <div className="flex flex-col h-full">
          {/* Toggle button */}
          <div className="flex-shrink-0 flex justify-end p-2 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
          
          {/* Navigation - Fixed */}
          <div className="flex-shrink-0 px-2 py-4 border-b border-gray-200 dark:border-gray-700">
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const IconComponent = iconMap[item.icon as keyof typeof iconMap] || Home;
                const isActive = isActiveRoute(item.path);
                
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      className={cn(
                        'w-full flex items-center px-3 py-3 rounded-lg transition-colors text-left',
                        'hover:bg-gray-100 dark:hover:bg-gray-800',
                        isActive 
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      <IconComponent className="w-5 h-5 flex-shrink-0" />
                      {!sidebarCollapsed && (
                        <span className="ml-3 font-medium">{item.title}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
            
          {/* Playlists section - Scrollable */}
          {!sidebarCollapsed && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Playlists header - Fixed */}
              <div className="flex-shrink-0 px-2 py-4">
                <div className="flex items-center justify-between px-3 mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    我的歌单
                  </h3>
                  <div className="flex items-center space-x-1">
                    {isLoggedIn && (
                      <button
                        onClick={loadUserPlaylists}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        title="刷新歌单"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title="创建歌单"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Playlists content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-2 pb-4">
                {!isLoggedIn ? (
                  <div className="px-3 py-8 text-center">
                    <div className="text-gray-400 dark:text-gray-500">
                      <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium mb-1">登录后查看您的歌单</p>
                      <p className="text-xs">发现更多精彩音乐内容</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {playlists.map((playlist) => (
                      <div key={playlist.id}>
                        <button
                          onClick={() => handlePlaylistClick(playlist.id)}
                          className={cn(
                            'w-full flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 text-left group',
                            'hover:bg-gray-100 hover:shadow-sm dark:hover:bg-gray-800',
                            'text-gray-700 dark:text-gray-300',
                            'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
                          )}
                          title={`${playlist.title} - ${playlist.creator}`}
                        >
                          <div className="w-11 h-11 flex-shrink-0 mr-3 relative">
                            {playlist.coverUrl ? (
                              <img
                                src={playlist.coverUrl}
                                alt={playlist.title}
                                className="w-full h-full rounded-xl object-cover shadow-sm group-hover:shadow-md transition-shadow duration-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQiIGhlaWdodD0iNDQiIHZpZXdCb3g9IjAgMCA0NCA0NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ0IiBoZWlnaHQ9IjQ0IiBmaWxsPSIjRjNGNEY2IiByeD0iOCIvPgo8cGF0aCBkPSJNMjIgMzNDMjguNSAxNiAzMyAyMiAyOC41IDIyQzI4LjUgMjguNSAyMiAzMyAyMiAzM1oiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center shadow-sm">
                                <Music className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                            
                            {/* 播放指示器 */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                              <div className="w-6 h-6 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-sm">
                                <Music className="w-3 h-3 text-gray-700 dark:text-gray-300" />
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                              {playlist.title}
                            </p>
                            <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              <span className="truncate">
                                {playlist.trackCount !== undefined ? `${playlist.trackCount}首` : `${playlist.songs.length}首`}
                              </span>
                              {playlist.creator && (
                                <>
                                  <span className="mx-1">·</span>
                                  <span className="truncate">{playlist.creator}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* 右侧箭头 */}
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </button>
                      </div>
                    ))}
                    
                    {playlists.length === 0 && (
                      <div className="px-3 py-8 text-center">
                        <div className="text-gray-400 dark:text-gray-500">
                          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm font-medium mb-1">暂无歌单</p>
                          <p className="text-xs">点击上方 + 创建歌单</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
      
      {/* Mobile backdrop */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default Sidebar;