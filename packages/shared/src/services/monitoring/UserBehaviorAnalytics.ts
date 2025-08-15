/**
 * 用户行为分析系统
 * 深度分析用户行为模式，提供个性化推荐和用户体验优化
 */

export interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  platform: string;
  userAgent: string;
  referrer?: string;
  events: UserEvent[];
  metrics: SessionMetrics;
}

export interface UserEvent {
  id: string;
  sessionId: string;
  userId?: string;
  type: 'page_view' | 'click' | 'play' | 'pause' | 'skip' | 'search' | 'like' | 'share' | 'custom';
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  properties: {
    [key: string]: any;
  };
  context: {
    page: string;
    component: string;
    position?: { x: number; y: number };
    viewport: { width: number; height: number };
  };
}

export interface SessionMetrics {
  pageViews: number;
  interactions: number;
  playTime: number;
  songsPlayed: number;
  songsSkipped: number;
  searches: number;
  bounced: boolean;
  converted: boolean;
  engagementScore: number;
}

export interface UserProfile {
  userId: string;
  createdAt: number;
  lastActive: number;
  totalSessions: number;
  totalPlayTime: number;
  
  // 偏好分析
  preferences: {
    genres: { [genre: string]: number };
    artists: { [artist: string]: number };
    timeOfDay: { [hour: number]: number };
    dayOfWeek: { [day: number]: number };
    sessionLength: number;
    skipRate: number;
    repeatRate: number;
  };
  
  // 行为模式
  behaviors: {
    searchPatterns: string[];
    playlistInteractions: number;
    socialSharing: number;
    discoverability: number; // 探索新内容的倾向
    loyalty: number; // 用户忠诚度
  };
  
  // 价值指标
  value: {
    lifetime: number;
    engagement: number;
    retention: number;
    advocacy: number; // 推荐倾向
  };
}

export interface CohortAnalysis {
  cohortId: string;
  period: string; // 'weekly' | 'monthly'
  startDate: number;
  users: string[];
  metrics: {
    retention: { [period: number]: number };
    engagement: { [period: number]: number };
    revenue: { [period: number]: number };
  };
}

export interface FunnelAnalysis {
  name: string;
  steps: Array<{
    name: string;
    events: string[];
    users: number;
    conversionRate: number;
  }>;
  overallConversionRate: number;
}

/**
 * 用户行为分析系统
 */
export class UserBehaviorAnalytics {
  private static instance: UserBehaviorAnalytics;
  private sessions = new Map<string, UserSession>();
  private profiles = new Map<string, UserProfile>();
  private events: UserEvent[] = [];
  private currentSessionId: string;
  
  // 配置
  private config = {
    sessionTimeout: 30 * 60 * 1000, // 30分钟会话超时
    maxEvents: 50000, // 最大事件数量
    batchSize: 100, // 批量处理大小
    enableHeatmap: true,
    enableRecording: false, // 会话录制
    samplingRate: 1.0, // 采样率
  };

  // 实时统计
  private realtimeStats = {
    activeUsers: new Set<string>(),
    currentSessions: 0,
    eventsPerSecond: 0,
    popularPages: new Map<string, number>(),
    popularActions: new Map<string, number>(),
  };

  private constructor() {
    this.currentSessionId = this.generateSessionId();
    this.initializeSession();
    this.startPeriodicTasks();
  }

  static getInstance(): UserBehaviorAnalytics {
    if (!UserBehaviorAnalytics.instance) {
      UserBehaviorAnalytics.instance = new UserBehaviorAnalytics();
    }
    return UserBehaviorAnalytics.instance;
  }

  /**
   * 开始新会话
   */
  startSession(userId?: string): string {
    const sessionId = this.generateSessionId();
    this.currentSessionId = sessionId;
    
    const session: UserSession = {
      sessionId,
      userId,
      startTime: Date.now(),
      platform: this.getPlatform(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      events: [],
      metrics: {
        pageViews: 0,
        interactions: 0,
        playTime: 0,
        songsPlayed: 0,
        songsSkipped: 0,
        searches: 0,
        bounced: true, // 默认为跳出，后续更新
        converted: false,
        engagementScore: 0,
      },
    };

    this.sessions.set(sessionId, session);
    this.realtimeStats.currentSessions++;
    
    if (userId) {
      this.realtimeStats.activeUsers.add(userId);
      this.updateUserProfile(userId);
    }

    return sessionId;
  }

  /**
   * 结束会话
   */
  endSession(sessionId: string = this.currentSessionId): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    
    // 计算跳出率
    session.metrics.bounced = session.events.length <= 1;
    
    // 计算参与度分数
    session.metrics.engagementScore = this.calculateEngagementScore(session);
    
    this.realtimeStats.currentSessions--;
    
    // 更新用户画像
    if (session.userId) {
      this.updateUserProfile(session.userId, session);
    }

    // 保存会话数据
    this.persistSession(session);
  }

