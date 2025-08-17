/**
 * 实时监控系统
 * 提供应用状态的实时监控和告警
 */

export interface MonitoringEvent {
  id: string;
  type: 'error' | 'warning' | 'info' | 'performance' | 'user_action';
  category: string;
  message: string;
  data: any;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: {
    component: string;
    function: string;
    userId?: string;
    sessionId: string;
  };
  context: {
    userAgent: string;
    platform: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  metrics?: {
    [key: string]: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (event: MonitoringEvent) => boolean;
  threshold?: number;
  timeWindow?: number; // 时间窗口(毫秒)
  cooldown?: number; // 冷却时间(毫秒)
  actions: AlertAction[];
  enabled: boolean;
}

export interface AlertAction {
  type: 'console' | 'notification' | 'api' | 'storage';
  config: {
    [key: string]: any;
  };
}

export interface DashboardMetrics {
  // 系统指标
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastUpdated: number;
  };
  
  // 性能指标
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
    memoryUsage: number;
  };
  
  // 用户指标
  userMetrics: {
    activeUsers: number;
    sessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  
  // 业务指标
  businessMetrics: {
    songsPlayed: number;
    playlistsCreated: number;
    searchQueries: number;
    userEngagement: number;
  };
  
  // 实时事件流
  recentEvents: MonitoringEvent[];
}

/**
 * 实时监控器
 */
export class RealTimeMonitor {
  private static instance: RealTimeMonitor;
  private events: MonitoringEvent[] = [];
  private alertRules: AlertRule[] = [];
  private subscribers: Map<string, (event: MonitoringEvent) => void> = new Map();
  private alerts: Map<string, number> = new Map(); // 记录告警触发时间
  private sessionId: string;
  
  // 配置
  private config = {
    maxEvents: 10000, // 最大事件数量
    retentionTime: 24 * 60 * 60 * 1000, // 24小时数据保留时间
    batchSize: 50, // 批量发送大小
    flushInterval: 30000, // 30秒刷新间隔
    enableConsoleLogging: true,
    enableRemoteLogging: false,
  };

  // 性能计数器
  private counters = new Map<string, number>();
  private timers = new Map<string, number>();
  private gauges = new Map<string, number>();

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeDefaultRules();
    this.startPeriodicTasks();
  }

  static getInstance(): RealTimeMonitor {
    if (!RealTimeMonitor.instance) {
      RealTimeMonitor.instance = new RealTimeMonitor();
    }
    return RealTimeMonitor.instance;
  }

  /**
   * 记录事件
   */
  logEvent(
    type: MonitoringEvent['type'],
    category: string,
    message: string,
    data: any = {},
    severity: MonitoringEvent['severity'] = 'low',
    component: string = 'unknown',
    functionName: string = 'unknown'
  ): void {
    const event: MonitoringEvent = {
      id: this.generateEventId(),
      type,
      category,
      message,
      data,
      timestamp: Date.now(),
      severity,
      source: {
        component,
        function: functionName,
        sessionId: this.sessionId,
      },
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        platform: this.detectPlatform(),
        version: this.getAppVersion(),
        environment: this.getEnvironment(),
      },
    };

    // 添加到事件列表
    this.events.push(event);
    
    // 限制事件数量
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    // 控制台日志
    if (this.config.enableConsoleLogging) {
      this.logToConsole(event);
    }

    // 检查告警规则
    this.checkAlertRules(event);

    // 通知订阅者
    this.notifySubscribers(event);

