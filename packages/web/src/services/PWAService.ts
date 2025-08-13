/**
 * PWA服务 - 渐进式Web应用功能
 * 包括Service Worker、离线缓存、桌面安装等
 */

import type { Song, Playlist } from '@music-player/shared';

// 扩展Window接口以支持PWA事件
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// PWA配置接口
export interface PWAConfig {
  enableOfflineMode: boolean;
  cacheStrategy: 'cacheFirst' | 'networkFirst' | 'staleWhileRevalidate';
  maxCacheSize: number; // MB
  maxCacheAge: number; // 毫秒
  offlinePagePath: string;
  enableBackgroundSync: boolean;
  enablePushNotifications: boolean;
}

// 默认PWA配置
const defaultPWAConfig: PWAConfig = {
  enableOfflineMode: true,
  cacheStrategy: 'staleWhileRevalidate',
  maxCacheSize: 500, // 500MB
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7天
  offlinePagePath: '/offline',
  enableBackgroundSync: false,
  enablePushNotifications: false,
};

/**
 * PWA管理服务
 */
export class PWAService {
  private static instance: PWAService;
  private config: PWAConfig;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isOnline: boolean = navigator.onLine;
  
  // 缓存管理
  private cacheNames = {
    static: 'music-player-static-v1',
    dynamic: 'music-player-dynamic-v1',
    audio: 'music-player-audio-v1',
    images: 'music-player-images-v1',
  };
  
  private constructor(config: Partial<PWAConfig> = {}) {
    this.config = { ...defaultPWAConfig, ...config };
    this.initializePWA();
  }
  
