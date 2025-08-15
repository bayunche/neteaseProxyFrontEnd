/**
 * 智能缓存系统
 * 基于用户行为分析和机器学习的智能预缓存
 */

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  priority: number;
  size: number;
  metadata: {
    userId?: string;
    category: string;
    tags: string[];
    expiresAt?: number;
    dependencies?: string[];
  };
}

export interface UserBehaviorData {
  userId: string;
  listenHistory: {
    songId: string;
    timestamp: number;
    duration: number;
    skipReason?: 'manual' | 'auto' | 'dislike';
  }[];
  searchHistory: string[];
  playlistInteractions: {
    playlistId: string;
    action: 'view' | 'play' | 'add' | 'remove';
    timestamp: number;
  }[];
  timePatterns: {
    preferredHours: number[];
    preferredDays: number[];
    avgSessionLength: number;
  };
}

export interface PredictionModel {
  predictNextSongs(userId: string, currentSong: string, context?: any): Promise<string[]>;
  updateModel(behaviorData: UserBehaviorData): Promise<void>;
  getPopularityScore(songId: string): Promise<number>;
  getPersonalizedScore(userId: string, songId: string): Promise<number>;
}

/**
 * 智能缓存管理器
 */
export class IntelligentCache {
  private static instance: IntelligentCache;
  private cache = new Map<string, CacheEntry>();
  private behaviorData = new Map<string, UserBehaviorData>();
  private predictionModel: PredictionModel;
  
  // 配置参数
  private config = {
    maxSize: 500 * 1024 * 1024, // 500MB
    maxEntries: 10000,
    cleanupThreshold: 0.8, // 80%使用率时开始清理
    predictionHorizon: 24 * 60 * 60 * 1000, // 24小时预测范围
    behaviorAnalysisWindow: 30 * 24 * 60 * 60 * 1000, // 30天行为分析窗口
    minAccessThreshold: 3, // 最小访问次数才考虑优先缓存
  };

