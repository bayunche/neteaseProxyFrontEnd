/**
 * 统计数据收集服务
 * 负责实时收集播放数据并进行聚合计算
 */

import type { Song, PlayMode } from '../types';

export interface PlaySession {
  id: string;
  startTime: number;
  endTime?: number;
  songId: string | number;
  songTitle: string;
  songArtist: string;
  playDuration: number; // 实际播放时长(秒)
  totalDuration: number; // 歌曲总时长(秒)
  playMode: PlayMode;
  isCompleted: boolean; // 是否完整播放
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalPlayTime: number;
  sessionCount: number;
  uniqueSongs: Set<string>;
  uniqueArtists: Set<string>;
  playModeCounts: Record<PlayMode, number>;
  topSongs: { songId: string; playCount: number; duration: number }[];
}

export interface RealTimeStatistics {
  // 当前播放会话
  currentSession: PlaySession | null;
  
  // 历史会话（最近1000个）
  recentSessions: PlaySession[];
  
  // 每日统计（最近90天）
  dailyStats: Record<string, DailyStats>;
  
  // 歌曲播放统计
  songPlayCounts: Record<string, {
    playCount: number;
    totalDuration: number;
    lastPlayed: number;
    song: Omit<Song, 'audioUrl'>;
  }>;
  
  // 艺术家播放统计
  artistPlayCounts: Record<string, {
    playCount: number;
    totalDuration: number;
    songCount: number;
    lastPlayed: number;
  }>;
  
  // 播放模式统计
  playModeStats: Record<PlayMode, {
    count: number;
    totalDuration: number;
  }>;
  
  // 元数据
  lastUpdated: number;
  totalPlayTime: number;
  totalSessions: number;
}

export class StatisticsCollector {
  private data: RealTimeStatistics;
  private sessionStartTime: number | null = null;
  private lastSongId: string | number | null = null;
  private playTimeAccumulator = 0;
  
  constructor(initialData?: Partial<RealTimeStatistics>) {
    this.data = {
      currentSession: null,
      recentSessions: [],
      dailyStats: {},
      songPlayCounts: {},
      artistPlayCounts: {},
      playModeStats: {
        sequence: { count: 0, totalDuration: 0 },
        random: { count: 0, totalDuration: 0 },
        single: { count: 0, totalDuration: 0 },
        list_loop: { count: 0, totalDuration: 0 }
      },
      lastUpdated: Date.now(),
      totalPlayTime: 0,
      totalSessions: 0,
      ...initialData
    };
    
    // 转换 Set 对象（因为持久化不支持 Set）
    Object.values(this.data.dailyStats).forEach(dayStats => {
      if (Array.isArray(dayStats.uniqueSongs)) {
        dayStats.uniqueSongs = new Set(dayStats.uniqueSongs);
      }
      if (Array.isArray(dayStats.uniqueArtists)) {
        dayStats.uniqueArtists = new Set(dayStats.uniqueArtists);
      }
    });
  }

  /**
   * 开始播放会话
   */
  startPlaySession(song: Song, playMode: PlayMode): void {
    const now = Date.now();
    this.sessionStartTime = now;
    
    // 如果有未完成的会话，先结束它
    if (this.data.currentSession && !this.data.currentSession.endTime) {
      this.endPlaySession(false);
    }
    
    this.data.currentSession = {
      id: `session_${now}`,
      startTime: now,
      songId: song.id,
      songTitle: song.title || song.name || '',
      songArtist: song.artist || '',
      playDuration: 0,
      totalDuration: song.duration || 0,
      playMode,
      isCompleted: false
    };
    
    this.lastSongId = song.id;
    this.playTimeAccumulator = 0;
  }

  /**
   * 更新播放进度
   */
  updatePlayProgress(currentTime: number, duration: number): void {
    if (!this.data.currentSession) return;
    
    // 累计播放时间（防止拖拽进度条导致的时间跳跃）
    const timeDiff = Math.abs(currentTime - this.playTimeAccumulator);
    if (timeDiff < 5) { // 5秒内的变化认为是正常播放
      this.playTimeAccumulator = currentTime;
      this.data.currentSession.playDuration = currentTime;
    }
    
    this.data.currentSession.totalDuration = duration;
    
    // 检查是否完整播放（播放超过90%认为完整播放）
    if (duration > 0 && currentTime / duration > 0.9) {
      this.data.currentSession.isCompleted = true;
    }
  }

  /**
   * 结束播放会话
   */
  endPlaySession(isCompleted: boolean = false): void {
    if (!this.data.currentSession) return;
    
    const session = this.data.currentSession;
    const now = Date.now();
    
    session.endTime = now;
    session.isCompleted = isCompleted || session.isCompleted;
    
    // 确保播放时长合理
    const sessionDuration = Math.min(session.playDuration, session.totalDuration);
    session.playDuration = sessionDuration;
    
    // 只记录播放时长超过5秒的会话
    if (sessionDuration > 5) {
      this.recordSession(session);
    }
    
    this.data.currentSession = null;
    this.sessionStartTime = null;
    this.playTimeAccumulator = 0;
  }