  static getInstance(config?: Partial<PWAConfig>): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService(config);
    }
    return PWAService.instance;
  }
  
  /**
   * 初始化PWA功能
   */
  private async initializePWA() {
    if ('serviceWorker' in navigator) {
      await this.registerServiceWorker();
    }
    
    this.setupInstallPrompt();
    this.setupNetworkListeners();
    this.setupMediaSession();
    
    if (this.config.enablePushNotifications) {
      await this.setupPushNotifications();
    }
  }
  
  /**
   * 注册Service Worker
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      this.serviceWorkerRegistration = registration;
      
      console.log('Service Worker registered successfully');
      
      // 监听Service Worker更新
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        this.handleServiceWorkerUpdate(registration);
      });
      
      // 配置Service Worker
      this.configureServiceWorker();
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  
  /**
   * 配置Service Worker
   */
  private configureServiceWorker() {
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'CONFIGURE',
        config: this.config,
        cacheNames: this.cacheNames,
      });
    }
  }
  
  /**
   * 处理Service Worker更新
   */
  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration) {
    const newWorker = registration.installing;
    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // 有新版本可用
            this.notifyAppUpdate();
          }
        }
      });
    }
  }
  
  /**
   * 通知应用更新
   */
  private notifyAppUpdate() {
    const event = new CustomEvent('appUpdateAvailable', {
      detail: { registration: this.serviceWorkerRegistration }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * 应用更新
   */
  async applyUpdate(): Promise<void> {
    if (this.serviceWorkerRegistration?.waiting) {
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
  
  /**
   * 设置应用安装提示
   */
  private setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // 阻止默认的安装提示
      e.preventDefault();
      this.deferredPrompt = e;
      
      // 触发自定义安装提示事件
      const event = new CustomEvent('appInstallPrompt', {
        detail: { prompt: e }
      });
      window.dispatchEvent(event);
    });
    
    // 监听应用安装完成
    window.addEventListener('appinstalled', () => {
      console.log('App installed successfully');
      this.deferredPrompt = null;
      
      const event = new CustomEvent('appInstalled');
      window.dispatchEvent(event);
    });
  }
  
  /**
   * 显示安装提示
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }
    
    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log(`Install prompt outcome: ${outcome}`);
      this.deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }
  
  /**
   * 检查是否可以安装
   */
  canInstall(): boolean {
    return !!this.deferredPrompt;
  }
  
  /**
   * 检查是否已安装
   */
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as { standalone?: boolean }).standalone === true;
  }
  
  /**
   * 设置网络监听器
   */
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('App is online');
      this.syncWhenOnline();
      
      const event = new CustomEvent('networkStatusChange', {
        detail: { isOnline: true }
      });
      window.dispatchEvent(event);
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('App is offline');
      
      const event = new CustomEvent('networkStatusChange', {
        detail: { isOnline: false }
      });
      window.dispatchEvent(event);
    });
  }
  
  /**
   * 在线时同步数据
   */
  private async syncWhenOnline() {
    if (this.config.enableBackgroundSync && this.serviceWorkerRegistration?.sync) {
      try {
        await this.serviceWorkerRegistration.sync.register('background-sync');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }
  
  /**
   * 设置媒体会话
   */
  private setupMediaSession() {
    if ('mediaSession' in navigator) {
      // 设置默认媒体元数据
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Music Player',
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        artwork: [
          { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-256x256.png', sizes: '256x256', type: 'image/png' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ]
      });
      
      // 设置支持的操作
      const actionHandlers = [
        'play',
        'pause',
        'previoustrack',
        'nexttrack',
        'seekbackward',
        'seekforward',
        'stop',
      ];
      
      actionHandlers.forEach(action => {
        try {
          navigator.mediaSession.setActionHandler(action as MediaSessionAction, (details) => {
            this.handleMediaSessionAction(action as MediaSessionAction, details);
          });
        } catch (error) {
          console.warn(`Media session action ${action} not supported:`, error);
        }
      });
    }
  }
  
  /**
   * 处理媒体会话操作
   */
  private handleMediaSessionAction(action: MediaSessionAction, details?: MediaSessionActionDetails) {
    const event = new CustomEvent('mediaSessionAction', {
      detail: { action, details }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * 更新媒体会话元数据
   */
  updateMediaSession(song: Song) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album || 'Unknown Album',
        artwork: song.albumCover ? [
          { src: song.albumCover, sizes: '512x512', type: 'image/jpeg' }
        ] : []
      });
    }
  }
  
  /**
   * 设置播放状态
   */
  setPlaybackState(state: MediaSessionPlaybackState) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = state;
    }
  }
  
  /**
   * 设置位置状态
   */
  setPositionState(duration: number, position: number, playbackRate: number = 1.0) {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          position,
          playbackRate,
        });
      } catch (error) {
        console.warn('Failed to set position state:', error);
      }
    }
  }
  
  /**
   * 设置推送通知
   */
  private async setupPushNotifications() {
    if (!('Notification' in window) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Push notifications enabled');
      await this.subscribeToPush();
    }
  }
  
  /**
   * 订阅推送服务
   */
  private async subscribeToPush() {
    if (!this.serviceWorkerRegistration) return;
    
    try {
      await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || ''),
      });
      
      console.log('Push subscription successful');
      // 这里可以将订阅信息发送到服务器
      
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }
  
  /**
   * 发送本地通知
   */
  async sendNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: 'music-player',
        renotify: true,
        ...options,
      });
      
      // 自动关闭通知
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }
  
  /**
   * 预缓存重要资源
   */
  async precacheResources(resources: string[]): Promise<void> {
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'PRECACHE_RESOURCES',
        resources,
      });
    }
  }
  
  /**
   * 缓存歌曲
   */
  async cacheSong(song: Song): Promise<void> {
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'CACHE_SONG',
        song,
      });
    }
  }
  
  /**
   * 缓存播放列表
   */
  async cachePlaylist(playlist: Playlist): Promise<void> {
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'CACHE_PLAYLIST',
        playlist,
      });
    }
  }
  
  /**
   * 获取缓存状态
   */
  async getCacheStatus(): Promise<{
    size: number;
    items: number;
    quota?: number;
    usage?: number;
  } | null> {
    return new Promise((resolve) => {
      if (this.serviceWorkerRegistration?.active) {
        const channel = new MessageChannel();
        
        channel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        this.serviceWorkerRegistration.active.postMessage({
          type: 'GET_CACHE_STATUS',
        }, [channel.port2]);
      } else {
        resolve(null);
      }
    });
  }
  
  /**
   * 清理缓存
   */
  async clearCache(): Promise<void> {
    if (this.serviceWorkerRegistration?.active) {
      this.serviceWorkerRegistration.active.postMessage({
        type: 'CLEAR_CACHE',
      });
    }
  }
  
  /**
   * 获取网络状态
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }
  
  /**
   * 工具方法：Base64转Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }
}