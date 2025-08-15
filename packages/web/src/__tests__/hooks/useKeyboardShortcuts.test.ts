/**
 * 键盘快捷键Hook测试
 */

import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// Mock player store
const mockPlayerStore = {
  play: jest.fn(),
  pause: jest.fn(),
  next: jest.fn(),
  previous: jest.fn(),
  toggleMute: jest.fn(),
  setVolume: jest.fn(),
  seekTo: jest.fn(),
  currentSong: {
    id: '1',
    title: 'Test Song',
    duration: 180
  },
  isPlaying: false,
  volume: 50
};

jest.mock('../../stores', () => ({
  usePlayerStore: () => mockPlayerStore
}));

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock audio element
    const mockAudio = {
      currentTime: 60,
      play: jest.fn(),
      pause: jest.fn()
    };
    jest.spyOn(document, 'querySelector').mockReturnValue(mockAudio as unknown as HTMLAudioElement);
  });

  afterEach(() => {
    // Clean up event listeners
    document.removeEventListener('keydown', expect.any(Function));
  });

  describe('基础功能', () => {
    test('应该注册默认快捷键', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());
      
      const shortcuts = result.current.getAllShortcuts();
      expect(shortcuts.length).toBeGreaterThan(0);
      
      // 检查一些关键快捷键
      const spaceShortcut = shortcuts.find(s => s.key === ' ');
      expect(spaceShortcut).toBeDefined();
      expect(spaceShortcut?.description).toBe('播放/暂停');
    });

    test('应该接受自定义快捷键', () => {
      const customShortcuts = [
        {
          key: 'r',
          action: jest.fn(),
          description: '自定义重复',
        }
      ];
      
      const { result } = renderHook(() => useKeyboardShortcuts(customShortcuts));
      
      const shortcuts = result.current.getAllShortcuts();
      const customShortcut = shortcuts.find(s => s.key === 'r');
      expect(customShortcut).toBeDefined();
      expect(customShortcut?.description).toBe('自定义重复');
    });
  });

  describe('播放控制快捷键', () => {
    test('空格键应该切换播放/暂停', () => {
      renderHook(() => useKeyboardShortcuts());
      
      // 模拟空格键按下
      const event = new KeyboardEvent('keydown', { key: ' ' });
      act(() => {
        document.dispatchEvent(event);
      });
      
      expect(mockPlayerStore.play).toHaveBeenCalled();
    });

    test('箭头键应该控制播放和音量', () => {
      renderHook(() => useKeyboardShortcuts());
      
      // 右箭头 - 下一首
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      });
      expect(mockPlayerStore.next).toHaveBeenCalled();
      
      // 左箭头 - 上一首
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      });
      expect(mockPlayerStore.previous).toHaveBeenCalled();
      
      // 上箭头 - 音量+
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      });
      expect(mockPlayerStore.setVolume).toHaveBeenCalledWith(55);
      
      // 下箭头 - 音量-
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      });
      expect(mockPlayerStore.setVolume).toHaveBeenCalledWith(45);
    });

    test('M键应该切换静音', () => {
      renderHook(() => useKeyboardShortcuts());
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
      });
      
      expect(mockPlayerStore.toggleMute).toHaveBeenCalled();
    });
  });

  describe('进度控制快捷键', () => {
    test('J和L键应该控制快进快退', () => {
      renderHook(() => useKeyboardShortcuts());
      
      // L - 快进10秒
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
      });
      expect(mockPlayerStore.seekTo).toHaveBeenCalledWith(70);
      
      // J - 快退10秒
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
      });
      expect(mockPlayerStore.seekTo).toHaveBeenCalledWith(50);
    });

    test('数字键应该跳转到对应进度', () => {
      renderHook(() => useKeyboardShortcuts());
      
      // 数字5 - 跳转到50%
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '5' }));
      });
      expect(mockPlayerStore.seekTo).toHaveBeenCalledWith(90); // 50% of 180s
      
      // 数字0 - 回到开始
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '0' }));
      });
      expect(mockPlayerStore.seekTo).toHaveBeenCalledWith(0);
    });
  });

  describe('组合键快捷键', () => {
    test('Ctrl+F应该聚焦搜索框', () => {
      const mockSearchInput = {
        focus: jest.fn()
      };
      jest.spyOn(document, 'querySelector').mockReturnValue(mockSearchInput as unknown as HTMLInputElement);
      
      renderHook(() => useKeyboardShortcuts());
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'f', 
          ctrlKey: true 
        }));
      });
      
      expect(mockSearchInput.focus).toHaveBeenCalled();
    });

    test('Ctrl+K应该切换播放/暂停', () => {
      renderHook(() => useKeyboardShortcuts());
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'k', 
          ctrlKey: true 
        }));
      });
      
      expect(mockPlayerStore.play).toHaveBeenCalled();
    });
  });

  describe('输入框处理', () => {
    test('在输入框聚焦时不应该触发非全局快捷键', () => {
      // 模拟输入框聚焦
      const mockInput = document.createElement('input');
      jest.spyOn(document, 'activeElement', 'get').mockReturnValue(mockInput);
      
      renderHook(() => useKeyboardShortcuts());
      
      // 创建一个事件，target是input元素
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      Object.defineProperty(event, 'target', {
        value: mockInput,
        enumerable: true
      });
      
      act(() => {
        document.dispatchEvent(event);
      });
      
      // 非全局快捷键不应该被触发
      expect(mockPlayerStore.next).not.toHaveBeenCalled();
    });

    test('全局快捷键应该在输入框聚焦时仍然工作', () => {
      const mockInput = document.createElement('input');
      
      renderHook(() => useKeyboardShortcuts());
      
      // 创建一个全局快捷键事件
      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      Object.defineProperty(event, 'target', {
        value: mockInput,
        enumerable: true
      });
      
      act(() => {
        document.dispatchEvent(event);
      });
      
      // 全局快捷键应该被触发
      expect(mockPlayerStore.play).toHaveBeenCalled();
    });
  });

  describe('边界情况', () => {
    test('应该处理没有当前歌曲的情况', () => {
      const storeWithoutSong = {
        ...mockPlayerStore,
        currentSong: null
      };
      
      jest.doMock('../../stores', () => ({
        usePlayerStore: () => storeWithoutSong
      }));
      
      const { result } = renderHook(() => useKeyboardShortcuts());
      
      // 应该不会崩溃
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: '5' }));
      });
      
      expect(result.current.getAllShortcuts).toBeDefined();
    });

    test('应该处理音量边界值', () => {
      // 音量在最大值时
      const storeWithMaxVolume = {
        ...mockPlayerStore,
        volume: 100
      };
      
      jest.doMock('../../stores', () => ({
        usePlayerStore: () => storeWithMaxVolume
      }));
      
      renderHook(() => useKeyboardShortcuts());
      
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      });
      
      expect(mockPlayerStore.setVolume).toHaveBeenCalledWith(100); // 不应超过100
    });
  });

  describe('性能和清理', () => {
    test('应该在卸载时清理事件监听器', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = renderHook(() => useKeyboardShortcuts());
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    test('应该防止事件的默认行为', () => {
      renderHook(() => useKeyboardShortcuts());
      
      const preventDefaultSpy = jest.fn();
      const event = new KeyboardEvent('keydown', { key: ' ' });
      event.preventDefault = preventDefaultSpy;
      
      act(() => {
        document.dispatchEvent(event);
      });
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });
});