  /**
   * 记录播放会话到统计数据
   */
  private recordSession(session: PlaySession): void {
    
    // 添加到最近会话
    this.data.recentSessions.unshift(session);
    if (this.data.recentSessions.length > 1000) {
      this.data.recentSessions = this.data.recentSessions.slice(0, 1000);
    }
    
    // 更新歌曲统计
    const songKey = String(session.songId);
    if (!this.data.songPlayCounts[songKey]) {
      this.data.songPlayCounts[songKey] = {
        playCount: 0,
        totalDuration: 0,
        lastPlayed: 0,
        song: {
          id: session.songId,
          title: session.songTitle,
          name: session.songTitle,
          artist: session.songArtist,
          duration: session.totalDuration
        } as Omit<Song, 'audioUrl'>
      };
    }
    
    this.data.songPlayCounts[songKey].playCount++;
    this.data.songPlayCounts[songKey].totalDuration += session.playDuration;
    this.data.songPlayCounts[songKey].lastPlayed = session.startTime;
    
    // 更新艺术家统计
    const artistKey = session.songArtist;
    if (!this.data.artistPlayCounts[artistKey]) {
      this.data.artistPlayCounts[artistKey] = {
        playCount: 0,
        totalDuration: 0,
        songCount: 0,
        lastPlayed: 0
      };
    }
    
    this.data.artistPlayCounts[artistKey].playCount++;
    this.data.artistPlayCounts[artistKey].totalDuration += session.playDuration;
    this.data.artistPlayCounts[artistKey].lastPlayed = session.startTime;
    
    // 更新播放模式统计
    this.data.playModeStats[session.playMode].count++;
    this.data.playModeStats[session.playMode].totalDuration += session.playDuration;
    
    // 更新每日统计
    const today = new Date().toISOString().split('T')[0];
    if (!this.data.dailyStats[today]) {
      this.data.dailyStats[today] = {
        date: today,
        totalPlayTime: 0,
        sessionCount: 0,
        uniqueSongs: new Set(),
        uniqueArtists: new Set(),
        playModeCounts: {
          sequence: 0,
          random: 0,
          single: 0,
          list_loop: 0
        },
        topSongs: []
      };
    }
    
    const dayStats = this.data.dailyStats[today];
    dayStats.totalPlayTime += session.playDuration;
    dayStats.sessionCount++;
    dayStats.uniqueSongs.add(songKey);
    dayStats.uniqueArtists.add(artistKey);
    dayStats.playModeCounts[session.playMode]++;
    
    // 更新总计
    this.data.totalPlayTime += session.playDuration;
    this.data.totalSessions++;
    this.data.lastUpdated = Date.now();
    
    // 清理旧数据（保留最近90天）
    this.cleanupOldData();
  }

  /**
   * 清理超过90天的数据
   */
  private cleanupOldData(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const cutoffString = cutoffDate.toISOString().split('T')[0];
    
    Object.keys(this.data.dailyStats).forEach(date => {
      if (date < cutoffString) {
        delete this.data.dailyStats[date];
      }
    });
  }

  /**
   * 获取统计数据（转换为页面需要的格式）
   */
  getStatistics() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // 获取最近一周的数据
    const weekStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const weekData = this.getWeeklyStats(weekStart, now);
    
    // 获取最喜欢的歌曲和艺术家
    const topSong = this.getTopSong();
    const topArtist = this.getTopArtist();
    
    // 计算趋势
    const trends = this.calculateTrends();
    
