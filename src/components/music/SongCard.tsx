import React from 'react';
import { Play, Pause, Heart, Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';
import type { Song } from '../../types';

interface SongCardProps {
  song: Song;
  index?: number;
  showIndex?: boolean;
  showAlbum?: boolean;
  showArtist?: boolean;
  variant?: 'list' | 'grid';
  className?: string;
  onPlay?: (song: Song) => void;
  onAddToQueue?: (song: Song) => void;
  onAddToFavorites?: (song: Song) => void;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  index,
  showIndex = false,
  showAlbum = true,
  showArtist = true,
  variant = 'list',
  className,
  onPlay,
  onAddToQueue,
  onAddToFavorites
}) => {
  const { 
    player,
    user,
    play,
    pause,
    addToQueue,
    addToFavorites,
    removeFromFavorites 
  } = usePlayerStore();

  const { currentSong, isPlaying } = player;
  const { favorites } = user;
  
  const isCurrentSong = currentSong?.id === song.id;
  const isFavorite = favorites.some(fav => fav.id === song.id);

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatArtistNames = (artists?: Array<{ name: string }>) => {
    return artists?.map(artist => artist.name).join(' / ') || '';
  };

  const getSongTitle = () => song.name || song.title || '未知歌曲';
  const getSongArtist = () => {
    if (song.artists && song.artists.length > 0) {
      return formatArtistNames(song.artists);
    }
    return song.artist || '未知艺术家';
  };
  const getSongAlbum = () => {
    if (typeof song.album === 'object' && song.album?.name) {
      return song.album.name;
    }
    return typeof song.album === 'string' ? song.album : '未知专辑';
  };
  const getSongCover = () => song.picUrl || song.coverUrl || (typeof song.album === 'object' ? song.album?.picUrl : undefined);

  const handlePlay = () => {
    if (onPlay) {
      onPlay(song);
    } else {
      if (isCurrentSong && isPlaying) {
        pause();
      } else {
        play(song);
      }
    }
  };

  const handleAddToQueue = () => {
    if (onAddToQueue) {
      onAddToQueue(song);
    } else {
      addToQueue(song);
    }
  };

  const handleToggleFavorite = () => {
    if (onAddToFavorites) {
      onAddToFavorites(song);
    } else {
      if (isFavorite) {
        removeFromFavorites(song.id);
      } else {
        addToFavorites(song);
      }
    }
  };

  if (variant === 'grid') {
    return (
      <div className={cn("group relative", className)}>
        <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
          {/* 封面图片 */}
          <div className="relative aspect-square">
            <img
              src={getSongCover()}
              alt={getSongTitle()}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzEyMCAyMCAxNDAgMTAwIDEyMCAxMDBDMTIwIDEyMCAxMDAgMTQwIDEwMCAxNDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
              }}
            />
            
            {/* 播放按钮覆盖层 */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <button
                onClick={handlePlay}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  "transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100",
                  isCurrentSong && isPlaying
                    ? "bg-white text-primary-500"
                    : "bg-primary-500 text-white"
                )}
              >
                {isCurrentSong && isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
            </div>

            {/* 当前播放指示器 */}
            {isCurrentSong && (
              <div className="absolute top-2 left-2">
                <div className="w-3 h-3 bg-primary-500 rounded-full">
                  {isPlaying && (
                    <div className="w-3 h-3 bg-primary-500 rounded-full animate-ping"></div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 歌曲信息 */}
          <div className="p-3">
            <div className="font-medium text-gray-900 dark:text-white truncate mb-1">
              {getSongTitle()}
            </div>
            {showArtist && (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1">
                {getSongArtist()}
              </div>
            )}
            {showAlbum && (
              <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {song.album}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleToggleFavorite}
              className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow transition-all"
              title={isFavorite ? "取消收藏" : "收藏"}
            >
              <Heart className={cn(
                "w-3 h-3",
                isFavorite ? "text-red-500 fill-current" : "text-gray-400"
              )} />
            </button>
            <button
              onClick={handleAddToQueue}
              className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:shadow transition-all"
              title="添加到播放队列"
            >
              <Plus className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List variant
  return (
    <div className={cn(
      "group flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors",
      isCurrentSong && "bg-primary-50 dark:bg-primary-900/20",
      className
    )}>
      {/* 序号/播放按钮 */}
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center mr-3">
        {showIndex && (
          <span className={cn(
            "text-sm group-hover:hidden",
            isCurrentSong ? "text-primary-500" : "text-gray-400"
          )}>
            {typeof index === 'number' ? (index + 1).toString().padStart(2, '0') : '—'}
          </span>
        )}
        <button
          onClick={handlePlay}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full transition-all",
            showIndex ? "hidden group-hover:flex" : "flex",
            isCurrentSong && isPlaying
              ? "bg-primary-100 dark:bg-primary-800 text-primary-500"
              : "bg-primary-500 hover:bg-primary-600 text-white"
          )}
        >
          {isCurrentSong && isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>
      </div>

      {/* 歌曲封面 */}
      <div className="flex-shrink-0 mr-3">
        <img
          src={getSongCover()}
          alt={song.title}
          className="w-10 h-10 rounded-md object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyOEMyNCA0IDI4IDIwIDI0IDIwQzI0IDI0IDIwIDI4IDIwIDI4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
          }}
        />
      </div>

      {/* 歌曲信息 */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium truncate",
          isCurrentSong ? "text-primary-500" : "text-gray-900 dark:text-white"
        )}>
          {getSongTitle()}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {[showArtist && getSongArtist(), showAlbum && getSongAlbum()].filter(Boolean).join(' • ')}
        </div>
      </div>

      {/* 时长 */}
      <div className="flex-shrink-0 text-sm text-gray-400 mr-4">
        {formatDuration(song.duration || 0)}
      </div>

      {/* 操作按钮 */}
      <div className="flex-shrink-0 flex items-center space-x-1">
        <button
          onClick={handleToggleFavorite}
          className={cn(
            "p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100",
            "hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
          title={isFavorite ? "取消收藏" : "收藏"}
        >
          <Heart className={cn(
            "w-4 h-4",
            isFavorite ? "text-red-500 fill-current" : "text-gray-400"
          )} />
        </button>
        <button
          onClick={handleAddToQueue}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="添加到播放队列"
        >
          <Plus className="w-4 h-4 text-gray-400" />
        </button>
        <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default SongCard;