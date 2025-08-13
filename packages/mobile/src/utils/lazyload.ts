import React, { ComponentType, lazy } from 'react';
import { InteractionManager, Platform } from 'react-native';

/**
 * React Native 懒加载和性能优化工具
 * 基于 React Native 的特性优化组件加载
 */

// 预加载缓存
const preloadCache = new Map<string, Promise<{ default: ComponentType<any> }>>();

// React Native 懒加载配置
interface MobileLazyLoadOptions {
  preload?: boolean;
  priority?: 'high' | 'normal' | 'low';
  waitForInteractions?: boolean;
  retryCount?: number;
  chunkName?: string;
}

/**
 * React Native 增强懒加载
 */
export function createMobileLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: MobileLazyLoadOptions = {}
) {
  const {
    preload = false,
    priority = 'normal',
    waitForInteractions = true,
    retryCount = 2,
    chunkName
  } = options;

  // 带重试和交互等待的导入函数
  const importWithOptimization = async (): Promise<{ default: ComponentType<T> }> => {
    // 等待交互完成（避免阻塞动画）
    if (waitForInteractions) {
      await new Promise(resolve => InteractionManager.runAfterInteractions(resolve));
    }

    let lastError: Error;
    
    for (let i = 0; i < retryCount; i++) {
      try {
        const result = await importFn();
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Mobile lazy import failed (attempt ${i + 1}/${retryCount}):`, error);
        
        // 等待重试延迟
        if (i < retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    
    throw new Error(`Failed to load component after ${retryCount} attempts: ${lastError.message}`);
  };

  // 创建懒加载组件
  const LazyComponent = lazy(() => {
    const cacheKey = chunkName || importFn.toString();
    
    if (preloadCache.has(cacheKey)) {
      return preloadCache.get(cacheKey)!;
    }
    
    const promise = importWithOptimization();
    preloadCache.set(cacheKey, promise);
    
    return promise;
  });

  // 预加载功能
  LazyComponent.preload = () => {
    const cacheKey = chunkName || importFn.toString();
    if (!preloadCache.has(cacheKey)) {
      const promise = importWithOptimization();
      preloadCache.set(cacheKey, promise);
    }
    return preloadCache.get(cacheKey)!;
  };

  // 如果设置了预加载，根据优先级执行
  if (preload) {
    switch (priority) {
      case 'high':
        // 高优先级：立即预加载
        LazyComponent.preload();
        break;
      case 'normal':
        // 中等优先级：等待当前交互完成后预加载
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => LazyComponent.preload(), 100);
        });
        break;
      case 'low':
        // 低优先级：延迟预加载
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => LazyComponent.preload(), 2000);
        });
        break;
    }
  }

  return LazyComponent;
}

/**
 * React Native 路由预加载器
 */
export class MobileRoutePreloader {
  private static instance: MobileRoutePreloader;
  private preloadedScreens = new Set<string>();
  private preloadQueue: Array<{ name: string; preloader: () => Promise<any> }> = [];
  
  static getInstance() {
    if (!MobileRoutePreloader.instance) {
      MobileRoutePreloader.instance = new MobileRoutePreloader();
    }
    return MobileRoutePreloader.instance;
  }
  
  /**
   * 注册屏幕预加载器
   */
  registerScreen(name: string, preloader: () => Promise<any>) {
    this.preloadQueue.push({ name, preloader });
  }
  
  /**
   * 预加载相关屏幕
   */
  async preloadRelatedScreens(currentScreen: string) {
    // 在交互完成后执行预加载
    InteractionManager.runAfterInteractions(async () => {
      const relatedScreens = this.getRelatedScreens(currentScreen);
      
      for (const screen of relatedScreens) {
        if (!this.preloadedScreens.has(screen.name)) {
          try {
            await screen.preloader();
            this.preloadedScreens.add(screen.name);
          } catch (error) {
            console.warn(`Failed to preload screen ${screen.name}:`, error);
          }
        }
      }
    });
  }
  
  /**
   * 获取相关屏幕
   */
  private getRelatedScreens(currentScreen: string) {
    const screenRelations: Record<string, string[]> = {
      'Home': ['Search', 'Library'],
      'Search': ['Home', 'Player'],
      'Library': ['Home', 'Player'],
      'Player': ['Home'],
      'Profile': ['Home']
    };
    
    const relatedNames = screenRelations[currentScreen] || [];
    return this.preloadQueue.filter(screen => 
      relatedNames.includes(screen.name)
    );
  }
}

/**
 * React Native 资源预加载器
 */
export class MobileResourcePreloader {
  private static cache = new Map<string, Promise<any>>();
  
  /**
   * 预加载图片资源
   */
  static async preloadImages(sources: Array<string | { uri: string }>): Promise<void> {
    const { Image } = require('react-native');
    
    const promises = sources.map(source => {
      const key = typeof source === 'string' ? source : source.uri;
      
      if (this.cache.has(key)) {
        return this.cache.get(key)!;
      }
      
      const promise = new Promise<void>((resolve, reject) => {
        Image.prefetch(key)
          .then(() => resolve())
          .catch(reject);
      });
      
      this.cache.set(key, promise);
      return promise;
    });
    
    await Promise.allSettled(promises);
  }
  
  /**
   * 预加载字体（仅iOS）
   */
  static async preloadFonts(fontNames: string[]): Promise<void> {
    if (Platform.OS !== 'ios') return;
    
    // iOS 字体预加载逻辑
    // 这里可以扩展实现字体预加载
    console.log('Preloading fonts:', fontNames);
  }
  
  /**
   * 清理预加载缓存
   */
  static clearCache() {
    this.cache.clear();
  }
}

/**
 * React Native 性能监控
 */
export class MobilePerformanceMonitor {
  private static metrics = new Map<string, { startTime: number; endTime?: number }>();
  
  /**
   * 开始性能测量
   */
  static startMeasure(name: string) {
    this.metrics.set(name, { 
      startTime: Date.now() 
    });
  }
  
  /**
   * 结束性能测量
   */
  static endMeasure(name: string) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.endTime = Date.now();
      const duration = metric.endTime - metric.startTime;
      
      console.log(`[Performance] ${name}: ${duration}ms`);
      
      // 发送到分析服务
      this.reportToAnalytics(name, duration);
      
      this.metrics.delete(name);
      return duration;
    }
    return 0;
  }
  
  /**
   * 发送性能数据到分析服务
   */
  private static reportToAnalytics(name: string, duration: number) {
    // 这里可以集成到 Firebase Analytics 或其他分析服务
    try {
      // 示例：Firebase Analytics
      // analytics().logEvent('performance_metric', {
      //   metric_name: name,
      //   duration: duration,
      //   platform: Platform.OS
      // });
    } catch (error) {
      console.warn('Failed to report performance metrics:', error);
    }
  }
  
  /**
   * 获取内存使用信息（开发模式）
   */
  static getMemoryInfo() {
    if (__DEV__) {
      // 在开发模式下可以使用一些调试工具
      console.log('Memory info - Available in development mode');
    }
  }
}

/**
 * 交互优化工具
 */
export class InteractionOptimizer {
  /**
   * 延迟执行直到交互完成
   */
  static runAfterInteractions<T>(callback: () => T): Promise<T> {
    return new Promise(resolve => {
      InteractionManager.runAfterInteractions(() => {
        resolve(callback());
      });
    });
  }
  
  /**
   * 批量延迟执行
   */
  static batchAfterInteractions<T>(callbacks: Array<() => T>): Promise<T[]> {
    return new Promise(resolve => {
      InteractionManager.runAfterInteractions(() => {
        const results = callbacks.map(callback => callback());
        resolve(results);
      });
    });
  }
  
  /**
   * 节流优化的状态更新
   */
  static throttledUpdate<T>(
    updateFn: (value: T) => void,
    delay: number = 16 // 60fps
  ) {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (value: T) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        updateFn(value);
        timeoutId = null;
      }, delay);
    };
  }
}