    return {
      allTime: {
        totalPlayTime: Math.round(this.data.totalPlayTime),
        totalSongs: this.data.totalSessions,
        uniqueSongs: Object.keys(this.data.songPlayCounts).length,
        uniqueArtists: Object.keys(this.data.artistPlayCounts).length,
        avgSessionLength: this.data.totalSessions > 0 ? Math.round(this.data.totalPlayTime / this.data.totalSessions) : 0,
        longestSession: this.getLongestSession(),
        favoriteSong: topSong,
        favoriteArtist: topArtist?.name || ''
      },
      recent: {
        lastWeek: weekData,
        lastMonth: this.getMonthlyStats(),
        yesterday: this.data.dailyStats[yesterday] ? this.formatDayStats(this.data.dailyStats[yesterday]) : null
      },
      trends
    };
  }

  /**
   * 获取周统计
   */
  private getWeeklyStats(startDate: Date, endDate: Date) {
    let totalPlayTime = 0;
    const songCounts: Record<string, { playCount: number; totalDuration: number; song: Omit<Song, 'audioUrl'> }> = {};
    
    // 遍历这周的每一天
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayStats = this.data.dailyStats[dateStr];
      
      if (dayStats) {
        totalPlayTime += dayStats.totalPlayTime;
        
        // 聚合歌曲统计（这里简化处理，实际应该从session中重新计算）
        Object.keys(this.data.songPlayCounts).forEach(songId => {
          const songData = this.data.songPlayCounts[songId];
          const songSessions = this.data.recentSessions.filter(s => 
            String(s.songId) === songId && 
            new Date(s.startTime).toISOString().split('T')[0] === dateStr
          );
          
          if (songSessions.length > 0) {
            if (!songCounts[songId]) {
              songCounts[songId] = {
                playCount: 0,
                totalDuration: 0,
                song: songData.song
              };
            }
            songCounts[songId].playCount += songSessions.length;
            songCounts[songId].totalDuration += songSessions.reduce((sum, s) => sum + s.playDuration, 0);
          }
        });
      }
    }
    
    // 获取 top songs
    const topSongs = Object.entries(songCounts)
      .map(([, data]) => ({
        song: data.song,
        playCount: data.playCount,
        totalDuration: Math.round(data.totalDuration)
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 10);
    
    return {
      weekStart: startDate.toISOString().split('T')[0],
      weekEnd: endDate.toISOString().split('T')[0],
      totalPlayTime: Math.round(totalPlayTime),
      dailyBreakdown: [], // 可以后续实现
      topSongs,
      topArtists: Object.entries(this.data.artistPlayCounts)
        .map(([artist, data]) => ({
          artist,
          playCount: data.playCount,
          totalDuration: Math.round(data.totalDuration)
        }))
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 10)
    };
  }

  /**
   * 获取月度统计
   */
  private getMonthlyStats() {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let totalPlayTime = 0;
    let newSongsCount = 0;
    let newArtistsCount = 0;
    
    // 统计本月数据
    Object.entries(this.data.dailyStats).forEach(([date, dayStats]) => {
      if (date.startsWith(thisMonth)) {
        totalPlayTime += dayStats.totalPlayTime;
      }
    });
    
    // 计算新发现的歌曲和艺术家（这里简化处理）
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    Object.values(this.data.songPlayCounts).forEach(songData => {
      if (songData.lastPlayed >= monthStart) {
        newSongsCount++;
      }
    });
    
    Object.values(this.data.artistPlayCounts).forEach(artistData => {
      if (artistData.lastPlayed >= monthStart) {
        newArtistsCount++;
      }
    });
    
    return {
      month: thisMonth,
      totalPlayTime: Math.round(totalPlayTime),
      weeklyBreakdown: [],
      topSongs: [],
      topArtists: [],
      discoveryStats: {
        newSongsCount,
        newArtistsCount
      }
    };
  }

  /**
   * 格式化每日统计
   */
  private formatDayStats(dayStats: DailyStats) {
    return {
      date: dayStats.date,
      totalPlayTime: Math.round(dayStats.totalPlayTime),
      songCount: dayStats.sessionCount,
      uniqueSongCount: dayStats.uniqueSongs.size,
      topSongs: [],
      topArtists: [],
      playModeStats: dayStats.playModeCounts
    };
  }

  /**
   * 获取最喜欢的歌曲
   */
  private getTopSong() {
    const topSongEntry = Object.entries(this.data.songPlayCounts)
      .sort(([,a], [,b]) => b.playCount - a.playCount)[0];
    
    return topSongEntry ? topSongEntry[1].song : null;
  }

  /**
   * 获取最喜欢的艺术家
   */
  private getTopArtist() {
    const topArtistEntry = Object.entries(this.data.artistPlayCounts)
      .sort(([,a], [,b]) => b.playCount - a.playCount)[0];
    
    return topArtistEntry ? { name: topArtistEntry[0], ...topArtistEntry[1] } : null;
  }

  /**
   * 获取最长播放会话
   */
  private getLongestSession(): number {
    return this.data.recentSessions.reduce((max, session) => 
      Math.max(max, session.playDuration), 0
    );
  }

  /**
   * 计算趋势
   */
  private calculateTrends() {
    // 这里可以实现更复杂的趋势计算
    return {
      playTimeGrowth: 15.5, // 可以基于历史数据计算
      discoveryRate: Object.keys(this.data.songPlayCounts).length / Math.max(this.data.totalSessions, 1),
      repeatRate: this.calculateRepeatRate()
    };
  }

  /**
   * 计算重复播放率
   */
  private calculateRepeatRate(): number {
    const totalPlays = this.data.totalSessions;
    const uniqueSongs = Object.keys(this.data.songPlayCounts).length;
    
    return totalPlays > 0 ? Math.max(0, (totalPlays - uniqueSongs) / totalPlays) : 0;
  }

  /**
   * 获取原始数据（用于持久化）
   */
  getRawData(): RealTimeStatistics {
    // 转换 Set 为数组以便持久化
    const dataForStorage = { ...this.data };
    Object.values(dataForStorage.dailyStats).forEach(dayStats => {
      const modifiableDayStats = dayStats as DailyStats & { uniqueSongs: string[]; uniqueArtists: string[] };
      modifiableDayStats.uniqueSongs = Array.from(dayStats.uniqueSongs) as never;
      modifiableDayStats.uniqueArtists = Array.from(dayStats.uniqueArtists) as never;
    });
    
    return dataForStorage as RealTimeStatistics;
  }
}