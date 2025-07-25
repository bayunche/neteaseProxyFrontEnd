import { AudioEngine } from './AudioEngine';
import type { AudioEngineConfig, AudioEngineEvents } from './AudioEngine';
import { AudioEventManager } from './AudioEventManager';
import type { Song, PlayMode, PlaybackState } from '../../types';
import { SongAPI } from '../api';

export interface AudioServiceConfig extends AudioEngineConfig {
  enablePreload: boolean;
  enableFade: boolean;
  fadeDuration: number;
}

export interface PlaybackQueue {
  songs: Song[];
  currentIndex: number;
  mode: PlayMode;
}

export interface AudioServiceState {
  currentSong: Song | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  previousVolume: number;
  playbackState: PlaybackState;
  buffered: number;
  error: string | null;
}

/**
 * 音频服务 - 高级音频播放管理
 * 整合AudioEngine和事件管理，提供完整的播放功能
 */
export class AudioService {
  private engine!: AudioEngine;
  private eventManager: AudioEventManager;
  private config: AudioServiceConfig;
  private state: AudioServiceState;
  private queue: PlaybackQueue;
  private stateChangeCallbacks: Set<(state: AudioServiceState) => void> = new Set();

  constructor(config: Partial<AudioServiceConfig> = {}) {
    this.config = {
      volume: 0.8,
      preload: true,
      crossfade: false,
      crossfadeDuration: 3000,
      enablePreload: true,
      enableFade: false,
      fadeDuration: 1000,
      ...config
    };

    this.state = {
      currentSong: null,
      isPlaying: false,
      isPaused: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
      volume: this.config.volume,
      isMuted: false,
      previousVolume: this.config.volume,
      playbackState: 'idle',
      buffered: 0,
      error: null
    };

    this.queue = {
      songs: [],
      currentIndex: -1,
      mode: 'sequence'
    };

    this.eventManager = new AudioEventManager();
    this.setupAudioEngine();
  }

  private setupAudioEngine(): void {
    const engineEvents: AudioEngineEvents = {
      onStateChange: (state) => {
        this.updateState({ playbackState: state });
        this.updatePlayingState(state);
      },
      
      onTimeUpdate: (currentTime, duration) => {
        this.updateState({ currentTime, duration });
      },
      
      onVolumeChange: (volume) => {
        this.updateState({ volume });
      },
      
      onError: (error) => {
        this.updateState({ error, isPlaying: false, isPaused: false });
        this.eventManager.emit('error', error);
      },
      
      onSongEnd: () => {
        this.handleSongEnd();
      },
      
      onLoadStart: () => {
        this.updateState({ isLoading: true, error: null });
      },
      
      onLoadComplete: () => {
        this.updateState({ isLoading: false });
      },
      
      onBuffering: (buffered) => {
        this.updateState({ buffered });
      }
    };

    this.engine = new AudioEngine(this.config, engineEvents);
  }

  private updateState(updates: Partial<AudioServiceState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyStateChange();
  }

  private updatePlayingState(playbackState: PlaybackState): void {
    const isPlaying = playbackState === 'playing';
    const isPaused = playbackState === 'paused';
    const isLoading = playbackState === 'loading';
    
    this.updateState({ isPlaying, isPaused, isLoading });
  }

  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  private async handleSongEnd(): Promise<void> {
    this.eventManager.emit('ended');
    
    // 根据播放模式决定下一步行动
    switch (this.queue.mode) {
      case 'single':
        // 单曲循环
        await this.restart();
        break;
      case 'list_loop':
        // 列表循环
        await this.playNext() || await this.playFirst();
        break;
      case 'sequence':
        // 顺序播放
        await this.playNext();
        break;
      case 'random':
        // 随机播放
        await this.playRandom();
        break;
    }
  }

  // 播放控制方法

