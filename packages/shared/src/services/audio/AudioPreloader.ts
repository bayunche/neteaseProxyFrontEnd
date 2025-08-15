/**
 * 智能音频预加载服务
 * 实现基于用户行为和播放模式的音频预加载策略
 */

import type { Song, PlayMode } from '../../types';

// 预加载状态
export enum PreloadStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  LOADED = 'loaded',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}

// 预加载项目
export interface PreloadItem {
  song: Song;
  url: string;
  status: PreloadStatus;
  priority: number;
  timestamp: number;
  progress?: number;
  error?: Error;
  abortController?: AbortController;
}

// 预加载策略配置
export interface PreloadConfig {
  // 基础配置
  maxConcurrentPreloads: number;
  maxCacheSize: number; // MB
  preloadBufferSize: number; // 预加载缓冲区大小(字节)
  
  // 预加载策略
  nextSongsCount: number; // 预加载接下来几首歌
  prevSongsCount: number; // 预加载前面几首歌
  relatedSongsCount: number; // 预加载相关歌曲数量
  
  // 优先级权重
  priorityWeights: {
    next: number;
    previous: number;
    related: number;
    popular: number;
    recent: number;
  };
  
  // 网络策略
  enableOnCellular: boolean;
  cellularQualityLimit: 'low' | 'medium' | 'high';
  wifiOnlyPreload: boolean;
  
  // 存储策略
  maxCacheAge: number; // 缓存最大年龄(毫秒)
  cleanupThreshold: number; // 清理阈值(MB)
}

// 默认配置
const defaultConfig: PreloadConfig = {
  maxConcurrentPreloads: 3,
  maxCacheSize: 100, // 100MB
  preloadBufferSize: 1024 * 1024, // 1MB
  nextSongsCount: 3,
  prevSongsCount: 1,
  relatedSongsCount: 2,
  priorityWeights: {
    next: 1.0,
    previous: 0.7,
    related: 0.5,
    popular: 0.3,
    recent: 0.4,
  },
  enableOnCellular: false,
  cellularQualityLimit: 'medium',
  wifiOnlyPreload: true,
  maxCacheAge: 24 * 60 * 60 * 1000, // 24小时
  cleanupThreshold: 80, // 80MB时开始清理
};

// 网络状态检测接口
export interface NetworkInfo {
  isConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'unknown';
  isMetered: boolean;
  downloadSpeed?: number; // Mbps
}

// 用户行为分析数据
export interface UserBehavior {
  skipRate: number; // 跳过率
  repeatRate: number; // 重复播放率
  genrePreferences: Record<string, number>; // 流派偏好
  artistPreferences: Record<string, number>; // 艺人偏好
  timeOfDayPatterns: Record<string, number>; // 时间段偏好
  sessionLength: number; // 平均会话长度
}

/**
 * 智能音频预加载器
 */
export class AudioPreloader {
  private static instance: AudioPreloader;
  private config: PreloadConfig;
  private preloadQueue: Map<string, PreloadItem> = new Map();
  private cache: Map<string, ArrayBuffer> = new Map();
  private cacheSize: number = 0;
  private activePreloads: Set<string> = new Set();
  
  // 策略分析器
  private behaviorAnalyzer: UserBehaviorAnalyzer;
  private networkMonitor: NetworkMonitor;
  
  private constructor(config: Partial<PreloadConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.behaviorAnalyzer = new UserBehaviorAnalyzer();
    this.networkMonitor = new NetworkMonitor();
    
    // 定期清理缓存
    this.startCacheCleanup();
  }
  
