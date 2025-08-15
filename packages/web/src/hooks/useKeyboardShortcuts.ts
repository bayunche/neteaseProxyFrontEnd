import { useEffect, useRef, useMemo } from 'react';
import { usePlayerStore } from "@music-player/shared/stores";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  global?: boolean; // 是否在输入框聚焦时也触发
}

/**
 * 键盘快捷键Hook
 */
export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[] = []) => {
  const { 
    play, pause, next, previous, toggleMute, 
    setVolume, seekTo, currentSong, isPlaying, volume 
  } = usePlayerStore();
  
  const shortcutsRef = useRef(shortcuts);
  
  // 更新shortcuts引用
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // 默认快捷键
  const defaultShortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      key: ' ',
      action: () => isPlaying ? pause() : play(),
      description: '播放/暂停',
      global: true
    },
    {
      key: 'ArrowRight',
      action: next,
      description: '下一首'
    },
    {
      key: 'ArrowLeft', 
      action: previous,
      description: '上一首'
    },
    {
      key: 'ArrowUp',
      action: () => setVolume(Math.min(100, volume + 5)),
      description: '音量+5%'
    },
    {
      key: 'ArrowDown',
      action: () => setVolume(Math.max(0, volume - 5)),
      description: '音量-5%'
    },
    {
      key: 'm',
      action: toggleMute,
      description: '静音/取消静音'
    },
    {
      key: 'f',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: '聚焦搜索框',
      global: true
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => isPlaying ? pause() : play(),
      description: 'Ctrl+K 播放/暂停',
      global: true
    },
    {
      key: 'l',
      action: () => {
        // 快进10秒
        if (currentSong) {
          const audio = document.querySelector('audio');
          if (audio) {
            seekTo(Math.min(currentSong.duration, audio.currentTime + 10));
          }
        }
      },
      description: '快进10秒'
    },
    {
      key: 'j',
      action: () => {
        // 快退10秒
        const audio = document.querySelector('audio');
        if (audio) {
          seekTo(Math.max(0, audio.currentTime - 10));
        }
      },
      description: '快退10秒'
    },
    {
      key: '0',
      action: () => seekTo(0),
      description: '回到开始'
    },
    // 数字键1-9设置播放进度
    ...Array.from({ length: 9 }, (_, i) => ({
      key: (i + 1).toString(),
      action: () => {
        if (currentSong) {
          const progress = (i + 1) / 10;
          seekTo(currentSong.duration * progress);
        }
      },
      description: `跳转到${(i + 1) * 10}%位置`
    })),
  ], [play, pause, next, previous, toggleMute, setVolume, seekTo, currentSong, isPlaying, volume]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否在输入框中
      const target = event.target as HTMLElement;
      const isInputActive = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable;

      const allShortcuts = [...defaultShortcuts, ...shortcutsRef.current];

      for (const shortcut of allShortcuts) {
        const keyMatches = event.key === shortcut.key || 
                          event.code === shortcut.key;
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
        const altMatches = !!shortcut.altKey === event.altKey;
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
        const metaMatches = !!shortcut.metaKey === event.metaKey;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
          // 如果在输入框中且快捷键不是全局的，则跳过
          if (isInputActive && !shortcut.global) {
            continue;
          }

          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    play, pause, next, previous, toggleMute, setVolume, seekTo,
    currentSong, isPlaying, volume, defaultShortcuts
  ]);

  // 返回所有可用的快捷键列表
  const getAllShortcuts = () => {
    return [...defaultShortcuts, ...shortcutsRef.current];
  };

  return {
    getAllShortcuts
  };
};