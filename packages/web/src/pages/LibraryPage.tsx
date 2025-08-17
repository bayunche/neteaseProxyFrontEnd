import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Heart, Clock, Plus, Grid, List, RefreshCw, AlertCircle } from 'lucide-react';
import { usePlayerStore } from "@music-player/shared/stores";
import { cn } from '../utils/cn';
import SongList from '../components/music/SongList';
import PlaylistCard from '../components/playlist/PlaylistCard';
import type { Song } from "@music-player/shared/types";

const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    playAllSongs,
    createPlaylist,
    loadUserPlaylists,
    loadPlaylistDetail
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState('playlists');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isLoggedIn, playlists, favorites, recentPlayed } = user;

  const tabs = [
    { id: 'playlists', label: '歌单', icon: Music, count: playlists.length },
    { id: 'favorites', label: '我喜欢', icon: Heart, count: favorites.length },
    { id: 'recent', label: '最近播放', icon: Clock, count: recentPlayed.length }
  ];

  useEffect(() => {
    const loadPlaylistsWithStatus = async () => {
      if (isLoggedIn) {
        setIsLoading(true);
        setError(null);
        try {
          await loadUserPlaylists();
          console.log('用户歌单加载完成');
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : '加载歌单失败';
          setError(errorMessage);
          console.error('加载用户歌单失败:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPlaylistsWithStatus();
  }, [isLoggedIn, loadUserPlaylists]);

  // 当切换tab时的处理逻辑
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadTabData = async () => {
      try {
        switch (activeTab) {
          case 'playlists':
            // 歌单tab已经在登录时自动加载了
            break;
          case 'favorites':
            // 可以在这里添加收藏歌曲的刷新逻辑
            console.log('切换到收藏tab，当前收藏数量:', favorites.length);
            break;
          case 'recent':
            // 可以在这里添加最近播放的刷新逻辑
            console.log('切换到最近播放tab，当前播放记录:', recentPlayed.length);
            break;
        }
      } catch (error) {
        console.error('加载tab数据失败:', error);
      }
    };

    loadTabData();
  }, [activeTab, isLoggedIn, favorites.length, recentPlayed.length]);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateModal(false);
    }
  };

  const handlePlayAll = (songs: Song[]) => {
    if (songs.length > 0) {
      playAllSongs(songs);
    }
  };

  const handleRefresh = async () => {
    if (!isLoggedIn) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await loadUserPlaylists();
      console.log('手动刷新歌单完成');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新歌单失败';
      setError(errorMessage);
      console.error('手动刷新歌单失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaylistClick = async (playlist: { id: string; title: string; songs?: Song[] }) => {
    try {
      console.log('点击歌单，开始加载详情:', playlist.title);
      
      // 如果歌单还没有歌曲详情，自动加载
      if (!playlist.songs || playlist.songs.length === 0) {
        console.log('歌单暂无歌曲，正在加载详情...');
        const detailedPlaylist = await loadPlaylistDetail(playlist.id);
        if (detailedPlaylist) {
          console.log(`歌单详情加载完成: "${detailedPlaylist.title}", ${detailedPlaylist.songs.length}首歌曲`);
        }
      }
      
      // 导航到歌单详情页
      navigate(`/playlist/${playlist.id}`);
    } catch (error) {
      console.error('加载歌单详情失败:', error);
      // 即使加载失败也导航到歌单页，让用户知道发生了什么
      navigate(`/playlist/${playlist.id}`);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'playlists':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                我的歌单 ({playlists.length})
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                  <span>刷新</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>新建歌单</span>
                </button>
                <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 transition-colors',
                      viewMode === 'grid'
                        ? 'bg-primary-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 transition-colors',
                      viewMode === 'list'
                        ? 'bg-primary-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 错误显示 */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">加载失败</span>
                </div>
                <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-300 rounded text-sm transition-colors"
                >
                  重试
                </button>
              </div>
            )}

            {/* 加载状态 */}
            {isLoading && playlists.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <RefreshCw className="w-8 h-8 mb-4 animate-spin" />
                <p>正在加载歌单...</p>
              </div>
            )}

            {!isLoading && playlists.length === 0 && !error ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <Music className="w-16 h-16 mb-4 opacity-50" />
                <p className="mb-2">还没有创建任何歌单</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  创建第一个歌单
                </button>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                  : 'space-y-2'
              )}>
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    variant={viewMode === 'grid' ? 'card' : 'compact'}
                    onClick={handlePlaylistClick}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'favorites':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                我喜欢的音乐 ({favorites.length})
              </h2>
              {favorites.length > 0 && (
                <button
                  onClick={() => handlePlayAll(favorites)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  <Music className="w-4 h-4" />
                  <span>播放全部</span>
                </button>
              )}
            </div>

            {favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <Heart className="w-16 h-16 mb-4 opacity-50" />
                <p>还没有收藏任何歌曲</p>
                <p className="text-sm">点击歌曲旁的❤️来收藏喜欢的音乐</p>
              </div>
            ) : (
              <SongList songs={favorites} />
            )}
          </div>
        );

      case 'recent':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                最近播放 ({recentPlayed.length})
              </h2>
              {recentPlayed.length > 0 && (
                <button
                  onClick={() => handlePlayAll(recentPlayed)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  <Music className="w-4 h-4" />
                  <span>播放全部</span>
                </button>
              )}
            </div>

            {recentPlayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <Clock className="w-16 h-16 mb-4 opacity-50" />
                <p>还没有播放历史</p>
                <p className="text-sm">开始听音乐来建立播放记录</p>
              </div>
            ) : (
              <SongList songs={recentPlayed} />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <Music className="w-16 h-16 mb-4 opacity-50" />
        <p className="mb-4">请先登录以查看您的音乐库</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          登录
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 标签栏 */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={cn(
                'px-2 py-0.5 text-xs rounded-full',
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              )}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>

      {/* 创建歌单模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              创建新歌单
            </h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="输入歌单名称"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreatePlaylist();
                }
              }}
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;