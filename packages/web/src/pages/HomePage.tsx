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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Welcome section with search */}
        <div className="text-center py-16 relative">
          {/* 背景装饰 */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/4 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent mb-6">
                发现你的音乐世界
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                在这里搜索你喜欢的音乐，创建专属播放列表，享受无与伦比的高品质音乐体验
              </p>
            </div>
            
            {/* 搜索栏 */}
            <div className="max-w-lg mx-auto">
              <div className="relative">
                <SearchBar />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-blue-600 rounded-lg blur opacity-25 -z-10"></div>
              </div>
            </div>

            {/* 开发模式测试功能 */}
            {process.env.NODE_ENV === 'development' && (
              <details className="max-w-md mx-auto">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                  开发者工具
                </summary>
                <div className="flex justify-center space-x-3 mt-4">
                  <Button
                    onClick={handleTestPlay}
                    variant="secondary"
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
              </details>
            )}
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* 我的收藏 */}
            <div className="xl:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                  我的收藏
                  <span className="ml-2 text-sm font-normal bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">
                    {favorites.length}
                  </span>
                </h2>
              </div>
              
              {favorites.length > 0 ? (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                  <SongList 
                    songs={favorites.slice(0, 5)} 
                    showIndex={false}
                  />
                </div>
              ) : (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    还没有收藏的音乐
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    收藏你喜欢的歌曲，它们会出现在这里，让你随时回味美好的音乐时光
                  </p>
                </div>
              )}
            </div>

            {/* 快速操作和统计 */}
            <div className="space-y-6">
              {/* 创建播放列表 */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    创建播放列表
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                    创建个性化的音乐播放列表，组织你的音乐收藏
                  </p>
                  <Button
                    onClick={() => setShowCreatePlaylist(true)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0 shadow-lg"
                  >
                    立即创建
                  </Button>
                </div>
              </div>

              {/* 音乐统计 */}
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">音乐统计</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-400">收藏音乐</span>
                    <span className="font-bold text-lg bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                      {favorites.length} 首
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-400">创建歌单</span>
                    <span className="font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                      {playlists.length} 个
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-400">最近播放</span>
                    <span className="font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
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
          <div className="relative overflow-hidden bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-3xl p-12 text-white shadow-2xl">
            {/* 背景装饰 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
            </div>
            
            <div className="relative max-w-3xl mx-auto text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <Music className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">开始你的音乐之旅</h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                这是一个基于React和TypeScript构建的现代音乐播放器。
                你可以搜索音乐、创建播放列表、收藏喜欢的歌曲，并享受高品质的播放体验。
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button 
                  size="lg"
                  className="bg-white text-primary-600 hover:bg-white/90 border-0 shadow-lg px-8 py-3"
                >
                  开始搜索
                </Button>
                <Button 
                  size="lg"
                  variant="ghost"
                  className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3"
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
    </div>
  );
};

export default HomePage;