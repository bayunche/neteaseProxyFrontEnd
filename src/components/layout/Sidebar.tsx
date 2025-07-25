import React from 'react';
import { 
  Home, 
  Search, 
  Heart, 
  Clock, 
  Music, 
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';

const Sidebar: React.FC = () => {
  const { ui, user, toggleSidebar } = usePlayerStore();
  const { sidebarCollapsed } = ui;
  const { playlists } = user;

  const navigationItems = [
    { id: 'home', label: '发现音乐', icon: Home, active: true },
    { id: 'search', label: '搜索', icon: Search },
    { id: 'favorites', label: '我的收藏', icon: Heart },
    { id: 'recent', label: '最近播放', icon: Clock },
  ];

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
          <div className="flex justify-end p-2">
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
          
          {/* Navigation */}
          <nav className="flex-1 px-2">
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={cn(
                      'w-full flex items-center px-3 py-3 rounded-lg transition-colors text-left',
                      'hover:bg-gray-100 dark:hover:bg-gray-800',
                      item.active 
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3 font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            
            {/* Playlists section */}
            {!sidebarCollapsed && (
              <div className="mt-8">
                <div className="flex items-center justify-between px-3 mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    我的歌单
                  </h3>
                  <button
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    title="创建歌单"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <ul className="space-y-1">
                  {playlists.map((playlist) => (
                    <li key={playlist.id}>
                      <button
                        className={cn(
                          'w-full flex items-center px-3 py-2 rounded-lg transition-colors text-left',
                          'hover:bg-gray-100 dark:hover:bg-gray-800',
                          'text-gray-700 dark:text-gray-300'
                        )}
                      >
                        <Music className="w-4 h-4 flex-shrink-0" />
                        <span className="ml-3 text-sm truncate">{playlist.title}</span>
                        <span className="ml-auto text-xs text-gray-400">
                          {playlist.songs.length}
                        </span>
                      </button>
                    </li>
                  ))}
                  
                  {playlists.length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
                      暂无歌单
                    </li>
                  )}
                </ul>
              </div>
            )}
          </nav>
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