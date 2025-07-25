import React from 'react';
import { X, Play, Pause, Shuffle, Trash2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';
import type { Song } from '../../types';

interface QueueSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const QueueSidebar: React.FC<QueueSidebarProps> = ({ isOpen, onClose }) => {
  const {
    queue,
    player,
    play,
    pause,
    removeFromQueue,
    clearQueue,
    shuffleQueue,
    // moveInQueue
  } = usePlayerStore();

  const { currentSong, isPlaying } = player;
  const { songs, currentIndex } = queue;

  const handleSongClick = (song: Song) => {
    play(song);
  };

  const handleRemoveSong = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromQueue(index);
  };

  const handleClearQueue = () => {
    clearQueue();
  };

  const handleShuffleQueue = () => {
    shuffleQueue();
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (currentSong) {
      play(currentSong);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = songs.reduce((acc, song) => acc + song.duration, 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  return (
    <>
      {/* 背景遮罩 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 侧边栏 */}
      <div className={cn(
        "fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full",
        "lg:relative lg:translate-x-0"
      )}>
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              播放队列
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {songs.length} 首歌曲 • {totalMinutes} 分钟
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors lg:hidden"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-2 p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePlayPause}
            disabled={songs.length === 0}
            className={cn(
              "flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              songs.length > 0
                ? "bg-primary-500 hover:bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
            )}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>暂停</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>播放</span>
              </>
            )}
          </button>

          <button
            onClick={handleShuffleQueue}
            disabled={songs.length <= 1}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="随机播放"
          >
            <Shuffle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          <button
            onClick={handleClearQueue}
            disabled={songs.length === 0}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="清空队列"
          >
            <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 队列列表 */}
        <div className="flex-1 overflow-y-auto">
          {songs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                播放队列为空
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-1">
                添加一些歌曲开始播放
              </p>
            </div>
          ) : (
            <div className="py-2">
              {songs.map((song, index) => {
                const isCurrentSong = currentSong?.id === song.id && index === currentIndex;
                
                return (
                  <div
                    key={`${song.id}-${index}`}
                    className={cn(
                      "group flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors",
                      isCurrentSong && "bg-primary-50 dark:bg-primary-900/20"
                    )}
                    onClick={() => handleSongClick(song)}
                  >
                    {/* 序号/播放状态 */}
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center mr-3">
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
                        <span className={cn(
                          "text-sm text-gray-400 group-hover:hidden",
                          index < 9 ? `0${index + 1}` : String(index + 1)
                        )}>
                          {index + 1}
                        </span>
                      )}
                      
                      {!isCurrentSong && (
                        <button className="hidden group-hover:flex w-6 h-6 items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-primary-500 hover:text-white rounded-full transition-colors">
                          <Play className="w-3 h-3 ml-0.5" />
                        </button>
                      )}
                    </div>

                    {/* 歌曲信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-8 h-8 rounded object-cover mr-2"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAyMkMxOSA2IDIyIDE2IDE5IDE2QzE5IDE5IDE2IDIyIDE2IDIyWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className={cn(
                            "font-medium text-sm truncate",
                            isCurrentSong 
                              ? "text-primary-500" 
                              : "text-gray-900 dark:text-white"
                          )}>
                            {song.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {song.artist}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 时长和操作 */}
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {formatDuration(song.duration)}
                      </span>
                      
                      <button
                        onClick={(e) => handleRemoveSong(index, e)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-all"
                        title="从队列中移除"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QueueSidebar;