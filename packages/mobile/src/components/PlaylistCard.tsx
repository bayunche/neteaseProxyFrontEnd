import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import type { Playlist } from '@music-player/shared';
import { theme } from '../styles/theme';
import GlassView from './GlassView';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PlaylistCardProps {
  playlist: Playlist;
  onPress?: () => void;
  onPlayPress?: () => void;
  onMorePress?: () => void;
  compact?: boolean;
  showSongCount?: boolean;
}

export default function PlaylistCard({
  playlist,
  onPress,
  onPlayPress,
  onMorePress,
  compact = false,
  showSongCount = true
}: PlaylistCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    runOnJS(onPress)?.();
  };

  const handlePlayPress = (event: any) => {
    event.stopPropagation();
    runOnJS(onPlayPress)?.();
  };

  const handleMorePress = (event: any) => {
    event.stopPropagation();
    runOnJS(onMorePress)?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const coverImage = playlist.cover || 'https://via.placeholder.com/120x120/333/fff?text=📁';

  return (
    <AnimatedPressable
      style={[animatedStyle, compact ? styles.compactCard : styles.card]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <GlassView 
        intensity="light"
        style={[styles.container, compact && styles.compactContainer]}
      >
        {/* Cover Image */}
        <View style={[styles.imageContainer, compact && styles.compactImageContainer]}>
          <Image 
            source={{ uri: coverImage }}
            style={[styles.coverImage, compact && styles.compactCoverImage]}
            defaultSource={{ uri: 'https://via.placeholder.com/120x120/333/fff?text=📁' }}
          />
          
          {/* Play Button Overlay */}
          <Pressable 
            style={styles.playOverlay}
            onPress={handlePlayPress}
          >
            <View style={[styles.playButton, compact && styles.compactPlayButton]}>
              <Feather 
                name="play" 
                size={compact ? 16 : 20} 
                color={theme.colors.text}
              />
            </View>
          </Pressable>
          
          {/* Playlist Type Badge */}
          {playlist.isPrivate && (
            <View style={styles.privateBadge}>
              <Feather name="lock" size={12} color={theme.colors.text} />
            </View>
          )}
        </View>

        {/* Playlist Info */}
        <View style={[styles.playlistInfo, compact && styles.compactPlaylistInfo]}>
          <View style={styles.titleRow}>
            <Text 
              style={[styles.title, compact && styles.compactTitle]}
              numberOfLines={compact ? 1 : 2}
            >
              {playlist.name}
            </Text>
            
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
          
          {playlist.description && !compact && (
            <Text 
              style={styles.description}
              numberOfLines={2}
            >
              {playlist.description}
            </Text>
          )}
          
          {showSongCount && (
            <View style={styles.statsRow}>
              <Text style={[styles.stats, compact && styles.compactStats]}>
                {playlist.trackCount || 0} 首歌曲
              </Text>
              
              {playlist.creator && (
                <>
                  <Text style={[styles.separator, compact && styles.compactStats]}>
                    • 
                  </Text>
                  <Text style={[styles.creator, compact && styles.compactStats]}>
                    {playlist.creator}
                  </Text>
                </>
              )}
            </View>
          )}
          
          {playlist.lastModified && !compact && (
            <Text style={styles.lastModified}>
              更新于 {new Date(playlist.lastModified).toLocaleDateString()}
            </Text>
          )}
        </View>
      </GlassView>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: theme.spacing.sm,
    width: 180,
  },
  compactCard: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    width: 'auto',
  },
  container: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
    alignSelf: 'center',
  },
  compactImageContainer: {
    marginBottom: 0,
    marginRight: theme.spacing.md,
  },
  coverImage: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.lg,
  },
  compactCoverImage: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
  },
  playOverlay: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.sm,
  },
  playButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactPlayButton: {
    padding: theme.spacing.xs,
  },
  privateBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs,
  },
  playlistInfo: {
    flex: 1,
  },
  compactPlaylistInfo: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  compactTitle: {
    ...theme.typography.body1,
    fontWeight: '600',
  },
  description: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  stats: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  compactStats: {
    fontSize: 12,
  },
  separator: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginHorizontal: theme.spacing.xs,
  },
  creator: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  lastModified: {
    ...theme.typography.caption,
    color: theme.colors.textQuaternary,
    fontSize: 10,
  },
  moreButton: {
    padding: theme.spacing.xs,
  },
  compactMoreButton: {
    padding: theme.spacing.xs / 2,
  },
});