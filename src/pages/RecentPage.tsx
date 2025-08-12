import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Play, 
  MoreHorizontal, 
  Calendar,
  X,
  Trash2,
  Download,
  Search
} from 'lucide-react';
import { usePlayerStore } from '../stores';
import { cn } from '../utils/cn';
import type { Song, PlayHistoryEntry } from '../types';

const RecentPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [recentHistory, setRecentHistory] = useState<PlayHistoryEntry[]>([]);
  
  const { play, addToQueue, clearRecentPlayed } = usePlayerStore();

  // 加载最近播放历史
  useEffect(() => {
    const loadRecentHistory = () => {
      try {
        const stored = localStorage.getItem('music-player-history');
        if (stored) {
          const parsed = JSON.parse(stored);
          const history = parsed.map((entry: PlayHistoryEntry & { playedAt: string }) => ({
            ...entry,
            playedAt: new Date(entry.playedAt)
          }));
          setRecentHistory(history.reverse()); // 最新的在前面
        }
      } catch (error) {
        console.error('加载播放历史失败:', error);
      }
    };

    loadRecentHistory();
    
    // 定期刷新数据
    const interval = setInterval(loadRecentHistory, 30000); // 30秒刷新一次
    return () => clearInterval(interval);
  }, []);

  // 过滤和搜索历史记录
  const filteredHistory = useMemo(() => {
    let filtered = [...recentHistory];

    // 时间过滤
    const now = new Date();
    switch (selectedPeriod) {
      case 'today': {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(entry => entry.playedAt >= today);
        break;
      }
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(entry => entry.playedAt >= weekAgo);
        break;
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(entry => entry.playedAt >= monthAgo);
        break;
      }
    }

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        (entry.song.title?.toLowerCase().includes(query)) ||
        (entry.song.name?.toLowerCase().includes(query)) ||
        (entry.song.artist?.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [recentHistory, selectedPeriod, searchQuery]);

  // 按日期分组
  const groupedHistory = useMemo(() => {
    const groups = new Map<string, PlayHistoryEntry[]>();
    
    filteredHistory.forEach(entry => {
      const dateKey = entry.playedAt.toDateString();
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(entry);
    });

    return Array.from(groups.entries()).map(([date, entries]) => ({
      date: new Date(date),
      entries: entries.sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
    }));
  }, [filteredHistory]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    if (date >= today) {
      return '今天';
    } else if (date >= yesterday) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSongPlay = async (song: Song) => {
    await play(song);
  };

  const handleClearHistory = () => {
    // 清空播放历史记录
    localStorage.removeItem('music-player-history');
    setRecentHistory([]);
    
    // 清空store中的最近播放
    clearRecentPlayed();
    
    setShowClearDialog(false);
  };

  const handleExportHistory = () => {
    const dataStr = JSON.stringify(recentHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `播放历史_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const SongItem: React.FC<{ 
    entry: PlayHistoryEntry; 
    showTime?: boolean; 
  }> = ({ entry, showTime = true }) => {
    const song = entry.song;

    return (
      <div className="group flex items-center space-x-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
        {/* 播放时间 */}
        {showTime && (
          <div className="text-xs text-gray-500 dark:text-gray-400 w-12 flex-shrink-0">
            {formatTime(entry.playedAt)}
          </div>
        )}

        {/* 歌曲封面 */}
        <div className="relative flex-shrink-0">
          <img
            src={song.coverUrl || song.picUrl}
            alt={song.title || song.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <button
            onClick={() => handleSongPlay(song)}
            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-lg transition-all duration-200"
          >
            <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* 歌曲信息 */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 dark:text-white truncate">
            {song.title || song.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {song.artist}
          </p>
        </div>

        {/* 播放信息 */}
        <div className="text-right flex-shrink-0 hidden md:block">
          <p className="text-sm text-gray-900 dark:text-white">
            {formatDuration(entry.duration)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {entry.completed ? '完整播放' : '部分播放'}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => addToQueue(song)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="添加到队列"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const EmptyState: React.FC = () => (
    <div className="text-center py-12">
      <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {searchQuery ? '没有找到匹配的播放记录' : '暂无播放历史'}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        {searchQuery 
          ? '试试其他关键词或调整时间范围'
          : '开始播放音乐，您的播放历史将显示在这里'
        }
      </p>
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          清除搜索
        </button>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                最近播放
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {filteredHistory.length > 0 && `${filteredHistory.length} 首歌曲`}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {recentHistory.length > 0 && (
                <>
                  <button
                    onClick={handleExportHistory}
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">导出</span>
                  </button>
                  
                  <button
                    onClick={() => setShowClearDialog(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">清空</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 搜索和过滤 */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索歌曲或艺术家..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 时间过滤 */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[
                { key: 'all', label: '全部' },
                { key: 'today', label: '今天' },
                { key: 'week', label: '本周' },
                { key: 'month', label: '本月' },
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key as 'today' | 'week' | 'month' | 'all')}
                  className={cn(
                    'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                    selectedPeriod === period.key
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {groupedHistory.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {groupedHistory.map(({ date, entries }) => (
              <div key={date.toDateString()} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                      {formatDate(date)}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {entries.length} 首歌曲
                    </span>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {entries.map((entry, index) => (
                    <SongItem 
                      key={`${entry.id}-${index}`} 
                      entry={entry}
                      showTime={true}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 清空确认对话框 */}
      {showClearDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              清空播放历史
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              确定要清空所有播放历史记录吗？此操作无法撤销。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearHistory}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                确定清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentPage;