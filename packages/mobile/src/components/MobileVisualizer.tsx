import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { 
  Rect, 
  Circle, 
  Path, 
  LinearGradient, 
  Stop, 
  Defs 
} from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming,
  withRepeat,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { theme } from '../styles/theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width: screenWidth } = Dimensions.get('window');

type VisualizerType = 'bars' | 'wave' | 'circle' | 'particles';

interface MobileVisualizerProps {
  audioData?: Uint8Array;
  isPlaying?: boolean;
  type?: VisualizerType;
  width?: number;
  height?: number;
  color?: string;
  intensity?: number;
  barCount?: number;
}

// 条形可视化组件
const BarsVisualizer: React.FC<{
  audioData: Uint8Array;
  width: number;
  height: number;
  color: string;
  barCount: number;
  isPlaying: boolean;
}> = ({ audioData, width, height, color, barCount, isPlaying }) => {
  const animatedValues = Array.from({ length: barCount }, () => useSharedValue(0.1));
  
  useEffect(() => {
    if (isPlaying && audioData.length > 0) {
      const step = Math.floor(audioData.length / barCount);
      
      animatedValues.forEach((value, index) => {
        const dataIndex = index * step;
        const amplitude = audioData[dataIndex] / 255;
        value.value = withTiming(amplitude || 0.1, {
          duration: 100,
          easing: Easing.out(Easing.cubic),
        });
      });
    } else {
      // 如果没有数据或不在播放，使用随机动画
      animatedValues.forEach((value) => {
        value.value = withRepeat(
          withTiming(Math.random() * 0.5 + 0.1, {
            duration: 300 + Math.random() * 200,
            easing: Easing.inOut(Easing.sine),
          }),
          -1,
          true
        );
      });
    }
  }, [audioData, isPlaying, barCount]);

  const barWidth = width / barCount - 2;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      
      {animatedValues.map((animatedValue, index) => {
        const animatedProps = useAnimatedProps(() => ({
          height: animatedValue.value * height,
          y: height - animatedValue.value * height,
        }));

        return (
          <AnimatedRect
            key={index}
            x={index * (barWidth + 2)}
            width={barWidth}
            fill="url(#barGradient)"
            rx={2}
            animatedProps={animatedProps}
          />
        );
      })}
    </Svg>
  );
};

// 波形可视化组件
const WaveVisualizer: React.FC<{
  audioData: Uint8Array;
  width: number;
  height: number;
  color: string;
  isPlaying: boolean;
}> = ({ audioData, width, height, color, isPlaying }) => {
  const pathData = useSharedValue('');

  useEffect(() => {
    const generateWavePath = () => {
      if (!isPlaying) {
        // 静态波形
        const points = Array.from({ length: 50 }, (_, i) => {
          const x = (i / 49) * width;
          const y = height / 2;
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
        
        pathData.value = withTiming(points, { duration: 300 });
        return;
      }

      if (audioData.length === 0) return;

      const step = Math.floor(audioData.length / 50);
      const points = Array.from({ length: 50 }, (_, i) => {
        const dataIndex = i * step;
        const amplitude = audioData[dataIndex] / 255;
        const x = (i / 49) * width;
        const y = height / 2 + (amplitude - 0.5) * height * 0.8;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');

      pathData.value = withTiming(points, {
        duration: 50,
        easing: Easing.linear,
      });
    };

    generateWavePath();
  }, [audioData, width, height, isPlaying]);

  const animatedProps = useAnimatedProps(() => ({
    d: pathData.value,
  }));

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <Stop offset="50%" stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </LinearGradient>
      </Defs>
      
      <AnimatedPath
        stroke="url(#waveGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        animatedProps={animatedProps}
      />
    </Svg>
  );
};

// 圆形可视化组件
const CircleVisualizer: React.FC<{
  audioData: Uint8Array;
  width: number;
  height: number;
  color: string;
  isPlaying: boolean;
}> = ({ audioData, width, height, color, isPlaying }) => {
  const circleCount = 12;
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) / 4;
  
  const animatedValues = Array.from({ length: circleCount }, () => useSharedValue(0));

  useEffect(() => {
    if (isPlaying && audioData.length > 0) {
      const step = Math.floor(audioData.length / circleCount);
      
      animatedValues.forEach((value, index) => {
        const dataIndex = index * step;
        const amplitude = audioData[dataIndex] / 255;
        value.value = withTiming(amplitude, {
          duration: 100,
          easing: Easing.out(Easing.cubic),
        });
      });
    } else {
      animatedValues.forEach((value) => {
        value.value = withRepeat(
          withTiming(Math.random() * 0.5 + 0.2, {
            duration: 400 + Math.random() * 300,
            easing: Easing.inOut(Easing.sine),
          }),
          -1,
          true
        );
      });
    }
  }, [audioData, isPlaying]);

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.2" />
        </LinearGradient>
      </Defs>
      
      {animatedValues.map((animatedValue, index) => {
        const angle = (index / circleCount) * 2 * Math.PI;
        const x = centerX + Math.cos(angle) * baseRadius;
        const y = centerY + Math.sin(angle) * baseRadius;

        const animatedProps = useAnimatedProps(() => ({
          r: 4 + animatedValue.value * 15,
        }));

        return (
          <AnimatedCircle
            key={index}
            cx={x}
            cy={y}
            fill="url(#circleGradient)"
            opacity={0.8}
            animatedProps={animatedProps}
          />
        );
      })}
    </Svg>
  );
};

export default function MobileVisualizer({
  audioData = new Uint8Array(0),
  isPlaying = false,
  type = 'bars',
  width = screenWidth - 40,
  height = 120,
  color = theme.colors.primary,
  intensity = 1,
  barCount = 32,
}: MobileVisualizerProps) {
  const [currentType, setCurrentType] = useState<VisualizerType>(type);

  // 自动切换可视化类型（可选）
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        const types: VisualizerType[] = ['bars', 'wave', 'circle'];
        const currentIndex = types.indexOf(currentType);
        const nextIndex = (currentIndex + 1) % types.length;
        setCurrentType(types[nextIndex]);
      }, 10000); // 10秒切换一次

      return () => clearInterval(interval);
    }
  }, [isPlaying, currentType]);

  const renderVisualizer = () => {
    switch (currentType) {
      case 'bars':
        return (
          <BarsVisualizer
            audioData={audioData}
            width={width}
            height={height}
            color={color}
            barCount={barCount}
            isPlaying={isPlaying}
          />
        );
      case 'wave':
        return (
          <WaveVisualizer
            audioData={audioData}
            width={width}
            height={height}
            color={color}
            isPlaying={isPlaying}
          />
        );
      case 'circle':
        return (
          <CircleVisualizer
            audioData={audioData}
            width={width}
            height={height}
            color={color}
            isPlaying={isPlaying}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { width, height }]}>
      {renderVisualizer()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
});