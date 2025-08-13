import React, { useCallback, useMemo, memo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  ListRenderItem,
  RefreshControl
} from 'react-native';
import { FlashList, EstimatedItemSize } from '@shopify/flash-list';
import type { Song } from '@music-player/shared';
import { theme } from '../styles/theme';
import { MobilePerformanceMonitor } from '../utils/lazyload';

/**
 * React Native 虚拟化歌曲列表
 * 使用 @shopify/flash-list 实现高性能大列表渲染
 */

// 歌曲项组件
interface SongItemProps {
  song: Song;
  index: number;
  onPress?: (song: Song, index: number) => void;
  onLongPress?: (song: Song, index: number) => void;
  isCurrentPlaying?: boolean;
  searchTerm?: string;
  highlightMatches?: boolean;
}

const SongItem = memo<SongItemProps>(({ 
  song, 
  index, 
  onPress, 
  onLongPress,
  isCurrentPlaying = false,
  searchTerm,
  highlightMatches = false 
}) => {
  const handlePress = useCallback(() => {
    onPress?.(song, index);
  }, [song, index, onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(song, index);
  }, [song, index, onLongPress]);

  // 高亮搜索匹配
  const getHighlightedText = (text: string, term: string) => {
    if (!highlightMatches || !term) return text;
    
    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === term.toLowerCase() ? (
        <Text key={i} style={styles.highlightedText}>{part}</Text>
      ) : (
        <Text key={i}>{part}</Text>
      )
    );
  };

  return (
    <View style={[
      styles.songItem,
      isCurrentPlaying && styles.currentPlayingItem
    ]}>
      {/* 专辑封面 */}
      <View style={styles.albumCover}>
        {song.albumCover ? (
          <View style={styles.albumImage} />
        ) : (
          <View style={[styles.albumImage, styles.placeholderAlbum]}>
            <Text style={styles.placeholderText}>♪</Text>
          </View>
        )}
      </View>

      {/* 歌曲信息 */}
      <View style={styles.songInfo}>
        <Text 
          style={[styles.songTitle, isCurrentPlaying && styles.currentPlayingText]}
          numberOfLines={1}
        >
          {highlightMatches && searchTerm ? 
            getHighlightedText(song.title, searchTerm) : 
            song.title
          }
        </Text>
        <Text 
          style={[styles.songArtist, isCurrentPlaying && styles.currentPlayingArtist]}
          numberOfLines={1}
        >
          {highlightMatches && searchTerm ? 
            getHighlightedText(song.artist, searchTerm) : 
            song.artist
          }
        </Text>
      </View>

      {/* 持续时间 */}
      <Text style={styles.duration}>
        {formatDuration(song.duration)}
      </Text>

      {/* 当前播放指示器 */}
      {isCurrentPlaying && (
        <View style={styles.playingIndicator}>
          <View style={styles.playingDot} />
        </View>
      )}
    </View>
  );
});

SongItem.displayName = 'VirtualizedSongItem';

// 工具函数
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 主要虚拟化列表组件
interface VirtualizedSongListProps {
  songs: Song[];
  onSongPress?: (song: Song, index: number) => void;
  onSongLongPress?: (song: Song, index: number) => void;
  currentPlayingSong?: Song;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => Promise<void>;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  
  // 虚拟化选项
  estimatedItemSize?: EstimatedItemSize;
  removeClippedSubviews?: boolean;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  
  // 无限滚动
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => Promise<void>;
  loadMoreThreshold?: number;
  
  // 搜索高亮
  searchTerm?: string;
  highlightMatches?: boolean;
  
  // 性能监控
  enablePerformanceMonitoring?: boolean;
}

export const VirtualizedSongList: React.FC<VirtualizedSongListProps> = memo(({
  songs,
  onSongPress,
  onSongLongPress,
  currentPlayingSong,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  style,
  contentContainerStyle,
  estimatedItemSize = 72,
  removeClippedSubviews = true,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 16,
  hasNextPage = false,
  isLoadingMore = false,
  onLoadMore,
  loadMoreThreshold = 0.8,
  searchTerm,
  highlightMatches = false,
  enablePerformanceMonitoring = false,
}) => {
  // 性能监控
  React.useEffect(() => {
    if (enablePerformanceMonitoring) {
      MobilePerformanceMonitor.startMeasure('song_list_render');
      return () => {
        MobilePerformanceMonitor.endMeasure('song_list_render');
      };
    }
  }, [enablePerformanceMonitoring, songs.length]);

  // 渲染歌曲项
  const renderSongItem: ListRenderItem<Song> = useCallback(({ item, index }) => (
    <SongItem
      song={item}
      index={index}
      onPress={onSongPress}
      onLongPress={onSongLongPress}
      isCurrentPlaying={currentPlayingSong?.id === item.id}
      searchTerm={searchTerm}
      highlightMatches={highlightMatches}
    />
  ), [onSongPress, onSongLongPress, currentPlayingSong, searchTerm, highlightMatches]);

  // 滚动到底部处理
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isLoadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasNextPage, isLoadingMore, onLoadMore]);

  // 下拉刷新控制
  const refreshControl = useMemo(() => 
    onRefresh ? (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        tintColor={theme.colors.primary}
        colors={[theme.colors.primary]}
      />
    ) : undefined,
    [isRefreshing, onRefresh]
  );

  // 底部加载指示器
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  }, [isLoadingMore]);

  // 空状态
  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {isLoading ? 'Loading songs...' : 'No songs available'}
      </Text>
      {isLoading && (
        <ActivityIndicator 
          size="large" 
          color={theme.colors.primary} 
          style={styles.loadingIndicator} 
        />
      )}
    </View>
  ), [isLoading]);

  // 项目分隔符
  const ItemSeparator = useCallback(() => (
    <View style={styles.separator} />
  ), []);

  // 获取项目布局（用于滚动到特定项目）
  const getItemLayout = useCallback((data: Song[] | null | undefined, index: number) => ({
    length: typeof estimatedItemSize === 'number' ? estimatedItemSize : 72,
    offset: (typeof estimatedItemSize === 'number' ? estimatedItemSize : 72) * index,
    index,
  }), [estimatedItemSize]);

  return (
    <View style={[styles.container, style]}>
      <FlashList
        data={songs}
        renderItem={renderSongItem}
        estimatedItemSize={estimatedItemSize}
        removeClippedSubviews={removeClippedSubviews}
        maxToRenderPerBatch={maxToRenderPerBatch}
        updateCellsBatchingPeriod={updateCellsBatchingPeriod}
        onEndReached={handleEndReached}
        onEndReachedThreshold={loadMoreThreshold}
        refreshControl={refreshControl}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentContainerStyle}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        // 性能优化选项
        disableIntervalMomentum
        initialNumToRender={10}
        maxToRenderPerBatch={maxToRenderPerBatch}
        windowSize={10}
        // 可访问性
        accessible
        accessibilityLabel="Songs list"
      />
    </View>
  );
});

VirtualizedSongList.displayName = 'VirtualizedSongList';

// 样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    minHeight: 72,
  },
  currentPlayingItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  albumCover: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  albumImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  placeholderAlbum: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  currentPlayingText: {
    color: theme.colors.primary,
  },
  currentPlayingArtist: {
    color: theme.colors.primary + '80',
  },
  duration: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  playingIndicator: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginLeft: 76,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  loadingIndicator: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  highlightedText: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
});

export default VirtualizedSongList;