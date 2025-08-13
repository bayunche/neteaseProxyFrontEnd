import React, { useEffect, useState } from 'react';
import { Music, Heart, Clock, Plus, Grid, List } from 'lucide-react';
import { usePlayerStore } from '../stores';
import { cn } from '../utils/cn';
import SongList from '../components/music/SongList';
import PlaylistCard from '../components/playlist/PlaylistCard';
import type { Song } from '../types';

const LibraryPage: React.FC = () => {
  const {
    user,
    playAllSongs,
    createPlaylist,
    loadUserPlaylists,
    checkLoginStatus
  } = usePlayerStore();

  const [activeTab, setActiveTab] = useState('playlists');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const { isLoggedIn, playlists, favorites, recentPlayed } = user;

  const tabs = [
    { id: 'playlists', label: '歌单', icon: Music, count: playlists.length },
    { id: 'favorites', label: '我喜欢', icon: Heart, count: favorites.length },
    { id: 'recent', label: '最近播放', icon: Clock, count: recentPlayed.length }
  ];

  useEffect(() => {
    if (isLoggedIn) {
      loadUserPlaylists();
    }
  }, [isLoggedIn, loadUserPlaylists]);

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

            {playlists.length === 0 ? (
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
          onClick={checkLoginStatus}
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