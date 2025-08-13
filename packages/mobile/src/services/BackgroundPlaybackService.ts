/**
 * React Native 后台播放服务
 * 支持锁屏播放、通知控制、音频焦点管理等移动端特性
 */

import { AppState, Platform } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import type { Song } from '@music-player/shared';

// 后台任务定义
const BACKGROUND_AUDIO_TASK = 'background-audio-task';

// 通知配置
export interface NotificationConfig {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  isPlaying: boolean;
  position: number;
  duration: number;
}

// 锁屏控制配置
export interface LockScreenConfig {
  enableSkipButtons: boolean;
  enableSeekButtons: boolean;
  enableRepeatButton: boolean;
  enableShuffleButton: boolean;
  showProgress: boolean;
}

/**
 * 后台播放管理服务
 */
export class BackgroundPlaybackService {
  private static instance: BackgroundPlaybackService;
  private isInitialized = false;
  private currentSong: Song | null = null;
  private playbackStatus: AVPlaybackStatus | null = null;
  private appStateSubscription: any = null;
  
  // 配置
  private lockScreenConfig: LockScreenConfig = {
    enableSkipButtons: true,
    enableSeekButtons: true,
    enableRepeatButton: true,
    enableShuffleButton: true,
    showProgress: true,
  };
  
  private constructor() {
    this.initializeService();
  }
  
  static getInstance(): BackgroundPlaybackService {
    if (!BackgroundPlaybackService.instance) {
      BackgroundPlaybackService.instance = new BackgroundPlaybackService();
    }
    return BackgroundPlaybackService.instance;
  }
  
  /**
   * 初始化后台播放服务
   */
  private async initializeService() {
    if (this.isInitialized) return;
    
    try {
      // 配置音频模式
      await this.setupAudioMode();
      
      // 设置通知处理器
      await this.setupNotifications();
      
      // 注册后台任务
      await this.registerBackgroundTask();
      
      // 监听应用状态变化
      this.setupAppStateListeners();
      
      // 请求权限
      await this.requestPermissions();
      
      this.isInitialized = true;
      console.log('Background playback service initialized');
      
    } catch (error) {
      console.error('Failed to initialize background playback service:', error);
    }
  }
  
