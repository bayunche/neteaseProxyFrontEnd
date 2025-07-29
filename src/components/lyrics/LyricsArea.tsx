import React, { useEffect, useRef, useState } from 'react';
import { Volume2, RotateCcw, ArrowUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';

interface LyricsAreaProps {
  onReturnToSongContent: () => void;
  onScrollToTop: () => void;
}

const LyricsArea: React.FC<LyricsAreaProps> = ({ onReturnToSongContent, onScrollToTop }) => {
  const { 
    player, 
    lyrics,
    updateCurrentLyricLine,
    loadLyrics
  } = usePlayerStore();
  
  const { 
    currentSong, 
    currentTime
  } = player;

  const { current: currentLyrics, currentLineIndex } = lyrics;
  
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [userScrolling, setUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const isAutoScrolling = useRef(false);

  // 当歌曲变化时加载歌词
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

  // 监听滚动到顶部事件
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isAutoScrolling.current) return;
      
      // 检查是否滚动到顶部
      if (container.scrollTop <= 10) {
        onScrollToTop();
        return;
      }
      
      setUserScrolling(true);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setUserScrolling(false);
      }, 3000);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [onScrollToTop]);

  // 网易云风格的歌词滚动
  useEffect(() => {
    if (userScrolling) return;
    
    const container = lyricsContainerRef.current;
    
    if (!container || !currentLyrics?.lines?.length || currentLineIndex === -1 || currentLineIndex >= currentLyrics.lines.length) {
      return;
    }

    const scrollToActiveLine = () => {
      const activeLine = lyricRefs.current[currentLineIndex];
      
      if (!activeLine) {
        setTimeout(scrollToActiveLine, 100);
        return;
      }

      const containerHeight = container.clientHeight;
      const lineOffsetTop = activeLine.offsetTop;
      
      // 网易云风格：将当前歌词行滚动到视口中央位置
      const targetScrollTop = lineOffsetTop - containerHeight / 2 + activeLine.clientHeight / 2;
      const maxScrollTop = container.scrollHeight - containerHeight;
      const finalScrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));
      
      isAutoScrolling.current = true;
      
      // 使用更平滑的滚动动画
      container.scrollTo({
        top: finalScrollTop,
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 1000);
    };

    // 立即执行滚动，不延迟
    scrollToActiveLine();
  }, [currentLineIndex, userScrolling, currentLyrics]);

  const handleScrollToCurrentLine = () => {
    setUserScrolling(false);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };

  if (!currentSong) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* 背景装饰效果 */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 via-transparent to-primary-500/5 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/30 to-transparent"></div>
      {/* Header with return button */}
      <div className="flex items-center justify-between p-6 pb-4">
        <button
          onClick={onReturnToSongContent}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/10"
        >
          <ArrowUp className="w-5 h-5" />
          <span>返回歌曲信息</span>
        </button>
        
        {/* Scroll indicators */}
        {userScrolling && (
          <div className="flex items-center space-x-3">
            <div className="bg-black/50 backdrop-blur-sm border border-white/10 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span>手动浏览模式</span>
            </div>
            <button
              onClick={handleScrollToCurrentLine}
              className="bg-primary-500/80 hover:bg-primary-500 backdrop-blur-sm text-white p-2 rounded-lg transition-colors border border-white/10"
              title="返回当前播放位置"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Lyrics content */}
      <div className="flex-1 relative">
        <div 
          ref={lyricsContainerRef}
          className="h-full overflow-y-auto px-6 pb-6"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            willChange: 'scroll-position'
          }}
        >
          {currentLyrics && currentLyrics.lines && currentLyrics.lines.length > 0 ? (
            <div className="max-w-4xl mx-auto">
              {/* 顶部占位，确保第一句歌词可以滚动到中央 */}
              <div className="h-96"></div>
              
              {currentLyrics.lines.map((line, index) => {
                const isCurrentLine = index === currentLineIndex;
                const distanceFromCurrent = Math.abs(index - currentLineIndex);
                
                return (
                  <div
                    key={index}
                    data-lyric-index={index}
                    ref={(el) => {
                      lyricRefs.current[index] = el;
                    }}
                    className={cn(
                      'text-center py-6 px-6 transition-all duration-500 ease-out cursor-pointer relative',
                      'min-h-[80px] flex items-center justify-center',
                      // 网易云风格的文字大小和透明度变化
                      isCurrentLine 
                        ? 'text-3xl font-bold text-white drop-shadow-lg transform scale-105' 
                        : distanceFromCurrent === 1
                        ? 'text-xl text-white/80 font-medium'
                        : distanceFromCurrent === 2
                        ? 'text-lg text-white/60'
                        : distanceFromCurrent <= 3
                        ? 'text-base text-white/40'
                        : 'text-sm text-white/20'
                    )}
                    style={{
                      // 添加渐变效果，让歌词更有层次感
                      textShadow: isCurrentLine ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    }}
                    onClick={() => {
                      const { seek } = usePlayerStore.getState();
                      seek(line.time / 1000);
                      setUserScrolling(true);
                      if (scrollTimeoutRef.current) {
                        clearTimeout(scrollTimeoutRef.current);
                      }
                      scrollTimeoutRef.current = setTimeout(() => {
                        setUserScrolling(false);
                      }, 2000);
                    }}
                  >
                    {/* 当前歌词高亮效果 */}
                    {isCurrentLine && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-lg"></div>
                    )}
                    
                    <span className="relative z-10 block leading-relaxed max-w-3xl">
                      {line.text}
                    </span>
                  </div>
                );
              })}
              
              {/* 底部占位，确保最后一句歌词可以滚动到中央 */}
              <div className="h-96"></div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Volume2 className="w-10 h-10 text-white/60" />
                </div>
                <h3 className="text-2xl font-medium text-white/90 mb-3">
                  暂无歌词
                </h3>
                <p className="text-white/60 text-lg">
                  享受纯音乐的美妙时光
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LyricsArea;