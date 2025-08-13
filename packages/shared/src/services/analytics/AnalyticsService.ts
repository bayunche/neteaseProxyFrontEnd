/**
 * 统一分析服务
 * 支持多平台数据收集和分析
 */

import type { Song, Playlist, User } from '../../types/index';

// 事件类型定义
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

// 用户行为事件
export interface UserActionEvent extends AnalyticsEvent {
  action: 'play' | 'pause' | 'skip' | 'like' | 'share' | 'search' | 'navigate';
  targetType?: 'song' | 'playlist' | 'artist' | 'album';
  targetId?: string;
}

// 性能事件
export interface PerformanceEvent extends AnalyticsEvent {
  metric: 'app_start' | 'page_load' | 'audio_load' | 'search_time';
  value: number;
  unit: 'ms' | 'seconds' | 'bytes';
}

// 错误事件
export interface ErrorEvent extends AnalyticsEvent {
  error: string;
  stack?: string;
  context?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// 分析配置
export interface AnalyticsConfig {
  enabled: boolean;
  trackUserActions: boolean;
  trackPerformance: boolean;
  trackErrors: boolean;
  batchSize: number;
  flushInterval: number; // ms
  endpoint?: string;
  apiKey?: string;
  userId?: string;
  anonymizeData: boolean;
}

// 默认配置
const defaultConfig: AnalyticsConfig = {
  enabled: true,
  trackUserActions: true,
  trackPerformance: true,
  trackErrors: true,
  batchSize: 50,
  flushInterval: 30000, // 30秒
  anonymizeData: true,
};

/**
 * 分析服务基类
 */
export abstract class AnalyticsService {
  protected config: AnalyticsConfig;
  protected eventQueue: AnalyticsEvent[] = [];
  protected sessionId: string;
  protected flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
    
    if (this.config.enabled) {
      this.startFlushTimer();
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 启动定时刷新
   */
  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * 停止定时刷新
   */
  private stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * 记录事件
   */
  track(event: AnalyticsEvent): void {
    if (!this.config.enabled) return;

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      sessionId: this.sessionId,
      userId: event.userId || this.config.userId,
    };

    // 数据匿名化
    if (this.config.anonymizeData) {
      enrichedEvent.userId = enrichedEvent.userId ? this.hashUserId(enrichedEvent.userId) : undefined;
    }

    this.eventQueue.push(enrichedEvent);

    // 检查是否需要立即刷新
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * 记录用户行为
   */
  trackUserAction(action: UserActionEvent['action'], properties?: Record<string, unknown>): void {
    if (!this.config.trackUserActions) return;

    this.track({
      name: 'user_action',
      properties: {
        action,
        ...properties,
      },
    });
  }

  /**
   * 记录性能指标
   */
  trackPerformance(metric: PerformanceEvent['metric'], value: number, unit: PerformanceEvent['unit'] = 'ms'): void {
    if (!this.config.trackPerformance) return;

    this.track({
      name: 'performance',
      properties: {
        metric,
        value,
        unit,
      },
    });
  }

  /**
   * 记录错误
   */
  trackError(error: string, context?: string, severity: ErrorEvent['severity'] = 'medium'): void {
    if (!this.config.trackErrors) return;

    this.track({
      name: 'error',
      properties: {
        error,
        context,
        severity,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });
  }

  /**
   * 记录页面浏览
   */
  trackPageView(page: string, properties?: Record<string, unknown>): void {
    this.track({
      name: 'page_view',
      properties: {
        page,
        ...properties,
      },
    });
  }

  /**
   * 记录音乐播放
   */
  trackSongPlay(song: Song, playlist?: Playlist): void {
    this.trackUserAction('play', {
      songId: song.id,
      songTitle: song.title,
      artistName: song.artist,
      albumName: song.album,
      duration: song.duration,
      playlistId: playlist?.id,
      playlistName: playlist?.name,
    });
  }

  /**
   * 记录搜索
   */
  trackSearch(query: string, results?: number): void {
    this.trackUserAction('search', {
      query: this.config.anonymizeData ? this.hashString(query) : query,
      resultsCount: results,
    });
  }

  /**
   * 设置用户信息
   */
  setUser(user: Partial<User>): void {
    const userId = this.config.anonymizeData && user.id ? this.hashUserId(user.id) : user.id;
    
    this.track({
      name: 'user_identify',
      properties: {
        userId,
        // 只记录非敏感信息
        userType: user.type,
        registrationDate: user.createdAt,
      },
    });
  }

  /**
   * 批量发送事件
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(events);
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // 重新加入队列进行重试
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): { size: number; sessionId: string } {
    return {
      size: this.eventQueue.length,
      sessionId: this.sessionId,
    };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...newConfig };

    // 根据配置变化启动或停止定时器
    if (!wasEnabled && this.config.enabled) {
      this.startFlushTimer();
    } else if (wasEnabled && !this.config.enabled) {
      this.stopFlushTimer();
      this.eventQueue = []; // 清空队列
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flush(); // 发送剩余事件
  }

  /**
   * 哈希用户ID（用于匿名化）
   */
  private hashUserId(userId: string): string {
    return this.hashString(`user_${userId}`);
  }

  /**
   * 字符串哈希（简单实现）
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 发送事件到服务器（抽象方法）
   */
  protected abstract sendEvents(events: AnalyticsEvent[]): Promise<void>;
}

/**
 * 内存分析服务（用于开发和测试）
 */
export class MemoryAnalyticsService extends AnalyticsService {
  private allEvents: AnalyticsEvent[] = [];

  protected async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    // 在内存中存储事件
    this.allEvents.push(...events);
    console.log(`[Analytics] Stored ${events.length} events, total: ${this.allEvents.length}`);
  }

  /**
   * 获取所有事件
   */
  getAllEvents(): AnalyticsEvent[] {
    return [...this.allEvents];
  }

  /**
   * 清空事件
   */
  clearEvents(): void {
    this.allEvents = [];
  }

  /**
   * 获取事件统计
   */
  getEventStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.allEvents.forEach(event => {
      stats[event.name] = (stats[event.name] || 0) + 1;
    });
    return stats;
  }
}

/**
 * HTTP分析服务
 */
export class HttpAnalyticsService extends AnalyticsService {
  protected async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.endpoint) {
      throw new Error('Analytics endpoint not configured');
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({
        events,
        timestamp: Date.now(),
        sessionId: this.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}

/**
 * 分析服务工厂
 */
export class AnalyticsServiceFactory {
  static create(type: 'memory' | 'http' = 'memory', config?: Partial<AnalyticsConfig>): AnalyticsService {
    switch (type) {
      case 'memory':
        return new MemoryAnalyticsService(config);
      case 'http':
        return new HttpAnalyticsService(config);
      default:
        throw new Error(`Unknown analytics service type: ${type}`);
    }
  }
}