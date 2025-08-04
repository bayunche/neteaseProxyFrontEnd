import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { usePlayerStore } from '../stores';
import SongContentArea from '../components/lyrics/SongContentArea';
import LyricsArea from '../components/lyrics/LyricsArea';

const LyricsPage: React.FC = () => {
  const { player } = usePlayerStore();
  const { currentSong } = player;
  
  const [currentView, setCurrentView] = useState<'content' | 'lyrics'>('content');
  const [autoSwitchTimer, setAutoSwitchTimer] = useState<NodeJS.Timeout | null>(null);

  // 当歌曲变化时重置视图到内容区
  useEffect(() => {
    if (currentSong) {
      setCurrentView('content');
      
      // 清理之前的定时器
      if (autoSwitchTimer) {
        clearTimeout(autoSwitchTimer);
      }
      
      // 设置3秒自动切换定时器
      const timer = setTimeout(() => {
        setCurrentView('lyrics');
      }, 3000);
      setAutoSwitchTimer(timer);
      
      // 清理函数
      return () => {
        clearTimeout(timer);
      };
    }
  }, [currentSong]); // 只依赖 currentSong

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (autoSwitchTimer) {
        clearTimeout(autoSwitchTimer);
      }
    };
  }, []); // 空依赖数组，仅在组件卸载时运行

  const handleBackClick = () => {
    window.history.back();
  };

  const handleScrollDetected = () => {
    if (autoSwitchTimer) {
      clearTimeout(autoSwitchTimer);
      setAutoSwitchTimer(null);
    }
    setCurrentView('lyrics');
  };

  const handleReturnToSongContent = () => {
    setCurrentView('content');
  };

  const handleScrollToTop = () => {
    setCurrentView('content');
  };

  if (!currentSong) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            没有正在播放的歌曲
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            选择一首歌曲开始播放
          </p>
          <button
            onClick={handleBackClick}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4 bg-white dark:bg-gray-900">
        <button
          onClick={handleBackClick}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {currentView === 'content' ? '歌曲信息' : '歌词显示'}
        </div>
      </div>

      {/* Content */}
      {currentView === 'content' ? (
        <SongContentArea onScrollDetected={handleScrollDetected} />
      ) : (
        <LyricsArea 
          onReturnToSongContent={handleReturnToSongContent}
          onScrollToTop={handleScrollToTop}
        />
      )}
    </div>
  );
};

export default LyricsPage;