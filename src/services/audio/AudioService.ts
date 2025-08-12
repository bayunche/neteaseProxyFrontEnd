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
  // 新增：播放状态标记
  canPlayNext: boolean;
  canPlayPrevious: boolean;
  queueCompleted: boolean; // 队列是否已播放完成
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
      error: null,
      canPlayNext: false,
      canPlayPrevious: false,
      queueCompleted: false
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
        console.error('AudioEngine错误:', error);
        const errorMessage = this.formatError(error);
        this.updateState({ 
          error: errorMessage, 
          isPlaying: false, 
          isPaused: false,
          playbackState: 'error'
        });
        this.eventManager.emit('error', errorMessage);
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
    // 更新播放能力状态
    this.updatePlaybackCapabilities();
    this.notifyStateChange();
  }
  
  private updatePlaybackCapabilities(): void {
    const canPlayNext = this.queue.currentIndex < this.queue.songs.length - 1 || 
                        this.queue.mode === 'list_loop' || 
                        this.queue.mode === 'random';
    
    const canPlayPrevious = this.queue.currentIndex > 0 || 
                           this.queue.mode === 'list_loop';
    
    const queueCompleted = this.queue.mode === 'sequence' && 
                          this.queue.currentIndex >= this.queue.songs.length - 1 &&
                          this.state.playbackState === 'ended';
    
    this.state.canPlayNext = canPlayNext;
    this.state.canPlayPrevious = canPlayPrevious;
    this.state.queueCompleted = queueCompleted;
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
    
    try {
      // 根据播放模式决定下一步行动
      switch (this.queue.mode) {
        case 'single':
          // 单曲循环
          await this.restart();
          break;
        case 'list_loop': {
          // 列表循环
          const hasNextInLoop = await this.playNext();
          if (!hasNextInLoop) {
            await this.playFirst();
          }
          break;
        }
        case 'sequence': {
          // 顺序播放 - 如果没有下一首，标记为播放完成但不停止
          const hasNext = await this.playNext();
          if (!hasNext) {
            // 播放完成，重置到队列开头但不自动播放
            this.queue.currentIndex = 0;
            this.updateState({ 
              isPlaying: false, 
              isPaused: true,
              playbackState: 'paused',
              queueCompleted: true,
              error: null // 清除错误状态
            });
            this.eventManager.emit('queuecomplete');
          }
          break;
        }
        case 'random':
          // 随机播放
          await this.playRandom();
          break;
        default:
          console.warn('未知的播放模式:', this.queue.mode);
          break;
      }
    } catch (error) {
      console.error('处理歌曲结束事件失败:', error);
      this.updateState({
        error: `播放结束处理失败: ${(error as Error).message}`,
        isPlaying: false,
        isPaused: true,
        playbackState: 'error'
      });
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
      
      // 预加载下一首歌曲（包括播放URL）
      if (this.config.enablePreload) {
        this.preloadNextSong();
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
      
      // 优化：检查是否已经缓存了播放URL
      const cachedSong = this.findSongInQueue(String(song.id));
      if (cachedSong?.audioUrl && cachedSong.audioUrl !== song.audioUrl) {
        console.log('使用缓存的播放URL:', cachedSong.audioUrl);
        songToLoad = {
          ...song,
          audioUrl: cachedSong.audioUrl
        };
      } else if (!song.audioUrl || song.source === 'api') {
        console.log('获取歌曲播放URL:', song.name || song.title);
        
        // 重试机制：最多重试3次
        let retryCount = 0;
        const maxRetries = 3;
        let playUrl = null;
        
        while (retryCount < maxRetries && !playUrl) {
          try {
            playUrl = await SongAPI.getSongUrl(Number(song.id));
            if (playUrl) {
              console.log(`成功获取播放URL (第${retryCount + 1}次尝试):`, playUrl);
              break;
            }
          } catch (apiError) {
            retryCount++;
            console.warn(`第${retryCount}次获取播放URL失败:`, apiError);
            
            if (retryCount < maxRetries) {
              // 等待 1 秒后重试
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }
        
        if (!playUrl) {
          throw new Error(`无法获取播放URL（重试${maxRetries}次后失败）`);
        }
        
        songToLoad = {
          ...song,
          audioUrl: playUrl
        };
      }

      // 尝试加载音频
      await this.engine.loadSong(songToLoad);
      
      // 如果成功获取了新的audioUrl，更新队列中的歌曲信息以便缓存
      if (songToLoad.audioUrl !== song.audioUrl) {
        this.updateSongInQueue(String(song.id), { audioUrl: songToLoad.audioUrl });
      }
    } catch (error) {
      console.warn('加载原始音频失败，尝试后备方案:', error);
      
      // 尝试生成后备音频
      try {
        const { generateTestAudio } = await import('../../utils/audioGenerator');
        const fallbackAudio = generateTestAudio({
          frequency: 440,
          duration: song.duration || 30000,
          waveType: 'sine'
        });
        
        const fallbackSong = {
          ...song,
          audioUrl: fallbackAudio,
          title: `${song.name || song.title} (后备音频)`
        };
        
        await this.engine.loadSong(fallbackSong);
        this.updateState({ 
          error: `原音频加载失败: ${(error as Error).message}，使用生成的后备音频` 
        });
      } catch (fallbackError) {
        // 如果后备方案也失败，抛出更详细的错误信息
        const detailedError = new Error(`加载歌曲失败: ${(error as Error).message}, 后备音频也失败: ${(fallbackError as Error).message}`);
        throw detailedError;
      }
    }
  }

  async play(): Promise<void> {
    if (this.queue.songs.length === 0) {
      console.warn('播放失败: 队列为空');
      this.updateState({ 
        error: '播放队列为空，请添加歌曲',
        isPlaying: false,
        isPaused: false,
        playbackState: 'idle'
      });
      return;
    }
    
    try {
      // 优化：更精确的继续播放判断
      if (this.state.currentSong && 
          (this.engine.getState() === 'paused' || this.state.isPaused) && 
          !this.state.queueCompleted) {
        // 如果有当前歌曲且是暂停状态，继续播放
        console.log('继续播放当前歌曲:', this.state.currentSong.title);
        await this.engine.play();
        this.eventManager.emit('play', this.state.currentSong);
        return;
      }
      
      // 智能选择播放位置
      let playIndex = this.queue.currentIndex;
      
      // 优化的播放位置选择逻辑
      if (this.shouldResetQueue()) {
        console.log('检测到需要重置队列，从头开始');
        playIndex = 0;
        this.updateState({ queueCompleted: false });
      } else if (playIndex < 0 || playIndex >= this.queue.songs.length) {
        console.log(`无效的播放索引 ${playIndex}，从头开始`);
        playIndex = 0;
      }
      
      await this.playFromQueue(playIndex);
    } catch (error) {
      console.error('播放失败:', error);
      this.updateState({ 
        error: `播放失败: ${(error as Error).message}`,
        isPlaying: false,
        isPaused: false,
        playbackState: 'error'
      });
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
    // 确保索引有效，如果队列为空则设为-1
    if (songs.length === 0) {
      this.queue.currentIndex = -1;
    } else {
      this.queue.currentIndex = Math.max(0, Math.min(startIndex, songs.length - 1));
    }
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
    if (index < 0 || index >= this.queue.songs.length) {
      console.warn(`删除队列歌曲失败: 无效索引 ${index}, 队列长度: ${this.queue.songs.length}`);
      return;
    }
    
    const removedSong = this.queue.songs[index];
    const isCurrentSong = index === this.queue.currentIndex;
    const wasPlaying = this.state.isPlaying;
    
    console.log(`删除队列歌曲: "${removedSong.title}" (索引 ${index}), 当前索引: ${this.queue.currentIndex}`);
    
    // 删除歌曲
    this.queue.songs.splice(index, 1);
    
    if (this.queue.songs.length === 0) {
      // 队列空了，停止播放并重置状态
      console.log('队列已空，停止播放');
      this.queue.currentIndex = -1;
      this.stop();
      this.updateState({
        currentSong: null,
        isPlaying: false,
        isPaused: false,
        playbackState: 'idle',
        queueCompleted: false
      });
    } else {
      // 调整索引
      if (index < this.queue.currentIndex) {
        // 删除的是当前歌曲之前的歌曲，索引前移
        this.queue.currentIndex--;
        console.log(`索引调整: ${this.queue.currentIndex + 1} -> ${this.queue.currentIndex}`);
      } else if (isCurrentSong) {
        // 删除的是当前播放的歌曲
        if (this.queue.currentIndex >= this.queue.songs.length) {
          // 索引超出范围，调整到最后一首
          this.queue.currentIndex = this.queue.songs.length - 1;
        }
        
        // 如果当前正在播放，自动播放下一首
        if (wasPlaying && this.queue.songs.length > 0) {
          console.log(`当前歌曲被删除，自动播放下一首 (索引: ${this.queue.currentIndex})`);
          // 延迟执行，让状态更新完成
          setTimeout(() => {
            this.playFromQueue(this.queue.currentIndex).catch(error => {
              console.error('自动播放下一首失败:', error);
            });
          }, 100);
        } else {
          // 不在播放状态，只更新当前歌曲信息
          const newCurrentSong = this.queue.songs[this.queue.currentIndex] || null;
          this.updateState({ currentSong: newCurrentSong });
        }
      }
      // 其他情况(删除当前歌曲之后的歌曲)不需要调整索引
    }
    
    this.eventManager.emit('queuechange', this.queue);
  }

  clearQueue(): void {
    this.queue.songs = [];
    this.queue.currentIndex = -1;
    this.eventManager.emit('queuechange', this.queue);
  }

  setPlayMode(mode: PlayMode): void {
    const oldMode = this.queue.mode;
    this.queue.mode = mode;
    
    console.log(`播放模式切换: ${oldMode} -> ${mode}`);
    
    // 优化切换模式时的特殊处理
    if (oldMode !== mode) {
      this.handlePlayModeChange(oldMode, mode);
      this.updatePlaybackCapabilities();
    }
    
    this.eventManager.emit('playmodechange', mode);
  }

  // 播放队列导航

  async playNext(): Promise<boolean> {
    const nextIndex = this.queue.currentIndex + 1;
    if (nextIndex < this.queue.songs.length) {
      await this.playFromQueue(nextIndex);
      return true;
    }
    
    // 在列表循环模式下，如果到了末尾，跳转到开头
    if (this.queue.mode === 'list_loop' && this.queue.songs.length > 0) {
      await this.playFromQueue(0);
      return true;
    }
    
    return false;
  }

  async playPrevious(): Promise<boolean> {
    if (this.queue.songs.length === 0) {
      console.warn('播放上一首失败: 队列为空');
      return false;
    }
    
    // 如果当前播放时间大于3秒，重新开始当前歌曲
    if (this.state.currentTime > 3) {
      console.log('播放上一首: 当前播放时间 > 3秒，重新开始当前歌曲');
      this.seek(0);
      return true;
    }
    
    const prevIndex = this.queue.currentIndex - 1;
    if (prevIndex >= 0) {
      console.log(`播放上一首: 从索引 ${this.queue.currentIndex} 跓转到 ${prevIndex}`);
      await this.playFromQueue(prevIndex);
      return true;
    }
    
    // 在列表循环模式下，从最后一首开始
    if (this.queue.mode === 'list_loop' && this.queue.songs.length > 0) {
      const lastIndex = this.queue.songs.length - 1;
      console.log(`播放上一首: 列表循环模式，跳转到最后一首 (${lastIndex})`);
      await this.playFromQueue(lastIndex);
      return true;
    }
    
    console.log('播放上一首: 已在队列开头，无法播放上一首');
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
    if (this.queue.songs.length === 0) {
      console.warn('随机播放失败: 队列为空');
      return false;
    }
    
    if (this.queue.songs.length === 1) {
      // 只有一首歌，重新播放当前歌曲
      await this.playFromQueue(0);
      return true;
    }
    
    // 安全的随机选择：从除当前索引外的所有位置中选择
    const availableIndices = Array.from({ length: this.queue.songs.length }, (_, i) => i)
      .filter(i => i !== this.queue.currentIndex);
    
    if (availableIndices.length === 0) {
      // 极端情况：只有一首歌且是当前歌曲，重新播放
      console.log('随机播放: 只有一首歌，重新播放当前歌曲');
      await this.restart();
    } else {
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      console.log(`随机播放: 从 ${availableIndices.length} 个可选项中选择索引 ${randomIndex}`);
      await this.playFromQueue(randomIndex);
    }
    
    return true;
  }

  async playFromQueue(index: number): Promise<void> {
    if (this.queue.songs.length === 0) {
      console.warn('播放失败: 队列为空');
      this.updateState({ error: '播放队列为空' });
      return;
    }
    
    if (index < 0 || index >= this.queue.songs.length) {
      console.warn(`无效的队列索引: ${index}, 队列长度: ${this.queue.songs.length}`);
      // 自动修正到有效范围
      index = Math.max(0, Math.min(index, this.queue.songs.length - 1));
      console.log(`自动修正索引到: ${index}`);
    }

    const song = this.queue.songs[index];
    this.queue.currentIndex = index;
    
    console.log(`开始播放队列歌曲: "${song.title}" (索引: ${index}/${this.queue.songs.length - 1})`);

    try {
      await this.playSong(song);
    } catch (error) {
      console.error('播放队列歌曲失败:', error);
      this.updateState({ 
        error: `播放失败: ${(error as Error).message}`,
        isPlaying: false,
        isPaused: false 
      });
      throw error;
    }
  }

  // 辅助方法：在队列中查找歌曲
  private findSongInQueue(songId: string): Song | undefined {
    return this.queue.songs.find(s => s.id === songId);
  }

  // 辅助方法：更新队列中的歌曲信息
  private updateSongInQueue(songId: string, updates: Partial<Song>): void {
    const index = this.queue.songs.findIndex(s => s.id === songId);
    if (index >= 0) {
      this.queue.songs[index] = {
        ...this.queue.songs[index],
        ...updates
      };
      console.log(`更新队列歌曲信息: "${this.queue.songs[index].title}"`);
    }
  }

  // 预加载下一首歌曲（包括播放URL）
  private async preloadNextSong(): Promise<void> {
    const nextSong = this.getNextSong();
    if (!nextSong) return;

    console.log('开始预加载下一首歌曲:', nextSong.title);

    try {
      // 预加载音频引擎
      this.engine.preloadNext(nextSong);

      // 如果下一首歌曲没有播放URL，后台获取
      if (!nextSong.audioUrl || nextSong.source === 'api') {
        SongAPI.getSongUrl(Number(nextSong.id))
          .then(playUrl => {
            if (playUrl) {
              this.updateSongInQueue(String(nextSong.id), { audioUrl: playUrl });
              console.log('预加载播放URL成功:', nextSong.title);
            }
          })
          .catch(error => {
            console.warn('预加载播放URL失败:', nextSong.title, error);
          });
      }
    } catch (error) {
      console.warn('预加载下一首歌曲失败:', error);
    }
  }

  // 判断是否需要重置队列播放状态
  private shouldResetQueue(): boolean {
    return this.state.queueCompleted || 
           this.engine.getState() === 'ended' || 
           (!this.state.currentSong && this.queue.songs.length > 0) ||
           this.state.playbackState === 'error';
  }

  // 处理播放模式变化
  private handlePlayModeChange(oldMode: PlayMode, newMode: PlayMode): void {
    // 从单曲循环切换到其他模式时的特殊处理
    if (oldMode === 'single' && newMode !== 'single' && this.state.playbackState === 'ended') {
      console.log('从单曲循环模式切换，重置播放状态');
      this.updateState({ 
        playbackState: 'paused',
        queueCompleted: false,
        isPaused: true,
        isPlaying: false
      });
    }

    // 从随机模式切换时，可能需要重新预加载
    if (oldMode === 'random' && newMode !== 'random' && this.config.enablePreload) {
      this.preloadNextSong();
    }
  }

  // 格式化错误信息
  private formatError(error: string | Error): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof Error) {
      // 针对常见错误类型提供用户友好的消息
      if (error.message.includes('Network')) {
        return '网络连接失败，请检查网络设置';
      }
      if (error.message.includes('decode')) {
        return '音频文件格式不支持或已损坏';
      }
      if (error.message.includes('CORS')) {
        return '跨域访问被阻止，请联系管理员';
      }
      if (error.message.includes('404')) {
        return '音频文件不存在或已被删除';
      }
      if (error.message.includes('403')) {
        return '没有访问权限，可能需要登录';
      }
      
      return error.message;
    }
    
    return '未知错误';
  }

  // 清除错误状态
  clearError(): void {
    this.updateState({ error: null });
  }

  private getNextSong(): Song | null {
    switch (this.queue.mode) {
      case 'single':
        return this.state.currentSong;
      case 'random': {
        if (this.queue.songs.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.queue.songs.length);
        return this.queue.songs[randomIndex];
      }
      default: {
        const nextIndex = this.queue.currentIndex + 1;
        if (nextIndex < this.queue.songs.length) {
          return this.queue.songs[nextIndex];
        } else if (this.queue.mode === 'list_loop' && this.queue.songs.length > 0) {
          return this.queue.songs[0];
        }
        return null;
      }
    }
  }

  // 事件订阅

  onStateChange(callback: (state: AudioServiceState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  on(event: string, callback: (data?: unknown) => void): () => void {
    return this.eventManager.on(event as never, callback);
  }

  once(event: string, callback: (data?: unknown) => void): () => void {
    return this.eventManager.once(event as never, callback);
  }

  off(event: string, callback?: (data?: unknown) => void): void {
    this.eventManager.off(event as never, callback);
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