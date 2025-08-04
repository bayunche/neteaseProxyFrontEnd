import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Heart, 
  Download, 
  Share2, 
  MoreHorizontal,
  Clock,
  User,
  Calendar,
  Music2,
  Shuffle,
  ChevronLeft,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '../utils/cn';
import { usePlayerStore } from '../stores';
import { formatSongDuration, formatPlayCount } from '../services/api';
import { EnhancedPlaylistAPI } from '../services/api/PlaylistAPI.enhanced';
import VirtualizedSongList from '../components/music/VirtualizedSongList';
import type { Playlist, Song } from '../types';

interface PlaylistState {
  info: Omit<Playlist, 'songs'> | null;
  songs: Song[];
  totalSongs: number;
  hasMoreSongs: boolean;
  currentOffset: number;
}

const EnhancedPlaylistDetailPage: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  
  // 状态管理
  const [playlist, setPlaylist] = useState<PlaylistState>({
    info: null,
    songs: [],
    totalSongs: 0,
    hasMoreSongs: false,
    currentOffset: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    player,
    queue,
    user,
    play,
    pause,
    addToQueue,
    addToFavorites,
    removeFromFavorites,
    playAllSongs
  } = usePlayerStore();

  const { currentSong, isPlaying } = player;
  const { favorites } = user;

  // 加载歌单基本信息
  const loadPlaylistInfo = useCallback(async () => {
    if (!playlistId) {
      setError('歌单ID不存在');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const info = await EnhancedPlaylistAPI.getPlaylistInfo({ id: playlistId });
      
      setPlaylist(prev => ({
        ...prev,
        info,
        totalSongs: info.trackCount || 0
      }));
      
      // 加载第一页歌曲
      await loadSongs(0, 50);
      
    } catch (err) {
      console.error('加载歌单信息失败:', err);
      setError(err instanceof Error ? err.message : '加载歌单信息失败');
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  // 加载歌曲（分页）
  const loadSongs = useCallback(async (offset: number, limit: number) => {
    if (!playlistId) return;

    try {
      setLoadingMore(true);
      
      const response = await EnhancedPlaylistAPI.getPlaylistSongs({
        playlistId,
        offset,
        limit
      });

      setPlaylist(prev => {
        const newSongs = [...prev.songs];
        
        // 填充新数据到对应位置
        response.songs.forEach((song, index) => {
          newSongs[offset + index] = song;
        });

        return {
          ...prev,
          songs: newSongs,
          hasMoreSongs: response.hasMore,
          currentOffset: Math.max(prev.currentOffset, offset + response.songs.length)
        };
      });
      
    } catch (err) {
      console.error('加载歌曲失败:', err);
      // 不设置全局错误，避免影响已加载的内容
    } finally {
      setLoadingMore(false);
    }
  }, [playlistId]);

  // 处理加载更多
  const handleLoadMore = useCallback(async (startIndex: number, stopIndex: number) => {
    const pageSize = 50;
    const startPage = Math.floor(startIndex / pageSize);
    const offset = startPage * pageSize;
    
    // 检查是否已经加载过这个范围
    const needsLoading = playlist.songs.slice(offset, offset + pageSize)
      .some(song => !song);
    
    if (needsLoading && !loadingMore) {
      await loadSongs(offset, pageSize);
    }
  }, [playlist.songs, loadSongs, loadingMore]);

  // 初始化加载
  useEffect(() => {
    loadPlaylistInfo();
  }, [loadPlaylistInfo]);

  // 处理播放/暂停
  const handlePlayPause = useCallback(() => {
    if (!playlist.info || playlist.songs.length === 0) return;

    const currentPlaylistSong = playlist.songs.find(song => song?.id === currentSong?.id);
    
    if (currentPlaylistSong && isPlaying) {
      pause();
    } else {
      // 播放第一首可用歌曲
      const firstSong = playlist.songs.find(song => song);
      if (firstSong) {
        play(firstSong);
      }
    }
  }, [playlist, currentSong, isPlaying, play, pause]);

  // 处理歌曲点击
  const handleSongClick = useCallback((song: Song, index: number) => {
    play(song);
  }, [play]);

  // 处理播放全部
  const handlePlayAll = useCallback(async () => {
    if (!playlist.info || playlist.totalSongs === 0) return;
    
    try {
      setLoadingMore(true);
      
      // 获取所有歌曲（最多1000首）
      const allSongs = await EnhancedPlaylistAPI.getAllSongs(playlistId!, 1000);
      
      if (allSongs.length > 0) {
        await playAllSongs(allSongs);
      }
    } catch (error) {
      console.error('播放全部失败:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [playlist.info, playlist.totalSongs, playlistId, playAllSongs]);

  // 处理随机播放
  const handleShufflePlay = useCallback(async () => {
    if (!playlist.info || playlist.totalSongs === 0) return;
    
    try {
      setLoadingMore(true);
      
      const allSongs = await EnhancedPlaylistAPI.getAllSongs(playlistId!, 1000);
      
      if (allSongs.length > 0) {
        const shuffledSongs = [...allSongs].sort(() => Math.random() - 0.5);
        await playAllSongs(shuffledSongs);
      }
    } catch (error) {
      console.error('随机播放失败:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [playlist.info, playlist.totalSongs, playlistId, playAllSongs]);

  // 返回上一页
  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // 重试加载
  const handleRetry = useCallback(() => {
    EnhancedPlaylistAPI.clearCache(playlistId);
    loadPlaylistInfo();
  }, [playlistId, loadPlaylistInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载歌单信息中...</p>
        </div>
      </div>
    );
  }

  if (error || !playlist.info) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-center mb-6">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            加载失败
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || '歌单加载失败，请检查网络连接'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            返回
          </button>
          <button
            onClick={handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重试</span>
          </button>
        </div>
      </div>
    );
  }

  const totalDuration = playlist.songs
    .filter(song => song)
    .reduce((acc, song) => acc + song.duration, 0);
  const isCurrentPlaylist = playlist.songs.some(song => song?.id === currentSong?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 返回按钮 */}
      <button
        onClick={handleGoBack}
        className="mb-6 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        返回
      </button>

      {/* 歌单头部信息 */}
      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* 歌单封面 */}
        <div className="flex-shrink-0">
          <div className="relative group">
            <img
              src={playlist.info.coverUrl}
              alt={playlist.info.title}
              className="w-64 h-64 object-cover rounded-2xl shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjggMTkwQzE1NCA5NyAxOTAgMTI4IDE1NCAxMjhDMTU0IDE1NCAxMjggMTkwIDEyOCAxOTBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-2xl transition-all duration-300 flex items-center justify-center">
              <button
                onClick={handlePlayPause}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                  "opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100",
                  isCurrentPlaylist && isPlaying
                    ? "bg-white text-primary-500"
                    : "bg-primary-500 text-white"
                )}
              >
                {isCurrentPlaylist && isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 歌单信息 */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              歌单
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
              {playlist.info.title}
            </h1>
            
            {playlist.info.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-2xl leading-relaxed">
                {playlist.info.description}
              </p>
            )}

            {/* 歌单元数据 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {playlist.info.creator}
              </div>
              <div className="flex items-center">
                <Music2 className="w-4 h-4 mr-1" />
                {playlist.totalSongs} 首歌曲
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {Math.floor(totalDuration / 60000)} 分钟
              </div>
              {playlist.info.playCount && (
                <div className="flex items-center">
                  <Play className="w-4 h-4 mr-1" />
                  {formatPlayCount(playlist.info.playCount)} 播放
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {playlist.info.createdAt.toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayAll}
              disabled={playlist.totalSongs === 0 || loadingMore}
              className={cn(
                "px-8 py-3 rounded-full font-medium transition-all flex items-center",
                playlist.totalSongs > 0 && !loadingMore
                  ? "bg-primary-500 hover:bg-primary-600 text-white transform hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <Play className="w-5 h-5 mr-2" />
              {loadingMore ? '加载中...' : '播放全部'}
            </button>

            <button
              onClick={handleShufflePlay}
              disabled={playlist.totalSongs === 0 || loadingMore}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-500 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Shuffle className="w-5 h-5 mr-2" />
              随机播放
            </button>

            <button className="p-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-500 rounded-full transition-all">
              <Heart className="w-5 h-5" />
            </button>

            <button className="p-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-500 rounded-full transition-all">
              <Share2 className="w-5 h-5" />
            </button>

            <button className="p-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-500 rounded-full transition-all">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 虚拟化歌曲列表 */}
      <VirtualizedSongList
        songs={playlist.songs}
        totalCount={playlist.totalSongs}
        hasMore={playlist.hasMoreSongs}
        onLoadMore={handleLoadMore}
        onSongClick={handleSongClick}
        isLoading={loadingMore}
        height={600}
        className="shadow-lg"
      />
    </div>
  );
};

export default EnhancedPlaylistDetailPage;