  // 缓存统计
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    predictions: 0,
    correctPredictions: 0,
  };

  private constructor(predictionModel: PredictionModel) {
    this.predictionModel = predictionModel;
    this.initializeCleanupTimer();
  }

  static getInstance(predictionModel?: PredictionModel): IntelligentCache {
    if (!IntelligentCache.instance) {
      if (!predictionModel) {
        throw new Error('PredictionModel required for first initialization');
      }
      IntelligentCache.instance = new IntelligentCache(predictionModel);
    }
    return IntelligentCache.instance;
  }

  /**
   * 获取缓存数据
   */
  async get<T>(key: string, userId?: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    if (entry.metadata.expiresAt && Date.now() > entry.metadata.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    entry.priority = this.calculatePriority(entry, userId);

    // 记录用户行为
    if (userId) {
      this.recordAccess(userId, key, entry.metadata.category);
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * 设置缓存数据
   */
  async set<T>(
    key: string, 
    data: T, 
    metadata: CacheEntry['metadata'],
    userId?: string
  ): Promise<void> {
    const size = this.estimateSize(data);
    
    // 检查是否需要清理空间
    if (this.shouldCleanup(size)) {
      await this.intelligentCleanup();
    }

    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
      priority: 1,
      size,
      metadata,
    };

    // 计算初始优先级
    entry.priority = this.calculatePriority(entry, userId);

    this.cache.set(key, entry);

    // 触发预测性缓存
    if (userId && metadata.category === 'audio') {
      await this.triggerPredictiveCache(userId, key);
    }
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 记录用户行为数据
   */
  recordUserBehavior(userId: string, behavior: Partial<UserBehaviorData>): void {
    const existing = this.behaviorData.get(userId) || {
      userId,
      listenHistory: [],
      searchHistory: [],
      playlistInteractions: [],
      timePatterns: {
        preferredHours: [],
        preferredDays: [],
        avgSessionLength: 0,
      },
    };

    // 合并行为数据
    if (behavior.listenHistory) {
      existing.listenHistory.push(...behavior.listenHistory);
      // 保持最近的记录
      existing.listenHistory = existing.listenHistory
        .slice(-1000)
        .sort((a, b) => b.timestamp - a.timestamp);
    }

    if (behavior.searchHistory) {
      existing.searchHistory.push(...behavior.searchHistory);
      existing.searchHistory = existing.searchHistory.slice(-100);
    }

    if (behavior.playlistInteractions) {
      existing.playlistInteractions.push(...behavior.playlistInteractions);
      existing.playlistInteractions = existing.playlistInteractions.slice(-500);
    }

    this.behaviorData.set(userId, existing);
    
    // 异步更新预测模型
    this.predictionModel.updateModel(existing).catch(console.error);
  }

  /**
   * 预测性缓存
   */
  private async triggerPredictiveCache(userId: string, currentSongKey: string): Promise<void> {
    try {
      const predictions = await this.predictionModel.predictNextSongs(
        userId, 
        currentSongKey,
        { time: Date.now() }
      );

      this.stats.predictions++;

      // 预缓存预测的歌曲
      for (const songId of predictions.slice(0, 5)) { // 预缓存前5首
        const cacheKey = `audio:${songId}`;
        if (!this.cache.has(cacheKey)) {
          // 这里应该调用音频服务预加载
          this.schedulePrefetch(cacheKey, userId);
        }
      }
    } catch (error) {
      console.error('Predictive caching failed:', error);
    }
  }

  /**
   * 调度预获取任务
   */
  private schedulePrefetch(cacheKey: string, userId: string): void {
    // 低优先级异步预获取
    setTimeout(async () => {
      try {
        // 这里应该调用相应的服务来预获取数据
        // 例如：await audioService.prefetch(songId);
        console.log(`Prefetching ${cacheKey} for user ${userId}`);
      } catch (error) {
        console.warn(`Prefetch failed for ${cacheKey}:`, error);
      }
    }, 1000);
  }

  /**
   * 智能清理算法
   */
  private async intelligentCleanup(): Promise<void> {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    // 按优先级排序（低优先级先被清理）
    entries.sort((a, b) => {
      // 综合考虑优先级、访问时间、访问频率
      const scoreA = this.calculateEvictionScore(a, now);
      const scoreB = this.calculateEvictionScore(b, now);
      return scoreA - scoreB;
    });

    // 清理低分项目直到达到目标大小
    const targetSize = this.config.maxSize * 0.7; // 清理到70%
    let currentSize = this.getCurrentSize();
    let evicted = 0;

    for (const entry of entries) {
      if (currentSize <= targetSize) break;
      
      this.cache.delete(entry.key);
      currentSize -= entry.size;
      evicted++;
    }

    this.stats.evictions += evicted;
    console.log(`Intelligent cleanup: evicted ${evicted} entries, freed ${this.formatBytes(this.getCurrentSize() - currentSize)}`);
  }

  /**
   * 计算缓存项的优先级
   */
  private calculatePriority(entry: CacheEntry, userId?: string): number {
    let priority = 1;

    // 基于访问频率
    priority += Math.log(entry.accessCount + 1) * 0.3;

    // 基于最近访问时间
    const timeSinceAccess = Date.now() - entry.lastAccessed;
    priority += Math.max(0, 1 - timeSinceAccess / (7 * 24 * 60 * 60 * 1000)) * 0.2;

    // 基于内容类型
    switch (entry.metadata.category) {
      case 'audio':
        priority += 2; // 音频文件高优先级
        break;
      case 'image':
        priority += 1;
        break;
      case 'metadata':
        priority += 0.5;
        break;
    }

    // 基于用户个性化评分
    if (userId && entry.metadata.category === 'audio') {
      // 这里可以调用预测模型获取个性化评分
      // priority += personalizedScore * 0.3;
    }

    return Math.max(0, priority);
  }

  /**
   * 计算清理评分（越低越容易被清理）
   */
  private calculateEvictionScore(entry: CacheEntry, now: number): number {
    let score = entry.priority;

    // 访问时间因子
    const daysSinceAccess = (now - entry.lastAccessed) / (24 * 60 * 60 * 1000);
    score -= daysSinceAccess * 0.1;

    // 大小因子（大文件更容易被清理）
    score -= (entry.size / (1024 * 1024)) * 0.01;

    // 过期时间因子
    if (entry.metadata.expiresAt) {
      const daysToExpire = (entry.metadata.expiresAt - now) / (24 * 60 * 60 * 1000);
      if (daysToExpire < 1) {
        score -= 2; // 即将过期的项目优先清理
      }
    }

    return score;
  }

  /**
   * 记录访问行为
   */
  private recordAccess(userId: string, key: string, category: string): void {
    // 简化的行为记录
    const existing = this.behaviorData.get(userId);
    if (existing && category === 'audio') {
      const songId = key.replace('audio:', '');
      existing.listenHistory.push({
        songId,
        timestamp: Date.now(),
        duration: 0, // 这里需要实际的播放时长
      });
    }
  }

  /**
   * 检查是否需要清理
   */
  private shouldCleanup(newDataSize: number): boolean {
    const currentSize = this.getCurrentSize();
    const currentRatio = currentSize / this.config.maxSize;
    
    return currentRatio > this.config.cleanupThreshold ||
           (currentSize + newDataSize) > this.config.maxSize ||
           this.cache.size > this.config.maxEntries;
  }

  /**
   * 获取当前缓存大小
   */
  private getCurrentSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  /**
   * 估算数据大小
   */
  private estimateSize(data: any): number {
    if (typeof data === 'string') {
      return data.length * 2; // UTF-16
    }
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    if (data instanceof Blob) {
      return data.size;
    }
    // 对象的粗略估计
    return JSON.stringify(data).length * 2;
  }

  /**
   * 格式化字节数
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 初始化定期清理定时器
   */
  private initializeCleanupTimer(): void {
    // 每小时检查一次缓存状态
    setInterval(() => {
      const currentRatio = this.getCurrentSize() / this.config.maxSize;
      if (currentRatio > this.config.cleanupThreshold) {
        this.intelligentCleanup().catch(console.error);
      }
    }, 60 * 60 * 1000);
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses),
      predictionAccuracy: this.stats.predictions > 0 ? 
        this.stats.correctPredictions / this.stats.predictions : 0,
      currentSize: this.getCurrentSize(),
      currentEntries: this.cache.size,
      utilizationRate: this.getCurrentSize() / this.config.maxSize,
    };
  }

  /**
   * 导出缓存状态用于调试
   */
  exportState() {
    return {
      config: this.config,
      stats: this.getStats(),
      entries: Array.from(this.cache.values()).map(entry => ({
        key: entry.key,
        size: entry.size,
        accessCount: entry.accessCount,
        priority: entry.priority,
        category: entry.metadata.category,
        age: Date.now() - entry.timestamp,
      })),
    };
  }
}