import React, { useState } from 'react';
import { Heart, Music, Clock, Plus, PlayCircle, Settings } from 'lucide-react';
import { usePlayerStore } from "@music-player/shared/stores";
import { SearchBar, SearchResults } from '../components/search';
import { PlaylistCard, CreatePlaylist } from '../components/playlist';
import { SongList } from '../components/music';
import { Button } from '../components/common';
import { APITestPanel } from '../components/api/APITestPanel';
import { getTestPlaylist, getTestSong } from '../data/mockSongs';

const HomePage: React.FC = () => {
  const { user, search, play, addToQueue } = usePlayerStore();
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showAPITest, setShowAPITest] = useState(false);
  
  const { favorites, playlists, recentPlayed } = user;

  // 测试功能
  const handleTestPlay = async () => {
    const testSong = getTestSong();
    try {
      await play(testSong);
    } catch (error) {
      console.error('测试播放失败:', error);
    }
  };

  const handleAddTestPlaylist = () => {
    const testSongs = getTestPlaylist();
    testSongs.forEach(song => addToQueue(song));
  };

  return (
    <div className="space-y-8">
      {/* Welcome section with search */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          发现你的音乐世界
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          搜索喜欢的音乐，创建专属播放列表，享受高品质的音乐体验
        </p>
        
        {/* 搜索栏 */}
        <div className="max-w-md mx-auto">
          <SearchBar />
        </div>

        {/* 测试功能按钮 */}
        <div className="flex justify-center space-x-4 mt-6">
          <Button
            onClick={handleTestPlay}
            variant="primary"
            size="sm"
            icon={<PlayCircle className="w-4 h-4" />}
          >
            测试播放
          </Button>
          <Button
            onClick={handleAddTestPlaylist}
            variant="secondary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
          >
            添加测试歌曲
          </Button>
          <Button
            onClick={() => setShowAPITest(!showAPITest)}
            variant={showAPITest ? "primary" : "secondary"}
            size="sm"
            icon={<Settings className="w-4 h-4" />}
          >
            {showAPITest ? '隐藏' : '显示'}API测试
          </Button>
        </div>
      </div>

      {/* API测试面板 */}
      {showAPITest && (
        <div className="mb-8">
          <APITestPanel />
        </div>
      )}

      {/* 搜索结果 */}
      {search.keyword && (search.results || search.isSearching) && (
        <div className="mb-8">
          {(() => {
            console.log('HomePage - 渲染搜索结果:', { 
              keyword: search.keyword, 
              results: search.results, 
              isSearching: search.isSearching 
            });
            return null;
          })()}
          <SearchResults />
        </div>
      )}

      {/* 我的音乐库 - 仅在无搜索结果时显示 */}
      {!search.keyword && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 我的收藏 */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              我的收藏 ({favorites.length})
            </h2>
          </div>
          
          {favorites.length > 0 ? (
            <SongList 
              songs={favorites.slice(0, 5)} 
              showIndex={false}
              className="bg-white dark:bg-gray-800 rounded-xl p-4"
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
              <Heart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                还没有收藏的音乐
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                收藏喜欢的歌曲，它们会出现在这里
              </p>
            </div>
          )}
        </div>

        {/* 快速操作 */}
        <div className="space-y-6">
          {/* 创建播放列表 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                创建播放列表
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                创建个性化的音乐播放列表
              </p>
              <Button
                onClick={() => setShowCreatePlaylist(true)}
                size="sm"
                className="w-full"
              >
                立即创建
              </Button>
            </div>
          </div>

          {/* 最近播放统计 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">音乐统计</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">收藏音乐</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {favorites.length} 首
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">创建歌单</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {playlists.length} 个
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">最近播放</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {recentPlayed.length} 首
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 我的歌单 */}
      {!search.keyword && playlists.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Music className="w-5 h-5 mr-2 text-primary-500" />
              我的歌单 ({playlists.length})
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {playlists.slice(0, 10).map((playlist) => (
              <PlaylistCard 
                key={playlist.id} 
                playlist={playlist}
                variant="card"
              />
            ))}
          </div>
        </div>
      )}

      {/* 最近播放 */}
      {!search.keyword && recentPlayed.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              最近播放
            </h2>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <SongList 
              songs={recentPlayed.slice(0, 10)} 
              showIndex={false}
              showHeader={false}
            />
          </div>
        </div>
      )}

      {/* 如果没有任何音乐内容，显示引导信息 */}
      {!search.keyword && favorites.length === 0 && playlists.length === 0 && recentPlayed.length === 0 && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-8 text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">开始你的音乐之旅</h2>
            <p className="text-primary-100 mb-6">
              这是一个基于React和TypeScript构建的现代音乐播放器。
              你可以搜索音乐、创建播放列表、收藏喜欢的歌曲，并享受高品质的播放体验。
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="secondary"
                className="bg-white text-primary-600 hover:bg-primary-50"
              >
                开始搜索
              </Button>
              <Button 
                variant="ghost"
                className="border border-white text-white hover:bg-white hover:text-primary-600"
                onClick={() => setShowCreatePlaylist(true)}
              >
                创建歌单
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Features showcase */}
      {!search.keyword && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">主要特性</h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">高品质音频播放</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">支持多种音频格式，提供清晰的音质体验</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">智能播放模式</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">支持顺序、随机、单曲循环等多种播放模式</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">响应式设计</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">完美适配桌面、平板和移动设备</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">深色模式</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">支持浅色和深色主题，保护你的眼睛</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">技术栈</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">⚛️</div>
              <div className="font-medium text-gray-900 dark:text-white">React 18</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">前端框架</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">🔷</div>
              <div className="font-medium text-gray-900 dark:text-white">TypeScript</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">类型安全</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">🎨</div>
              <div className="font-medium text-gray-900 dark:text-white">Tailwind CSS</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">样式框架</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-2xl mb-2">🐻</div>
              <div className="font-medium text-gray-900 dark:text-white">Zustand</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">状态管理</div>
            </div>
          </div>
        </div>
      </div>
      )}
      {/* 创建播放列表模态框 */}
      <CreatePlaylist
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
      />
    </div>
  );
};

export default HomePage;