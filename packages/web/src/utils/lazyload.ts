import { lazy, ComponentType } from 'react';

/**
 * 增强的懒加载工具
 * 支持预加载、错误重试、加载优先级等高级功能
 */

// 预加载缓存
const preloadCache = new Map<string, Promise<{ default: ComponentType<unknown> }>>();

// 懒加载配置
interface LazyLoadOptions {
  preload?: boolean;
  priority?: 'high' | 'normal' | 'low';
  retryCount?: number;
  timeout?: number;
  chunkName?: string;
}

/**
 * 增强的懒加载函数
 */
export function createLazyComponent<T = Record<string, unknown>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyLoadOptions = {}
) {
  const {
    preload = false,
    priority = 'normal',
    retryCount = 3,
    timeout = 30000,
    chunkName
  } = options;

  // 带重试机制的导入函数
  const importWithRetry = async (): Promise<{ default: ComponentType<T> }> => {
    let lastError: Error;
    
    for (let i = 0; i < retryCount; i++) {
      try {
        // 添加超时控制
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Import timeout')), timeout);
        });
        
        const result = await Promise.race([importFn(), timeoutPromise]);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Lazy import failed (attempt ${i + 1}/${retryCount}):`, error);
        
        // 等待重试延迟
        if (i < retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
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
    
    const promise = importWithRetry();
    preloadCache.set(cacheKey, promise);
    
    return promise;
  });

  // 预加载功能
  LazyComponent.preload = () => {
    const cacheKey = chunkName || importFn.toString();
    if (!preloadCache.has(cacheKey)) {
      const promise = importWithRetry();
      preloadCache.set(cacheKey, promise);
    }
    return preloadCache.get(cacheKey)!;
  };

  // 如果设置了预加载，立即开始预加载
  if (preload) {
    // 根据优先级决定预加载时机
    switch (priority) {
      case 'high':
        LazyComponent.preload();
        break;
      case 'normal':
        setTimeout(() => LazyComponent.preload(), 100);
        break;
      case 'low':
        setTimeout(() => LazyComponent.preload(), 1000);
        break;
    }
  }

  return LazyComponent;
}

/**
 * 预加载多个组件
 */
export function preloadComponents(components: Array<{ preload: () => Promise<unknown> }>) {
  return Promise.all(components.map(component => 
    component.preload().catch(error => {
      console.warn('Preload failed:', error);
      return null;
    })
  ));
}

/**
 * 基于路由的智能预加载
 */
export class RoutePreloader {
  private static instance: RoutePreloader;
  private preloadedRoutes = new Set<string>();
  private preloadQueue: Array<{ path: string; preloader: () => Promise<unknown> }> = [];
  
  static getInstance() {
    if (!RoutePreloader.instance) {
      RoutePreloader.instance = new RoutePreloader();
    }
    return RoutePreloader.instance;
  }
  
  /**
   * 注册路由预加载器
   */
  registerRoute(path: string, preloader: () => Promise<unknown>) {
    this.preloadQueue.push({ path, preloader });
  }
  
  /**
   * 预加载相关路由
   */
  async preloadRoute(currentPath: string) {
    // 预加载逻辑：预加载可能访问的相关路由
    const relatedRoutes = this.getRelatedRoutes(currentPath);
    
    for (const route of relatedRoutes) {
      if (!this.preloadedRoutes.has(route.path)) {
        try {
          await route.preloader();
          this.preloadedRoutes.add(route.path);
        } catch (error) {
          console.warn(`Failed to preload route ${route.path}:`, error);
        }
      }
    }
  }
  
  /**
   * 获取相关路由（简单的启发式算法）
   */
  private getRelatedRoutes(currentPath: string) {
    const routeRelations: Record<string, string[]> = {
      '/': ['/search', '/library'],
      '/search': ['/playlist', '/library'],
      '/library': ['/playlist', '/recent'],
      '/playlist': ['/lyrics'],
      '/settings': ['/stats']
    };
    
    const relatedPaths = routeRelations[currentPath] || [];
    return this.preloadQueue.filter(route => 
      relatedPaths.some(path => route.path.includes(path))
    );
  }
}

/**
 * 资源预加载器
 */
export class ResourcePreloader {
  private static cache = new Map<string, Promise<unknown>>();
  
  /**
   * 预加载图片
   */
  static preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }
    
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    
    this.cache.set(src, promise);
    return promise;
  }
  
  /**
   * 预加载音频元数据
   */
  static preloadAudioMetadata(src: string): Promise<HTMLAudioElement> {
    if (this.cache.has(`audio:${src}`)) {
      return this.cache.get(`audio:${src}`)!;
    }
    
    const promise = new Promise<HTMLAudioElement>((resolve, reject) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => resolve(audio);
      audio.onerror = reject;
      audio.src = src;
    });
    
    this.cache.set(`audio:${src}`, promise);
    return promise;
  }
  
  /**
   * 预加载字体
   */
  static preloadFont(fontFamily: string, src: string): Promise<void> {
    if (this.cache.has(`font:${fontFamily}`)) {
      return this.cache.get(`font:${fontFamily}`)!;
    }
    
    const promise = new Promise<void>((resolve, reject) => {
      const font = new FontFace(fontFamily, `url(${src})`);
      font.load()
        .then(() => {
          document.fonts.add(font);
          resolve();
        })
        .catch(reject);
    });
    
    this.cache.set(`font:${fontFamily}`, promise);
    return promise;
  }
}

/**
 * 性能监控
 */
export class LazyLoadPerformanceMonitor {
  private static loadTimes = new Map<string, number>();
  
  static startTiming(componentName: string) {
    this.loadTimes.set(componentName, performance.now());
  }
  
  static endTiming(componentName: string) {
    const startTime = this.loadTimes.get(componentName);
    if (startTime) {
      const loadTime = performance.now() - startTime;
      console.log(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      this.loadTimes.delete(componentName);
      
      // 发送性能数据到分析服务
      this.reportPerformance(componentName, loadTime);
    }
  }
  
  private static reportPerformance(componentName: string, loadTime: number) {
    // 这里可以集成到你的分析服务
    if (typeof gtag !== 'undefined') {
      gtag('event', 'lazy_load_performance', {
        component_name: componentName,
        load_time: Math.round(loadTime),
        custom_map: { metric1: 'load_time' }
      });
    }
  }
}