/**
 * 音频可视化Hook测试
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAudioVisualization } from '../../hooks/useAudioVisualization';

// Mock Web Audio API interfaces
interface MockAnalyserNode {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  frequencyBinCount: number;
  getByteFrequencyData: jest.MockedFunction<(array: Uint8Array) => void>;
  getByteTimeDomainData: jest.MockedFunction<(array: Uint8Array) => void>;
  connect: jest.MockedFunction<(destination: AudioNode) => AudioNode>;
}

interface MockMediaElementAudioSourceNode {
  connect: jest.MockedFunction<(destination: AudioNode) => AudioNode>;
}

interface MockAudioContext {
  state: string;
  sampleRate: number;
  createAnalyser: jest.MockedFunction<() => MockAnalyserNode>;
  createMediaElementSource: jest.MockedFunction<(element: HTMLMediaElement) => MockMediaElementAudioSourceNode>;
  destination: Record<string, unknown>;
  resume: jest.MockedFunction<() => Promise<void>>;
  close: jest.MockedFunction<() => Promise<void>>;
}

interface MockAudioElement {
  addEventListener: jest.MockedFunction<(type: string, listener: EventListener) => void>;
  removeEventListener: jest.MockedFunction<(type: string, listener: EventListener) => void>;
  currentTime: number;
  duration: number;
  paused: boolean;
}

// Mock Web Audio API
const mockAnalyser: MockAnalyserNode = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
  frequencyBinCount: 1024,
  getByteFrequencyData: jest.fn(),
  getByteTimeDomainData: jest.fn(),
  connect: jest.fn(),
};

const mockAudioContext: MockAudioContext = {
  state: 'running',
  sampleRate: 44100,
  createAnalyser: jest.fn(() => mockAnalyser),
  createMediaElementSource: jest.fn(() => ({
    connect: jest.fn()
  })),
  destination: {},
  resume: jest.fn(),
  close: jest.fn(),
};

const mockAudioElement: MockAudioElement = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 180,
  paused: false
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

describe('useAudioVisualization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AudioContext
    (global as { AudioContext?: jest.MockedClass<typeof AudioContext> }).AudioContext = jest.fn(() => mockAudioContext as unknown as AudioContext);
    (global as { webkitAudioContext?: jest.MockedClass<typeof AudioContext> }).webkitAudioContext = jest.fn(() => mockAudioContext as unknown as AudioContext);
    
    // Reset mock implementations
    mockAnalyser.getByteFrequencyData.mockImplementation((array: Uint8Array) => {
      // Fill with sample data
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 255);
      }
    });
    
    mockAnalyser.getByteTimeDomainData.mockImplementation((array: Uint8Array) => {
      // Fill with sample data
      for (let i = 0; i < array.length; i++) {
        array[i] = 128 + Math.floor(Math.random() * 127);
      }
    });
  });

  describe('初始化', () => {
    test('应该正确初始化音频可视化', async () => {
      const { result } = renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement)
      );
      
      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true);
        expect(result.current.frequencyData).toBeInstanceOf(Uint8Array);
        expect(result.current.timeData).toBeInstanceOf(Uint8Array);
      });
    });

    test('应该使用默认配置', async () => {
      renderHook(() => useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement));
      
      await waitFor(() => {
        expect(mockAudioContext.createAnalyser).toHaveBeenCalled();
        expect(mockAnalyser.fftSize).toBe(2048);
        expect(mockAnalyser.smoothingTimeConstant).toBe(0.8);
      });
    });

    test('应该接受自定义配置', async () => {
      const options = {
        fftSize: 1024,
        smoothingTimeConstant: 0.5,
        minDecibels: -100,
        maxDecibels: 0,
        enabled: false
      };
      
      renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement, options)
      );
      
      await waitFor(() => {
        expect(mockAnalyser.fftSize).toBe(1024);
        expect(mockAnalyser.smoothingTimeConstant).toBe(0.5);
        expect(mockAnalyser.minDecibels).toBe(-100);
        expect(mockAnalyser.maxDecibels).toBe(0);
      });
    });
  });

  describe('音频上下文管理', () => {
    test('应该在音频上下文挂起时恢复', async () => {
      const suspendedContext = {
        ...mockAudioContext,
        state: 'suspended',
        resume: jest.fn().mockResolvedValue(undefined)
      };
      
      (global as { AudioContext?: jest.MockedClass<typeof AudioContext> }).AudioContext = jest.fn(() => suspendedContext as unknown as AudioContext);
      
      renderHook(() => useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement));
      
      await waitFor(() => {
        expect(suspendedContext.resume).toHaveBeenCalled();
      });
    });

    test('应该正确连接音频节点', async () => {
      const mockSource = {
        connect: jest.fn()
      };
      
      mockAudioContext.createMediaElementSource.mockReturnValue(mockSource);
      
      renderHook(() => useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement));
      
      await waitFor(() => {
        expect(mockSource.connect).toHaveBeenCalledWith(mockAnalyser);
        expect(mockAnalyser.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      });
    });

    test('应该在禁用时不初始化音频上下文', () => {
      renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement, { enabled: false })
      );
      
      expect(mockAudioContext.createAnalyser).not.toHaveBeenCalled();
    });
  });

  describe('可视化数据更新', () => {
    test('应该正确更新频域和时域数据', async () => {
      const { result } = renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement)
      );
      
      // 启动可视化
      act(() => {
        result.current.startVisualization();
      });
      
      await waitFor(() => {
        expect(mockAnalyser.getByteFrequencyData).toHaveBeenCalled();
        expect(mockAnalyser.getByteTimeDomainData).toHaveBeenCalled();
        expect(result.current.frequencyData.length).toBeGreaterThan(0);
        expect(result.current.timeData.length).toBeGreaterThan(0);
      });
    });

    test('应该在停止时取消动画帧', () => {
      const { result } = renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement)
      );
      
      act(() => {
        result.current.startVisualization();
      });
      
      act(() => {
        result.current.stopVisualization();
      });
      
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('音频事件监听', () => {
    test('应该监听音频播放事件', () => {
      renderHook(() => useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement));
      
      expect(mockAudioElement.addEventListener).toHaveBeenCalledWith('play', expect.any(Function));
      expect(mockAudioElement.addEventListener).toHaveBeenCalledWith('pause', expect.any(Function));
      expect(mockAudioElement.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    });

    test('应该在音频播放时启动可视化', async () => {
      renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement)
      );
      
      // 模拟播放事件
      const playHandler = mockAudioElement.addEventListener.mock.calls
        .find(call => call[0] === 'play')?.[1];
      
      if (playHandler) {
        act(() => {
          playHandler(new Event('play'));
        });
        
        await waitFor(() => {
          expect(global.requestAnimationFrame).toHaveBeenCalled();
        });
      }
    });

    test('应该在音频暂停时停止可视化', () => {
      renderHook(() => useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement));
      
      // 模拟暂停事件
      const pauseHandler = mockAudioElement.addEventListener.mock.calls
        .find(call => call[0] === 'pause')?.[1];
      
      if (pauseHandler) {
        act(() => {
          pauseHandler(new Event('pause'));
        });
        
        expect(global.cancelAnimationFrame).toHaveBeenCalled();
      }
    });
  });

  describe('辅助函数', () => {
    test('getAverageFrequency应该返回正确的频率范围平均值', async () => {
      const { result } = renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement)
      );
      
      await waitFor(() => {
        const average = result.current.getAverageFrequency(100, 1000);
        expect(typeof average).toBe('number');
        expect(average).toBeGreaterThanOrEqual(0);
        expect(average).toBeLessThanOrEqual(255);
      });
    });

    test('getBeatIntensity应该返回节拍强度', async () => {
      const { result } = renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement)
      );
      
      await waitFor(() => {
        const intensity = result.current.getBeatIntensity();
        expect(typeof intensity).toBe('number');
        expect(intensity).toBeGreaterThanOrEqual(0);
        expect(intensity).toBeLessThanOrEqual(1);
      });
    });

    test('getFrequencyBands应该返回不同频段的能量', async () => {
      const { result } = renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement)
      );
      
      await waitFor(() => {
        const bands = result.current.getFrequencyBands();
        expect(bands).toHaveProperty('bass');
        expect(bands).toHaveProperty('midrange');
        expect(bands).toHaveProperty('treble');
        
        expect(bands.bass).toBeGreaterThanOrEqual(0);
        expect(bands.bass).toBeLessThanOrEqual(1);
        expect(bands.midrange).toBeGreaterThanOrEqual(0);
        expect(bands.midrange).toBeLessThanOrEqual(1);
        expect(bands.treble).toBeGreaterThanOrEqual(0);
        expect(bands.treble).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('错误处理', () => {
    test('应该处理音频上下文创建失败', () => {
      (global as { AudioContext?: jest.MockedClass<typeof AudioContext> }).AudioContext = jest.fn(() => {
        throw new Error('AudioContext creation failed');
      });
      (global as { webkitAudioContext?: unknown }).webkitAudioContext = undefined;
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { /* no-op */ });
      
      expect(() => {
        renderHook(() => useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement));
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to initialize audio visualization:', 
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    test('应该处理空音频元素', () => {
      const { result } = renderHook(() => 
        useAudioVisualization(null)
      );
      
      expect(result.current.isEnabled).toBe(true);
      expect(result.current.frequencyData).toEqual(new Uint8Array(0));
      expect(result.current.timeData).toEqual(new Uint8Array(0));
    });
  });

  describe('资源清理', () => {
    test('应该在组件卸载时清理资源', () => {
      const { unmount } = renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement)
      );
      
      unmount();
      
      expect(mockAudioElement.removeEventListener).toHaveBeenCalledWith('play', expect.any(Function));
      expect(mockAudioElement.removeEventListener).toHaveBeenCalledWith('pause', expect.any(Function));
      expect(mockAudioElement.removeEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
      expect(mockAudioContext.close).toHaveBeenCalled();
    });

    test('应该在配置变更时重新初始化', async () => {
      const { rerender } = renderHook(
        ({ enabled }) => useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement, { enabled }),
        { initialProps: { enabled: true } }
      );
      
      // 禁用后重新启用
      rerender({ enabled: false });
      rerender({ enabled: true });
      
      // 应该重新创建分析器
      await waitFor(() => {
        expect(mockAudioContext.createAnalyser).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('性能测试', () => {
    test('应该能够处理大量数据', async () => {
      // 模拟大的FFT大小
      const { result } = renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement, { fftSize: 8192 })
      );
      
      await waitFor(() => {
        expect(result.current.frequencyData.length).toBeGreaterThan(0);
        expect(result.current.timeData.length).toBeGreaterThan(0);
      });
      
      // 应该能够处理大数组而不崩溃
      const average = result.current.getAverageFrequency(20, 20000);
      expect(typeof average).toBe('number');
    });

    test('应该优化频繁的数据更新', async () => {
      const { result } = renderHook(() => 
        useAudioVisualization(mockAudioElement as unknown as HTMLAudioElement)
      );
      
      // 启动可视化
      act(() => {
        result.current.startVisualization();
      });
      
      // 模拟多次快速更新
      for (let i = 0; i < 10; i++) {
        act(() => {
          result.current.startVisualization();
        });
      }
      
      // 应该能够正常处理
      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true);
      });
    });
  });
});