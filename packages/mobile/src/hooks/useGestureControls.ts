import { useEffect, useCallback } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { Haptics } from 'expo-haptics';
import { Audio } from 'expo-av';

interface GestureControlsConfig {
  enableSwipeToSkip?: boolean;
  enablePinchToVolume?: boolean;
  enableDoubleTapToLike?: boolean;
  enableLongPressToAddQueue?: boolean;
  swipeThreshold?: number;
  volumeSensitivity?: number;
}

interface GestureActions {
  onNext?: () => void;
  onPrevious?: () => void;
  onVolumeChange?: (volume: number) => void;
  onLike?: () => void;
  onAddToQueue?: () => void;
  onPlayPause?: () => void;
}

const defaultConfig: Required<GestureControlsConfig> = {
  enableSwipeToSkip: true,
  enablePinchToVolume: true,
  enableDoubleTapToLike: true,
  enableLongPressToAddQueue: true,
  swipeThreshold: 100,
  volumeSensitivity: 0.5,
};

/**
 * 手势控制Hook
 * 为音乐播放器提供手势交互功能
 */
export const useGestureControls = (
  config: GestureControlsConfig = {},
  actions: GestureActions = {}
) => {
  const opts = { ...defaultConfig, ...config };
  
  // 手势状态
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const initialVolume = useSharedValue(0.5);
  
  // 获取当前音量
  const getCurrentVolume = useCallback(async () => {
    try {
      const { volume } = await Audio.getStatusAsync();
      return volume || 0.5;
    } catch {
      return 0.5;
    }
  }, []);

  // 触觉反馈
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'medium') => {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  }, []);

  // 水平滑动手势 - 切歌
  const swipeGesture = Gesture.Pan()
    .enabled(opts.enableSwipeToSkip)
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      
      if (Math.abs(translationX) > opts.swipeThreshold || Math.abs(velocityX) > 500) {
        if (translationX > 0) {
          // 向右滑动 - 上一首
          runOnJS(triggerHaptic)('medium');
          runOnJS(actions.onPrevious || (() => {}))();
        } else {
          // 向左滑动 - 下一首
          runOnJS(triggerHaptic)('medium');
          runOnJS(actions.onNext || (() => {}))();
        }
      }
      
      translateX.value = withSpring(0);
    });

  // 双指缩放手势 - 音量控制
  const pinchGesture = Gesture.Pinch()
    .enabled(opts.enablePinchToVolume)
    .onStart(async () => {
      const currentVolume = await runOnJS(getCurrentVolume)();
      initialVolume.value = currentVolume;
    })
    .onUpdate((event) => {
      const volumeChange = (event.scale - 1) * opts.volumeSensitivity;
      const newVolume = Math.max(0, Math.min(1, initialVolume.value + volumeChange));
      
      runOnJS(actions.onVolumeChange || (() => {}))(newVolume);
    })
    .onEnd(() => {
      runOnJS(triggerHaptic)('light');
    });

  // 双击手势 - 喜欢
  const doubleTapGesture = Gesture.Tap()
    .enabled(opts.enableDoubleTapToLike)
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(triggerHaptic)('heavy');
      runOnJS(actions.onLike || (() => {}))();
    });

  // 长按手势 - 添加到队列
  const longPressGesture = Gesture.LongPress()
    .enabled(opts.enableLongPressToAddQueue)
    .minDuration(800)
    .onStart(() => {
      runOnJS(triggerHaptic)('heavy');
      runOnJS(actions.onAddToQueue || (() => {}))();
    });

  // 单击手势 - 播放/暂停
  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      runOnJS(actions.onPlayPause || (() => {}))();
    });

  // 组合手势
  const composedGestures = Gesture.Simultaneous(
    Gesture.Exclusive(doubleTapGesture, tapGesture),
    swipeGesture,
    pinchGesture,
    longPressGesture
  );

  return {
    gestures: composedGestures,
    translateX,
    scale,
    GestureDetector
  };
};

/**
 * 播放器手势Hook - 专门为播放器页面设计的手势控制
 */
export const usePlayerGestures = (actions: GestureActions) => {
  const { gestures, translateX } = useGestureControls({
    enableSwipeToSkip: true,
    enablePinchToVolume: true,
    enableDoubleTapToLike: true,
    swipeThreshold: 80,
  }, actions);

  return {
    gestures,
    translateX,
  };
};

/**
 * 歌曲列表手势Hook - 为歌曲列表项提供手势
 */
export const useSongListGestures = (actions: GestureActions) => {
  const { gestures } = useGestureControls({
    enableSwipeToSkip: false,
    enablePinchToVolume: false,
    enableDoubleTapToLike: true,
    enableLongPressToAddQueue: true,
  }, actions);

  return { gestures };
};

/**
 * 播放列表手势Hook - 为播放列表提供手势
 */
export const usePlaylistGestures = (actions: GestureActions) => {
  const { gestures } = useGestureControls({
    enableSwipeToSkip: false,
    enablePinchToVolume: false,
    enableDoubleTapToLike: false,
    enableLongPressToAddQueue: true,
  }, actions);

  return { gestures };
};