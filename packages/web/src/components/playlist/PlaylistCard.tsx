import React from 'react';
import { Play, Music, Heart, MoreHorizontal, Lock } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from "@music-player/shared/stores";
import type { Playlist } from "@music-player/shared/types";

interface PlaylistCardProps {
  playlist: Playlist;
  variant?: 'card' | 'compact';
  showCreator?: boolean;
  showSongCount?: boolean;
  className?: string;
  onClick?: (playlist: Playlist) => void;
  onPlay?: (playlist: Playlist) => void;
  onAddToFavorites?: (playlist: Playlist) => void;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  variant = 'card',
  showCreator = true,
  showSongCount = true,
  className,
  onClick,
  onPlay,
  onAddToFavorites
}) => {
  const { play, addToQueue } = usePlayerStore();

  const handleClick = () => {
    onClick?.(playlist);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(playlist);
    } else if (playlist.songs.length > 0) {
      // 播放播放列表的第一首歌曲，并将其他歌曲添加到队列
      play(playlist.songs[0]);
      playlist.songs.slice(1).forEach(song => {
        addToQueue(song);
      });
    }
  };

  const handleAddToFavorites = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToFavorites?.(playlist);
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer",
          className
        )}
      >
        {/* 播放列表封面 */}
        <div className="relative flex-shrink-0 mr-3">
          {playlist.coverUrl ? (
            <img
              src={playlist.coverUrl}
              alt={playlist.title}
              className="w-12 h-12 rounded-lg object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMyOCA4IDM2IDI0IDI4IDI0QzI4IDI4IDI0IDM2IDI0IDM2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-gray-400" />
            </div>
          )}
          
          {/* 播放按钮 */}
          {playlist.songs.length > 0 && (
            <button
              onClick={handlePlay}
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all duration-300"
            >
              <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300">
                <Play className="w-3 h-3 ml-0.5" />
              </div>
            </button>
          )}
        </div>

        {/* 播放列表信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {playlist.title}
            </h3>
            {!playlist.isPublic && (
              <Lock className="w-3 h-3 text-gray-400 ml-1 flex-shrink-0" />
            )}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {[
              showCreator && playlist.creator,
              showSongCount && `${playlist.songs.length}首`
            ].filter(Boolean).join(' • ')}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddToFavorites}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="收藏播放列表"
          >
            <Heart className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden",
        className
      )}
    >
      {/* 播放列表封面 */}
      <div className="relative aspect-square">
        {playlist.coverUrl ? (
          <img
            src={playlist.coverUrl}
            alt={playlist.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTQwQzEyMCAyMCAxNDAgMTAwIDEyMCAxMDBDMTIwIDEyMCAxMDAgMTQwIDEwMCAxNDBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Music className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* 播放按钮覆盖层 */}
        {playlist.songs.length > 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <button
              onClick={handlePlay}
              className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-primary-600"
            >
              <Play className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        )}

        {/* 私密播放列表标识 */}
        {!playlist.isPublic && (
          <div className="absolute top-2 left-2">
            <div className="bg-black bg-opacity-50 rounded-full p-1">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddToFavorites}
            className="p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all"
            title="收藏播放列表"
          >
            <Heart className="w-3 h-3 text-white" />
          </button>
          <button className="p-1.5 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all">
            <MoreHorizontal className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>

      {/* 播放列表信息 */}
      <div className="p-4">
        <div className="flex items-center mb-1">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {playlist.title}
          </h3>
          {!playlist.isPublic && (
            <Lock className="w-3 h-3 text-gray-400 ml-1 flex-shrink-0" />
          )}
        </div>
        
        {playlist.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {playlist.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          {showCreator && (
            <span className="truncate">{playlist.creator}</span>
          )}
          {showSongCount && (
            <span className="flex-shrink-0">
              {playlist.songs.length} 首
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;