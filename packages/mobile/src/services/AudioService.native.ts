import { Audio, AVPlaybackSource } from 'expo-av';
import { AudioEngine } from '@music-player/shared';

/**
 * React Native音频播放服务实现
 * 使用Expo AV提供音频播放功能
 */
export class NativeAudioEngine implements AudioEngine {
  private sound: Audio.Sound | null = null;
  private isLoaded = false;
  private _onTimeUpdate?: (time: number) => void;
  private _onLoadedMetadata?: (duration: number) => void;
  private _onEnded?: () => void;
  private _onError?: (error: Error) => void;
  private _onLoadStart?: () => void;
  private _onCanPlay?: () => void;
  
  private positionUpdateTimer?: NodeJS.Timeout;
  
  constructor() {
    this.setupAudioMode();
  }
  
  private async setupAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('设置音频模式失败:', error);
    }
  }
  
  async load(url: string): Promise<void> {
    try {
      // 卸载之前的音频
      await this.unload();
      
      this._onLoadStart?.();
      
      // 创建新的音频对象
      const { sound } = await Audio.Sound.createAsync(
        { uri: url } as AVPlaybackSource,
        {
          shouldPlay: false,
          isLooping: false,
          volume: 1.0,
        },
        this.onPlaybackStatusUpdate.bind(this)
      );
      
      this.sound = sound;
      this.isLoaded = true;
      
    } catch (error) {
      console.error('音频加载失败:', error);
      this._onError?.(error as Error);
    }
  }
  
  async play(): Promise<void> {
    if (!this.sound || !this.isLoaded) {
      throw new Error('音频未加载');
    }
    
    try {
      await this.sound.playAsync();
      this.startPositionUpdates();
    } catch (error) {
      console.error('播放失败:', error);
      this._onError?.(error as Error);
    }
  }
  
  async pause(): Promise<void> {
    if (!this.sound) return;
    
    try {
      await this.sound.pauseAsync();
      this.stopPositionUpdates();
    } catch (error) {
      console.error('暂停失败:', error);
      this._onError?.(error as Error);
    }
  }
  
  async stop(): Promise<void> {
    if (!this.sound) return;
    
    try {
      await this.sound.stopAsync();
      this.stopPositionUpdates();
    } catch (error) {
      console.error('停止失败:', error);
      this._onError?.(error as Error);
    }
  }
  
  async seek(time: number): Promise<void> {
    if (!this.sound) return;
    
    try {
      await this.sound.setPositionAsync(time * 1000); // 转换为毫秒
    } catch (error) {
      console.error('跳转失败:', error);
      this._onError?.(error as Error);
    }
  }
  
  async setVolume(volume: number): Promise<void> {
    if (!this.sound) return;
    
    try {
      await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    } catch (error) {
      console.error('设置音量失败:', error);
      this._onError?.(error as Error);
    }
  }
  
  async unload(): Promise<void> {
    this.stopPositionUpdates();
    
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('卸载音频失败:', error);
      }
      this.sound = null;
    }
    
    this.isLoaded = false;
  }
  
  private onPlaybackStatusUpdate(status: any) {
    if (!status.isLoaded) return;
    
    // 首次加载完成
    if (status.durationMillis && !this._onLoadedMetadata) {
      this._onLoadedMetadata?.(status.durationMillis / 1000);
      this._onCanPlay?.();
    }
    
    // 播放结束
    if (status.didJustFinish) {
      this._onEnded?.();
      this.stopPositionUpdates();
    }
    
    // 更新播放位置
    if (status.positionMillis !== undefined) {
      this._onTimeUpdate?.(status.positionMillis / 1000);
    }
  }
  
  private startPositionUpdates() {
    this.stopPositionUpdates();
    this.positionUpdateTimer = setInterval(async () => {
      if (this.sound) {
        try {
          const status = await this.sound.getStatusAsync();
          if (status.isLoaded && status.positionMillis !== undefined) {
            this._onTimeUpdate?.(status.positionMillis / 1000);
          }
        } catch (error) {
          // 忽略获取状态错误
        }
      }
    }, 100); // 每100ms更新一次
  }
  
  private stopPositionUpdates() {
    if (this.positionUpdateTimer) {
      clearInterval(this.positionUpdateTimer);
      this.positionUpdateTimer = undefined;
    }
  }
  
  // 事件监听器设置
  set onTimeUpdate(callback: ((time: number) => void) | undefined) {
    this._onTimeUpdate = callback;
  }
  
  set onLoadedMetadata(callback: ((duration: number) => void) | undefined) {
    this._onLoadedMetadata = callback;
  }
  
  set onEnded(callback: (() => void) | undefined) {
    this._onEnded = callback;
  }
  
  set onError(callback: ((error: Error) => void) | undefined) {
    this._onError = callback;
  }
  
  set onLoadStart(callback: (() => void) | undefined) {
    this._onLoadStart = callback;
  }
  
  set onCanPlay(callback: (() => void) | undefined) {
    this._onCanPlay = callback;
  }
  
  // Getters
  get currentTime(): number {
    // 这个值通过onPlaybackStatusUpdate更新
    return 0;
  }
  
  get duration(): number {
    // 这个值通过onPlaybackStatusUpdate更新
    return 0;
  }
  
  get volume(): number {
    // 需要从sound对象获取，暂时返回1
    return 1;
  }
  
  get paused(): boolean {
    // 需要从sound状态获取，暂时返回false
    return false;
  }
  
  get ended(): boolean {
    // 需要从sound状态获取，暂时返回false
    return false;
  }
}