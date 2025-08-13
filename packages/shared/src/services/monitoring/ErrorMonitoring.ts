/**
 * 错误监控服务
 * 统一处理和上报应用错误
 */

import type { AnalyticsService } from '../analytics/AnalyticsService';

// 错误级别
export type ErrorLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

// 错误上下文
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: number;
  extra?: Record<string, unknown>;
}

// 错误信息
export interface ErrorInfo {
  message: string;
  stack?: string;
  level: ErrorLevel;
  category?: string;
  context?: ErrorContext;
}

// 监控配置
export interface MonitoringConfig {
  enabled: boolean;
  captureUnhandledErrors: boolean;
  captureUnhandledRejections: boolean;
  captureConsoleErrors: boolean;
  maxBreadcrumbs: number;
  beforeSend?: (error: ErrorInfo) => ErrorInfo | null;
  sampleRate: number; // 0-1, 采样率
}

// 面包屑记录
export interface Breadcrumb {
  timestamp: number;
  message: string;
  category: string;
  level: ErrorLevel;
  data?: Record<string, unknown>;
}

/**
 * 错误监控服务
 */
export class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private config: MonitoringConfig;
  private analyticsService?: AnalyticsService;
  private breadcrumbs: Breadcrumb[] = [];
  private isInitialized = false;

  // 默认配置
  private static defaultConfig: MonitoringConfig = {
    enabled: true,
    captureUnhandledErrors: true,
    captureUnhandledRejections: true,
    captureConsoleErrors: true,
    maxBreadcrumbs: 100,
    sampleRate: 1.0,
  };

  private constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...ErrorMonitoringService.defaultConfig, ...config };
  }

  static getInstance(config?: Partial<MonitoringConfig>): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService(config);
    }
    return ErrorMonitoringService.instance;
  }

  /**
   * 初始化监控服务
   */
  init(analyticsService?: AnalyticsService): void {
    if (this.isInitialized || !this.config.enabled) return;

    this.analyticsService = analyticsService;
    this.setupGlobalHandlers();
    this.isInitialized = true;

    console.log('[ErrorMonitoring] Service initialized');
  }

  /**
   * 设置全局错误处理器
   */
  private setupGlobalHandlers(): void {
    // 捕获未处理的异常
    if (this.config.captureUnhandledErrors && typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureError({
          message: event.message,
          stack: event.error?.stack,
          level: 'error',
          category: 'javascript',
          context: {
            url: event.filename,
            extra: {
              lineno: event.lineno,
              colno: event.colno,
            },
          },
        });
      });
    }

    // 捕获未处理的Promise拒绝
    if (this.config.captureUnhandledRejections && typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.captureError({
          message: `Unhandled Promise Rejection: ${event.reason}`,
          stack: event.reason?.stack,
          level: 'error',
          category: 'promise',
          context: {
            extra: {
              reason: event.reason,
            },
          },
        });
      });
    }

    // 捕获控制台错误
    if (this.config.captureConsoleErrors) {
      this.overrideConsole();
    }
  }

  /**
   * 重写console方法以捕获错误
   */
  private overrideConsole(): void {
    const originalConsole = {
      error: console.error,
      warn: console.warn,
      log: console.log,
    };

    console.error = (...args) => {
      this.addBreadcrumb({
        message: args.join(' '),
        category: 'console',
        level: 'error',
        timestamp: Date.now(),
      });
      originalConsole.error.apply(console, args);
    };

    console.warn = (...args) => {
      this.addBreadcrumb({
        message: args.join(' '),
        category: 'console',
        level: 'warning',
        timestamp: Date.now(),
      });
      originalConsole.warn.apply(console, args);
    };
  }

  /**
   * 手动捕获错误
   */
  captureError(errorInfo: Partial<ErrorInfo>): void {
    if (!this.config.enabled || !this.shouldSampleError()) return;

    const enrichedError: ErrorInfo = {
      message: errorInfo.message || 'Unknown error',
      stack: errorInfo.stack,
      level: errorInfo.level || 'error',
      category: errorInfo.category || 'manual',
      context: {
        ...this.getDefaultContext(),
        ...errorInfo.context,
      },
    };

    // 添加面包屑
    this.addBreadcrumb({
      message: `Error: ${enrichedError.message}`,
      category: enrichedError.category || 'error',
      level: enrichedError.level,
      timestamp: Date.now(),
      data: {
        stack: enrichedError.stack,
      },
    });

    // 应用beforeSend钩子
    const processedError = this.config.beforeSend?.(enrichedError) || enrichedError;
    if (!processedError) return;

    // 发送到分析服务
    this.sendToAnalytics(processedError);

    // 在开发环境中打印错误
    if (process.env.NODE_ENV === 'development') {
      console.group(`[ErrorMonitoring] ${processedError.level.toUpperCase()}`);
      console.error(processedError.message);
      if (processedError.stack) {
        console.error(processedError.stack);
      }
      console.groupEnd();
    }
  }

  /**
   * 捕获异常
   */
  captureException(error: Error, context?: Partial<ErrorContext>): void {
    this.captureError({
      message: error.message,
      stack: error.stack,
      level: 'error',
      category: 'exception',
      context,
    });
  }

  /**
   * 添加面包屑
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'> & { timestamp?: number }): void {
    const fullBreadcrumb: Breadcrumb = {
      timestamp: Date.now(),
      ...breadcrumb,
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // 保持面包屑数量在限制范围内
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }

  /**
   * 设置用户上下文
   */
  setUserContext(userId: string, extra?: Record<string, unknown>): void {
    this.addBreadcrumb({
      message: `User context set: ${userId}`,
      category: 'user',
      level: 'info',
      data: extra,
    });
  }

  /**
   * 设置额外上下文
   */
  setExtraContext(key: string, value: unknown): void {
    this.addBreadcrumb({
      message: `Context set: ${key}`,
      category: 'context',
      level: 'debug',
      data: { [key]: value },
    });
  }

  /**
   * 获取默认上下文
   */
  private getDefaultContext(): ErrorContext {
    const context: ErrorContext = {
      timestamp: Date.now(),
    };

    // Web环境特定信息
    if (typeof window !== 'undefined') {
      context.userAgent = navigator.userAgent;
      context.url = window.location.href;
    }

    return context;
  }

  /**
   * 判断是否应该采样这个错误
   */
  private shouldSampleError(): boolean {
    return Math.random() <= this.config.sampleRate;
  }

  /**
   * 发送错误到分析服务
   */
  private sendToAnalytics(error: ErrorInfo): void {
    if (!this.analyticsService) return;

    this.analyticsService.trackError(
      error.message,
      error.category,
      this.mapLevelToSeverity(error.level)
    );

    // 发送详细错误信息
    this.analyticsService.track({
      name: 'error_detail',
      properties: {
        message: error.message,
        stack: error.stack,
        level: error.level,
        category: error.category,
        context: error.context,
        breadcrumbs: this.breadcrumbs.slice(-10), // 只发送最近10条面包屑
      },
    });
  }

  /**
   * 映射错误级别到严重性
   */
  private mapLevelToSeverity(level: ErrorLevel): 'low' | 'medium' | 'high' | 'critical' {
    switch (level) {
      case 'debug':
      case 'info':
        return 'low';
      case 'warning':
        return 'medium';
      case 'error':
        return 'high';
      case 'fatal':
        return 'critical';
      default:
        return 'medium';
    }
  }

  /**
   * 获取面包屑
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * 清空面包屑
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (!this.config.enabled && this.isInitialized) {
      this.disable();
    }
  }

  /**
   * 禁用监控
   */
  disable(): void {
    this.config.enabled = false;
    this.clearBreadcrumbs();
    this.isInitialized = false;
  }

  /**
   * 获取监控状态
   */
  getStatus(): {
    enabled: boolean;
    initialized: boolean;
    breadcrumbsCount: number;
    config: MonitoringConfig;
  } {
    return {
      enabled: this.config.enabled,
      initialized: this.isInitialized,
      breadcrumbsCount: this.breadcrumbs.length,
      config: { ...this.config },
    };
  }
}

/**
 * React错误边界辅助函数
 */
export function captureErrorBoundaryError(
  error: Error,
  errorInfo: { componentStack: string }
): void {
  const monitoring = ErrorMonitoringService.getInstance();
  
  monitoring.captureError({
    message: `React Error Boundary: ${error.message}`,
    stack: error.stack,
    level: 'error',
    category: 'react',
    context: {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    },
  });
}

/**
 * 异步函数错误包装器
 */
export function withErrorCapture<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: string
): T {
  return ((...args: Parameters<T>) => {
    return Promise.resolve(fn(...args)).catch((error) => {
      const monitoring = ErrorMonitoringService.getInstance();
      monitoring.captureException(error, { extra: { context, args } });
      throw error; // 重新抛出错误
    });
  }) as T;
}