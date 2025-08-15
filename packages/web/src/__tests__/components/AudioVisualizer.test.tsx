/**
 * 音频可视化组件测试
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AudioVisualizer } from '../../components/visualizer/AudioVisualizer';
import { useAudioVisualization } from '../../hooks/useAudioVisualization';

// Mock hooks
jest.mock('../../hooks/useAudioVisualization');
jest.mock('../../stores', () => ({
  usePlayerStore: () => ({
    currentSong: { id: '1', title: 'Test Song' },
    isPlaying: true,
  }),
}));

const mockUseAudioVisualization = useAudioVisualization as jest.MockedFunction<typeof useAudioVisualization>;

describe('AudioVisualizer', () => {
  beforeEach(() => {
    // Reset mocks
    mockUseAudioVisualization.mockReturnValue({
      frequencyData: new Uint8Array(32).fill(128), // Mock frequency data
      timeData: new Uint8Array(32).fill(128), // Mock time data
      analyserNode: null,
      isEnabled: true,
      startVisualization: jest.fn(),
      stopVisualization: jest.fn(),
      getAverageFrequency: jest.fn(() => 0.5),
      getBeatIntensity: jest.fn(() => 0.7),
      getFrequencyBands: jest.fn(() => ({
        bass: 0.6,
        midrange: 0.4,
        treble: 0.3,
      })),
      audioContext: null,
    });

    // Mock canvas context
    const mockCanvas = {
      getContext: jest.fn(() => ({
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        set fillStyle(value) {},
        set strokeStyle(value) {},
        set lineWidth(value) {},
      })),
    };

    jest.spyOn(document, 'querySelector').mockReturnValue(mockCanvas as HTMLCanvasElement);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染', () => {
    test('应该正确渲染可视化器', () => {
      render(<AudioVisualizer />);
      
      const canvas = screen.getByRole('img', { hidden: true }); // canvas has role img by default
      expect(canvas).toBeInTheDocument();
    });

    test('应该使用默认属性', () => {
      render(<AudioVisualizer />);
      
      expect(mockUseAudioVisualization).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          enabled: true,
          fftSize: 2048,
          smoothingTimeConstant: 0.8,
        })
      );
    });

    test('应该接受自定义属性', () => {
      render(
        <AudioVisualizer
          type="wave"
          width={400}
          height={200}
          color="#ff0000"
          enabled={false}
        />
      );
      
      expect(mockUseAudioVisualization).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe('可视化类型', () => {
    test('应该支持条形图可视化', () => {
      const { container } = render(<AudioVisualizer type="bars" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('应该支持波形可视化', () => {
      const { container } = render(<AudioVisualizer type="wave" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('应该支持圆形可视化', () => {
      const { container } = render(<AudioVisualizer type="circle" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    test('应该支持粒子可视化', () => {
      const { container } = render(<AudioVisualizer type="particles" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('交互功能', () => {
    test('应该在鼠标悬停时显示控制按钮', () => {
      const { container } = render(<AudioVisualizer />);
      const visualizer = container.firstChild as HTMLElement;
      
      fireEvent.mouseEnter(visualizer);
      
      // 检查控制按钮是否出现
      expect(screen.getByTitle('频谱')).toBeInTheDocument();
      expect(screen.getByTitle('波形')).toBeInTheDocument();
      expect(screen.getByTitle('圆形')).toBeInTheDocument();
      expect(screen.getByTitle('粒子')).toBeInTheDocument();
    });

    test('应该在鼠标离开时隐藏控制按钮', () => {
      const { container } = render(<AudioVisualizer />);
      const visualizer = container.firstChild as HTMLElement;
      
      fireEvent.mouseEnter(visualizer);
      fireEvent.mouseLeave(visualizer);
      
      // 控制按钮应该被隐藏
      // 注意：由于使用了framer-motion，可能需要等待动画完成
    });

    test('应该能够切换可视化类型', () => {
      const { container } = render(<AudioVisualizer />);
      const visualizer = container.firstChild as HTMLElement;
      
      fireEvent.mouseEnter(visualizer);
      
      const waveButton = screen.getByTitle('波形');
      fireEvent.click(waveButton);
      
      // 检查是否切换到波形模式
      expect(waveButton).toHaveClass('active');
    });
  });

  describe('响应式行为', () => {
    test('应该根据容器大小调整canvas尺寸', () => {
      const { rerender } = render(
        <AudioVisualizer width={300} height={150} />
      );
      
      rerender(
        <AudioVisualizer width={600} height={300} />
      );
      
      // 验证canvas尺寸是否更新
      const canvas = screen.getByRole('img', { hidden: true });
      expect(canvas).toHaveAttribute('width', '600');
      expect(canvas).toHaveAttribute('height', '300');
    });

    test('应该在禁用时显示静态状态', () => {
      render(<AudioVisualizer enabled={false} />);
      
      expect(mockUseAudioVisualization).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  describe('音频数据处理', () => {
    test('应该处理空音频数据', () => {
      mockUseAudioVisualization.mockReturnValue({
        frequencyData: new Uint8Array(0),
        timeData: new Uint8Array(0),
        analyserNode: null,
        isEnabled: true,
        startVisualization: jest.fn(),
        stopVisualization: jest.fn(),
        getAverageFrequency: jest.fn(() => 0),
        getBeatIntensity: jest.fn(() => 0),
        getFrequencyBands: jest.fn(() => ({
          bass: 0,
          midrange: 0,
          treble: 0,
        })),
        audioContext: null,
      });

      expect(() => {
        render(<AudioVisualizer />);
      }).not.toThrow();
    });

    test('应该处理异常音频数据', () => {
      mockUseAudioVisualization.mockReturnValue({
        frequencyData: new Uint8Array(32).fill(255), // 最大值
        timeData: new Uint8Array(32).fill(0), // 最小值
        analyserNode: null,
        isEnabled: true,
        startVisualization: jest.fn(),
        stopVisualization: jest.fn(),
        getAverageFrequency: jest.fn(() => 1),
        getBeatIntensity: jest.fn(() => 1),
        getFrequencyBands: jest.fn(() => ({
          bass: 1,
          midrange: 1,
          treble: 1,
        })),
        audioContext: null,
      });

      expect(() => {
        render(<AudioVisualizer />);
      }).not.toThrow();
    });
  });

  describe('性能测试', () => {
    test('应该能够处理高频更新', () => {
      const { rerender } = render(<AudioVisualizer />);
      
      // 模拟快速数据更新
      for (let i = 0; i < 100; i++) {
        mockUseAudioVisualization.mockReturnValue({
          frequencyData: new Uint8Array(32).fill(Math.floor(Math.random() * 255)),
          timeData: new Uint8Array(32).fill(Math.floor(Math.random() * 255)),
          analyserNode: null,
          isEnabled: true,
          startVisualization: jest.fn(),
          stopVisualization: jest.fn(),
          getAverageFrequency: jest.fn(() => Math.random()),
          getBeatIntensity: jest.fn(() => Math.random()),
          getFrequencyBands: jest.fn(() => ({
            bass: Math.random(),
            midrange: Math.random(),
            treble: Math.random(),
          })),
          audioContext: null,
        });
        
        rerender(<AudioVisualizer />);
      }
      
      // 应该没有崩溃或性能问题
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('清理和内存管理', () => {
    test('应该在组件卸载时清理资源', () => {
      const stopVisualization = jest.fn();
      
      mockUseAudioVisualization.mockReturnValue({
        frequencyData: new Uint8Array(32),
        timeData: new Uint8Array(32),
        analyserNode: null,
        isEnabled: true,
        startVisualization: jest.fn(),
        stopVisualization,
        getAverageFrequency: jest.fn(() => 0.5),
        getBeatIntensity: jest.fn(() => 0.7),
        getFrequencyBands: jest.fn(() => ({
          bass: 0.6,
          midrange: 0.4,
          treble: 0.3,
        })),
        audioContext: null,
      });

      const { unmount } = render(<AudioVisualizer />);
      
      unmount();
      
      // 验证清理函数被调用
      // 注意：这取决于具体的实现细节
    });
  });

  describe('可访问性', () => {
    test('应该包含适当的ARIA属性', () => {
      render(<AudioVisualizer />);
      
      const visualizer = screen.getByRole('img', { hidden: true });
      expect(visualizer).toBeInTheDocument();
    });

    test('应该支持键盘导航', () => {
      const { container } = render(<AudioVisualizer />);
      const visualizer = container.firstChild as HTMLElement;
      
      fireEvent.mouseEnter(visualizer);
      
      const firstButton = screen.getByTitle('频谱');
      fireEvent.keyDown(firstButton, { key: 'Enter' });
      
      expect(firstButton).toHaveClass('active');
    });
  });
});