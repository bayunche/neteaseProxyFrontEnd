import React, { useState, useEffect } from 'react';
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
  Plus,
  ChevronLeft
} from 'lucide-react';
import { cn } from '../utils/cn';
import { usePlayerStore } from '../stores';
import { formatSongDuration, formatPlayCount } from '../services/api';
import type { Playlist, Song } from '../types';

const PlaylistDetailPage: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
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
    loadPlaylistDetail,
    playAllSongs
  } = usePlayerStore();

  const { currentSong, isPlaying } = player;
  const { favorites } = user;

  // 加载歌单详情
  useEffect(() => {
    const loadPlaylist = async () => {
      if (!playlistId) {
        setError('歌单ID不存在');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const playlistData = await loadPlaylistDetail(playlistId);
        
        if (playlistData) {
          setPlaylist(playlistData);
        } else {
          setError('歌单不存在或加载失败');
        }
      } catch (err) {
        console.error('加载歌单详情失败:', err);
        setError('加载歌单详情失败');
      } finally {
        setLoading(false);
      }
    };

    loadPlaylist();
  }, [playlistId, loadPlaylistDetail]);

  // 处理播放/暂停
  const handlePlayPause = () => {
    if (!playlist || playlist.songs.length === 0) return;

    const currentPlaylistSong = playlist.songs.find(song => song.id === currentSong?.id);
    
    if (currentPlaylistSong && isPlaying) {
      pause();
    } else {
      // 播放第一首歌曲
      play(playlist.songs[0]);
    }
  };

  // 处理歌曲点击
  const handleSongClick = (song: Song, index: number) => {
    play(song);
  };

  // 处理添加到收藏
  const handleToggleFavorite = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFavorite = favorites.some(fav => fav.id === song.id);
    
    if (isFavorite) {
      removeFromFavorites(song.id);
    } else {
      addToFavorites(song);
    }
  };

  // 处理添加到队列
  const handleAddToQueue = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(song);
  };

  // 处理播放全部
  const handlePlayAll = async () => {
    if (!playlist || playlist.songs.length === 0) return;
    await playAllSongs(playlist.songs);
  };

  // 处理随机播放
  const handleShufflePlay = async () => {
    if (!playlist || playlist.songs.length === 0) return;
    const shuffledSongs = [...playlist.songs].sort(() => Math.random() - 0.5);
    await playAllSongs(shuffledSongs);
  };

  // 返回上一页
  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-red-500 mb-4">
          <Music2 className="w-16 h-16 mx-auto mb-2 opacity-50" />
          <p className="text-lg font-medium">{error || '歌单加载失败'}</p>
        </div>
        <button
          onClick={handleGoBack}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  const totalDuration = playlist.songs.reduce((acc, song) => acc + song.duration, 0);
  const isCurrentPlaylist = playlist.songs.some(song => song.id === currentSong?.id);

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
              src={playlist.coverUrl}
              alt={playlist.title}
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
              {playlist.title}
            </h1>
            
            {playlist.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-2xl leading-relaxed">
                {playlist.description}
              </p>
            )}

            {/* 歌单元数据 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {playlist.creator}
              </div>
              <div className="flex items-center">
                <Music2 className="w-4 h-4 mr-1" />
                {playlist.songs.length} 首歌曲
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {Math.floor(totalDuration / 60000)} 分钟
              </div>
              {playlist.playCount && (
                <div className="flex items-center">
                  <Play className="w-4 h-4 mr-1" />
                  {formatPlayCount(playlist.playCount)} 播放
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {playlist.createdAt.toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayAll}
              disabled={playlist.songs.length === 0}
              className={cn(
                "px-8 py-3 rounded-full font-medium transition-all",
                playlist.songs.length > 0
                  ? "bg-primary-500 hover:bg-primary-600 text-white transform hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <Play className="w-5 h-5 mr-2 inline" />
              播放全部
            </button>

            <button
              onClick={handleShufflePlay}
              disabled={playlist.songs.length === 0}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-500 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shuffle className="w-5 h-5 mr-2 inline" />
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

      {/* 歌曲列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        {/* 列表头部 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="w-8 text-center">#</div>
            <div className="flex-1 ml-4">歌曲</div>
            <div className="w-32 text-right">时长</div>
            <div className="w-16"></div>
          </div>
        </div>

        {/* 歌曲列表 */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {playlist.songs.map((song, index) => {
            const isCurrentSong = currentSong?.id === song.id;
            const isFavorite = favorites.some(fav => fav.id === song.id);

            return (
              <div
                key={song.id}
                className={cn(
                  "group flex items-center px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors",
                  isCurrentSong && "bg-primary-50 dark:bg-primary-900/20"
                )}
                onClick={() => handleSongClick(song, index)}
              >
                {/* 序号/播放状态 */}
                <div className="w-8 flex items-center justify-center">
                  {isCurrentSong ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                      {isPlaying ? (
                        <div className="flex space-x-0.5">
                          <div className="w-0.5 h-4 bg-primary-500 animate-pulse"></div>
                          <div className="w-0.5 h-2 bg-primary-500 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-0.5 h-3 bg-primary-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      ) : (
                        <Play className="w-3 h-3 text-primary-500" />
                      )}
                    </div>
                  ) : (
                    <>
                      <span className={cn(
                        "text-sm text-gray-400 group-hover:hidden",
                        index < 9 ? 'w-4' : 'w-6'
                      )}>
                        {index + 1}
                      </span>
                      <button className="hidden group-hover:flex w-6 h-6 items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-primary-500 hover:text-white rounded-full transition-colors">
                        <Play className="w-3 h-3 ml-0.5" />
                      </button>
                    </>
                  )}
                </div>

                {/* 歌曲信息 */}
                <div className="flex-1 ml-4 min-w-0">
                  <div className="flex items-center">
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-12 h-12 rounded-lg object-cover mr-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMCAxOCAzNiAyNCAzMCAyNEMzMCAzMCAyNCAzNiAyNCAzNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className={cn(
                        "font-medium truncate",
                        isCurrentSong 
                          ? "text-primary-500" 
                          : "text-gray-900 dark:text-white"
                      )}>
                        {song.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {song.artist}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 时长 */}
                <div className="w-32 text-right">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatSongDuration(song.duration)}
                  </span>
                </div>

                {/* 操作按钮 */}
                <div className="w-16 flex items-center justify-end space-x-1">
                  <button
                    onClick={(e) => handleToggleFavorite(song, e)}
                    className={cn(
                      "p-2 rounded-full transition-all opacity-0 group-hover:opacity-100",
                      isFavorite
                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600"
                    )}
                    title={isFavorite ? "取消收藏" : "收藏"}
                  >
                    <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                  </button>

                  <button
                    onClick={(e) => handleAddToQueue(song, e)}
                    className="p-2 rounded-full text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100"
                    title="添加到队列"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {playlist.songs.length === 0 && (
          <div className="py-16 text-center">
            <Music2 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
              这个歌单还没有歌曲
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              添加一些歌曲来开始播放
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetailPage;