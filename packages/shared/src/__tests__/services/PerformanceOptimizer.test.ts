/**
 * 性能优化器测试
 */

import { PerformanceOptimizer } from '../../services/optimization/PerformanceOptimizer';

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    },
  },
  writable: true,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;

  beforeEach(() => {
    optimizer = PerformanceOptimizer.getInstance();
    optimizer.stopMonitoring();
  });

  afterEach(() => {
    optimizer.stopMonitoring();
    jest.clearAllMocks();
  });

  describe('监控功能', () => {
    test('应该能够开始和停止性能监控', () => {
      expect(() => {
        optimizer.startMonitoring();
        optimizer.stopMonitoring();
      }).not.toThrow();
    });

    test('应该能够获取当前配置', () => {
      const config = optimizer.getConfig();
      
      expect(config).toHaveProperty('audioQuality');
      expect(config).toHaveProperty('animationLevel');
      expect(config).toHaveProperty('cacheSize');
      expect(config).toHaveProperty('prefetchEnabled');
    });
  });

  describe('性能指标收集', () => {
    test('应该能够收集基本性能指标', async () => {
      // 模拟一些性能数据
      jest.spyOn(optimizer as any, 'measureFPS').mockResolvedValue(30);
      jest.spyOn(optimizer as any, 'getAverageLatency').mockReturnValue(500);
      jest.spyOn(optimizer as any, 'getErrorRate').mockReturnValue(0.02);

      optimizer.startMonitoring();
      
      // 等待一些时间让指标被收集
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      const stats = optimizer.getStats();
      
      if (stats) {
        expect(stats).toHaveProperty('current');
        expect(stats).toHaveProperty('average');
        expect(stats).toHaveProperty('config');
      }
    });
  });

  describe('优化策略', () => {
    test('应该在低FPS时触发动画优化', async () => {
      const lowFpsMetrics = {
        fps: 20, // 低于阈值
        frameDrops: 5,
        renderTime: 25,
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        memoryLeaks: 0,
        requestLatency: 300,
        bandwidth: 1000000,
        failedRequests: 0,
        audioLatency: 50,
        bufferHealth: 0.8,
        dropouts: 0,
        interactionDelay: 100,
        loadTime: 2000,
        errorRate: 0.01,
        timestamp: Date.now(),
      };

      const spy = jest.spyOn(optimizer as any, 'applyAnimationConfig');
      
      await (optimizer as any).analyzeAndOptimize(lowFpsMetrics);
      
      expect(spy).toHaveBeenCalled();
    });

    test('应该在高内存使用时触发内存清理', async () => {
      const highMemoryMetrics = {
        fps: 60,
        frameDrops: 0,
        renderTime: 16,
        heapUsed: 90 * 1024 * 1024, // 90% 使用率
        heapTotal: 100 * 1024 * 1024,
        memoryLeaks: 1,
        requestLatency: 300,
        bandwidth: 1000000,
        failedRequests: 0,
        audioLatency: 50,
        bufferHealth: 0.8,
        dropouts: 0,
        interactionDelay: 100,
        loadTime: 2000,
        errorRate: 0.01,
        timestamp: Date.now(),
      };

      const clearCacheSpy = jest.spyOn(optimizer as any, 'clearUnusedCaches');
      
      await (optimizer as any).analyzeAndOptimize(highMemoryMetrics);
      
      expect(clearCacheSpy).toHaveBeenCalled();
    });

    test('应该在高延迟时降低音频质量', async () => {
      const highLatencyMetrics = {
        fps: 60,
        frameDrops: 0,
        renderTime: 16,
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        memoryLeaks: 0,
        requestLatency: 3000, // 高延迟
        bandwidth: 50000, // 低带宽
        failedRequests: 0,
        audioLatency: 50,
        bufferHealth: 0.8,
        dropouts: 0,
        interactionDelay: 100,
        loadTime: 2000,
        errorRate: 0.01,
        timestamp: Date.now(),
      };

      const audioQualitySpy = jest.spyOn(optimizer as any, 'applyAudioQualityConfig');
      
      await (optimizer as any).analyzeAndOptimize(highLatencyMetrics);
      
      expect(audioQualitySpy).toHaveBeenCalled();
    });
  });

  describe('配置管理', () => {
    test('应该能够获取默认配置', () => {
      const config = optimizer.getConfig();
      
      expect(config.audioQuality).toBe('auto');
      expect(config.animationLevel).toBe('auto');
      expect(config.prefetchEnabled).toBe(true);
      expect(config.virtualScrolling).toBe(false);
    });

    test('应该能够响应配置变更事件', () => {
      const eventSpy = jest.spyOn(window, 'dispatchEvent');
      
      (optimizer as any).applyAnimationConfig();
      
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'performance-config-changed'
        })
      );
    });
  });

  describe('问题识别', () => {
    test('应该正确识别性能问题', () => {
      const problematicMetrics = {
        fps: 20, // 低FPS
        frameDrops: 10,
        renderTime: 30,
        heapUsed: 90 * 1024 * 1024, // 高内存使用
        heapTotal: 100 * 1024 * 1024,
        memoryLeaks: 1,
        requestLatency: 2000, // 高延迟
        bandwidth: 1000000,
        failedRequests: 0,
        audioLatency: 150, // 高音频延迟
        bufferHealth: 0.3, // 低缓冲区健康度
        dropouts: 3,
        interactionDelay: 500,
        loadTime: 5000,
        errorRate: 0.08, // 高错误率
        timestamp: Date.now(),
      };

      const issues = (optimizer as any).identifyPerformanceIssues(problematicMetrics);
      
      expect(issues).toContain('low_fps');
      expect(issues).toContain('high_memory');
      expect(issues).toContain('high_latency');
      expect(issues).toContain('high_error_rate');
      expect(issues).toContain('audio_latency');
      expect(issues).toContain('buffer_underrun');
    });

    test('应该在良好性能时不识别问题', () => {
      const goodMetrics = {
        fps: 60,
        frameDrops: 0,
        renderTime: 16,
        heapUsed: 30 * 1024 * 1024,
        heapTotal: 100 * 1024 * 1024,
        memoryLeaks: 0,
        requestLatency: 200,
        bandwidth: 5000000,
        failedRequests: 0,
        audioLatency: 20,
        bufferHealth: 0.9,
        dropouts: 0,
        interactionDelay: 50,
        loadTime: 1000,
        errorRate: 0.01,
        timestamp: Date.now(),
      };

      const issues = (optimizer as any).identifyPerformanceIssues(goodMetrics);
      
      expect(issues).toHaveLength(0);
    });
  });

  describe('边界情况处理', () => {
    test('应该处理无效的性能数据', () => {
      const invalidMetrics = {
        fps: NaN,
        frameDrops: -1,
        renderTime: Infinity,
        heapUsed: -1,
        heapTotal: 0,
        memoryLeaks: NaN,
        requestLatency: -1,
        bandwidth: NaN,
        failedRequests: -1,
        audioLatency: NaN,
        bufferHealth: 2, // 超出范围
        dropouts: -1,
        interactionDelay: NaN,
        loadTime: -1,
        errorRate: 1.5, // 超出范围
        timestamp: Date.now(),
      };

      expect(() => {
        (optimizer as any).identifyPerformanceIssues(invalidMetrics);
      }).not.toThrow();
    });
  });
});