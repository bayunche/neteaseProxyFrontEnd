import type { 
  PlayHistoryEntry, 
  DailyStats, 
  WeeklyStats, 
  MonthlyStats, 
  PlayStats, 
  Song,
  PlayMode 
} from '../types';

/**
 * 播放统计服务
 * 负责收集、存储和分析播放数据
 */
export class StatsService {
  private static readonly STORAGE_KEY = 'music-player-stats';
  private static readonly HISTORY_KEY = 'music-player-history';
  private static readonly MAX_HISTORY_ENTRIES = 10000; // 最多存储10000条历史记录

  private playHistory: PlayHistoryEntry[] = [];
  private currentSession: {
    startTime: Date | null;
    songId: string | number | null;
    playStartTime: number;
  } = {
    startTime: null,
    songId: null,
    playStartTime: 0
  };

  constructor() {
    this.loadHistoryFromStorage();
  }

  /**
   * 从本地存储加载播放历史
   */
  private loadHistoryFromStorage(): void {
    try {
      const stored = localStorage.getItem(StatsService.HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.playHistory = parsed.map((entry: any) => ({
          ...entry,
          playedAt: new Date(entry.playedAt)
        }));
      }
    } catch (error) {
      console.error('加载播放历史失败:', error);
      this.playHistory = [];
    }
  }

