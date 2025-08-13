import React, { useEffect, useRef } from 'react';
import { Music2, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';
import { formatSongDuration } from '../../services/api';

interface LyricsPanelProps {
  className?: string;
}

const LyricsPanel: React.FC<LyricsPanelProps> = ({ className }) => {
  const { 
    player, 
    lyrics, 
    updateCurrentLyricLine 
  } = usePlayerStore();
  
  const { currentSong, currentTime, isPlaying } = player;
  const { current: currentLyrics, currentLineIndex, isLoading, error } = lyrics;
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);

  // 更新当前歌词行
  useEffect(() => {
    if (isPlaying && currentTime > 0) {
      updateCurrentLyricLine(currentTime);
    }
  }, [currentTime, isPlaying, updateCurrentLyricLine]);

  // 自动滚动到当前歌词行
  useEffect(() => {
    if (currentLineRef.current && scrollContainerRef.current && currentLineIndex >= 0) {
      const container = scrollContainerRef.current;
      const currentLine = currentLineRef.current;
      
      const containerHeight = container.clientHeight;
      const lineOffsetTop = currentLine.offsetTop;
      const lineHeight = currentLine.clientHeight;
      
      // 计算滚动位置，让当前行显示在容器中央
      const scrollTo = lineOffsetTop - containerHeight / 2 + lineHeight / 2;
      
      container.scrollTo({
        top: Math.max(0, scrollTo),
        behavior: 'smooth'
      });
    }
  }, [currentLineIndex]);

  // 如果没有当前歌曲
  if (!currentSong) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full text-gray-400", className)}>
        <Music2 className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">暂无播放歌曲</p>
        <p className="text-sm">选择一首歌曲开始播放</p>
      </div>
    );
  }

  // 加载中状态
  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full text-gray-400", className)}>
        <Loader2 className="w-8 h-8 mb-4 animate-spin" />
        <p className="text-sm">正在加载歌词...</p>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full text-gray-400", className)}>
        <AlertCircle className="w-12 h-12 mb-4 text-red-400" />
        <p className="text-lg font-medium mb-2 text-red-400">歌词加载失败</p>
        <p className="text-sm text-center max-w-xs">{error}</p>
      </div>
    );
  }

  // 无歌词状态
  if (!currentLyrics || !currentLyrics.lines.length) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full text-gray-400", className)}>
        <Music2 className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">暂无歌词</p>
        <p className="text-sm text-center">
          《{currentSong.title}》
          <br />
          {currentSong.artist}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 歌曲信息 */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <img
            src={currentSong.coverUrl}
            alt={currentSong.title}
            className="w-16 h-16 rounded-lg object-cover shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiA0OEM0MCAyNCA0OCAzMiA0MCAzMkM0MCA0MCAzMiA0OCAzMiA0OFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
            }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {currentSong.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {currentSong.artist}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {formatSongDuration(player.currentTime * 1000)} / {formatSongDuration(player.duration * 1000)}
            </p>
          </div>
        </div>
      </div>

      {/* 歌词内容 */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
      >
        {currentLyrics.lines.map((line, index) => {
          const isCurrentLine = index === currentLineIndex;
          const isPastLine = index < currentLineIndex;
          const isFutureLine = index > currentLineIndex;
          
          return (
            <div
              key={index}
              ref={isCurrentLine ? currentLineRef : undefined}
              className={cn(
                "text-center leading-relaxed transition-all duration-300 cursor-pointer hover:text-primary-500",
                isCurrentLine && "text-primary-500 font-semibold text-xl transform scale-105",
                isPastLine && "text-gray-400 dark:text-gray-500 text-lg",
                isFutureLine && "text-gray-600 dark:text-gray-400 text-lg"
              )}
              onClick={() => {
                // 点击歌词行跳转到对应时间
                const targetTime = line.time / 1000;
                usePlayerStore.getState().seek(targetTime);
              }}
            >
              <p className="mx-auto max-w-2xl">
                {line.text}
              </p>
              {isCurrentLine && (
                <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  {formatSongDuration(line.time)}
                </div>
              )}
            </div>
          );
        })}
        
        {/* 底部留白 */}
        <div className="h-32"></div>
      </div>
    </div>
  );
};

export default LyricsPanel;