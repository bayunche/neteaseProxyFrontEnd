import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { usePlayerStore } from '@music-player/shared';
import { theme } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

export default function BottomPlayer() {
  const navigation = useNavigation();
  const { player, play, pause, next, previous } = usePlayerStore();
  const { currentSong, isPlaying, currentTime, duration } = player;
  
  const progressValue = useSharedValue(0);
  const playButtonScale = useSharedValue(1);
  
  // 计算播放进度
  React.useEffect(() => {
    const progress = duration > 0 ? currentTime / duration : 0;
    progressValue.value = withSpring(progress);
  }, [currentTime, duration]);
  
  // 播放按钮动画
  React.useEffect(() => {
    playButtonScale.value = withSpring(isPlaying ? 1.1 : 1);
  }, [isPlaying]);
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));
  
  const playButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playButtonScale.value }],
  }));
  
  if (!currentSong) {
    return null;
  }
  
  const handlePlayerPress = () => {
    navigation.navigate('Player' as never);
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <View style={styles.container}>
      {/* 进度条 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>
      
      <BlurView intensity={100} tint="dark" style={styles.playerContainer}>
        {/* 渐变覆盖层 */}
        <View style={styles.overlay} />
        
        <TouchableOpacity 
          style={styles.songInfo}
          onPress={handlePlayerPress}
          activeOpacity={0.8}
        >
          {/* 专辑封面 */}
          <View style={styles.albumCover}>
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
                  size={20} 
                  color={theme.colors.textTertiary}
                />
              </View>
            )}
          </View>
          
          {/* 歌曲信息 */}
          <View style={styles.songDetails}>
            <Text style={styles.songName} numberOfLines={1}>
              {currentSong.name}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {currentSong.artists?.map(artist => artist.name).join(', ') || '未知艺术家'}
            </Text>
          </View>
          
          {/* 时间信息 */}
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </TouchableOpacity>
        
        {/* 控制按钮 */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={previous}
          >
            <Ionicons 
              name="play-skip-back" 
              size={24} 
              color={theme.colors.text}
            />
          </TouchableOpacity>
          
          <Animated.View style={playButtonStyle}>
            <TouchableOpacity 
              style={styles.playButton}
              onPress={() => isPlaying ? pause() : play()}
            >
              <Ionicons 
                name={isPlaying ? "pause" : "play"} 
                size={24} 
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </Animated.View>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={next}
          >
            <Ionicons 
              name="play-skip-forward" 
              size={24} 
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: theme.dimensions.bottomTabHeight,
    left: 0,
    right: 0,
    height: theme.dimensions.bottomPlayerHeight,
    zIndex: 100,
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 1,
  },
  progressBackground: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  playerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 2, // 为进度条留出空间
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  songInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  albumCover: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
  albumPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songDetails: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  songName: {
    ...theme.typography.body1,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  artistName: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  timeText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    minWidth: 80,
    textAlign: 'right',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  controlButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});