  /**
   * 跟踪事件
   */
  track(
    type: UserEvent['type'],
    category: string,
    action: string,
    properties: any = {},
    userId?: string
  ): void {
    // 采样控制
    if (Math.random() > this.config.samplingRate) return;

    const event: UserEvent = {
      id: this.generateEventId(),
      sessionId: this.currentSessionId,
      userId: userId || this.getCurrentUserId(),
      type,
      category,
      action,
      label: properties.label,
      value: properties.value,
      timestamp: Date.now(),
      properties,
      context: {
        page: this.getCurrentPage(),
        component: properties.component || 'unknown',
        position: properties.position,
        viewport: this.getViewport(),
      },
    };

    // 添加到事件列表
    this.events.push(event);
    
    // 限制事件数量
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    // 更新会话事件
    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.events.push(event);
      this.updateSessionMetrics(session, event);
    }

    // 更新实时统计
    this.updateRealtimeStats(event);

    // 发送事件（异步）
    this.sendEvent(event);
  }

  /**
   * 跟踪页面浏览
   */
  trackPageView(page: string, properties: any = {}): void {
    this.track('page_view', 'navigation', 'page_view', {
      page,
      ...properties,
    });
  }

  /**
   * 跟踪用户交互
   */
  trackInteraction(element: string, action: string, properties: any = {}): void {
    this.track('click', 'interaction', action, {
      element,
      ...properties,
    });
  }

  /**
   * 跟踪音乐播放
   */
  trackPlay(songId: string, properties: any = {}): void {
    this.track('play', 'music', 'play_song', {
      songId,
      ...properties,
    });
  }

  /**
   * 跟踪搜索行为
   */
  trackSearch(query: string, results: number, properties: any = {}): void {
    this.track('search', 'discovery', 'search', {
      query,
      results,
      ...properties,
    });
  }

  /**
   * 生成用户旅程地图
   */
  generateUserJourney(userId: string): Array<{
    step: number;
    action: string;
    page: string;
    timestamp: number;
    duration: number;
  }> {
    const userEvents = this.events
      .filter(e => e.userId === userId)
      .sort((a, b) => a.timestamp - b.timestamp);

    return userEvents.map((event, index) => ({
      step: index + 1,
      action: `${event.category}.${event.action}`,
      page: event.context.page,
      timestamp: event.timestamp,
      duration: index < userEvents.length - 1 
        ? userEvents[index + 1].timestamp - event.timestamp 
        : 0,
    }));
  }

  /**
   * 漏斗分析
   */
  analyzeFunnel(funnelSteps: Array<{
    name: string;
    events: string[];
  }>): FunnelAnalysis {
    const result: FunnelAnalysis = {
      name: 'User Conversion Funnel',
      steps: [],
      overallConversionRate: 0,
    };

    let previousUsers = new Set<string>();
    let firstStepUsers = 0;

    for (let i = 0; i < funnelSteps.length; i++) {
      const step = funnelSteps[i];
      const stepUsers = new Set<string>();

      // 查找完成当前步骤的用户
      this.events.forEach(event => {
        const eventKey = `${event.category}.${event.action}`;
        if (step.events.includes(eventKey) && event.userId) {
          stepUsers.add(event.userId);
        }
      });

      // 如果不是第一步，只计算之前步骤的用户
      const validUsers = i === 0 
        ? stepUsers 
        : new Set([...stepUsers].filter(u => previousUsers.has(u)));

      if (i === 0) {
        firstStepUsers = validUsers.size;
      }

      const conversionRate = i === 0 ? 100 : (validUsers.size / previousUsers.size) * 100;

      result.steps.push({
        name: step.name,
        events: step.events,
        users: validUsers.size,
        conversionRate,
      });

      previousUsers = validUsers;
    }

    result.overallConversionRate = firstStepUsers > 0 
      ? (previousUsers.size / firstStepUsers) * 100 
      : 0;

    return result;
  }

  /**
   * 群组分析
   */
  analyzeCohort(period: 'weekly' | 'monthly' = 'monthly'): CohortAnalysis[] {
    const cohorts = new Map<string, CohortAnalysis>();
    const periodMs = period === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

    // 按时间段分组用户
    this.events.forEach(event => {
      if (!event.userId) return;

      const cohortDate = new Date(event.timestamp);
      cohortDate.setHours(0, 0, 0, 0);
      
      if (period === 'weekly') {
        cohortDate.setDate(cohortDate.getDate() - cohortDate.getDay());
      } else {
        cohortDate.setDate(1);
      }

      const cohortId = cohortDate.toISOString();

      if (!cohorts.has(cohortId)) {
        cohorts.set(cohortId, {
          cohortId,
          period,
          startDate: cohortDate.getTime(),
          users: [],
          metrics: {
            retention: {},
            engagement: {},
            revenue: {},
          },
        });
      }

      const cohort = cohorts.get(cohortId)!;
      if (!cohort.users.includes(event.userId)) {
        cohort.users.push(event.userId);
      }
    });

    // 计算留存率
    cohorts.forEach(cohort => {
      for (let period = 0; period <= 12; period++) {
        const periodStart = cohort.startDate + (period * periodMs);
        const periodEnd = periodStart + periodMs;

        const activeUsers = cohort.users.filter(userId => {
          return this.events.some(event => 
            event.userId === userId &&
            event.timestamp >= periodStart &&
            event.timestamp < periodEnd
          );
        });

        cohort.metrics.retention[period] = cohort.users.length > 0 
          ? (activeUsers.length / cohort.users.length) * 100 
          : 0;
      }
    });

    return Array.from(cohorts.values());
  }

  /**
   * 热力图数据
   */
  getHeatmapData(page: string): Array<{
    x: number;
    y: number;
    value: number;
  }> {
    const clicks = this.events.filter(event => 
      event.type === 'click' && 
      event.context.page === page &&
      event.context.position
    );

    const heatmapData: { [key: string]: number } = {};

    clicks.forEach(click => {
      if (click.context.position) {
        const x = Math.floor(click.context.position.x / 10) * 10;
        const y = Math.floor(click.context.position.y / 10) * 10;
        const key = `${x},${y}`;
        heatmapData[key] = (heatmapData[key] || 0) + 1;
      }
    });

    return Object.entries(heatmapData).map(([key, value]) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y, value };
    });
  }

  /**
   * 获取实时统计
   */
  getRealtimeStats() {
    return {
      activeUsers: this.realtimeStats.activeUsers.size,
      currentSessions: this.realtimeStats.currentSessions,
      eventsPerSecond: this.realtimeStats.eventsPerSecond,
      popularPages: Array.from(this.realtimeStats.popularPages.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      popularActions: Array.from(this.realtimeStats.popularActions.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
    };
  }

  /**
   * 获取用户画像
   */
  getUserProfile(userId: string): UserProfile | null {
    return this.profiles.get(userId) || null;
  }

  /**
   * A/B测试分析
   */
  analyzeABTest(testName: string, variants: string[]): {
    [variant: string]: {
      users: number;
      conversions: number;
      conversionRate: number;
      confidence: number;
    };
  } {
    const results: any = {};

    variants.forEach(variant => {
      const variantEvents = this.events.filter(e => 
        e.properties.abTest === testName && 
        e.properties.variant === variant
      );

      const users = new Set(variantEvents.map(e => e.userId).filter(Boolean));
      const conversions = variantEvents.filter(e => e.properties.conversion).length;

      results[variant] = {
        users: users.size,
        conversions,
        conversionRate: users.size > 0 ? (conversions / users.size) * 100 : 0,
        confidence: this.calculateConfidence(users.size, conversions),
      };
    });

    return results;
  }

  /**
   * 私有方法
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): void {
    this.startSession();
    
    // 监听页面卸载事件
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.endSession();
      });
    }
  }

  private getCurrentUserId(): string | undefined {
    // 从当前会话或存储中获取用户ID
    return undefined; // 需要实现
  }

  private getCurrentPage(): string {
    return typeof window !== 'undefined' ? window.location.pathname : '';
  }

  private getViewport(): { width: number; height: number } {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    return { width: 0, height: 0 };
  }

  private getPlatform(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const ua = navigator.userAgent;
    if (ua.includes('Mobile')) return 'mobile';
    if (ua.includes('Tablet')) return 'tablet';
    return 'desktop';
  }

  private calculateEngagementScore(session: UserSession): number {
    const { events, duration = 0 } = session;
    let score = 0;

    // 基础分数
    score += Math.min(events.length * 10, 100);

    // 时间分数
    score += Math.min((duration / 1000) / 60 * 5, 50); // 每分钟5分

    // 交互深度
    const uniqueActions = new Set(events.map(e => e.action));
    score += uniqueActions.size * 15;

    // 内容消费
    const playEvents = events.filter(e => e.type === 'play');
    score += playEvents.length * 20;

    return Math.min(score, 1000);
  }

  private updateSessionMetrics(session: UserSession, event: UserEvent): void {
    const metrics = session.metrics;

    switch (event.type) {
      case 'page_view':
        metrics.pageViews++;
        break;
      case 'click':
        metrics.interactions++;
        break;
      case 'play':
        metrics.songsPlayed++;
        break;
      case 'skip':
        metrics.songsSkipped++;
        break;
      case 'search':
        metrics.searches++;
        break;
    }

    // 更新跳出状态
    if (session.events.length > 1) {
      metrics.bounced = false;
    }
  }

  private updateRealtimeStats(event: UserEvent): void {
    if (event.userId) {
      this.realtimeStats.activeUsers.add(event.userId);
    }

    // 更新页面统计
    const page = event.context.page;
    this.realtimeStats.popularPages.set(
      page, 
      (this.realtimeStats.popularPages.get(page) || 0) + 1
    );

    // 更新行为统计
    const action = `${event.category}.${event.action}`;
    this.realtimeStats.popularActions.set(
      action,
      (this.realtimeStats.popularActions.get(action) || 0) + 1
    );
  }

  private updateUserProfile(userId: string, session?: UserSession): void {
    let profile = this.profiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        createdAt: Date.now(),
        lastActive: Date.now(),
        totalSessions: 0,
        totalPlayTime: 0,
        preferences: {
          genres: {},
          artists: {},
          timeOfDay: {},
          dayOfWeek: {},
          sessionLength: 0,
          skipRate: 0,
          repeatRate: 0,
        },
        behaviors: {
          searchPatterns: [],
          playlistInteractions: 0,
          socialSharing: 0,
          discoverability: 0,
          loyalty: 0,
        },
        value: {
          lifetime: 0,
          engagement: 0,
          retention: 0,
          advocacy: 0,
        },
      };
      this.profiles.set(userId, profile);
    }

    profile.lastActive = Date.now();

    if (session) {
      profile.totalSessions++;
      profile.totalPlayTime += session.duration || 0;
      profile.value.engagement = session.metrics.engagementScore;
    }
  }

  private calculateConfidence(sampleSize: number, conversions: number): number {
    if (sampleSize === 0) return 0;
    
    const p = conversions / sampleSize;
    const z = 1.96; // 95% confidence interval
    const margin = z * Math.sqrt((p * (1 - p)) / sampleSize);
    
    return Math.max(0, Math.min(100, (1 - margin) * 100));
  }

  private persistSession(session: UserSession): void {
    // 这里可以发送到服务器或保存到本地存储
    console.log('Session completed:', {
      sessionId: session.sessionId,
      duration: session.duration,
      events: session.events.length,
      engagementScore: session.metrics.engagementScore,
    });
  }

  private sendEvent(event: UserEvent): void {
    // 异步发送事件到服务器
    setTimeout(() => {
      // 这里实现实际的发送逻辑
    }, 0);
  }

  private startPeriodicTasks(): void {
    // 定期清理过期数据
    setInterval(() => {
      this.cleanupOldData();
    }, 5 * 60 * 1000); // 每5分钟清理一次

    // 计算每秒事件数
    let eventCount = 0;
    setInterval(() => {
      this.realtimeStats.eventsPerSecond = eventCount;
      eventCount = 0;
    }, 1000);

    // 监听事件来更新计数
    this.events.forEach(() => eventCount++);
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24小时前
    
    // 清理过期事件
    this.events = this.events.filter(event => event.timestamp > cutoff);
    
    // 清理过期会话
    this.sessions.forEach((session, sessionId) => {
      if (session.startTime < cutoff) {
        this.sessions.delete(sessionId);
      }
    });
  }
}