  static getInstance(config?: Partial<PreloadConfig>): AudioPreloader {
    if (!AudioPreloader.instance) {
      AudioPreloader.instance = new AudioPreloader(config);
    }
    return AudioPreloader.instance;
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<PreloadConfig>) {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 开始预加载策略
   */
  async startPreloadStrategy(
    currentSong: Song,
    playlist: Song[],
    currentIndex: number,
    playMode: PlayMode
  ) {
    try {
      // 检查网络状态
      const networkInfo = await this.networkMonitor.getNetworkInfo();
      if (!this.shouldPreloadOnNetwork(networkInfo)) {
        console.log('Skipping preload due to network conditions');
        return;
      }
      
      // 获取用户行为数据
      const behavior = this.behaviorAnalyzer.getCurrentBehavior();
      
      // 生成预加载队列
      const preloadCandidates = this.generatePreloadCandidates(
        currentSong,
        playlist,
        currentIndex,
        playMode,
        behavior
      );
      
      // 执行预加载
      await this.executePreloadStrategy(preloadCandidates);
      
    } catch (error) {
      console.error('Preload strategy failed:', error);
    }
  }
  
  /**
   * 生成预加载候选列表
   */
  private generatePreloadCandidates(
    currentSong: Song,
    playlist: Song[],
    currentIndex: number,
    playMode: PlayMode,
    behavior: UserBehavior
  ): Array<{ song: Song; priority: number; reason: string }> {
    const candidates: Array<{ song: Song; priority: number; reason: string }> = [];
    
    // 1. 接下来的歌曲(基于播放模式)
    const nextSongs = this.getNextSongs(playlist, currentIndex, playMode);
    nextSongs.forEach((song, index) => {
      const priority = this.config.priorityWeights.next * (1 - index * 0.2);
      candidates.push({ song, priority, reason: `next_${index + 1}` });
    });
    
    // 2. 前面的歌曲(支持向前播放)
    const prevSongs = this.getPreviousSongs(playlist, currentIndex);
    prevSongs.forEach((song, index) => {
      const priority = this.config.priorityWeights.previous * (1 - index * 0.3);
      candidates.push({ song, priority, reason: `prev_${index + 1}` });
    });
    
    // 3. 相关歌曲(基于用户偏好)
    const relatedSongs = this.getRelatedSongs(currentSong, behavior);
    relatedSongs.forEach((song, index) => {
      const priority = this.config.priorityWeights.related * (1 - index * 0.2);
      candidates.push({ song, priority, reason: `related_${index + 1}` });
    });
    
    // 4. 热门歌曲(基于播放统计)
    const popularSongs = this.getPopularSongs(playlist, behavior);
    popularSongs.forEach((song, index) => {
      const priority = this.config.priorityWeights.popular * (1 - index * 0.4);
      candidates.push({ song, priority, reason: `popular_${index + 1}` });
    });
    
    // 5. 最近播放(基于历史)
    const recentSongs = this.getRecentSongs(behavior);
    recentSongs.forEach((song, index) => {
      const priority = this.config.priorityWeights.recent * (1 - index * 0.3);
      candidates.push({ song, priority, reason: `recent_${index + 1}` });
    });
    
    // 去重并排序
    const uniqueCandidates = this.deduplicateAndSort(candidates);
    
    return uniqueCandidates.slice(0, 10); // 限制候选数量
  }
  
  /**
   * 执行预加载策略
   */
  private async executePreloadStrategy(
    candidates: Array<{ song: Song; priority: number; reason: string }>
  ) {
    // 取消低优先级的预加载
    this.cancelLowPriorityPreloads(candidates);
    
    // 开始新的预加载
    const promises = candidates
      .slice(0, this.config.maxConcurrentPreloads)
      .map(candidate => this.preloadSong(candidate.song, candidate.priority, candidate.reason));
    
    await Promise.allSettled(promises);
  }
  
  /**
   * 预加载单首歌曲
   */
  async preloadSong(song: Song, priority: number, reason: string): Promise<void> {
    const songId = String(song.id);
    
    // 检查是否已经在缓存中
    if (this.cache.has(songId)) {
      console.log(`Song ${songId} already cached`);
      return;
    }
    
    // 检查是否已经在预加载中
    if (this.activePreloads.has(songId)) {
      console.log(`Song ${songId} already preloading`);
      return;
    }
    
    try {
      this.activePreloads.add(songId);
      
      // 创建预加载项目
      const abortController = new AbortController();
      const preloadItem: PreloadItem = {
        song,
        url: song.url || '',
        status: PreloadStatus.LOADING,
        priority,
        timestamp: Date.now(),
        abortController,
      };
      
      this.preloadQueue.set(songId, preloadItem);
      
      console.log(`Starting preload for ${song.title} (${reason}, priority: ${priority})`);
      
      // 开始预加载
      const audioData = await this.fetchAudioData(song.url || '', abortController.signal);
      
      // 存储到缓存
      this.addToCache(songId, audioData);
      
      // 更新状态
      preloadItem.status = PreloadStatus.LOADED;
      
      console.log(`Preload completed for ${song.title}`);
      
    } catch (error) {
      console.error(`Preload failed for ${song.title}:`, error);
      
      const preloadItem = this.preloadQueue.get(songId);
      if (preloadItem) {
        preloadItem.status = PreloadStatus.ERROR;
        preloadItem.error = error as Error;
      }
      
    } finally {
      this.activePreloads.delete(songId);
    }
  }
  
  /**
   * 获取预加载的音频数据
   */
  getPreloadedAudio(songId: string): ArrayBuffer | null {
    return this.cache.get(songId) || null;
  }
  
  /**
   * 获取预加载状态
   */
  getPreloadStatus(songId: string): PreloadStatus {
    const item = this.preloadQueue.get(songId);
    return item?.status || PreloadStatus.IDLE;
  }
  
  /**
   * 取消预加载
   */
  cancelPreload(songId: string) {
    const item = this.preloadQueue.get(songId);
    if (item && item.abortController) {
      item.abortController.abort();
      item.status = PreloadStatus.CANCELLED;
      this.activePreloads.delete(songId);
    }
  }
  
  /**
   * 清理缓存
   */
  clearCache(songIds?: string[]) {
    if (songIds) {
      songIds.forEach(id => {
        const size = this.cache.get(id)?.byteLength || 0;
        this.cache.delete(id);
        this.cacheSize -= size;
        this.preloadQueue.delete(id);
      });
    } else {
      this.cache.clear();
      this.cacheSize = 0;
      this.preloadQueue.clear();
    }
  }
  
  // 私有方法实现...
  
  private async fetchAudioData(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.arrayBuffer();
  }
  
  private addToCache(songId: string, data: ArrayBuffer) {
    const size = data.byteLength;
    
    // 检查缓存大小限制
    if (this.cacheSize + size > this.config.maxCacheSize * 1024 * 1024) {
      this.cleanupCache();
    }
    
    this.cache.set(songId, data);
    this.cacheSize += size;
  }
  
  private cleanupCache() {
    // 按时间戳排序，删除最旧的缓存
    const items = Array.from(this.preloadQueue.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    const targetSize = this.config.cleanupThreshold * 1024 * 1024;
    
    for (const [songId] of items) {
      if (this.cacheSize <= targetSize) break;
      
      const size = this.cache.get(songId)?.byteLength || 0;
      this.cache.delete(songId);
      this.preloadQueue.delete(songId);
      this.cacheSize -= size;
    }
  }
  
  private startCacheCleanup() {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }
  
  private cleanupExpiredCache() {
    const now = Date.now();
    const maxAge = this.config.maxCacheAge;
    
    for (const [songId, item] of this.preloadQueue.entries()) {
      if (now - item.timestamp > maxAge) {
        const size = this.cache.get(songId)?.byteLength || 0;
        this.cache.delete(songId);
        this.preloadQueue.delete(songId);
        this.cacheSize -= size;
      }
    }
  }
  
  private shouldPreloadOnNetwork(networkInfo: NetworkInfo): boolean {
    if (!networkInfo.isConnected) return false;
    
    if (networkInfo.connectionType === 'cellular') {
      return this.config.enableOnCellular && !networkInfo.isMetered;
    }
    
    return true;
  }
  
  private getNextSongs(playlist: Song[], currentIndex: number, playMode: PlayMode): Song[] {
    const songs: Song[] = [];
    const count = this.config.nextSongsCount;
    
    switch (playMode) {
      case 'sequence':
        for (let i = 1; i <= count && currentIndex + i < playlist.length; i++) {
          songs.push(playlist[currentIndex + i]);
        }
        break;
        
      case 'list_loop':
        for (let i = 1; i <= count; i++) {
          const index = (currentIndex + i) % playlist.length;
          songs.push(playlist[index]);
        }
        break;
        
      case 'random':
        // 基于随机算法预测可能的下一首歌
        const remaining = playlist.filter((_, index) => index !== currentIndex);
        const shuffled = this.shuffleArray([...remaining]).slice(0, count);
        songs.push(...shuffled);
        break;
        
      default:
        break;
    }
    
    return songs;
  }
  
  private getPreviousSongs(playlist: Song[], currentIndex: number): Song[] {
    const songs: Song[] = [];
    const count = this.config.prevSongsCount;
    
    for (let i = 1; i <= count && currentIndex - i >= 0; i++) {
      songs.push(playlist[currentIndex - i]);
    }
    
    return songs;
  }
  
  private getRelatedSongs(currentSong: Song, behavior: UserBehavior): Song[] {
    // 基于用户偏好和歌曲特征获取相关歌曲
    // 这里需要实现推荐算法
    return [];
  }
  
  private getPopularSongs(playlist: Song[], behavior: UserBehavior): Song[] {
    // 基于播放统计获取热门歌曲
    return [];
  }
  
  private getRecentSongs(behavior: UserBehavior): Song[] {
    // 基于最近播放历史获取歌曲
    return [];
  }
  
  private deduplicateAndSort(candidates: Array<{ song: Song; priority: number; reason: string }>) {
    const unique = new Map<string, { song: Song; priority: number; reason: string }>();
    
    candidates.forEach(candidate => {
      const candidateId = String(candidate.song.id);
      const existing = unique.get(candidateId);
      if (!existing || candidate.priority > existing.priority) {
        unique.set(candidateId, candidate);
      }
    });
    
    return Array.from(unique.values()).sort((a, b) => b.priority - a.priority);
  }
  
  private cancelLowPriorityPreloads(newCandidates: Array<{ song: Song; priority: number; reason: string }>) {
    const minPriority = Math.min(...newCandidates.slice(0, this.config.maxConcurrentPreloads).map(c => c.priority));
    
    for (const [songId, item] of this.preloadQueue.entries()) {
      if (item.status === PreloadStatus.LOADING && item.priority < minPriority) {
        this.cancelPreload(songId);
      }
    }
  }
  
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * 用户行为分析器
 */
class UserBehaviorAnalyzer {
  getCurrentBehavior(): UserBehavior {
    // 这里实现用户行为分析逻辑
    return {
      skipRate: 0.2,
      repeatRate: 0.15,
      genrePreferences: {},
      artistPreferences: {},
      timeOfDayPatterns: {},
      sessionLength: 30 * 60, // 30分钟
    };
  }
}

/**
 * 网络监控器
 */
class NetworkMonitor {
  async getNetworkInfo(): Promise<NetworkInfo> {
    // 这里实现网络状态检测逻辑
    return {
      isConnected: true,
      connectionType: 'wifi',
      isMetered: false,
      downloadSpeed: 50, // 50Mbps
    };
  }
}