import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  Image,
  Dimensions,
  PanGestureHandler,
  State,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { usePlayerStore } from '@music-player/shared';
import { theme } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import GlassView from '../components/GlassView';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PlayerScreen() {
  const navigation = useNavigation();
  const { 
    player, 
    togglePlayPause, 
    playNext, 
    playPrevious,
    setCurrentTime,
  } = usePlayerStore();
  
  const { currentSong, isPlaying, currentTime, duration, volume } = player;
  const [isLyricsVisible, setIsLyricsVisible] = useState(false);
  
  const albumScale = useSharedValue(1);
  const progressValue = useSharedValue(0);
  const volumeOpacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  // 专辑封面旋转动画
  React.useEffect(() => {
    albumScale.value = withSpring(isPlaying ? 1.05 : 1);
  }, [isPlaying]);
  
  // 进度条同步
  React.useEffect(() => {
    const progress = duration > 0 ? currentTime / duration : 0;
    progressValue.value = withSpring(progress);
  }, [currentTime, duration]);
  
  // 下滑手势处理
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      const newY = context.startY + event.translationY;
      if (newY >= 0) {
        translateY.value = newY;
      }
    },
    onEnd: (event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        // 关闭播放器
        runOnJS(navigation.goBack)();
      } else {
        translateY.value = withSpring(0);
      }
    },
  });
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(translateY.value, [0, 200], [1, 0.7]),
  }));
  
  const albumStyle = useAnimatedStyle(() => ({
    transform: [{ scale: albumScale.value }],
  }));
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));
  
  if (!currentSong) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>没有正在播放的歌曲</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <LinearGradient
          colors={['#0f0f23', '#1a1a2e', '#16213e']}
          style={StyleSheet.absoluteFill}
        />
        
        <SafeAreaView style={styles.safeArea}>
          {/* 头部控制 */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-down" size={28} color={theme.colors.text} />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                正在播放
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                来自歌单
              </Text>
            </View>
            
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* 专辑封面区域 */}
          <View style={styles.albumSection}>
            <Animated.View style={[styles.albumContainer, albumStyle]}>
              <GlassView style={styles.albumWrapper} intensity="light">
                {currentSong.picUrl ? (
                  <Image 
                    source={{ uri: currentSong.picUrl }}
                    style={styles.albumImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.albumPlaceholder}>
                    <Ionicons 
                      name="musical-notes" 
                      size={80} 
                      color={theme.colors.textTertiary}
                    />
                  </View>
                )}
              </GlassView>
            </Animated.View>
          </View>
          
          {/* 歌曲信息 */}
          <View style={styles.songInfo}>
            <Text style={styles.songName} numberOfLines={1}>
              {currentSong.name}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {currentSong.artists?.map(artist => artist.name).join(', ') || '未知艺术家'}
            </Text>
          </View>
          
          {/* 进度控制 */}
          <View style={styles.progressSection}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
              </View>
              <View style={styles.progressDot} />
            </View>
            
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>
          
          {/* 控制按钮 */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="shuffle" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={playPrevious}
            >
              <Ionicons name="play-skip-back" size={32} color={theme.colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.playButton}
              onPress={togglePlayPause}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={32} 
                color={theme.colors.text}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={playNext}
            >
              <Ionicons name="play-skip-forward" size={32} color={theme.colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.controlButton}>
              <Ionicons name="repeat" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          {/* 底部功能 */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setIsLyricsVisible(!isLyricsVisible)}
            >
              <Ionicons 
                name="document-text-outline" 
                size={24} 
                color={isLyricsVisible ? theme.colors.primary : theme.colors.text}
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="list-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.body1,
    color: theme.colors.text,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  albumSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  albumContainer: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    maxWidth: 300,
    maxHeight: 300,
  },
  albumWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.sm,
  },
  albumImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.xl,
  },
  albumPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  songName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  artistName: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: theme.spacing.xl,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  progressBackground: {
    flex: 1,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  progressDot: {
    position: 'absolute',
    right: 0,
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xl,
  },
  controlButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: theme.spacing.lg,
  },
  actionButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});