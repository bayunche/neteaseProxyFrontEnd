export { AudioEngine } from './AudioEngine';
export type { AudioEngineConfig, AudioEngineEvents } from './AudioEngine';

export { AudioEventManager, audioEventManager } from './AudioEventManager';
export type { AudioEventCallback, AudioEventSubscription } from './AudioEventManager';

export { AudioService } from './AudioService';
export type { 
  AudioServiceConfig, 
  AudioServiceState, 
  PlaybackQueue 
} from './AudioService';

// 创建全局音频服务实例
import { AudioService } from './AudioService';

export const audioService = new AudioService({
  volume: 0.8,
  preload: true,
  enablePreload: true,
  enableFade: false,
  fadeDuration: 1000,
  crossfade: false,
  crossfadeDuration: 3000
});