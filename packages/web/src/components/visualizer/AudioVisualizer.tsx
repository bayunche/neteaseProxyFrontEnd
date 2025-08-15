import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { styled } from '../../styles/stitches.config';
import { useAudioVisualization } from '../../hooks/useAudioVisualization';
import { usePlayerStore } from "@music-player/shared/stores";

// 可视化类型
type VisualizerType = 'bars' | 'wave' | 'circle' | 'particles';

interface AudioVisualizerProps {
  type?: VisualizerType;
  width?: number;
  height?: number;
  color?: string;
  sensitivity?: number;
  enabled?: boolean;
  className?: string;
}

// 样式化组件
const VisualizerContainer = styled('div', {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '$lg',
  background: 'rgba(0, 0, 0, 0.2)',
  
  variants: {
    enabled: {
      true: {
        opacity: 1,
        transform: 'scale(1)',
      },
      false: {
        opacity: 0.3,
        transform: 'scale(0.95)',
      }
    }
  },
  
  defaultVariants: {
    enabled: true
  },
  
  transition: 'all $normal',
});

const Canvas = styled('canvas', {
  width: '100%',
  height: '100%',
  display: 'block',
});

const ControlsContainer = styled(motion.div, {
  position: 'absolute',
  top: '$2',
  right: '$2',
  display: 'flex',
  gap: '$1',
  padding: '$1',
  background: 'rgba(0, 0, 0, 0.5)',
  borderRadius: '$md',
  opacity: 0,
  
  transition: 'opacity $normal',
});

const ControlButton = styled(motion.button, {
  background: 'transparent',
  border: 'none',
  color: '$white',
  padding: '$1',
  borderRadius: '$sm',
  cursor: 'pointer',
  fontSize: '$xs',
  
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
  },
  
  '&.active': {
    background: '$primary500',
  }
});

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  type = 'bars',
  width = 300,
  height = 150,
  color = '#ef4444',
  sensitivity = 1,
  enabled = true,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  
  const [currentType, setCurrentType] = useState<VisualizerType>(type);
  const [showControls, setShowControls] = useState(false);
  
  const { currentSong, isPlaying } = usePlayerStore();
  
  // 获取音频元素
  const audioElement = document.querySelector('audio') as HTMLAudioElement | null;
  
  // 使用音频可视化Hook
  const {
    frequencyData,
    timeData,
    isEnabled,
    getFrequencyBands,
    getBeatIntensity
  } = useAudioVisualization(audioElement, {
    enabled: enabled && isPlaying,
    fftSize: 2048,
    smoothingTimeConstant: 0.8
  });

  // 绘制频谱条
  const drawBars = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const bufferLength = frequencyData.length;
    const barWidth = canvas.width / bufferLength * 2.5;
    let barHeight;
    let x = 0;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (frequencyData[i] / 255) * canvas.height * sensitivity;

      const r = barHeight + 25 * (i / bufferLength);
      const g = 250 * (i / bufferLength);
      const b = 50;

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }, [frequencyData, sensitivity]);

  // 绘制波形
  const drawWave = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const bufferLength = timeData.length;
    const sliceWidth = canvas.width / bufferLength;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.beginPath();

    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = (timeData[i] / 128.0) * sensitivity;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }, [timeData, sensitivity, color]);

  // 绘制圆形可视化
  const drawCircle = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const bufferLength = frequencyData.length;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < bufferLength; i++) {
      const angle = (i / bufferLength) * 2 * Math.PI;
      const barHeight = (frequencyData[i] / 255) * radius * sensitivity;

      const x1 = centerX + Math.cos(angle) * (radius - barHeight);
      const y1 = centerY + Math.sin(angle) * (radius - barHeight);
      const x2 = centerX + Math.cos(angle) * radius;
      const y2 = centerY + Math.sin(angle) * radius;

      const hue = (i / bufferLength) * 360;
      ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }, [frequencyData, sensitivity]);

  // 绘制粒子效果
  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const beatIntensity = getBeatIntensity();
    const bands = getFrequencyBands();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 基于音频数据创建粒子
    const particleCount = Math.floor(beatIntensity * 50 + 10);
    
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = (bands.bass + bands.midrange + bands.treble) * 5 + 1;
      
      const hue = (beatIntensity * 360 + i * 10) % 360;
      ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${0.3 + beatIntensity * 0.7})`;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [getBeatIntensity, getFrequencyBands]);

  // 主绘制函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    switch (currentType) {
      case 'bars':
        drawBars(ctx, canvas);
        break;
      case 'wave':
        drawWave(ctx, canvas);
        break;
      case 'circle':
        drawCircle(ctx, canvas);
        break;
      case 'particles':
        drawParticles(ctx, canvas);
        break;
    }

    if (isPlaying && isEnabled) {
      animationFrameRef.current = requestAnimationFrame(draw);
    }
  }, [currentType, isPlaying, isEnabled, drawBars, drawWave, drawCircle, drawParticles]);

  // 开始绘制循环
  useEffect(() => {
    if (isPlaying && isEnabled && frequencyData.length > 0) {
      draw();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, isEnabled, frequencyData, currentType, draw]);

  // 设置canvas尺寸
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
  }, [width, height]);

  const visualizerTypes: { type: VisualizerType; label: string }[] = [
    { type: 'bars', label: '频谱' },
    { type: 'wave', label: '波形' },
    { type: 'circle', label: '圆形' },
    { type: 'particles', label: '粒子' }
  ];

  return (
    <VisualizerContainer
      ref={containerRef}
      enabled={enabled && !!currentSong}
      className={className}
      style={{ width, height }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <Canvas ref={canvasRef} />
      
      {showControls && (
        <ControlsContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {visualizerTypes.map(({ type: vizType, label }) => (
            <ControlButton
              key={vizType}
              className={currentType === vizType ? 'active' : ''}
              onClick={() => setCurrentType(vizType)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={label}
            >
              {label}
            </ControlButton>
          ))}
        </ControlsContainer>
      )}
    </VisualizerContainer>
  );
};

export default AudioVisualizer;