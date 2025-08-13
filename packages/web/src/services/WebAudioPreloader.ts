import { AudioPreloader, type PreloadConfig, type NetworkInfo } from '@music-player/shared';

/**
 * Web平台音频预加载实现
 * 基于Web API扩展预加载功能
 */

// 网络连接信息接口
interface NetworkConnection {
  effectiveType?: string;
  type?: string;
  saveData?: boolean;
  downlink?: number;
}

class WebNetworkMonitor {
  /**
   * 获取Web平台网络信息
   */
  async getNetworkInfo(): Promise<NetworkInfo> {
    const connection = (navigator as { connection?: NetworkConnection }).connection;
    
    const networkInfo: NetworkInfo = {
      isConnected: navigator.onLine,
      connectionType: this.getConnectionType(connection),
      isMetered: this.isMeteredConnection(connection),
      downloadSpeed: connection?.downlink || undefined,
    };
    
    return networkInfo;
  }
  
  private getConnectionType(connection?: NetworkConnection): 'wifi' | 'cellular' | 'unknown' {
    if (!connection) return 'unknown';
    
    const effectiveType = connection.effectiveType;
    const type = connection.type;
    
    // 基于连接类型判断
    if (type === 'wifi' || type === 'ethernet') {
      return 'wifi';
    }
    
    if (type === 'cellular' || effectiveType === '2g' || effectiveType === '3g' || effectiveType === '4g') {
      return 'cellular';
    }
    
    return 'unknown';
  }
  
  private isMeteredConnection(connection?: NetworkConnection): boolean {
    if (!connection) return false;
    
    // 检查是否是计费连接
    if (connection.saveData) return true;
    
    // 基于连接类型推断
    const type = connection.type;
    return type === 'cellular' || type === 'bluetooth' || type === 'wimax';
  }
}

/**
 * Web音频预加载器
 */
export class WebAudioPreloader extends AudioPreloader {
  private static webInstance: WebAudioPreloader;
  private networkMonitor: WebNetworkMonitor;
  private mediaSession: MediaSession | null = null;
  
  private constructor(config?: Partial<PreloadConfig>) {
    // Web平台默认配置
    const webConfig: Partial<PreloadConfig> = {
      maxConcurrentPreloads: 2, // Web平台减少并发数
      maxCacheSize: 200, // 200MB缓存
      enableOnCellular: false, // 默认不在移动网络预加载
      wifiOnlyPreload: true,
      ...config,
    };
    
    super(webConfig);
    this.networkMonitor = new WebNetworkMonitor();
    this.initializeMediaSession();
    this.initializeNetworkListeners();
  }
  
  static getInstance(config?: Partial<PreloadConfig>): WebAudioPreloader {
    if (!WebAudioPreloader.webInstance) {
      WebAudioPreloader.webInstance = new WebAudioPreloader(config);
    }
    return WebAudioPreloader.webInstance;
  }
  
  /**
   * 初始化Media Session API
   */
  private initializeMediaSession() {
    if ('mediaSession' in navigator) {
      this.mediaSession = navigator.mediaSession;
    }
  }
  
  /**
   * 初始化网络状态监听器
   */
  private initializeNetworkListeners() {
    // 监听在线/离线状态
    window.addEventListener('online', this.handleNetworkChange.bind(this));
    window.addEventListener('offline', this.handleNetworkChange.bind(this));
    
    // 监听连接变化
    const connection = (navigator as { connection?: NetworkConnection }).connection;
    if (connection) {
      (connection as EventTarget).addEventListener('change', this.handleNetworkChange.bind(this));
    }
  }
  
  /**
   * 处理网络状态变化
   */
  private async handleNetworkChange() {
    const networkInfo = await this.networkMonitor.getNetworkInfo();
    console.log('Network changed:', networkInfo);
    
    // 如果网络状况不佳，暂停预加载
    if (!networkInfo.isConnected || networkInfo.isMetered) {
      this.pauseAllPreloads();
    } else if (networkInfo.connectionType === 'wifi') {
      // WiFi环境下恢复预加载
      this.resumePreloads();
    }
  }
  
  /**
   * Web平台优化的音频获取
   */
  protected async fetchAudioData(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
    try {
      // 使用带有优化选项的fetch
      const response = await fetch(url, {
        signal,
        cache: 'force-cache', // 优先使用缓存
        credentials: 'omit',
        mode: 'cors',
        headers: {
          'Range': 'bytes=0-1048576', // 先预加载1MB
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // 检查是否支持部分内容
      if (response.status === 206) {
        // 支持Range请求，渐进式加载
        return this.progressiveLoad(url, signal);
      }
      
      return response.arrayBuffer();
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      // 降级到普通fetch
      console.warn('Range request failed, falling back to full download:', error);
      const response = await fetch(url, { signal });
      return response.arrayBuffer();
    }
  }
  
  /**
   * 渐进式音频加载
   */
  private async progressiveLoad(url: string, signal: AbortSignal): Promise<ArrayBuffer> {
    const chunkSize = 1024 * 1024; // 1MB chunks
    const chunks: ArrayBuffer[] = [];
    let totalSize = 0;
    let currentByte = 0;
    
    // 获取文件总大小
    const headResponse = await fetch(url, { 
      method: 'HEAD',
      signal 
    });
    const fileSize = parseInt(headResponse.headers.get('content-length') || '0');
    
    while (currentByte < fileSize) {
      if (signal.aborted) {
        throw new Error('AbortError');
      }
      
      const end = Math.min(currentByte + chunkSize - 1, fileSize - 1);
      
      const response = await fetch(url, {
        signal,
        headers: {
          'Range': `bytes=${currentByte}-${end}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chunk: ${response.status}`);
      }
      
      const chunk = await response.arrayBuffer();
      chunks.push(chunk);
      totalSize += chunk.byteLength;
      currentByte = end + 1;
      
      // 报告进度
      const progress = (currentByte / fileSize) * 100;
      this.reportProgress(url, progress);
      
      // 如果已经加载足够用于播放的数据，可以提前返回
      if (totalSize >= 2 * 1024 * 1024) { // 2MB足够开始播放
        break;
      }
    }
    
    // 合并所有chunks
    const result = new ArrayBuffer(totalSize);
    const view = new Uint8Array(result);
    let offset = 0;
    
    for (const chunk of chunks) {
      view.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }
    
    return result;
  }
  
  /**
   * 报告加载进度
   */
  private reportProgress(url: string, progress: number) {
    const songId = this.extractSongIdFromUrl(url);
    // 检查这个URL的预加载状态并更新进度
    this.dispatchProgressEvent(songId, progress);
  }
  
  /**
   * 从URL提取歌曲ID
   */
  private extractSongIdFromUrl(url: string): string {
    // 这里需要根据实际URL格式实现
    return url;
  }
  
  /**
   * 分发进度事件
   */
  private dispatchProgressEvent(songId: string, progress: number) {
    const event = new CustomEvent('preloadProgress', {
      detail: { songId, progress }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * 暂停所有预加载
   */
  private pauseAllPreloads() {
    for (const [, item] of this.preloadQueue.entries()) {
      if (item.status === 'loading' && item.abortController) {
        item.abortController.abort();
        item.status = 'cancelled';
      }
    }
    console.log('All preloads paused due to network conditions');
  }
  
  /**
   * 恢复预加载
   */
  private resumePreloads() {
    console.log('Resuming preloads on good network');
    // 这里可以实现恢复逻辑
  }
  
  /**
   * 集成Service Worker缓存
   */
  async setupServiceWorkerCache() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // 向Service Worker发送缓存指令
        if (registration.active) {
          registration.active.postMessage({
            type: 'SETUP_AUDIO_CACHE',
            config: this.config,
          });
        }
      } catch (error) {
        console.warn('Service Worker cache setup failed:', error);
      }
    }
  }
  
  /**
   * 获取缓存统计信息
   */
  async getCacheStats() {
    const stats = {
      totalSize: this.cacheSize,
      itemCount: this.cache.size,
      preloadQueueSize: this.preloadQueue.size,
      activePreloads: this.activePreloads.size,
    };
    
    // 如果支持Storage API，获取更详细的存储信息
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        stats.quota = estimate.quota;
        stats.usage = estimate.usage;
        stats.usagePercentage = estimate.usage && estimate.quota ? 
          (estimate.usage / estimate.quota) * 100 : 0;
      } catch (error) {
        console.warn('Storage estimate failed:', error);
      }
    }
    
    return stats;
  }
  
  /**
   * 清理磁盘缓存
   */
  async clearDiskCache() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const audioCaches = cacheNames.filter(name => name.includes('audio-preload'));
        
        await Promise.all(
          audioCaches.map(cacheName => caches.delete(cacheName))
        );
        
        console.log('Disk cache cleared');
      } catch (error) {
        console.warn('Failed to clear disk cache:', error);
      }
    }
  }
}