  async playSong(song: Song): Promise<void> {
    try {
      this.updateState({ error: null });
      
      // 如果启用淡出效果且当前在播放
      if (this.config.enableFade && this.state.isPlaying) {
        await this.engine.fadeOut(this.config.fadeDuration);
      }

      // 尝试加载歌曲，如果失败则尝试后备方案
      await this.loadSongWithFallback(song);
      
      // 预加载下一首歌曲
      if (this.config.enablePreload) {
        const nextSong = this.getNextSong();
        if (nextSong) {
          this.engine.preloadNext(nextSong);
        }
      }

      this.updateState({ currentSong: song });
      
      if (this.config.enableFade) {
        await this.engine.fadeIn(this.config.fadeDuration);
      } else {
        await this.engine.play();
      }

      this.eventManager.emit('play', song);
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.updateState({ error: errorMessage });
      throw error;
    }
  }

  private async loadSongWithFallback(song: Song): Promise<void> {
    try {
      // 如果歌曲没有音频URL或者是来自API的歌曲，先获取播放URL
      let songToLoad = song;
      
      if (!song.audioUrl || song.source === 'api') {
        console.log('获取歌曲播放URL:', song.name || song.title);
        try {
          const playUrl = await SongAPI.getSongUrl(song.id);
          if (playUrl) {
            songToLoad = {
              ...song,
              audioUrl: playUrl
            };
            console.log('成功获取播放URL:', playUrl);
          } else {
            throw new Error('无法获取播放URL');
          }
        } catch (apiError) {
          console.warn('API获取播放URL失败:', apiError);
          throw apiError;
        }
      }

      // 尝试加载音频
      await this.engine.loadSong(songToLoad);
    } catch (error) {
      console.warn('加载原始音频失败，尝试后备方案:', error);
      
      // 尝试生成后备音频
      try {
        const { generateTestAudio } = await import('../../utils/audioGenerator');
        const fallbackAudio = generateTestAudio({
          frequency: 440,
          duration: song.duration || 30000, // 转换为毫秒
          waveType: 'sine'
        });
        
        const fallbackSong = {
          ...song,
          audioUrl: fallbackAudio,
          title: `${song.name || song.title} (后备音频)`
        };
        
        await this.engine.loadSong(fallbackSong);
        this.updateState({ 
          error: '原音频加载失败，使用生成的后备音频' 
        });
      } catch (fallbackError) {
        // 如果后备方案也失败，抛出原始错误
        throw error;
      }
    }
  }

  async play(): Promise<void> {
    if (this.state.currentSong) {
      await this.engine.play();
      this.eventManager.emit('play', this.state.currentSong);
    } else if (this.queue.songs.length > 0) {
      await this.playFromQueue(Math.max(0, this.queue.currentIndex));
    }
  }

  pause(): void {
    this.engine.pause();
    this.eventManager.emit('pause');
  }

  stop(): void {
    this.engine.stop();
    this.updateState({ currentSong: null });
    this.eventManager.emit('stop');
  }

  async restart(): Promise<void> {
    if (this.state.currentSong) {
      this.seek(0);
      await this.play();
    }
  }

  seek(time: number): void {
    this.engine.seek(time);
    this.eventManager.emit('seek', time);
  }

  setVolume(volume: number): void {
    this.engine.setVolume(volume);
    if (volume > 0 && this.state.isMuted) {
      this.updateState({ isMuted: false });
    }
    this.eventManager.emit('volumechange', volume);
  }

  toggleMute(): void {
    if (this.state.isMuted) {
      this.setVolume(this.state.previousVolume);
      this.updateState({ isMuted: false });
    } else {
      this.updateState({ 
        previousVolume: this.state.volume,
        isMuted: true 
      });
      this.setVolume(0);
    }
  }

  // 队列管理方法

  setQueue(songs: Song[], startIndex = 0): void {
    this.queue.songs = songs;
    this.queue.currentIndex = startIndex;
    this.eventManager.emit('queuechange', this.queue);
  }

  addToQueue(song: Song, index?: number): void {
    if (index !== undefined) {
      this.queue.songs.splice(index, 0, song);
      if (index <= this.queue.currentIndex) {
        this.queue.currentIndex++;
      }
    } else {
      this.queue.songs.push(song);
    }
    this.eventManager.emit('queuechange', this.queue);
  }

