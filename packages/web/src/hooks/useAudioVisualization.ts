import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface VisualizationData {
  frequencyData: Uint8Array;
  timeData: Uint8Array;
  analyserNode: AnalyserNode | null;
}

interface AudioVisualizationOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
  enabled?: boolean;
}

const defaultOptions: Required<AudioVisualizationOptions> = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
  enabled: true
};

/**
 * 音频可视化Hook
 */
export const useAudioVisualization = (
  audioElement: HTMLAudioElement | null,
  options: AudioVisualizationOptions = {}
) => {
  const opts = useMemo(() => ({ ...defaultOptions, ...options }), [options]);
  
  const [visualizationData, setVisualizationData] = useState<VisualizationData>({
    frequencyData: new Uint8Array(0),
    timeData: new Uint8Array(0),
    analyserNode: null
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 初始化音频上下文和分析器
  const initializeAudioContext = useCallback(async () => {
    if (!audioElement || !opts.enabled) return;

    try {
      // 创建音频上下文
      const AudioContextClass = window.AudioContext || (window as typeof AudioContext).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // 恢复音频上下文（如果被暂停）
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // 创建分析器节点
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = opts.fftSize;
      analyser.smoothingTimeConstant = opts.smoothingTimeConstant;
      analyser.minDecibels = opts.minDecibels;
      analyser.maxDecibels = opts.maxDecibels;

      // 创建媒体源节点
      const source = audioContext.createMediaElementSource(audioElement);
      
      // 连接节点：源 -> 分析器 -> 目标
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      // 保存引用
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      // 创建数据数组
      const bufferLength = analyser.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      const timeData = new Uint8Array(bufferLength);

      setVisualizationData({
        frequencyData,
        timeData,
        analyserNode: analyser
      });

    } catch (error) {
      console.error('Failed to initialize audio visualization:', error);
    }
  }, [audioElement, opts]);

  // 更新可视化数据
  const updateVisualizationData = useCallback(() => {
    if (!analyserRef.current || !opts.enabled) return;

    const analyser = analyserRef.current;
    const { frequencyData, timeData } = visualizationData;

    // 获取频域和时域数据
    analyser.getByteFrequencyData(frequencyData);
    analyser.getByteTimeDomainData(timeData);

    setVisualizationData(prev => ({
      ...prev,
      frequencyData: new Uint8Array(frequencyData),
      timeData: new Uint8Array(timeData)
    }));

    // 继续动画循环
    animationFrameRef.current = requestAnimationFrame(updateVisualizationData);
  }, [visualizationData, opts.enabled]);

  // 开始可视化
  const startVisualization = useCallback(() => {
    if (!opts.enabled) return;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    updateVisualizationData();
  }, [updateVisualizationData, opts.enabled]);

  // 停止可视化
  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // 清理资源
  const cleanup = useCallback(() => {
    stopVisualization();
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
  }, [stopVisualization]);

  // 当音频元素或选项变化时重新初始化
  useEffect(() => {
    if (audioElement && opts.enabled) {
      initializeAudioContext();
    } else {
      cleanup();
    }

    return cleanup;
  }, [audioElement, opts.enabled, initializeAudioContext, cleanup]);

  // 监听音频播放状态
  useEffect(() => {
    if (!audioElement) return;

    const handlePlay = () => {
      if (opts.enabled) {
        startVisualization();
      }
    };

    const handlePause = () => {
      stopVisualization();
    };

    const handleEnded = () => {
      stopVisualization();
    };

    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement, opts.enabled, startVisualization, stopVisualization]);

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // 辅助函数：获取频率范围的平均值
  const getAverageFrequency = useCallback((startFreq: number, endFreq: number): number => {
    if (!analyserRef.current || visualizationData.frequencyData.length === 0) return 0;

    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const startIndex = Math.floor((startFreq / nyquist) * visualizationData.frequencyData.length);
    const endIndex = Math.floor((endFreq / nyquist) * visualizationData.frequencyData.length);

    let sum = 0;
    let count = 0;
    
    for (let i = startIndex; i <= endIndex && i < visualizationData.frequencyData.length; i++) {
      sum += visualizationData.frequencyData[i];
      count++;
    }

    return count > 0 ? sum / count : 0;
  }, [visualizationData.frequencyData]);

  // 辅助函数：获取音乐的节拍强度
  const getBeatIntensity = useCallback((): number => {
    // 检测低频范围（60-250Hz）的能量，这通常包含节拍信息
    return getAverageFrequency(60, 250) / 255;
  }, [getAverageFrequency]);

  // 辅助函数：获取不同频段的能量
  const getFrequencyBands = useCallback(() => {
    return {
      bass: getAverageFrequency(20, 250) / 255,      // 低音
      midrange: getAverageFrequency(250, 4000) / 255, // 中频
      treble: getAverageFrequency(4000, 20000) / 255  // 高音
    };
  }, [getAverageFrequency]);

  return {
    ...visualizationData,
    isEnabled: opts.enabled,
    startVisualization,
    stopVisualization,
    getAverageFrequency,
    getBeatIntensity,
    getFrequencyBands,
    audioContext: audioContextRef.current
  };
};