  /**
   * 保存播放历史到本地存储
   */
  private saveHistoryToStorage(): void {
    try {
      // 只保留最近的记录，避免存储过大
      const recentHistory = this.playHistory
        .slice(-StatsService.MAX_HISTORY_ENTRIES)
        .map(entry => ({
          ...entry,
          playedAt: entry.playedAt.toISOString()
        }));
      
      localStorage.setItem(StatsService.HISTORY_KEY, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('保存播放历史失败:', error);
    }
  }

  /**
   * 开始播放会话
   */
  startPlaySession(song: Song, source: PlayHistoryEntry['source'] = 'manual'): void {
    this.currentSession = {
      startTime: new Date(),
      songId: song.id,
      playStartTime: Date.now()
    };

    console.log('开始播放会话:', song.title || song.name);
  }

  /**
   * 结束播放会话
   */
  endPlaySession(currentTime: number, duration: number, completed: boolean = false): void {
    if (!this.currentSession.startTime || !this.currentSession.songId) {
      return;
    }

    const playDuration = Math.floor((Date.now() - this.currentSession.playStartTime) / 1000);
    
    // 只记录播放时间超过30秒的会话
    if (playDuration < 30) {
      this.currentSession = { startTime: null, songId: null, playStartTime: 0 };
      return;
    }

    const entry: PlayHistoryEntry = {
      id: `${this.currentSession.songId}_${Date.now()}`,
      songId: this.currentSession.songId,
      song: this.getCurrentSongFromStore(),
      playedAt: this.currentSession.startTime,
      duration: Math.min(playDuration, duration),
      completed: completed || (currentTime / duration) > 0.8, // 播放超过80%视为完整播放
      source: 'manual',
      deviceInfo: {
        platform: navigator.platform,
        userAgent: navigator.userAgent
      }
    };

    this.addHistoryEntry(entry);
    this.currentSession = { startTime: null, songId: null, playStartTime: 0 };

    console.log('结束播放会话:', entry.song.title || entry.song.name, '播放时长:', playDuration);
  }

  /**
   * 从store获取当前歌曲信息（这里需要实际的store访问）
   */
  private getCurrentSongFromStore(): Song {
    // 这里应该从实际的store获取，暂时返回模拟数据
    return {
      id: this.currentSession.songId!,
      title: '未知歌曲',
      artist: '未知艺术家',
      duration: 0,
      coverUrl: ''
    };
  }

  /**
   * 添加历史记录
   */
  private addHistoryEntry(entry: PlayHistoryEntry): void {
    this.playHistory.push(entry);
    
    // 保持历史记录在合理范围内
    if (this.playHistory.length > StatsService.MAX_HISTORY_ENTRIES) {
      this.playHistory = this.playHistory.slice(-StatsService.MAX_HISTORY_ENTRIES);
    }
    
    this.saveHistoryToStorage();
  }

  /**
   * 更新播放进度
   */
  updatePlayProgress(currentTime: number, duration: number): void {
    // 可以用于实时更新当前播放状态
    // 比如检测是否跳过歌曲、暂停时间等
  }

  /**
   * 歌曲切换事件
   */
  onSongChange(newSong: Song, source: PlayHistoryEntry['source'] = 'manual'): void {
    // 结束当前会话
    if (this.currentSession.songId && this.currentSession.songId !== newSong.id) {
      this.endPlaySession(0, 0, false);
    }
    
    // 开始新会话
    this.startPlaySession(newSong, source);
  }

  /**
   * 播放模式变化事件
   */
  onPlayModeChange(mode: PlayMode): void {
    // 记录播放模式使用情况
    const today = this.formatDate(new Date());
    // 这里可以记录模式切换统计
  }

  /**
   * 获取播放统计数据
   */
  getPlayStats(): PlayStats {
    const now = new Date();
    const allTimeStats = this.calculateAllTimeStats();
    const recentStats = this.calculateRecentStats(now);
    const trends = this.calculateTrends();

    return {
      allTime: allTimeStats,
      recent: recentStats,
      trends: trends
    };
  }

  /**
   * 计算全时统计
   */
  private calculateAllTimeStats() {
    const totalPlayTime = this.playHistory.reduce((sum, entry) => sum + entry.duration, 0);
    const totalSongs = this.playHistory.length;
    const uniqueSongs = new Set(this.playHistory.map(entry => entry.songId)).size;
    const uniqueArtists = new Set(this.playHistory.map(entry => entry.song.artist)).size;
    
    // 计算会话统计
    const sessions = this.groupIntoSessions();
    const avgSessionLength = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length 
      : 0;
    const longestSession = sessions.length > 0 
      ? Math.max(...sessions.map(session => session.duration)) 
      : 0;

    // 找出最喜欢的歌曲和艺术家
    const songPlayCounts = this.getSongPlayCounts();
    const artistPlayCounts = this.getArtistPlayCounts();
    
    const favoriteSong = songPlayCounts.length > 0 ? songPlayCounts[0].song : undefined;
    const favoriteArtist = artistPlayCounts.length > 0 ? artistPlayCounts[0].artist : undefined;

    return {
      totalPlayTime,
      totalSongs,
      uniqueSongs,
      uniqueArtists,
      avgSessionLength: Math.floor(avgSessionLength),
      longestSession: Math.floor(longestSession),
      favoriteSong,
      favoriteArtist
    };
  }

  /**
   * 计算最近统计
   */
  private calculateRecentStats(now: Date) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = this.getWeekRange(now, -1);
    const lastMonth = this.getMonthRange(now, -1);

    return {
      lastWeek: this.calculateWeeklyStats(lastWeek.start, lastWeek.end),
      lastMonth: this.calculateMonthlyStats(lastMonth.start, lastMonth.end),
      yesterday: this.calculateDailyStats(this.formatDate(yesterday))
    };
  }

  /**
   * 计算趋势
   */
  private calculateTrends() {
    const thisWeek = this.getWeekRange(new Date(), 0);
    const lastWeek = this.getWeekRange(new Date(), -1);
    
    const thisWeekTime = this.getTotalPlayTime(thisWeek.start, thisWeek.end);
    const lastWeekTime = this.getTotalPlayTime(lastWeek.start, lastWeek.end);
    
    const playTimeGrowth = lastWeekTime > 0 
      ? ((thisWeekTime - lastWeekTime) / lastWeekTime) * 100 
      : 0;

    // 计算发现率和重复率
    const recentHistory = this.getHistoryInRange(thisWeek.start, thisWeek.end);
    const uniqueSongs = new Set(recentHistory.map(entry => entry.songId)).size;
    const totalPlays = recentHistory.length;
    
    const discoveryRate = totalPlays > 0 ? uniqueSongs / totalPlays : 0;
    const repeatRate = totalPlays > 0 ? (totalPlays - uniqueSongs) / totalPlays : 0;

    return {
      playTimeGrowth: Number(playTimeGrowth.toFixed(1)),
      discoveryRate: Number(discoveryRate.toFixed(3)),
      repeatRate: Number(repeatRate.toFixed(3))
    };
  }