  removeFromQueue(index: number): void {
    if (index >= 0 && index < this.queue.songs.length) {
      this.queue.songs.splice(index, 1);
      
      if (index < this.queue.currentIndex) {
        this.queue.currentIndex--;
      } else if (index === this.queue.currentIndex) {
        // 如果删除的是当前播放的歌曲
        if (this.queue.currentIndex >= this.queue.songs.length) {
          this.queue.currentIndex = this.queue.songs.length - 1;
        }
      }
      
      this.eventManager.emit('queuechange', this.queue);
    }
  }

  clearQueue(): void {
    this.queue.songs = [];
    this.queue.currentIndex = -1;
    this.eventManager.emit('queuechange', this.queue);
  }

  setPlayMode(mode: PlayMode): void {
    this.queue.mode = mode;
    this.eventManager.emit('playmodechange', mode);
  }

  // 播放队列导航

  async playNext(): Promise<boolean> {
    const nextIndex = this.queue.currentIndex + 1;
    if (nextIndex < this.queue.songs.length) {
      await this.playFromQueue(nextIndex);
      return true;
    }
    return false;
  }

  async playPrevious(): Promise<boolean> {
    // 如果当前播放时间大于3秒，重新开始当前歌曲
    if (this.state.currentTime > 3) {
      this.seek(0);
      return true;
    }
    
    const prevIndex = this.queue.currentIndex - 1;
    if (prevIndex >= 0) {
      await this.playFromQueue(prevIndex);
      return true;
    }
    return false;
  }

  async playFirst(): Promise<boolean> {
    if (this.queue.songs.length > 0) {
      await this.playFromQueue(0);
      return true;
    }
    return false;
  }

  async playLast(): Promise<boolean> {
    if (this.queue.songs.length > 0) {
      await this.playFromQueue(this.queue.songs.length - 1);
      return true;
    }
    return false;
  }

  async playRandom(): Promise<boolean> {
    if (this.queue.songs.length === 0) return false;
    
    let randomIndex;
    if (this.queue.songs.length === 1) {
      randomIndex = 0;
    } else {
      // 确保不会连续播放同一首歌
      do {
        randomIndex = Math.floor(Math.random() * this.queue.songs.length);
      } while (randomIndex === this.queue.currentIndex && this.queue.songs.length > 1);
    }
    
    await this.playFromQueue(randomIndex);
    return true;
  }

  async playFromQueue(index: number): Promise<void> {
    if (index >= 0 && index < this.queue.songs.length) {
      this.queue.currentIndex = index;
      await this.playSong(this.queue.songs[index]);
    }
  }

  // 辅助方法

  private getNextSong(): Song | null {
    switch (this.queue.mode) {
      case 'single':
        return this.state.currentSong;
      case 'random':
        if (this.queue.songs.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.queue.songs.length);
        return this.queue.songs[randomIndex];
      default:
        const nextIndex = this.queue.currentIndex + 1;
        if (nextIndex < this.queue.songs.length) {
          return this.queue.songs[nextIndex];
        } else if (this.queue.mode === 'list_loop' && this.queue.songs.length > 0) {
          return this.queue.songs[0];
        }
        return null;
    }
  }

  // 事件订阅

  onStateChange(callback: (state: AudioServiceState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  on(event: string, callback: (data?: any) => void): () => void {
    return this.eventManager.on(event as any, callback);
  }

  once(event: string, callback: (data?: any) => void): () => void {
    return this.eventManager.once(event as any, callback);
  }

  off(event: string, callback?: (data?: any) => void): void {
    this.eventManager.off(event as any, callback);
  }

  // 获取状态

  getState(): AudioServiceState {
    return { ...this.state };
  }

  getQueue(): PlaybackQueue {
    return { ...this.queue };
  }

  getCurrentSong(): Song | null {
    return this.state.currentSong;
  }

  getPlaybackInfo() {
    return this.engine.getPlaybackInfo();
  }

  // 配置管理

  updateConfig(newConfig: Partial<AudioServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.engine.updateConfig(newConfig);
  }

  getConfig(): AudioServiceConfig {
    return { ...this.config };
  }

  // 销毁

  destroy(): void {
    this.engine.destroy();
    this.eventManager.destroy();
    this.stateChangeCallbacks.clear();
  }
}