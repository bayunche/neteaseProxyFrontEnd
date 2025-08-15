import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import type { Song } from '@music-player/shared';
import { theme } from '../styles/theme';
import GlassView from './GlassView';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SongCardProps {
  song: Song;
  isPlaying?: boolean;
  isCurrentSong?: boolean;
  onPress?: () => void;
  onPlayPress?: () => void;
  onMorePress?: () => void;
  showImage?: boolean;
  showDuration?: boolean;
  compact?: boolean;
}

export default function SongCard({
  song,
  isPlaying = false,
  isCurrentSong = false,
  onPress,
  onPlayPress,
  onMorePress,
  showImage = true,
  showDuration = true,
  compact = false
}: SongCardProps) {
  const scale = useSharedValue(1);
  const playButtonOpacity = useSharedValue(0);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
    playButtonOpacity.value = withTiming(1);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    playButtonOpacity.value = withTiming(0);
  };

  const handlePress = () => {
    runOnJS(onPress)?.();
  };

  const handlePlayPress = () => {
    runOnJS(onPlayPress)?.();
  };

  const handleMorePress = () => {
    runOnJS(onMorePress)?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const playButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: playButtonOpacity.value
  }));

  const imageUri = song.albumCover || song.cover || 'https://via.placeholder.com/60x60/333/fff?text=♪';

  return (
    <AnimatedPressable
      style={[animatedStyle, compact ? styles.compactCard : styles.card]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <GlassView 
        intensity="light"
        style={[
          styles.container,
          isCurrentSong && styles.currentSongContainer,
          compact && styles.compactContainer
        ]}
      >
        <View style={styles.content}>
          {/* Album Cover */}
          {showImage && (
            <View style={[styles.imageContainer, compact && styles.compactImageContainer]}>
              <Image 
                source={{ uri: imageUri }}
                style={[styles.albumImage, compact && styles.compactAlbumImage]}
                defaultSource={{ uri: 'https://via.placeholder.com/60x60/333/fff?text=♪' }}
              />
              
              {/* Play Button Overlay */}
              <Animated.View 
                style={[styles.playOverlay, playButtonAnimatedStyle]}
                pointerEvents="none"
              >
                <View style={styles.playButton}>
                  <Feather 
                    name={isPlaying ? 'pause' : 'play'} 
                    size={compact ? 16 : 20} 
                    color={theme.colors.text}
                  />
                </View>
              </Animated.View>
            </View>
          )}

          {/* Song Info */}
          <View style={[styles.songInfo, compact && styles.compactSongInfo]}>
            <Text 
              style={[
                styles.title,
                compact && styles.compactTitle,
                isCurrentSong && styles.currentSongTitle
              ]}
              numberOfLines={1}
            >
              {song.title}
            </Text>
            
            <Text 
              style={[
                styles.artist,
                compact && styles.compactArtist
              ]}
              numberOfLines={1}
            >
              {song.artist}
            </Text>
            
            {!compact && song.album && (
              <Text 
                style={styles.album}
                numberOfLines={1}
              >
                {song.album}
              </Text>
            )}
          </View>

          {/* Duration and More Button */}
          <View style={styles.rightSection}>
            {showDuration && (
              <Text style={[styles.duration, compact && styles.compactDuration]}>
                {formatDuration(song.duration)}
              </Text>
            )}
            
            <Pressable
              style={[styles.moreButton, compact && styles.compactMoreButton]}
              onPress={handleMorePress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather 
                name="more-vertical" 
                size={compact ? 16 : 20} 
                color={theme.colors.textSecondary}
              />
            </Pressable>
          </View>

          {/* Playing Indicator */}
          {isCurrentSong && (
            <View style={styles.playingIndicator}>
              <View style={[styles.playingBar, { animationDelay: '0ms' }]} />
              <View style={[styles.playingBar, { animationDelay: '200ms' }]} />
              <View style={[styles.playingBar, { animationDelay: '400ms' }]} />
            </View>
          )}
        </View>
      </GlassView>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  compactCard: {
    marginHorizontal: theme.spacing.sm,
    marginVertical: theme.spacing.xs / 2,
  },
  container: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  compactContainer: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  currentSongContainer: {
    borderColor: theme.colors.primary,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  compactImageContainer: {
    marginRight: theme.spacing.sm,
  },
  albumImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
  },
  compactAlbumImage: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: theme.borderRadius.md,
  },
  playButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songInfo: {
    flex: 1,
  },
  compactSongInfo: {
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.body1,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs / 2,
  },
  compactTitle: {
    ...theme.typography.body2,
    marginBottom: theme.spacing.xs / 4,
  },
  currentSongTitle: {
    color: theme.colors.primary,
  },
  artist: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs / 2,
  },
  compactArtist: {
    ...theme.typography.caption,
  },
  album: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  duration: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xs,
  },
  compactDuration: {
    fontSize: 10,
  },
  moreButton: {
    padding: theme.spacing.xs,
  },
  compactMoreButton: {
    padding: theme.spacing.xs / 2,
  },
  playingIndicator: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  playingBar: {
    width: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 1.5,
    // Animation would be handled by native animations or libraries
    height: 12, // This would animate between different heights
  },
});