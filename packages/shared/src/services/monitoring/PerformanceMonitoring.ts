/**
 * 性能监控服务
 * 监控应用性能指标和用户体验
 */

import type { AnalyticsService } from '../analytics/AnalyticsService';

// 性能指标类型
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'seconds' | 'bytes' | 'count' | 'percentage';
  timestamp: number;
  category: 'timing' | 'resource' | 'custom' | 'vitals';
  tags?: Record<string, string>;
}

// Web Vitals指标
export interface WebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

// 资源加载性能
export interface ResourceTiming {
  name: string;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  startTime: number;
}

// 监控配置
export interface PerformanceMonitoringConfig {
  enabled: boolean;
  trackWebVitals: boolean;
  trackResourceLoading: boolean;
  trackUserTiming: boolean;
  trackMemoryUsage: boolean;
  sampleRate: number; // 0-1
  thresholds: {
    slowLoadTime: number; // ms
    largeResourceSize: number; // bytes
    highMemoryUsage: number; // MB
  };
}

/**
 * 性能监控服务
 */
export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private config: PerformanceMonitoringConfig;
  private analyticsService?: AnalyticsService;
  private observers: PerformanceObserver[] = [];
  private customTimers: Map<string, number> = new Map();
  private isInitialized = false;

  // 默认配置
  private static defaultConfig: PerformanceMonitoringConfig = {
    enabled: true,
    trackWebVitals: true,
    trackResourceLoading: true,
    trackUserTiming: true,
    trackMemoryUsage: true,
    sampleRate: 1.0,
    thresholds: {
      slowLoadTime: 3000, // 3秒
      largeResourceSize: 1024 * 1024, // 1MB
      highMemoryUsage: 100, // 100MB
    },
  };

  private constructor(config: Partial<PerformanceMonitoringConfig> = {}) {
    this.config = { ...PerformanceMonitoringService.defaultConfig, ...config };
  }

  static getInstance(config?: Partial<PerformanceMonitoringConfig>): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService(config);
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * 初始化性能监控
   */
  init(analyticsService?: AnalyticsService): void {
    if (this.isInitialized || !this.config.enabled || typeof window === 'undefined') return;

    this.analyticsService = analyticsService;
    this.setupPerformanceObservers();
    this.trackInitialMetrics();
    this.isInitialized = true;

    console.log('[PerformanceMonitoring] Service initialized');
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObservers(): void {
    // 监控导航和资源加载
    if (this.config.trackResourceLoading && 'PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleResourceEntry(entry);
          }
        });
        resourceObserver.observe({ entryTypes: ['navigation', 'resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('[PerformanceMonitoring] Failed to setup resource observer:', error);
      }
    }

    // 监控用户自定义计时
    if (this.config.trackUserTiming && 'PerformanceObserver' in window) {
      try {
        const userTimingObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.handleUserTimingEntry(entry);
          }
        });
        userTimingObserver.observe({ entryTypes: ['mark', 'measure'] });
        this.observers.push(userTimingObserver);
      } catch (error) {
        console.warn('[PerformanceMonitoring] Failed to setup user timing observer:', error);
      }
    }

    // 监控Web Vitals
    if (this.config.trackWebVitals) {
      this.setupWebVitalsObserver();
    }
  }

  /**
   * 设置Web Vitals监控
   */
  private setupWebVitalsObserver(): void {
    // 如果支持web-vitals库，使用它
    if (typeof window !== 'undefined' && 'webVitals' in window) {
      // 这里假设已经加载了web-vitals库
      // 实际项目中需要安装和导入web-vitals
      try {
        // 示例代码，实际需要根据web-vitals库的API调整
        this.trackWebVitals();
      } catch (error) {
        console.warn('[PerformanceMonitoring] Web Vitals tracking failed:', error);
      }
    } else {
      // 简单的Web Vitals近似实现
      this.trackBasicWebVitals();
    }
  }

  /**
   * 跟踪基础Web Vitals
   */
  private trackBasicWebVitals(): void {
    // FCP (First Contentful Paint)
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric({
            name: 'FCP',
            value: entry.startTime,
            unit: 'ms',
            category: 'vitals',
            timestamp: Date.now(),
          });
        }
      }
    });
    
    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (error) {
      console.warn('[PerformanceMonitoring] FCP observer failed:', error);
    }

    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.recordMetric({
        name: 'LCP',
        value: lastEntry.startTime,
        unit: 'ms',
        category: 'vitals',
        timestamp: Date.now(),
      });
    });
    
    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (error) {
      console.warn('[PerformanceMonitoring] LCP observer failed:', error);
    }
  }

  /**
   * 跟踪完整Web Vitals
   */
  private trackWebVitals(): void {
    // 这里应该使用web-vitals库
    // import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
    
    // 示例实现，实际项目中应该使用真正的web-vitals库
    console.log('[PerformanceMonitoring] Web Vitals tracking requires web-vitals library');
  }

  /**
   * 处理资源加载条目
   */
  private handleResourceEntry(entry: PerformanceEntry): void {
    if (!this.shouldSample()) return;

    const resourceEntry = entry as PerformanceResourceTiming;
    
    // 记录资源加载时间
    this.recordMetric({
      name: 'resource_load_time',
      value: resourceEntry.duration,
      unit: 'ms',
      category: 'resource',
      timestamp: Date.now(),
      tags: {
        resource: this.getResourceName(resourceEntry.name),
        type: this.getResourceType(resourceEntry.name),
      },
    });

    // 记录资源大小
    if (resourceEntry.transferSize) {
      this.recordMetric({
        name: 'resource_size',
        value: resourceEntry.transferSize,
        unit: 'bytes',
        category: 'resource',
        timestamp: Date.now(),
        tags: {
          resource: this.getResourceName(resourceEntry.name),
          type: this.getResourceType(resourceEntry.name),
        },
      });

      // 检查大文件阈值
      if (resourceEntry.transferSize > this.config.thresholds.largeResourceSize) {
        this.reportIssue('large_resource', {
          resource: resourceEntry.name,
          size: resourceEntry.transferSize,
        });
      }
    }

    // 检查慢加载阈值
    if (resourceEntry.duration > this.config.thresholds.slowLoadTime) {
      this.reportIssue('slow_resource', {
        resource: resourceEntry.name,
        duration: resourceEntry.duration,
      });
    }
  }

  /**
   * 处理用户计时条目
   */
  private handleUserTimingEntry(entry: PerformanceEntry): void {
    if (!this.shouldSample()) return;

    this.recordMetric({
      name: entry.name,
      value: entry.entryType === 'measure' ? entry.duration : entry.startTime,
      unit: 'ms',
      category: 'timing',
      timestamp: Date.now(),
      tags: {
        type: entry.entryType,
      },
    });
  }

  /**
   * 跟踪初始指标
   */
  private trackInitialMetrics(): void {
    if (typeof window === 'undefined') return;

    // 页面加载时间
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.recordMetric({
          name: 'page_load_time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          unit: 'ms',
          category: 'timing',
          timestamp: Date.now(),
        });

        this.recordMetric({
          name: 'dom_content_loaded',
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          unit: 'ms',
          category: 'timing',
          timestamp: Date.now(),
        });
      }
    });

    // 内存使用情况
    if (this.config.trackMemoryUsage) {
      this.trackMemoryUsage();
    }
  }

  /**
   * 跟踪内存使用
   */
  private trackMemoryUsage(): void {
    const trackMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        
        this.recordMetric({
          name: 'memory_used',
          value: memory.usedJSHeapSize / (1024 * 1024), // Convert to MB
          unit: 'bytes',
          category: 'custom',
          timestamp: Date.now(),
        });

        // 检查高内存使用阈值
        const memoryUsageMB = memory.usedJSHeapSize / (1024 * 1024);
        if (memoryUsageMB > this.config.thresholds.highMemoryUsage) {
          this.reportIssue('high_memory_usage', {
            usage: memoryUsageMB,
            limit: memory.jsHeapSizeLimit / (1024 * 1024),
          });
        }
      }
    };

    // 立即跟踪一次，然后每30秒跟踪一次
    trackMemory();
    setInterval(trackMemory, 30000);
  }

  /**
   * 开始自定义计时
   */
  startTiming(name: string): void {
    this.customTimers.set(name, performance.now());
    
    if ('mark' in performance) {
      performance.mark(`${name}_start`);
    }
  }

  /**
   * 结束自定义计时
   */
  endTiming(name: string): number | null {
    const startTime = this.customTimers.get(name);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.customTimers.delete(name);

    if ('mark' in performance && 'measure' in performance) {
      performance.mark(`${name}_end`);
      performance.measure(name, `${name}_start`, `${name}_end`);
    }

    this.recordMetric({
      name,
      value: duration,
      unit: 'ms',
      category: 'custom',
      timestamp: Date.now(),
    });

    return duration;
  }

  /**
   * 记录性能指标
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.config.enabled || !this.shouldSample()) return;

    // 发送到分析服务
    if (this.analyticsService) {
      // 只传递analytics支持的单位类型
      const analyticsUnit = ['ms', 'seconds', 'bytes'].includes(metric.unit) 
        ? (metric.unit as 'ms' | 'seconds' | 'bytes')
        : 'ms';
      
      this.analyticsService.trackPerformance(
        metric.name as any,
        metric.value,
        analyticsUnit
      );

      this.analyticsService.track({
        name: 'performance_metric',
        properties: {
          metric: metric.name,
          value: metric.value,
          unit: metric.unit,
          category: metric.category,
          tags: metric.tags,
        },
      });
    }
  }

  /**
   * 报告性能问题
   */
  private reportIssue(type: string, data: Record<string, unknown>): void {
    if (this.analyticsService) {
      this.analyticsService.track({
        name: 'performance_issue',
        properties: {
          issue_type: type,
          ...data,
        },
      });
    }
  }

  /**
   * 获取资源名称
   */
  private getResourceName(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.pathname.split('/').pop() || url;
    } catch {
      return url;
    }
  }

  /**
   * 获取资源类型
   */
  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'script';
      case 'css':
        return 'stylesheet';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return 'image';
      case 'mp3':
      case 'wav':
      case 'ogg':
        return 'audio';
      case 'mp4':
      case 'webm':
        return 'video';
      default:
        return 'other';
    }
  }

  /**
   * 判断是否应该采样
   */
  private shouldSample(): boolean {
    return Math.random() <= this.config.sampleRate;
  }

  /**
   * 获取当前性能快照
   */
  getPerformanceSnapshot(): {
    timing: PerformanceNavigationTiming | null;
    memory: any;
    resources: ResourceTiming[];
  } {
    const snapshot = {
      timing: null as PerformanceNavigationTiming | null,
      memory: null,
      resources: [] as ResourceTiming[],
    };

    if (typeof window !== 'undefined') {
      // 导航时间
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      snapshot.timing = navigation;

      // 内存信息
      if ('memory' in performance) {
        snapshot.memory = (performance as any).memory;
      }

      // 资源加载信息
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      snapshot.resources = resources.map(resource => ({
        name: resource.name,
        duration: resource.duration,
        transferSize: resource.transferSize,
        encodedBodySize: resource.encodedBodySize,
        decodedBodySize: resource.decodedBodySize,
        startTime: resource.startTime,
      }));
    }

    return snapshot;
  }

  /**
   * 销毁监控服务
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.customTimers.clear();
    this.isInitialized = false;
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<PerformanceMonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取服务状态
   */
  getStatus(): {
    enabled: boolean;
    initialized: boolean;
    activeTimers: string[];
    observersCount: number;
  } {
    return {
      enabled: this.config.enabled,
      initialized: this.isInitialized,
      activeTimers: Array.from(this.customTimers.keys()),
      observersCount: this.observers.length,
    };
  }
}