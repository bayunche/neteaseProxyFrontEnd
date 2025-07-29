import React, { useEffect } from 'react';
import { Heart, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';

interface SongContentAreaProps {
  onScrollDetected: () => void;
}

const SongContentArea: React.FC<SongContentAreaProps> = ({ onScrollDetected }) => {
  const { 
    player, 
    lyrics,
    play, 
    pause, 
    next, 
    previous, 
    setVolume, 
    toggleMute,
    addToFavorites,
    removeFromFavorites,
    user,
    updateCurrentLyricLine,
    loadLyrics
  } = usePlayerStore();
  
  const { 
    currentSong, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    isMuted 
  } = player;

  const { current: currentLyrics, currentLineIndex } = lyrics;

  // 加载歌词
  useEffect(() => {
    if (currentSong) {
      loadLyrics(String(currentSong.id));
    }
  }, [currentSong, loadLyrics]);

  // 更新当前歌词行
  useEffect(() => {
    if (currentLyrics?.lines?.length > 0) {
      updateCurrentLyricLine(currentTime);
    }
  }, [currentTime, updateCurrentLyricLine, currentLyrics]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isFavorite = currentSong && user.favorites.some(song => song.id === currentSong.id);

  const handleToggleFavorite = () => {
    if (!currentSong) return;
    
    if (isFavorite) {
      removeFromFavorites(currentSong.id);
    } else {
      addToFavorites(currentSong);
    }
  };

  if (!currentSong) {
    return null;
  }

  return (
    <div 
      className="flex-1 flex flex-col bg-gradient-to-b from-primary-100 to-white dark:from-gray-800 dark:to-gray-900 overflow-auto"
      onScroll={onScrollDetected}
    >
      {/* Header */}
      <div className="flex items-center justify-end p-6 pb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleToggleFavorite}
            className={cn(
              'p-2 rounded-full transition-colors',
              isFavorite 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
            )}
          >
            <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Song Info */}
      <div className="flex flex-col items-center px-6 pb-8">
        <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-2xl mb-6">
          <img
            src={currentSong.coverUrl}
            alt={currentSong.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
          {currentSong.title}
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-4">
          {currentSong.artist}
        </p>
        
        {currentSong.album && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {typeof currentSong.album === 'string' ? currentSong.album : currentSong.album.name}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center space-x-6 mb-6">
          <button
            onClick={previous}
            className="p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <SkipBack className="w-6 h-6" />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="w-16 h-16 flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </button>
          
          <button
            onClick={next}
            className="p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
            {formatTime(currentTime)}
          </span>
          
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          
          <span className="text-sm text-gray-500 dark:text-gray-400 w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleMute}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          
          <div className="w-32">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
            {Math.round((isMuted ? 0 : volume) * 100)}
          </span>
        </div>
      </div>

      {/* Extra content to enable scroll */}
      <div className="px-6 pb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">歌曲信息</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">歌手</span>
              <span className="text-gray-900 dark:text-white">{currentSong.artist}</span>
            </div>
            {currentSong.album && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">专辑</span>
                <span className="text-gray-900 dark:text-white">{typeof currentSong.album === 'string' ? currentSong.album : currentSong.album.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">时长</span>
              <span className="text-gray-900 dark:text-white">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">当前歌词</h3>
          {currentLyrics && currentLyrics.lines && currentLyrics.lines.length > 0 && currentLineIndex >= 0 ? (
            <div className="space-y-3">
              <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className="text-lg font-medium text-primary-600 dark:text-primary-400 leading-relaxed">
                  {currentLyrics.lines[currentLineIndex]?.text}
                </p>
              </div>
              {/* 显示前后几句歌词 */}
              <div className="space-y-2">
                {currentLineIndex > 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center opacity-70">
                    {currentLyrics.lines[currentLineIndex - 1]?.text}
                  </p>
                )}
                {currentLineIndex < currentLyrics.lines.length - 1 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    即将播放：{currentLyrics.lines[currentLineIndex + 1]?.text}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Music2 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                暂无歌词信息
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                滚动此区域或等待3秒钟将自动切换到歌词显示界面
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongContentArea;