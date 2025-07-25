import type { Song, PlaybackState } from '../../types';

export interface AudioEngineConfig {
  volume: number;
  preload: boolean;
  crossfade: boolean;
  crossfadeDuration: number;
}

export interface AudioEngineEvents {
  onStateChange: (state: PlaybackState) => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onVolumeChange: (volume: number) => void;
  onError: (error: string) => void;
  onSongEnd: () => void;
  onLoadStart: () => void;
  onLoadComplete: () => void;
  onBuffering: (buffered: number) => void;
}

export class AudioEngine {
  private audio: HTMLAudioElement;
  private currentSong: Song | null = null;
  private state: PlaybackState = 'idle';
  private config: AudioEngineConfig;
  private events: Partial<AudioEngineEvents>;
  private timeUpdateInterval: number | null = null;
  private fadeOutTimer: number | null = null;
  private fadeInTimer: number | null = null;

  constructor(config: Partial<AudioEngineConfig> = {}, events: Partial<AudioEngineEvents> = {}) {
    this.config = {
      volume: 0.8,
      preload: true,
      crossfade: false,
      crossfadeDuration: 3000,
      ...config
    };
    
    this.events = events;
    this.audio = new Audio();
    this.setupAudioElement();
    this.bindEvents();
  }

  private setupAudioElement(): void {
    this.audio.preload = this.config.preload ? 'metadata' : 'none';
    this.audio.volume = this.config.volume;
    this.audio.crossOrigin = 'anonymous'; // For CORS support
  }

  private bindEvents(): void {
    // 播放状态事件
    this.audio.addEventListener('loadstart', () => {
      this.setState('loading');
      this.events.onLoadStart?.();
    });

    this.audio.addEventListener('loadeddata', () => {
      this.events.onLoadComplete?.();
    });

    this.audio.addEventListener('canplay', () => {
      if (this.state === 'loading') {
        this.setState('paused');
      }
    });

    this.audio.addEventListener('canplaythrough', () => {
      if (this.state === 'loading') {
        this.setState('paused');
      }
    });

    this.audio.addEventListener('play', () => {
      this.setState('playing');
      this.startTimeUpdate();
    });

    this.audio.addEventListener('pause', () => {
      this.setState('paused');
      this.stopTimeUpdate();
    });

    this.audio.addEventListener('ended', () => {
      this.setState('ended');
      this.stopTimeUpdate();
      this.events.onSongEnd?.();
    });

    this.audio.addEventListener('error', () => {
      this.setState('error');
      this.stopTimeUpdate();
      const error = this.audio.error;
      let errorMessage = '音频播放出错';
      
      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = '音频播放被中止';
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMessage = '网络错误，无法加载音频';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMessage = '音频解码失败';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = '不支持的音频格式';
            break;
        }
      }
      
      this.events.onError?.(errorMessage);
    });

    this.audio.addEventListener('timeupdate', () => {
      this.events.onTimeUpdate?.(this.audio.currentTime, this.audio.duration || 0);
    });

    this.audio.addEventListener('volumechange', () => {
      this.events.onVolumeChange?.(this.audio.volume);
    });

    this.audio.addEventListener('progress', () => {
      if (this.audio.buffered.length > 0) {
        const buffered = this.audio.buffered.end(this.audio.buffered.length - 1);
        const duration = this.audio.duration || 0;
        this.events.onBuffering?.(duration > 0 ? (buffered / duration) * 100 : 0);
      }
    });

    this.audio.addEventListener('stalled', () => {
      // 网络停滞
      console.warn('Audio stalled');
    });

    this.audio.addEventListener('waiting', () => {
      // 等待数据
      console.log('Audio waiting for data');
    });
  }

  private setState(newState: PlaybackState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.events.onStateChange?.(newState);
    }
  }

  private startTimeUpdate(): void {
    this.stopTimeUpdate();
    this.timeUpdateInterval = window.setInterval(() => {
      if (!this.audio.paused) {
        this.events.onTimeUpdate?.(this.audio.currentTime, this.audio.duration || 0);
      }
    }, 100); // 100ms 更新频率
  }

  private stopTimeUpdate(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  // 公共 API 方法

  async loadSong(song: Song): Promise<void> {
    if (!song.audioUrl) {
      throw new Error('歌曲没有音频URL');
    }

    // 停止当前播放
    this.stop();
    
    this.currentSong = song;
    this.audio.src = song.audioUrl;
    
    return new Promise((resolve, reject) => {
      let timeout: number;
      
      const cleanup = () => {
        this.audio.removeEventListener('canplay', handleCanPlay);
        this.audio.removeEventListener('canplaythrough', handleCanPlayThrough);
        this.audio.removeEventListener('error', handleError);
        this.audio.removeEventListener('loadeddata', handleLoadedData);
        if (timeout) {
          clearTimeout(timeout);
        }
      };
      
      const handleCanPlay = () => {
        cleanup();
        resolve();
      };

      const handleCanPlayThrough = () => {
        cleanup();
        resolve();
      };

      const handleLoadedData = () => {
        cleanup();
        resolve();
      };
      
      const handleError = () => {
        cleanup();
        const error = this.audio.error;
        let errorMessage = '加载音频失败';
        
        if (error) {
          switch (error.code) {
            case error.MEDIA_ERR_ABORTED:
              errorMessage = '音频加载被中止';
              break;
            case error.MEDIA_ERR_NETWORK:
              errorMessage = '网络错误，请检查网络连接';
              break;
            case error.MEDIA_ERR_DECODE:
              errorMessage = '音频格式不支持或文件损坏';
              break;
            case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = '不支持的音频格式或CORS问题';
              break;
          }
        }
        
        // 如果是生成的音频URL失败，可能是浏览器不支持
        if (song.audioUrl.startsWith('blob:')) {
          errorMessage = '浏览器不支持生成的音频格式';
        }
        
        reject(new Error(errorMessage));
      };

      // 设置超时
      timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('音频加载超时，请检查网络连接'));
      }, 10000); // 10秒超时
      
      this.audio.addEventListener('canplay', handleCanPlay);
      this.audio.addEventListener('canplaythrough', handleCanPlayThrough);
      this.audio.addEventListener('loadeddata', handleLoadedData);
      this.audio.addEventListener('error', handleError);
      
      try {
        this.audio.load();
      } catch (error) {
        cleanup();
        reject(new Error('无法加载音频: ' + (error as Error).message));
      }
    });
  }

  async play(): Promise<void> {
    if (!this.currentSong) {
      throw new Error('没有加载的歌曲');
    }

    try {
      await this.audio.play();
    } catch (error) {
      throw new Error('播放失败: ' + (error as Error).message);
    }
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.pause();
    this.audio.currentTime = 0;
    this.setState('idle');
  }

  seek(time: number): void {
    if (!isNaN(this.audio.duration)) {
      this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration));
    }
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.audio.volume = clampedVolume;
    this.config.volume = clampedVolume;
  }

  getVolume(): number {
    return this.audio.volume;
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getDuration(): number {
    return this.audio.duration || 0;
  }

  getState(): PlaybackState {
    return this.state;
  }

  getCurrentSong(): Song | null {
    return this.currentSong;
  }

  isPlaying(): boolean {
    return this.state === 'playing';
  }

  isPaused(): boolean {
    return this.state === 'paused';
  }

  isLoading(): boolean {
    return this.state === 'loading';
  }

  // 淡入淡出效果
  fadeOut(duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      if (this.fadeOutTimer) {
        clearInterval(this.fadeOutTimer);
      }

      const startVolume = this.audio.volume;
      const step = startVolume / (duration / 50); // 50ms 间隔
      
      this.fadeOutTimer = window.setInterval(() => {
        const newVolume = Math.max(0, this.audio.volume - step);
        this.audio.volume = newVolume;
        
        if (newVolume <= 0) {
          clearInterval(this.fadeOutTimer!);
          this.fadeOutTimer = null;
          this.pause();
          resolve();
        }
      }, 50);
    });
  }

  fadeIn(duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      if (this.fadeInTimer) {
        clearInterval(this.fadeInTimer);
      }

      const targetVolume = this.config.volume;
      const step = targetVolume / (duration / 50); // 50ms 间隔
      
      this.audio.volume = 0;
      this.play();
      
      this.fadeInTimer = window.setInterval(() => {
        const newVolume = Math.min(targetVolume, this.audio.volume + step);
        this.audio.volume = newVolume;
        
        if (newVolume >= targetVolume) {
          clearInterval(this.fadeInTimer!);
          this.fadeInTimer = null;
          resolve();
        }
      }, 50);
    });
  }

  // 预加载下一首歌曲
  preloadNext(song: Song): void {
    if (song.audioUrl) {
      const preloadAudio = new Audio();
      preloadAudio.preload = 'metadata';
      preloadAudio.src = song.audioUrl;
    }
  }

  // 获取音频频谱数据（为音频可视化准备）
  getAudioContext(): AudioContext | null {
    // 这里可以扩展 Web Audio API 功能
    return null;
  }

  // 清理资源
  destroy(): void {
    this.stop();
    this.stopTimeUpdate();
    
    if (this.fadeOutTimer) {
      clearInterval(this.fadeOutTimer);
    }
    
    if (this.fadeInTimer) {
      clearInterval(this.fadeInTimer);
    }
    
    this.audio.src = '';
    this.audio.load();
  }

  // 配置更新
  updateConfig(newConfig: Partial<AudioEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.volume !== undefined) {
      this.setVolume(newConfig.volume);
    }
  }

  // 获取播放统计信息
  getPlaybackInfo(): {
    currentTime: number;
    duration: number;
    buffered: number;
    volume: number;
    state: PlaybackState;
    song: Song | null;
  } {
    let buffered = 0;
    if (this.audio.buffered.length > 0) {
      buffered = this.audio.buffered.end(this.audio.buffered.length - 1);
    }

    return {
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      buffered,
      volume: this.getVolume(),
      state: this.getState(),
      song: this.getCurrentSong()
    };
  }
}