    // 更新计数器
    this.updateCounters(event);
  }

  /**
   * 记录错误
   */
  logError(error: Error, component: string = 'unknown', additionalData: any = {}): void {
    this.logEvent(
      'error',
      'runtime',
      error.message,
      {
        stack: error.stack,
        name: error.name,
        ...additionalData,
      },
      'high',
      component,
      'runtime'
    );
  }

  /**
   * 记录性能指标
   */
  logPerformance(
    metricName: string,
    value: number,
    unit: string = 'ms',
    component: string = 'system'
  ): void {
    this.logEvent(
      'performance',
      'metrics',
      `Performance metric: ${metricName}`,
      { metricName, value, unit },
      'low',
      component,
      'performance'
    );

    // 更新性能计量器
    this.gauges.set(metricName, value);
  }

  /**
   * 记录用户行为
   */
  logUserAction(
    action: string,
    details: any = {},
    userId?: string
  ): void {
    const event: MonitoringEvent = {
      id: this.generateEventId(),
      type: 'user_action',
      category: 'user_behavior',
      message: `User action: ${action}`,
      data: details,
      timestamp: Date.now(),
      severity: 'low',
      source: {
        component: 'user_interface',
        function: action,
        userId,
        sessionId: this.sessionId,
      },
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        platform: this.detectPlatform(),
        version: this.getAppVersion(),
        environment: this.getEnvironment(),
      },
    };

    this.events.push(event);
    this.notifySubscribers(event);
    this.incrementCounter(`user_action.${action}`);
  }

  /**
   * 开始计时
   */
  startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  /**
   * 结束计时并记录
   */
  endTimer(name: string, component: string = 'system'): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} not found`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);
    
    this.logPerformance(name, duration, 'ms', component);
    return duration;
  }

  /**
   * 增加计数器
   */
  incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * 设置仪表值
   */
  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  /**
   * 订阅事件
   */
  subscribe(id: string, callback: (event: MonitoringEvent) => void): void {
    this.subscribers.set(id, callback);
  }

  /**
   * 取消订阅
   */
  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  /**
   * 添加告警规则
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /**
   * 移除告警规则
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules = this.alertRules.filter(rule => rule.id !== ruleId);
  }

  /**
   * 获取仪表板指标
   */
  getDashboardMetrics(): DashboardMetrics {
    const now = Date.now();
    const recentEvents = this.events
      .filter(event => now - event.timestamp < 60000) // 最近1分钟
      .slice(-20); // 最近20个事件

    // 计算错误率
    const totalEvents = this.events.length;
    const errorEvents = this.events.filter(e => e.type === 'error').length;
    const errorRate = totalEvents > 0 ? errorEvents / totalEvents : 0;

    // 计算平均响应时间
    const performanceEvents = this.events
      .filter(e => e.type === 'performance')
      .slice(-100); // 最近100个性能事件
    
    const avgResponseTime = performanceEvents.length > 0
      ? performanceEvents.reduce((sum, e) => sum + (e.data.value || 0), 0) / performanceEvents.length
      : 0;

    return {
      systemHealth: {
        status: this.getSystemHealthStatus(errorRate),
        uptime: now - this.getStartTime(),
        lastUpdated: now,
      },
      performance: {
        avgResponseTime,
        errorRate,
        throughput: this.counters.get('requests_per_minute') || 0,
        memoryUsage: this.gauges.get('memory_usage') || 0,
      },
      userMetrics: {
        activeUsers: this.gauges.get('active_users') || 0,
        sessionDuration: this.gauges.get('avg_session_duration') || 0,
        bounceRate: this.gauges.get('bounce_rate') || 0,
        conversionRate: this.gauges.get('conversion_rate') || 0,
      },
      businessMetrics: {
        songsPlayed: this.counters.get('songs_played') || 0,
        playlistsCreated: this.counters.get('playlists_created') || 0,
        searchQueries: this.counters.get('search_queries') || 0,
        userEngagement: this.gauges.get('user_engagement') || 0,
      },
      recentEvents,
    };
  }

  /**
   * 获取事件查询接口
   */
  queryEvents(filter: {
    type?: MonitoringEvent['type'];
    category?: string;
    severity?: MonitoringEvent['severity'];
    component?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): MonitoringEvent[] {
    let filtered = this.events;

    if (filter.type) {
      filtered = filtered.filter(e => e.type === filter.type);
    }
    if (filter.category) {
      filtered = filtered.filter(e => e.category === filter.category);
    }
    if (filter.severity) {
      filtered = filtered.filter(e => e.severity === filter.severity);
    }
    if (filter.component) {
      filtered = filtered.filter(e => e.source.component === filter.component);
    }
    if (filter.startTime) {
      filtered = filtered.filter(e => e.timestamp >= filter.startTime!);
    }
    if (filter.endTime) {
      filtered = filtered.filter(e => e.timestamp <= filter.endTime!);
    }

    // 按时间降序排序
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    return filter.limit ? filtered.slice(0, filter.limit) : filtered;
  }

  /**
   * 导出数据用于分析
   */
  exportData() {
    return {
      events: this.events,
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      config: this.config,
      sessionId: this.sessionId,
    };
  }

  /**
   * 初始化默认告警规则
   */
  private initializeDefaultRules(): void {
    // 高错误率告警
    this.addAlertRule({
      id: 'high_error_rate',
      name: '高错误率告警',
      description: '当错误率超过5%时触发',
      condition: (event) => {
        const recentErrors = this.events
          .filter(e => Date.now() - e.timestamp < 300000 && e.type === 'error')
          .length;
        const recentTotal = this.events
          .filter(e => Date.now() - e.timestamp < 300000)
          .length;
        
        return recentTotal > 0 && (recentErrors / recentTotal) > 0.05;
      },
      cooldown: 300000, // 5分钟冷却
      actions: [
        { type: 'console', config: { level: 'error' } }
      ],
      enabled: true,
    });

    // 内存使用过高告警
    this.addAlertRule({
      id: 'high_memory_usage',
      name: '内存使用过高',
      description: '当内存使用率超过90%时触发',
      condition: (event) => {
        const memoryUsage = this.gauges.get('memory_usage') || 0;
        return memoryUsage > 0.9;
      },
      cooldown: 600000, // 10分钟冷却
      actions: [
        { type: 'console', config: { level: 'warn' } }
      ],
      enabled: true,
    });

    // 性能下降告警
    this.addAlertRule({
      id: 'performance_degradation',
      name: '性能下降告警',
      description: '当响应时间超过2秒时触发',
      condition: (event) => {
        if (event.type === 'performance' && event.data.value > 2000) {
          return true;
        }
        return false;
      },
      cooldown: 120000, // 2分钟冷却
      actions: [
        { type: 'console', config: { level: 'warn' } }
      ],
      enabled: true,
    });
  }

  /**
   * 检查告警规则
   */
  private checkAlertRules(event: MonitoringEvent): void {
    const now = Date.now();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // 检查冷却时间
      const lastAlert = this.alerts.get(rule.id);
      if (lastAlert && rule.cooldown && (now - lastAlert) < rule.cooldown) {
        continue;
      }

      // 检查条件
      if (rule.condition(event)) {
        this.alerts.set(rule.id, now);
        this.executeAlertActions(rule, event);
      }
    }
  }

  /**
   * 执行告警动作
   */
  private executeAlertActions(rule: AlertRule, event: MonitoringEvent): void {
    for (const action of rule.actions) {
      switch (action.type) {
        case 'console':
          console.warn(`🚨 Alert: ${rule.name}`, {
            rule: rule.description,
            event: event.message,
            data: event.data,
          });
          break;
          
        case 'notification':
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Alert: ${rule.name}`, {
              body: event.message,
              icon: '/icons/icon-192x192.png',
            });
          }
          break;
          
        case 'storage':
          // 保存到本地存储用于后续分析
          this.saveAlertToStorage(rule, event);
          break;
      }
    }
  }

  /**
   * 保存告警到存储
   */
  private saveAlertToStorage(rule: AlertRule, event: MonitoringEvent): void {
    try {
      const alerts = JSON.parse(localStorage.getItem('monitor_alerts') || '[]');
      alerts.push({
        rule: rule.id,
        ruleName: rule.name,
        event: event.id,
        timestamp: Date.now(),
      });
      
      // 只保留最近100个告警
      if (alerts.length > 100) {
        alerts.splice(0, alerts.length - 100);
      }
      
      localStorage.setItem('monitor_alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('Failed to save alert to storage:', error);
    }
  }

  /**
   * 通知所有订阅者
   */
  private notifySubscribers(event: MonitoringEvent): void {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in event subscriber:', error);
      }
    });
  }

  /**
   * 更新计数器
   */
  private updateCounters(event: MonitoringEvent): void {
    this.incrementCounter(`events.${event.type}`);
    this.incrementCounter(`events.${event.category}`);
    this.incrementCounter(`events.severity.${event.severity}`);
  }

  /**
   * 控制台日志
   */
  private logToConsole(event: MonitoringEvent): void {
    const logLevel = this.getConsoleLogLevel(event.severity);
    const prefix = `[${event.type.toUpperCase()}] ${event.category}`;
    
    console[logLevel](`${prefix}: ${event.message}`, event.data);
  }

  /**
   * 获取控制台日志级别
   */
  private getConsoleLogLevel(severity: MonitoringEvent['severity']): 'log' | 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
      default:
        return 'log';
    }
  }

  /**
   * 启动周期性任务
   */
  private startPeriodicTasks(): void {
    // 定期清理过期事件
    setInterval(() => {
      const cutoff = Date.now() - this.config.retentionTime;
      this.events = this.events.filter(event => event.timestamp > cutoff);
    }, 60000); // 每分钟清理一次

    // 定期重置计数器（按需）
    setInterval(() => {
      // 重置每分钟的计数器
      this.counters.set('requests_per_minute', 0);
    }, 60000);
  }

  /**
   * 辅助方法
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectPlatform(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const ua = navigator.userAgent;
    if (ua.includes('Mobile')) return 'mobile';
    if (ua.includes('Tablet')) return 'tablet';
    return 'desktop';
  }

  private getAppVersion(): string {
    // 这里应该从应用配置中获取版本号
    return '1.0.0';
  }

  private getEnvironment(): 'development' | 'staging' | 'production' {
    // 根据实际情况检测环境
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        return 'development';
      }
      if (hostname.includes('staging') || hostname.includes('test')) {
        return 'staging';
      }
    }
    return 'production';
  }

  private getSystemHealthStatus(errorRate: number): 'healthy' | 'warning' | 'critical' {
    if (errorRate > 0.1) return 'critical';
    if (errorRate > 0.05) return 'warning';
    return 'healthy';
  }

  private getStartTime(): number {
    // 这里应该记录应用启动时间
    return Date.now() - 3600000; // 假设已运行1小时
  }
}