  /**
   * 配置音频模式
   */
  private async setupAudioMode() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: false,
    });
  }
  
  /**
   * 设置通知处理器
   */
  private async setupNotifications() {
    // 配置通知外观
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false, // 播放器通知不显示弹窗
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    
    // 监听通知操作
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse.bind(this));
  }
  
  /**
   * 处理通知响应
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { actionIdentifier, userText } = response;
    
    switch (actionIdentifier) {
      case 'PLAY_PAUSE':
        this.handlePlayPauseAction();
        break;
      case 'SKIP_NEXT':
        this.handleSkipNextAction();
        break;
      case 'SKIP_PREVIOUS':
        this.handleSkipPreviousAction();
        break;
      case 'STOP':
        this.handleStopAction();
        break;
      default:
        // 点击通知本身，打开应用
        this.handleOpenApp();
        break;
    }
  }
  
  /**
   * 注册后台任务
   */
  private async registerBackgroundTask() {
    if (!TaskManager.isTaskDefined(BACKGROUND_AUDIO_TASK)) {
      TaskManager.defineTask(BACKGROUND_AUDIO_TASK, ({ data, error }) => {
        if (error) {
          console.error('Background task error:', error);
          return;
        }
        
        // 后台任务逻辑
        this.handleBackgroundTask(data);
      });
    }
    
    // 启动后台任务
    try {
      await TaskManager.startTaskAsync(BACKGROUND_AUDIO_TASK, {
        keepAlive: true,
      });
    } catch (error) {
      console.warn('Background task not supported:', error);
    }
  }
  
  /**
   * 处理后台任务
   */
  private handleBackgroundTask(data: any) {
    // 在后台保持音频播放状态
    console.log('Background task running:', data);
    
    // 可以在这里执行需要在后台运行的逻辑
    // 例如：更新播放进度、处理网络请求等
  }
  
  /**
   * 设置应用状态监听器
   */
  private setupAppStateListeners() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('App state changed to:', nextAppState);
      
      switch (nextAppState) {
        case 'background':
          this.handleAppBackground();
          break;
        case 'active':
          this.handleAppForeground();
          break;
        case 'inactive':
          this.handleAppInactive();
          break;
      }
    });
  }
  
  /**
   * 处理应用进入后台
   */
  private handleAppBackground() {
    console.log('App entered background');
    
    // 确保后台播放继续
    if (this.currentSong && this.playbackStatus?.isLoaded) {
      this.updateLockScreenInfo();
      this.showPlaybackNotification();
    }
  }
  
  /**
   * 处理应用回到前台
   */
  private handleAppForeground() {
    console.log('App returned to foreground');
    
    // 清除通知
    this.clearPlaybackNotification();
  }
  
  /**
   * 处理应用变为非活跃状态
   */
  private handleAppInactive() {
    console.log('App became inactive');
    
    // 准备进入后台播放模式
    if (this.currentSong) {
      this.prepareBackgroundPlayback();
    }
  }
  
  /**
   * 请求必要权限
   */
  private async requestPermissions() {
    try {
      // 请求通知权限
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permission not granted');
      }
      
      // 请求媒体库权限（如果需要扫描本地音乐）
      const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
      if (mediaLibraryStatus.status !== 'granted') {
        console.warn('Media library permission not granted');
      }
      
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }
  
  /**
   * 更新当前播放歌曲
   */
  updateCurrentSong(song: Song, playbackStatus: AVPlaybackStatus) {
    this.currentSong = song;
    this.playbackStatus = playbackStatus;
    
    // 如果应用在后台，更新通知和锁屏信息
    if (AppState.currentState === 'background') {
      this.updateLockScreenInfo();
      this.updatePlaybackNotification();
    }
  }
  
  /**
   * 更新锁屏信息
   */
  private updateLockScreenInfo() {
    if (!this.currentSong || !this.playbackStatus?.isLoaded) return;
    
    try {
      // iOS: 使用 MPNowPlayingInfoCenter
      if (Platform.OS === 'ios') {
        const MPNowPlayingInfoCenter = require('react-native').NativeModules.MPNowPlayingInfoCenter;
        
        if (MPNowPlayingInfoCenter) {
          MPNowPlayingInfoCenter.setNowPlayingInfo({
            title: this.currentSong.title,
            artist: this.currentSong.artist,
            albumTitle: this.currentSong.album || '',
            artwork: this.currentSong.albumCover || '',
            playbackRate: this.playbackStatus.isPlaying ? 1.0 : 0.0,
            elapsedPlaybackTime: (this.playbackStatus.positionMillis || 0) / 1000,
            playbackDuration: (this.playbackStatus.durationMillis || 0) / 1000,
          });
        }
      }
      
      // Android: 使用 MediaSession
      if (Platform.OS === 'android') {
        // Android的MediaSession集成需要原生模块支持
        // 这里可以扩展实现
        console.log('Updating Android MediaSession');
      }
      
    } catch (error) {
      console.error('Failed to update lock screen info:', error);
    }
  }
  
  /**
   * 显示播放通知
   */
  private async showPlaybackNotification() {
    if (!this.currentSong) return;
    
    try {
      const notificationConfig: NotificationConfig = {
        title: this.currentSong.title,
        artist: this.currentSong.artist,
        album: this.currentSong.album,
        artwork: this.currentSong.albumCover,
        isPlaying: this.playbackStatus?.isPlaying || false,
        position: (this.playbackStatus?.positionMillis || 0) / 1000,
        duration: (this.playbackStatus?.durationMillis || 0) / 1000,
      };
      
      await this.createPlaybackNotification(notificationConfig);
      
    } catch (error) {
      console.error('Failed to show playback notification:', error);
    }
  }
  
  /**
   * 创建播放通知
   */
  private async createPlaybackNotification(config: NotificationConfig) {
    const actions = [];
    
    // 添加控制按钮
    if (this.lockScreenConfig.enableSkipButtons) {
      actions.push({
        identifier: 'SKIP_PREVIOUS',
        buttonTitle: '⏮️',
        options: { opensAppToForeground: false },
      });
    }
    
    actions.push({
      identifier: 'PLAY_PAUSE',
      buttonTitle: config.isPlaying ? '⏸️' : '▶️',
      options: { opensAppToForeground: false },
    });
    
    if (this.lockScreenConfig.enableSkipButtons) {
      actions.push({
        identifier: 'SKIP_NEXT',
        buttonTitle: '⏭️',
        options: { opensAppToForeground: false },
      });
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: config.artist,
        categoryIdentifier: 'PLAYBACK_CONTROL',
        data: {
          type: 'playback',
          songId: this.currentSong?.id,
        },
      },
      trigger: null, // 立即显示
    });
  }
  
  /**
   * 更新播放通知
   */
  private async updatePlaybackNotification() {
    // 取消当前通知并显示新的
    await this.clearPlaybackNotification();
    await this.showPlaybackNotification();
  }
  
  /**
   * 清除播放通知
   */
  private async clearPlaybackNotification() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
  
  /**
   * 准备后台播放
   */
  private prepareBackgroundPlayback() {
    // 确保音频会话配置正确
    this.setupAudioMode();
    
    // 发送事件通知其他组件准备后台播放
    const event = new CustomEvent('prepareBackgroundPlayback', {
      detail: {
        currentSong: this.currentSong,
        playbackStatus: this.playbackStatus,
      }
    });
    
    // 在React Native中，我们使用DeviceEventEmitter
    const { DeviceEventEmitter } = require('react-native');
    DeviceEventEmitter.emit('prepareBackgroundPlayback', {
      currentSong: this.currentSong,
      playbackStatus: this.playbackStatus,
    });
  }
  
  /**
   * 通知操作处理器
   */
  private handlePlayPauseAction() {
    this.emitControlAction('TOGGLE_PLAY_PAUSE');
  }
  
  private handleSkipNextAction() {
    this.emitControlAction('SKIP_NEXT');
  }
  
  private handleSkipPreviousAction() {
    this.emitControlAction('SKIP_PREVIOUS');
  }
  
  private handleStopAction() {
    this.emitControlAction('STOP');
  }
  
  private handleOpenApp() {
    this.emitControlAction('OPEN_APP');
  }
  
  /**
   * 发射控制动作事件
   */
  private emitControlAction(action: string) {
    const { DeviceEventEmitter } = require('react-native');
    DeviceEventEmitter.emit('backgroundPlaybackControl', { action });
  }
  
  /**
   * 配置锁屏控制
   */
  configureLockScreen(config: Partial<LockScreenConfig>) {
    this.lockScreenConfig = { ...this.lockScreenConfig, ...config };
    
    // 如果在后台，立即更新锁屏信息
    if (AppState.currentState === 'background') {
      this.updateLockScreenInfo();
    }
  }
  
  /**
   * 检查后台播放权限
   */
  async checkBackgroundPlaybackPermission(): Promise<boolean> {
    try {
      // 检查音频权限
      const audioPermissions = await Audio.getPermissionsAsync();
      
      // 检查通知权限
      const notificationPermissions = await Notifications.getPermissionsAsync();
      
      return audioPermissions.granted && notificationPermissions.granted;
    } catch (error) {
      console.error('Failed to check background playback permission:', error);
      return false;
    }
  }
  
  /**
   * 启用/禁用后台播放
   */
  setBackgroundPlaybackEnabled(enabled: boolean) {
    if (enabled) {
      this.setupAudioMode();
    } else {
      // 禁用后台播放
      Audio.setAudioModeAsync({
        staysActiveInBackground: false,
        // 其他设置保持不变
      });
    }
  }
  
  /**
   * 获取后台播放状态
   */
  getBackgroundPlaybackStatus() {
    return {
      isEnabled: this.isInitialized,
      currentSong: this.currentSong,
      playbackStatus: this.playbackStatus,
      appState: AppState.currentState,
    };
  }
  
  /**
   * 销毁服务
   */
  destroy() {
    // 清理监听器
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    // 停止后台任务
    TaskManager.unregisterAllTasksAsync();
    
    // 清除通知
    this.clearPlaybackNotification();
    
    // 重置状态
    this.currentSong = null;
    this.playbackStatus = null;
    this.isInitialized = false;
    
    console.log('Background playback service destroyed');
  }
}