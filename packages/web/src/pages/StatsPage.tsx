import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  Music, 
  TrendingUp, 
  Calendar,
  Headphones,
  Heart,
  Shuffle,
  RotateCcw,
  Play,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { usePlayerStore } from "@music-player/shared/stores";
import { cn } from '../utils/cn';
import type { PlayStats } from "@music-player/shared/types";

const StatsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'weekly' | 'monthly'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  
  const { stats, loadStats } = usePlayerStore();
  
  // 页面加载时获取统计数据
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // 模拟数据 - 在实际数据为空时使用
  const mockStats: PlayStats = {
    allTime: {
      totalPlayTime: 45000, // 12.5小时
      totalSongs: 1250,
      uniqueSongs: 890,
      uniqueArtists: 145,
      avgSessionLength: 1800, // 30分钟
      longestSession: 7200, // 2小时
      favoriteSong: {
        id: '1',
        title: '沸雪',
        artist: '周深',
        duration: 240,
        coverUrl: 'https://p2.music.126.net/example.jpg'
      },
      favoriteArtist: '周深'
    },
    recent: {
      lastWeek: {
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        totalPlayTime: 8400,
        dailyBreakdown: [],
        topSongs: [
          {
            song: {
              id: '1',
              title: '沸雪',
              artist: '周深',
              duration: 240,
              coverUrl: 'https://p2.music.126.net/example.jpg'
            },
            playCount: 15,
            totalDuration: 3600
          }
        ],
        topArtists: [
          {
            artist: '周深',
            playCount: 25,
            totalDuration: 6000
          }
        ]
      },
      lastMonth: {
        month: '2024-01',
        totalPlayTime: 28800,
        weeklyBreakdown: [],
        topSongs: [],
        topArtists: [],
        discoveryStats: {
          newSongsCount: 45,
          newArtistsCount: 12
        }
      },
      yesterday: {
        date: '2024-01-21',
        totalPlayTime: 1800,
        songCount: 25,
        uniqueSongCount: 18,
        topSongs: [],
        topArtists: [],
        playModeStats: {
          sequence: 10,
          random: 8,
          single: 5,
          list_loop: 2
        }
      }
    },
    trends: {
      playTimeGrowth: 15.5,
      discoveryRate: 0.35,
      repeatRate: 0.62
    }
  };

  // 使用实际数据或模拟数据，确保数据结构完整
  const currentStats = stats.data || mockStats;
  
  // 确保数据结构完整，防止空值引用
  const safeStats = {
    allTime: currentStats?.allTime || mockStats.allTime,
    recent: currentStats?.recent || mockStats.recent,
    trends: currentStats?.trends || mockStats.trends
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: number;
    className?: string;
  }> = ({ title, value, subtitle, icon, trend, className }) => (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700',
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center space-x-1 text-sm',
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          )}>
            {trend > 0 ? <ArrowUp className="w-4 h-4" /> : 
             trend < 0 ? <ArrowDown className="w-4 h-4" /> : null}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );

  const TopSongsList: React.FC<{ songs: Array<{ song: { id: string | number; title?: string; name?: string; artist?: string; coverUrl?: string }; playCount: number; totalDuration: number }> }> = ({ songs }) => (
    <div className="space-y-3">
      {songs.slice(0, 5).map((item, index) => (
        <div key={item.song.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-center w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-bold">
            {index + 1}
          </div>
          <img
            src={item.song.coverUrl || '/placeholder.jpg'}
            alt={item.song.title || item.song.name || ''}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {item.song.title || item.song.name || ''}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {item.song.artist || '未知艺术家'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {item.playCount}次
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {formatDuration(item.totalDuration)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const PlayModeChart: React.FC<{ stats: Record<string, number> }> = ({ stats }) => {
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    const modeNames = {
      sequence: '顺序播放',
      random: '随机播放',
      single: '单曲循环',
      list_loop: '列表循环'
    };
    const modeIcons = {
      sequence: <Play className="w-4 h-4" />,
      random: <Shuffle className="w-4 h-4" />,
      single: <RotateCcw className="w-4 h-4" />,
      list_loop: <RotateCcw className="w-4 h-4" />
    };

    return (
      <div className="space-y-3">
        {Object.entries(stats).map(([mode, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={mode} className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {modeIcons[mode as keyof typeof modeIcons]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {modeNames[mode as keyof typeof modeNames]}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {count}次 ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                播放统计
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                查看您的音乐播放习惯和偏好
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')}
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                <option value="week">最近一周</option>
                <option value="month">最近一月</option>
                <option value="year">最近一年</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'overview', label: '总览', icon: <BarChart3 className="w-4 h-4" /> },
              { key: 'daily', label: '每日', icon: <Calendar className="w-4 h-4" /> },
              { key: 'weekly', label: '每周', icon: <TrendingUp className="w-4 h-4" /> },
              { key: 'monthly', label: '每月', icon: <Clock className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'overview' | 'daily' | 'weekly' | 'monthly')}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="总播放时长"
                value={formatDuration(safeStats.allTime?.totalPlayTime || 0)}
                subtitle="所有时间"
                icon={<Clock className="w-6 h-6 text-primary-600" />}
                trend={safeStats.trends?.playTimeGrowth}
              />
              <StatCard
                title="播放歌曲"
                value={safeStats.allTime?.totalSongs || 0}
                subtitle={`${safeStats.allTime?.uniqueSongs || 0}首不重复`}
                icon={<Music className="w-6 h-6 text-primary-600" />}
              />
              <StatCard
                title="喜爱艺术家"
                value={safeStats.allTime?.uniqueArtists || 0}
                subtitle={`最爱: ${safeStats.allTime?.favoriteArtist || '暂无数据'}`}
                icon={<Headphones className="w-6 h-6 text-primary-600" />}
              />
              <StatCard
                title="发现率"
                value={`${((safeStats.trends?.discoveryRate || 0) * 100).toFixed(1)}%`}
                subtitle="新歌曲发现比例"
                icon={<TrendingUp className="w-6 h-6 text-primary-600" />}
                trend={5.2}
              />
            </div>

            {/* 最爱歌曲 */}
            {safeStats.allTime?.favoriteSong && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Heart className="w-5 h-5 text-red-500 mr-2" />
                  我的最爱
                </h3>
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-lg">
                  <img
                    src={safeStats.allTime.favoriteSong.coverUrl}
                    alt={safeStats.allTime.favoriteSong.title || safeStats.allTime.favoriteSong.name}
                    className="w-16 h-16 rounded-lg object-cover shadow-md"
                  />
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {safeStats.allTime.favoriteSong.title || safeStats.allTime.favoriteSong.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {safeStats.allTime.favoriteSong.artist}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      您最常播放的歌曲
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 本周热门 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  本周热门歌曲
                </h3>
                <TopSongsList songs={safeStats.recent?.lastWeek?.topSongs || []} />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  播放模式偏好
                </h3>
                <PlayModeChart stats={safeStats.recent?.yesterday?.playModeStats || {
                  sequence: 0,
                  random: 0,
                  single: 0,
                  list_loop: 0
                }} />
              </div>
            </div>

            {/* 趋势分析 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                趋势分析
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    +{safeStats.trends?.playTimeGrowth || 0}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">播放时长增长</p>
                  <p className="text-xs text-gray-500 mt-1">相比上周</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {((safeStats.trends?.discoveryRate || 0) * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">新歌发现率</p>
                  <p className="text-xs text-gray-500 mt-1">探索新音乐</p>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {((safeStats.trends?.repeatRate || 0) * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">重复播放率</p>
                  <p className="text-xs text-gray-500 mt-1">经典回味</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 其他标签页内容 */}
        {activeTab !== 'overview' && (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              功能开发中
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'daily' && '每日统计详情即将上线'}
              {activeTab === 'weekly' && '每周统计详情即将上线'}
              {activeTab === 'monthly' && '每月统计详情即将上线'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsPage;