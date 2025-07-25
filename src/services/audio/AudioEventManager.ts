import type { AudioEvent } from '../../types';

export type AudioEventCallback = (data?: any) => void;

export interface AudioEventSubscription {
  event: AudioEvent;
  callback: AudioEventCallback;
  once?: boolean;
}

/**
 * 音频事件管理器
 * 负责管理音频相关事件的订阅和发布
 */
export class AudioEventManager {
  private subscriptions: Map<AudioEvent, AudioEventCallback[]> = new Map();
  private onceSubscriptions: Map<AudioEvent, AudioEventCallback[]> = new Map();

  /**
   * 订阅音频事件
   */
  on(event: AudioEvent, callback: AudioEventCallback, once = false): () => void {
    const subscriptionsMap = once ? this.onceSubscriptions : this.subscriptions;
    
    if (!subscriptionsMap.has(event)) {
      subscriptionsMap.set(event, []);
    }
    
    subscriptionsMap.get(event)!.push(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback, once);
  }

  /**
   * 订阅一次性事件
   */
  once(event: AudioEvent, callback: AudioEventCallback): () => void {
    return this.on(event, callback, true);
  }

  /**
   * 取消订阅
   */
  off(event: AudioEvent, callback?: AudioEventCallback, once = false): void {
    const subscriptionsMap = once ? this.onceSubscriptions : this.subscriptions;
    const callbacks = subscriptionsMap.get(event);
    
    if (!callbacks) return;

    if (!callback) {
      // 如果没有指定回调函数，清除所有该事件的订阅
      subscriptionsMap.set(event, []);
      return;
    }

    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 发布事件
   */
  emit(event: AudioEvent, data?: any): void {
    // 执行普通订阅
    const callbacks = this.subscriptions.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in audio event callback for ${event}:`, error);
        }
      });
    }

    // 执行一次性订阅
    const onceCallbacks = this.onceSubscriptions.get(event);
    if (onceCallbacks) {
      // 复制数组，避免在执行过程中修改原数组
      const callbacksCopy = [...onceCallbacks];
      this.onceSubscriptions.set(event, []); // 清空一次性订阅
      
      callbacksCopy.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in audio event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 获取事件的订阅数量
   */
  getListenerCount(event: AudioEvent): number {
    const normalCount = this.subscriptions.get(event)?.length || 0;
    const onceCount = this.onceSubscriptions.get(event)?.length || 0;
    return normalCount + onceCount;
  }

  /**
   * 获取所有已订阅的事件
   */
  getEvents(): AudioEvent[] {
    const events = new Set<AudioEvent>();
    
    for (const event of this.subscriptions.keys()) {
      events.add(event);
    }
    
    for (const event of this.onceSubscriptions.keys()) {
      events.add(event);
    }
    
    return Array.from(events);
  }

  /**
   * 清除所有订阅
   */
  clear(): void {
    this.subscriptions.clear();
    this.onceSubscriptions.clear();
  }

  /**
   * 销毁事件管理器
   */
  destroy(): void {
    this.clear();
  }
}

/**
 * 全局音频事件管理器实例
 */
export const audioEventManager = new AudioEventManager();