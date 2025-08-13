import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface TabBarIconProps {
  name: string;
  focused: boolean;
  color: string;
  size: number;
}

export default function TabBarIcon({ name, focused, color, size }: TabBarIconProps) {
  const scale = useSharedValue(focused ? 1.2 : 1);
  const opacity = useSharedValue(focused ? 1 : 0.7);
  
  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withSpring(focused ? 1 : 0.7);
  }, [focused]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scale.value, [1, 1.2], [0, 0.3]),
    transform: [{ scale: interpolate(scale.value, [1, 1.2], [0.8, 1.5]) }],
  }));
  
  // 图标映射
  const getIconName = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'home': focused ? 'home' : 'home-outline',
      'search': focused ? 'search' : 'search-outline',
      'library-music': focused ? 'library' : 'library-outline',
      'person': focused ? 'person' : 'person-outline',
    };
    
    return iconMap[iconName] || 'home-outline';
  };
  
  return (
    <View style={styles.container}>
      {/* 发光效果 */}
      {focused && (
        <Animated.View style={[styles.glow, glowStyle]} />
      )}
      
      {/* 图标 */}
      <Animated.View style={animatedStyle}>
        <Ionicons 
          name={getIconName(name)} 
          size={size} 
          color={color} 
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
});