  /**
   * 计算每日统计
   */
  private calculateDailyStats(date: string): DailyStats {
    const dayStart = new Date(date + 'T00:00:00');
    const dayEnd = new Date(date + 'T23:59:59');
    const dayHistory = this.getHistoryInRange(dayStart, dayEnd);

    const totalPlayTime = dayHistory.reduce((sum, entry) => sum + entry.duration, 0);
    const songCount = dayHistory.length;
    const uniqueSongCount = new Set(dayHistory.map(entry => entry.songId)).size;

    // 统计播放模式
    const playModeStats = {
      sequence: 0,
      random: 0,
      single: 0,
      list_loop: 0
    };

    return {
      date,
      totalPlayTime,
      songCount,
      uniqueSongCount,
      topSongs: this.getTopSongs(dayHistory).slice(0, 10),
      topArtists: this.getTopArtists(dayHistory).slice(0, 10),
      playModeStats
    };
  }

  /**
   * 计算每周统计
   */
  private calculateWeeklyStats(weekStart: Date, weekEnd: Date): WeeklyStats {
    const weekHistory = this.getHistoryInRange(weekStart, weekEnd);
    const totalPlayTime = weekHistory.reduce((sum, entry) => sum + entry.duration, 0);

    return {
      weekStart: this.formatDate(weekStart),
      weekEnd: this.formatDate(weekEnd),
      totalPlayTime,
      dailyBreakdown: [], // 可以进一步实现
      topSongs: this.getTopSongs(weekHistory).slice(0, 10),
      topArtists: this.getTopArtists(weekHistory).slice(0, 10)
    };
  }

  /**
   * 计算每月统计
   */
  private calculateMonthlyStats(monthStart: Date, monthEnd: Date): MonthlyStats {
    const monthHistory = this.getHistoryInRange(monthStart, monthEnd);
    const totalPlayTime = monthHistory.reduce((sum, entry) => sum + entry.duration, 0);

    // 计算新发现统计
    const previousMonth = this.getMonthRange(monthStart, -1);
    const previousHistory = this.getHistoryInRange(previousMonth.start, previousMonth.end);
    const previousSongs = new Set(previousHistory.map(entry => entry.songId));
    const previousArtists = new Set(previousHistory.map(entry => entry.song.artist));

    const currentSongs = new Set(monthHistory.map(entry => entry.songId));
    const currentArtists = new Set(monthHistory.map(entry => entry.song.artist));

    const newSongsCount = [...currentSongs].filter(id => !previousSongs.has(id)).length;
    const newArtistsCount = [...currentArtists].filter(artist => !previousArtists.has(artist)).length;

    return {
      month: this.formatDate(monthStart).substring(0, 7), // YYYY-MM
      totalPlayTime,
      weeklyBreakdown: [], // 可以进一步实现
      topSongs: this.getTopSongs(monthHistory).slice(0, 10),
      topArtists: this.getTopArtists(monthHistory).slice(0, 10),
      discoveryStats: {
        newSongsCount,
        newArtistsCount
      }
    };
  }

  // 辅助方法

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getHistoryInRange(start: Date, end: Date): PlayHistoryEntry[] {
    return this.playHistory.filter(entry => 
      entry.playedAt >= start && entry.playedAt <= end
    );
  }

  private getTotalPlayTime(start: Date, end: Date): number {
    return this.getHistoryInRange(start, end)
      .reduce((sum, entry) => sum + entry.duration, 0);
  }

