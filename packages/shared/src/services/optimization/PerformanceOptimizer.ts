/**
 * 性能优化器
 * 实时监控应用性能并自动优化
 */

export interface PerformanceMetrics {
  // 渲染性能
  fps: number;
  frameDrops: number;
  renderTime: number;
  
  // 内存使用
  heapUsed: number;
  heapTotal: number;
  memoryLeaks: number;
  
  // 网络性能
  requestLatency: number;
  bandwidth: number;
  failedRequests: number;
  
  // 音频性能
  audioLatency: number;
  bufferHealth: number;
  dropouts: number;
  
  // 用户体验
  interactionDelay: number;
  loadTime: number;
  errorRate: number;
  
  timestamp: number;
}

export interface OptimizationStrategy {
  id: string;
  name: string;
  description: string;
  priority: number;
  execute: (metrics: PerformanceMetrics) => Promise<boolean>;
  canActivate: (metrics: PerformanceMetrics) => boolean;
  impact: 'low' | 'medium' | 'high';
}

export interface AdaptiveConfig {
  // 自适应质量设置
  audioQuality: 'low' | 'medium' | 'high' | 'auto';
  imageQuality: 'low' | 'medium' | 'high' | 'auto';
  animationLevel: 'none' | 'reduced' | 'full' | 'auto';
  
  // 缓存设置
  cacheSize: number;
  prefetchEnabled: boolean;
  
  // UI优化
  virtualScrolling: boolean;
  lazyLoading: boolean;
  
  // 网络优化
  maxConcurrentRequests: number;
  requestTimeout: number;
}

