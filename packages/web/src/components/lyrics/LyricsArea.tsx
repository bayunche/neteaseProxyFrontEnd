import React, { useEffect, useRef, useState } from 'react';
import { Volume2, RotateCcw } from 'lucide-react';
import { usePlayerStore } from '../../stores';
import { cn } from '../../utils/cn';

const LyricsArea: React.FC = () => {
  const { player, lyrics, loadLyrics, updateCurrentLyricLine } = usePlayerStore();
  const { currentSong, currentTime } = player;
  const { current: currentLyrics, currentLineIndex } = lyrics;
  
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [userScrolling, setUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isAutoScrolling = useRef(false);

  // 当歌曲变化时加载歌词
  useEffect(() => {
    if (currentSong) {
      loadLyrics(String(currentSong.id)).catch(console.error);
    }
  }, [currentSong, loadLyrics]);

  // 更新当前歌词行
  useEffect(() => {
    if (currentLyrics?.lines && currentLyrics.lines.length > 0 && currentTime > 0) {
      updateCurrentLyricLine(currentTime);
    }
  }, [currentTime, updateCurrentLyricLine, currentLyrics]);

  // 歌词加载完成后初始滚动定位
  useEffect(() => {
    if (currentLyrics?.lines && currentLyrics.lines.length > 0 && currentLineIndex >= 0) {
      // 延迟执行，确保DOM已完全渲染
      const timer = setTimeout(() => {
        setUserScrolling(false); // 确保不被用户滚动状态阻止
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentLyrics?.lines, currentLineIndex]);

  // 监听用户滚动行为
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isAutoScrolling.current) return;
      
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
  }, []);

  // 自动滚动到当前歌词 - 修复版本
  useEffect(() => {
    // 用户手动滚动时跳过自动滚动
    if (userScrolling) return;
    
    const container = lyricsContainerRef.current;
    
    // 基础条件检查
    if (!container || !currentLyrics?.lines?.length || currentLineIndex < 0 || currentLineIndex >= currentLyrics.lines.length) {
      return;
    }

    const performScroll = () => {
      const activeLine = lyricRefs.current[currentLineIndex];
      
      // 等待DOM元素准备就绪
      if (!activeLine) {
        // 延迟重试，确保元素已渲染
        const retryTimer = setTimeout(performScroll, 150);
        return () => clearTimeout(retryTimer);
      }

      // 简化的滚动计算，避免使用getBoundingClientRect
      const containerHeight = container.clientHeight;
      const lineOffsetTop = activeLine.offsetTop;
      const lineHeight = activeLine.offsetHeight;
      
      // 计算目标滚动位置：歌词行居中
      const targetScrollTop = lineOffsetTop - containerHeight / 2 + lineHeight / 2;
      
      const currentScrollTop = container.scrollTop;
      const scrollDifference = Math.abs(targetScrollTop - currentScrollTop);
      
      
      // 使用更大的阈值，避免频繁滚动
      if (scrollDifference > 50) {
        isAutoScrolling.current = true;
        
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
        
        // 重置自动滚动标志
        setTimeout(() => {
          isAutoScrolling.current = false;
        }, 1000);
      }
    };

    // 给DOM一点时间完成渲染
    const scrollTimer = setTimeout(performScroll, 200);
    
    return () => {
      clearTimeout(scrollTimer);
    };
  }, [currentLineIndex, userScrolling, currentLyrics]);

  const handleScrollToCurrentLine = () => {
    setUserScrolling(false);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };

  // 如果没有当前歌曲，显示提示
  if (!currentSong) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <Volume2 className="w-16 h-16 mx-auto mb-4 text-white/60" />
          <h2 className="text-xl mb-2">暂无正在播放的歌曲</h2>
          <p className="text-white/60">选择一首歌曲开始播放</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-900 text-white relative">
      {/* 用户滚动提示 */}
      {userScrolling && (
        <div className="absolute top-20 right-6 z-20 flex items-center space-x-3">
          <div className="bg-black/60 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span>手动浏览中</span>
          </div>
          <button
            onClick={handleScrollToCurrentLine}
            className="bg-red-500/90 hover:bg-red-500 backdrop-blur-sm text-white p-2 rounded-lg transition-colors border border-white/20 shadow-lg"
            title="返回当前播放位置"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}
      
      {/* 固定高度的滚动容器 */}
      <div className="h-screen overflow-hidden">
        <div 
          ref={lyricsContainerRef}
          className="h-full overflow-y-auto p-6"
          style={{
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
        {currentLyrics && currentLyrics.lines && currentLyrics.lines.length > 0 ? (
          <div className="max-w-4xl mx-auto">
            {/* 顶部占位，确保第一句歌词可以滚动到中央 */}
            <div className="h-screen"></div>
            
            {currentLyrics.lines.map((line, index) => {
              const isCurrentLine = index === currentLineIndex;
              const distanceFromCurrent = Math.abs(index - currentLineIndex);
              
              return (
                <div
                  key={index}
                  ref={(el) => {
                    lyricRefs.current[index] = el;
                  }}
                  className={cn(
                    'text-center py-8 px-6 transition-all duration-500 ease-out cursor-pointer',
                    'min-h-[120px] flex items-center justify-center mb-4',
                    isCurrentLine 
                      ? 'transform scale-105' 
                      : ''
                  )}
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
                  <div>
                    {/* 原文歌词 */}
                    <div className={cn(
                      'block leading-relaxed transition-all duration-500',
                      isCurrentLine 
                        ? 'text-2xl font-bold text-white drop-shadow-lg' 
                        : distanceFromCurrent === 1
                        ? 'text-xl text-white/80 font-medium'
                        : distanceFromCurrent === 2
                        ? 'text-lg text-white/60'
                        : 'text-base text-white/40'
                    )}>
                      {line.text}
                    </div>
                    
                    {/* 翻译歌词 */}
                    {line.translation && (
                      <div className={cn(
                        'mt-2 leading-relaxed transition-all duration-500',
                        isCurrentLine 
                          ? 'text-lg text-white/90 font-medium' 
                          : distanceFromCurrent === 1
                          ? 'text-base text-white/70'
                          : distanceFromCurrent === 2
                          ? 'text-sm text-white/50'
                          : 'text-sm text-white/30'
                      )}>
                        {line.translation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* 底部占位，确保最后一句歌词可以滚动到中央 */}
            <div className="h-screen"></div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Volume2 className="w-16 h-16 mx-auto mb-4 text-white/60" />
              <h3 className="text-xl mb-2">暂无歌词</h3>
              <p className="text-white/60">享受纯音乐的美妙时光</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default LyricsArea;