  private getWeekRange(date: Date, weeksOffset: number) {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay() + 1 + (weeksOffset * 7)); // 周一
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6); // 周日
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  private getMonthRange(date: Date, monthsOffset: number) {
    const start = new Date(date.getFullYear(), date.getMonth() + monthsOffset, 1);
    const end = new Date(date.getFullYear(), date.getMonth() + monthsOffset + 1, 0, 23, 59, 59, 999);
    
    return { start, end };
  }

  private getSongPlayCounts() {
    const counts = new Map<string, { song: Song; count: number; totalDuration: number }>();
    
    this.playHistory.forEach(entry => {
      const key = String(entry.songId);
      const existing = counts.get(key);
      
      if (existing) {
        existing.count++;
        existing.totalDuration += entry.duration;
      } else {
        counts.set(key, {
          song: entry.song,
          count: 1,
          totalDuration: entry.duration
        });
      }
    });
    
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count);
  }

  private getArtistPlayCounts() {
    const counts = new Map<string, { artist: string; count: number; totalDuration: number }>();
    
    this.playHistory.forEach(entry => {
      const artist = entry.song.artist || '未知艺术家';
      const existing = counts.get(artist);
      
      if (existing) {
        existing.count++;
        existing.totalDuration += entry.duration;
      } else {
        counts.set(artist, {
          artist,
          count: 1,
          totalDuration: entry.duration
        });
      }
    });
    
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count);
  }

  private getTopSongs(history: PlayHistoryEntry[]) {
    const counts = new Map<string, { song: Song; playCount: number; totalDuration: number }>();
    
    history.forEach(entry => {
      const key = String(entry.songId);
      const existing = counts.get(key);
      
      if (existing) {
        existing.playCount++;
        existing.totalDuration += entry.duration;
      } else {
        counts.set(key, {
          song: entry.song,
          playCount: 1,
          totalDuration: entry.duration
        });
      }
    });
    
    return Array.from(counts.values())
      .sort((a, b) => b.playCount - a.playCount);
  }

  private getTopArtists(history: PlayHistoryEntry[]) {
    const counts = new Map<string, { artist: string; playCount: number; totalDuration: number }>();
    
    history.forEach(entry => {
      const artist = entry.song.artist || '未知艺术家';
      const existing = counts.get(artist);
      
      if (existing) {
        existing.playCount++;
        existing.totalDuration += entry.duration;
      } else {
        counts.set(artist, {
          artist,
          playCount: 1,
          totalDuration: entry.duration
        });
      }
    });
    
    return Array.from(counts.values())
      .sort((a, b) => b.playCount - a.playCount);
  }

  private groupIntoSessions() {
    const sessions: { duration: number; songs: number }[] = [];
    let currentSession: { startTime: Date | null; duration: number; songs: number } = {
      startTime: null,
      duration: 0,
      songs: 0
    };

    const sortedHistory = [...this.playHistory].sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime());

    sortedHistory.forEach(entry => {
      if (!currentSession.startTime) {
        currentSession.startTime = entry.playedAt;
        currentSession.duration = entry.duration;
        currentSession.songs = 1;
      } else {
        const timeDiff = entry.playedAt.getTime() - currentSession.startTime.getTime() - currentSession.duration * 1000;
        
        // 如果间隔超过30分钟，开始新会话
        if (timeDiff > 30 * 60 * 1000) {
          sessions.push({
            duration: currentSession.duration,
            songs: currentSession.songs
          });
          
          currentSession = {
            startTime: entry.playedAt,
            duration: entry.duration,
            songs: 1
          };
        } else {
          currentSession.duration += entry.duration;
          currentSession.songs++;
        }
      }
    });

    // 添加最后一个会话
    if (currentSession.startTime) {
      sessions.push({
        duration: currentSession.duration,
        songs: currentSession.songs
      });
    }

    return sessions;
  }

  /**
   * 清空统计数据
   */
  clearStats(): void {
    this.playHistory = [];
    this.saveHistoryToStorage();
    localStorage.removeItem(StatsService.STORAGE_KEY);
  }

  /**
   * 导出统计数据
   */
  exportStats(): string {
    return JSON.stringify({
      history: this.playHistory,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * 导入统计数据
   */
  importStats(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.history && Array.isArray(parsed.history)) {
        this.playHistory = parsed.history.map((entry: any) => ({
          ...entry,
          playedAt: new Date(entry.playedAt)
        }));
        this.saveHistoryToStorage();
        return true;
      }
    } catch (error) {
      console.error('导入统计数据失败:', error);
    }
    return false;
  }
}

// 导出单例实例
export const statsService = new StatsService();