import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { theme } from '../styles/theme';

interface GlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'heavy';
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: keyof typeof theme.borderRadius;
  padding?: keyof typeof theme.spacing;
  animated?: boolean;
  onPress?: () => void;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function GlassView({
  children,
  style,
  intensity = 'medium',
  tint = 'dark',
  borderRadius = 'lg',
  padding = 'md',
  animated = false,
  onPress,
}: GlassViewProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const blurIntensity = {
    light: 20,
    medium: 50,
    heavy: 100,
  }[intensity];
  
  const animatedStyle = useAnimatedStyle(() => {
    if (!animated) return {};
    
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  
  const handlePressIn = () => {
    if (animated && onPress) {
      scale.value = withSpring(0.95);
      opacity.value = withSpring(0.8);
    }
  };
  
  const handlePressOut = () => {
    if (animated && onPress) {
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    }
  };
  
  const containerStyle: ViewStyle = {
    borderRadius: theme.borderRadius[borderRadius],
    padding: theme.spacing[padding],
    overflow: 'hidden',
    ...style,
  };
  
  const Component = animated ? AnimatedBlurView : BlurView;
  
  return (
    <Component
      intensity={blurIntensity}
      tint={tint}
      style={[containerStyle, animatedStyle]}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
      onTouchCancel={handlePressOut}
    >
      {/* 渐变覆盖层 */}
      <View style={[StyleSheet.absoluteFill, styles.overlay]} />
      
      {/* 边框高光 */}
      <View style={[StyleSheet.absoluteFill, styles.border]} />
      
      {/* 内容 */}
      <View style={styles.content}>
        {children}
      </View>
    </Component>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
  },
  border: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});