import React from 'react';
import { Play, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';
import type { Song } from '../../types';
import SongCard from './SongCard';

interface SongListProps {
  songs: Song[];
  title?: string;
  showHeader?: boolean;
  showIndex?: boolean;
  showAlbum?: boolean;
  showArtist?: boolean;
  variant?: 'list' | 'grid';
  onPlayAll?: () => void;
  onSongPlay?: (song: Song, index: number) => void;
  onSongAddToQueue?: (song: Song) => void;
  onSongAddToFavorites?: (song: Song) => void;
  className?: string;
  emptyState?: React.ReactNode;
}

const SongList: React.FC<SongListProps> = ({
  songs,
  title,
  showHeader = false,
  showIndex = true,
  showAlbum = true,
  showArtist = true,
  variant = 'list',
  onPlayAll,
  onSongPlay,
  onSongAddToQueue,
  onSongAddToFavorites,
  className,
  emptyState
}) => {
  const { addToQueue } = usePlayerStore();

  const handlePlayAll = () => {
    if (onPlayAll) {
      onPlayAll();
    } else if (songs.length > 0) {
      // 清空当前队列并添加所有歌曲
      songs.forEach((song, index) => {
        addToQueue(song, index);
      });
    }
  };

  if (songs.length === 0) {
    if (emptyState) {
      return <div className={className}>{emptyState}</div>;
    }
    
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <Play className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-center">暂无歌曲</p>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={className}>
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {songs.length > 0 && (
              <button
                onClick={handlePlayAll}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>播放全部</span>
              </button>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {songs.map((song, index) => (
            <SongCard
              key={`grid-${song.id}-${index}`}
              song={song}
              index={index}
              variant="grid"
              showIndex={showIndex}
              showAlbum={showAlbum}
              showArtist={showArtist}
              onPlay={(song) => onSongPlay?.(song, index)}
              onAddToQueue={onSongAddToQueue}
              onAddToFavorites={onSongAddToFavorites}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* 标题和播放全部按钮 */}
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          {songs.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>播放全部 ({songs.length})</span>
            </button>
          )}
        </div>
      )}

      {/* 列表头部 */}
      {showHeader && (
        <div className="flex items-center px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 mb-2">
          {showIndex && <div className="w-8 mr-3">#</div>}
          <div className="w-10 mr-3"></div> {/* 封面占位 */}
          <div className="flex-1">标题</div>
          {showAlbum && <div className="hidden md:block w-48 mr-4">专辑</div>}
          <div className="flex-shrink-0 w-16 text-center">
            <Clock className="w-4 h-4 inline" />
          </div>
          <div className="w-20"></div> {/* 操作按钮占位 */}
        </div>
      )}

      {/* 歌曲列表 */}
      <div className="space-y-1">
        {songs.map((song, index) => (
          <SongCard
            key={`list-${song.id}-${index}`}
            song={song}
            index={index}
            variant="list"
            showIndex={showIndex}
            showAlbum={showAlbum}
            showArtist={showArtist}
            onPlay={(song) => onSongPlay?.(song, index)}
            onAddToQueue={onSongAddToQueue}
            onAddToFavorites={onSongAddToFavorites}
          />
        ))}
      </div>

      {/* 歌曲统计 */}
      <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        共 {songs.length} 首歌曲
        {songs.length > 0 && (
          <span>
            {" • "}
            总时长 {Math.floor(songs.reduce((acc, song) => acc + song.duration, 0) / 60000)} 分钟
          </span>
        )}
      </div>
    </div>
  );
};

export default SongList;