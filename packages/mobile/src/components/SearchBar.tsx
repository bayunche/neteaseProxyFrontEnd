import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming 
} from 'react-native-reanimated';
import { theme } from '../styles/theme';
import GlassView from './GlassView';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onFocus,
  onBlur,
  placeholder = "搜索歌曲、专辑、艺人...",
  autoFocus = false
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusScale = useSharedValue(1);
  const clearOpacity = useSharedValue(0);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusScale.value = withSpring(1.02);
    if (value) {
      clearOpacity.value = withTiming(1);
    }
    onFocus?.();
  }, [value, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusScale.value = withSpring(1);
    clearOpacity.value = withTiming(0);
    onBlur?.();
  }, [onBlur]);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
    clearOpacity.value = withTiming(text ? 1 : 0);
  }, [onChangeText]);

  const handleClear = useCallback(() => {
    onChangeText('');
    clearOpacity.value = withTiming(0);
  }, [onChangeText]);

  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      onSubmit?.(value.trim());
    }
  }, [value, onSubmit]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: focusScale.value }]
  }));

  const clearAnimatedStyle = useAnimatedStyle(() => ({
    opacity: clearOpacity.value
  }));

  return (
    <Animated.View style={containerAnimatedStyle}>
      <GlassView 
        intensity="medium"
        style={[
          styles.container,
          isFocused && styles.containerFocused
        ]}
      >
        <View style={styles.inputContainer}>
          <Feather 
            name="search" 
            size={20} 
            color={theme.colors.textTertiary}
            style={styles.searchIcon}
          />
          
          <TextInput
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmit}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textQuaternary}
            autoFocus={autoFocus}
            returnKeyType="search"
            clearButtonMode="never"
            style={[
              styles.input,
              theme.typography.body1
            ]}
          />

          <AnimatedPressable
            style={[styles.clearButton, clearAnimatedStyle]}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather 
              name="x" 
              size={18} 
              color={theme.colors.textSecondary}
            />
          </AnimatedPressable>
        </View>
      </GlassView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
  },
  containerFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    paddingVertical: 0, // Remove default padding
  },
  clearButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
});