/**
 * 性能优化器主类
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: PerformanceMetrics[] = [];
  private config: AdaptiveConfig;
  private strategies: OptimizationStrategy[] = [];
  private isMonitoring = false;
  private monitoringInterval: number | null = null;
  
  // 性能阈值
  private thresholds = {
    minFPS: 30,
    maxMemoryUsage: 0.8, // 80% of available memory
    maxLatency: 1000, // 1 second
    maxErrorRate: 0.05, // 5%
  };

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeStrategies();
    this.startMonitoring();
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  /**
   * 开始性能监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics();
    }, 5000); // 每5秒收集一次指标

    console.log('Performance monitoring started');
  }

  /**
   * 停止性能监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('Performance monitoring stopped');
  }

  /**
   * 收集性能指标
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        // 渲染性能
        fps: await this.measureFPS(),
        frameDrops: this.getFrameDrops(),
        renderTime: this.getAverageRenderTime(),
        
        // 内存使用
        heapUsed: this.getHeapUsage().used,
        heapTotal: this.getHeapUsage().total,
        memoryLeaks: this.detectMemoryLeaks(),
        
        // 网络性能
        requestLatency: this.getAverageLatency(),
        bandwidth: await this.estimateBandwidth(),
        failedRequests: this.getFailedRequestCount(),
        
        // 音频性能
        audioLatency: this.getAudioLatency(),
        bufferHealth: this.getBufferHealth(),
        dropouts: this.getAudioDropouts(),
        
        // 用户体验
        interactionDelay: this.getInteractionDelay(),
        loadTime: this.getAverageLoadTime(),
        errorRate: this.getErrorRate(),
        
        timestamp: Date.now(),
      };

      this.metrics.push(metrics);
      
      // 保持最近100次的指标记录
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      // 分析并应用优化
      await this.analyzeAndOptimize(metrics);
      
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
  }

  /**
   * 分析性能并应用优化策略
   */
  private async analyzeAndOptimize(currentMetrics: PerformanceMetrics): Promise<void> {
    const issues = this.identifyPerformanceIssues(currentMetrics);
    
    if (issues.length === 0) return;

    console.log('Performance issues detected:', issues);

    // 按优先级排序可用的优化策略
    const applicableStrategies = this.strategies
      .filter(strategy => strategy.canActivate(currentMetrics))
      .sort((a, b) => b.priority - a.priority);

    // 应用优化策略
    for (const strategy of applicableStrategies) {
      try {
        const success = await strategy.execute(currentMetrics);
        if (success) {
          console.log(`Applied optimization strategy: ${strategy.name}`);
          
          // 高影响优化后等待一段时间再应用其他策略
          if (strategy.impact === 'high') {
            break;
          }
        }
      } catch (error) {
        console.error(`Error applying strategy ${strategy.name}:`, error);
      }
    }
  }

  /**
   * 识别性能问题
   */
  private identifyPerformanceIssues(metrics: PerformanceMetrics): string[] {
    const issues: string[] = [];

    if (metrics.fps < this.thresholds.minFPS) {
      issues.push('low_fps');
    }

    if (metrics.heapUsed / metrics.heapTotal > this.thresholds.maxMemoryUsage) {
      issues.push('high_memory');
    }

    if (metrics.requestLatency > this.thresholds.maxLatency) {
      issues.push('high_latency');
    }

    if (metrics.errorRate > this.thresholds.maxErrorRate) {
      issues.push('high_error_rate');
    }

    if (metrics.audioLatency > 100) { // 100ms
      issues.push('audio_latency');
    }

    if (metrics.bufferHealth < 0.5) {
      issues.push('buffer_underrun');
    }

    return issues;
  }

  /**
   * 初始化优化策略
   */
  private initializeStrategies(): void {
    this.strategies = [
      // 减少动画复杂度
      {
        id: 'reduce_animations',
        name: 'Reduce Animations',
        description: 'Disable or reduce complex animations',
        priority: 8,
        impact: 'medium',
        canActivate: (metrics) => metrics.fps < 30 || metrics.renderTime > 16.67,
        execute: async (metrics) => {
          this.config.animationLevel = metrics.fps < 20 ? 'none' : 'reduced';
          this.applyAnimationConfig();
          return true;
        }
      },

      // 降低音频质量
      {
        id: 'reduce_audio_quality',
        name: 'Reduce Audio Quality',
        description: 'Lower audio bitrate to reduce bandwidth usage',
        priority: 6,
        impact: 'high',
        canActivate: (metrics) => metrics.requestLatency > 2000 || metrics.bandwidth < 100000,
        execute: async (metrics) => {
          if (this.config.audioQuality === 'high') {
            this.config.audioQuality = 'medium';
          } else if (this.config.audioQuality === 'medium') {
            this.config.audioQuality = 'low';
          }
          await this.applyAudioQualityConfig();
          return true;
        }
      },

      // 清理内存
      {
        id: 'cleanup_memory',
        name: 'Cleanup Memory',
        description: 'Force garbage collection and clear unused caches',
        priority: 9,
        impact: 'high',
        canActivate: (metrics) => metrics.heapUsed / metrics.heapTotal > 0.8,
        execute: async (metrics) => {
          await this.forceGarbageCollection();
          await this.clearUnusedCaches();
          return true;
        }
      },

      // 减少并发请求
      {
        id: 'throttle_requests',
        name: 'Throttle Network Requests',
        description: 'Reduce concurrent network requests',
        priority: 7,
        impact: 'medium',
        canActivate: (metrics) => metrics.requestLatency > 1000 || metrics.failedRequests > 5,
        execute: async (metrics) => {
          this.config.maxConcurrentRequests = Math.max(2, this.config.maxConcurrentRequests - 1);
          this.applyNetworkConfig();
          return true;
        }
      },

      // 启用虚拟滚动
      {
        id: 'enable_virtualization',
        name: 'Enable List Virtualization',
        description: 'Use virtual scrolling for large lists',
        priority: 5,
        impact: 'medium',
        canActivate: (metrics) => metrics.renderTime > 20 && !this.config.virtualScrolling,
        execute: async (metrics) => {
          this.config.virtualScrolling = true;
          this.applyVirtualizationConfig();
          return true;
        }
      },

      // 禁用预加载
      {
        id: 'disable_prefetch',
        name: 'Disable Prefetching',
        description: 'Disable content prefetching to save bandwidth',
        priority: 4,
        impact: 'low',
        canActivate: (metrics) => metrics.bandwidth < 50000 && this.config.prefetchEnabled,
        execute: async (metrics) => {
          this.config.prefetchEnabled = false;
          this.applyPrefetchConfig();
          return true;
        }
      }
    ];
  }

  /**
   * 测量FPS
   */
  private async measureFPS(): Promise<number> {
    return new Promise((resolve) => {
      let lastTime = performance.now();
      let frameCount = 0;
      
      const measureFrame = () => {
        const currentTime = performance.now();
        frameCount++;
        
        if (currentTime - lastTime >= 1000) {
          resolve(frameCount);
        } else {
          requestAnimationFrame(measureFrame);
        }
      };
      
      requestAnimationFrame(measureFrame);
    });
  }

  /**
   * 获取帧丢失数
   */
  private getFrameDrops(): number {
    // 这里需要实际的帧丢失检测逻辑
    return 0;
  }

  /**
   * 获取平均渲染时间
   */
  private getAverageRenderTime(): number {
    // 这里需要实际的渲染时间测量逻辑
    return 16.67; // 假设60fps的理想值
  }

  /**
   * 获取内存使用情况
   */
  private getHeapUsage(): { used: number; total: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
      };
    }
    return { used: 0, total: 0 };
  }

  /**
   * 检测内存泄漏
   */
  private detectMemoryLeaks(): number {
    // 简化的内存泄漏检测
    if (this.metrics.length < 10) return 0;
    
    const recent = this.metrics.slice(-10);
    const trend = recent.reduce((acc, metric, index) => {
      if (index === 0) return acc;
      return acc + (metric.heapUsed - recent[index - 1].heapUsed);
    }, 0) / (recent.length - 1);
    
    return trend > 1024 * 1024 ? 1 : 0; // 如果内存每次增长超过1MB
  }

  /**
   * 获取平均延迟
   */
  private getAverageLatency(): number {
    // 这里需要实际的网络延迟测量逻辑
    return Math.random() * 500 + 200; // 模拟值
  }

  /**
   * 估算带宽
   */
  private async estimateBandwidth(): Promise<number> {
    // 简化的带宽估算
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.downlink * 1000000 || 1000000; // Convert Mbps to bps
    }
    return 1000000; // 1Mbps fallback
  }

  /**
   * 获取失败请求数
   */
  private getFailedRequestCount(): number {
    // 这里需要实际的请求统计逻辑
    return 0;
  }

  /**
   * 获取音频延迟
   */
  private getAudioLatency(): number {
    // 这里需要实际的音频延迟测量逻辑
    return 50; // 模拟值
  }

  /**
   * 获取缓冲区健康度
   */
  private getBufferHealth(): number {
    // 这里需要实际的音频缓冲区监控逻辑
    return 0.8; // 80%健康度
  }

  /**
   * 获取音频中断次数
   */
  private getAudioDropouts(): number {
    // 这里需要实际的音频中断统计逻辑
    return 0;
  }

  /**
   * 获取交互延迟
   */
  private getInteractionDelay(): number {
    // 这里需要实际的交互延迟测量逻辑
    return 100; // 模拟值
  }

  /**
   * 获取平均加载时间
   */
  private getAverageLoadTime(): number {
    // 这里需要实际的加载时间统计逻辑
    return 2000; // 模拟值
  }

  /**
   * 获取错误率
   */
  private getErrorRate(): number {
    // 这里需要实际的错误统计逻辑
    return 0.02; // 2%错误率
  }

  /**
   * 应用动画配置
   */
  private applyAnimationConfig(): void {
    const root = document.documentElement;
    root.style.setProperty('--animation-level', this.config.animationLevel);
    
    // 发送配置变更事件
    window.dispatchEvent(new CustomEvent('performance-config-changed', {
      detail: { animationLevel: this.config.animationLevel }
    }));
  }

  /**
   * 应用音频质量配置
   */
  private async applyAudioQualityConfig(): Promise<void> {
    // 发送音频质量变更事件
    window.dispatchEvent(new CustomEvent('audio-quality-changed', {
      detail: { quality: this.config.audioQuality }
    }));
  }

  /**
   * 强制垃圾回收
   */
  private async forceGarbageCollection(): Promise<void> {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * 清理未使用的缓存
   */
  private async clearUnusedCaches(): Promise<void> {
    // 发送缓存清理事件
    window.dispatchEvent(new CustomEvent('clear-unused-caches'));
  }

  /**
   * 应用网络配置
   */
  private applyNetworkConfig(): void {
    window.dispatchEvent(new CustomEvent('network-config-changed', {
      detail: { maxConcurrentRequests: this.config.maxConcurrentRequests }
    }));
  }

  /**
   * 应用虚拟化配置
   */
  private applyVirtualizationConfig(): void {
    window.dispatchEvent(new CustomEvent('virtualization-config-changed', {
      detail: { enabled: this.config.virtualScrolling }
    }));
  }

  /**
   * 应用预加载配置
   */
  private applyPrefetchConfig(): void {
    window.dispatchEvent(new CustomEvent('prefetch-config-changed', {
      detail: { enabled: this.config.prefetchEnabled }
    }));
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): AdaptiveConfig {
    return {
      audioQuality: 'auto',
      imageQuality: 'auto',
      animationLevel: 'auto',
      cacheSize: 100 * 1024 * 1024, // 100MB
      prefetchEnabled: true,
      virtualScrolling: false,
      lazyLoading: true,
      maxConcurrentRequests: 6,
      requestTimeout: 30000,
    };
  }

  /**
   * 获取当前配置
   */
  getConfig(): AdaptiveConfig {
    return { ...this.config };
  }

  /**
   * 获取性能统计
   */
  getStats() {
    if (this.metrics.length === 0) return null;

    const latest = this.metrics[this.metrics.length - 1];
    const average = this.metrics.reduce((acc, metric) => ({
      fps: acc.fps + metric.fps,
      memoryUsage: acc.memoryUsage + metric.heapUsed,
      latency: acc.latency + metric.requestLatency,
    }), { fps: 0, memoryUsage: 0, latency: 0 });

    const count = this.metrics.length;
    
    return {
      current: latest,
      average: {
        fps: average.fps / count,
        memoryUsage: average.memoryUsage / count,
        latency: average.latency / count,
      },
      config: this.config,
      appliedOptimizations: this.strategies.filter(s => 
        s.canActivate(latest)
      ).map(s => s.id),
    };
  }
}