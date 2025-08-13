import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { FixedSizeList as List, type ListChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { 
  Play, 
  Heart, 
  Plus, 
  Loader
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';
import { formatSongDuration } from '../../services/api';
import type { Song } from '../../types';

interface VirtualizedSongListProps {
  songs: Song[];
  totalCount: number;
  hasMore: boolean;
  onLoadMore: (startIndex: number, stopIndex?: number) => Promise<void>;
  onSongClick: (song: Song, index?: number) => void;
  isLoading?: boolean;
  className?: string;
  height?: number | string;
}

interface SongItemData {
  songs: Song[];
  favorites: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onSongClick: (song: Song, index?: number) => void;
  onToggleFavorite: (song: Song, e: React.MouseEvent) => void;
  onAddToQueue: (song: Song, e: React.MouseEvent) => void;
}

const ITEM_HEIGHT = 64; // 每个歌曲项的高度

const SongItem: React.FC<ListChildComponentProps<SongItemData>> = ({ 
  index, 
  style, 
  data 
}) => {
  const { 
    songs, 
    favorites, 
    currentSong, 
    isPlaying, 
    onSongClick, 
    onToggleFavorite, 
    onAddToQueue 
  } = data;

  const song = songs[index];
  
  if (!song) {
    // 加载占位符
    return (
      <div style={style} className="flex items-center px-6 py-4">
        <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="flex-1 ml-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mr-4"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        </div>
        <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  const isCurrentSong = currentSong?.id === song.id;
  const isFavorite = favorites.some(fav => fav.id === song.id);

  return (
    <div
      style={style}
      className={cn(
        "group flex items-center px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700",
        isCurrentSong && "bg-primary-50 dark:bg-primary-900/20"
      )}
      onClick={() => onSongClick(song, index)}
    >
      {/* 序号/播放状态 */}
      <div className="w-8 flex items-center justify-center">
        {isCurrentSong ? (
          <div className="w-4 h-4 flex items-center justify-center">
            {isPlaying ? (
              <div className="flex space-x-0.5">
                <div className="w-0.5 h-4 bg-primary-500 animate-pulse"></div>
                <div className="w-0.5 h-2 bg-primary-500 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-0.5 h-3 bg-primary-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
            ) : (
              <Play className="w-3 h-3 text-primary-500" />
            )}
          </div>
        ) : (
          <>
            <span className={cn(
              "text-sm text-gray-400 group-hover:hidden",
              index < 9 ? 'w-4' : 'w-6'
            )}>
              {index + 1}
            </span>
            <button className="hidden group-hover:flex w-6 h-6 items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-primary-500 hover:text-white rounded-full transition-colors">
              <Play className="w-3 h-3 ml-0.5" />
            </button>
          </>
        )}
      </div>

      {/* 歌曲信息 */}
      <div className="flex-1 ml-4 min-w-0">
        <div className="flex items-center">
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-12 h-12 rounded-lg object-cover mr-4"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMCAxOCAzNiAyNCAzMCAyNEMzMCAzMCAyNCAzNiAyNCAzNloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
            }}
          />
          <div className="min-w-0 flex-1">
            <div className={cn(
              "font-medium truncate",
              isCurrentSong 
                ? "text-primary-500" 
                : "text-gray-900 dark:text-white"
            )}>
              {song.title}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {song.artist}
            </div>
          </div>
        </div>
      </div>

      {/* 时长 */}
      <div className="w-20 text-right">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatSongDuration(song.duration)}
        </span>
      </div>

      {/* 操作按钮 */}
      <div className="w-20 flex items-center justify-end space-x-1">
        <button
          onClick={(e) => onToggleFavorite(song, e)}
          className={cn(
            "p-2 rounded-full transition-all opacity-0 group-hover:opacity-100",
            isFavorite
              ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              : "text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600"
          )}
          title={isFavorite ? "取消收藏" : "收藏"}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>

        <button
          onClick={(e) => onAddToQueue(song, e)}
          className="p-2 rounded-full text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all opacity-0 group-hover:opacity-100"
          title="添加到队列"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const VirtualizedSongList: React.FC<VirtualizedSongListProps> = ({
  songs,
  totalCount,
  hasMore,
  onLoadMore,
  onSongClick,
  isLoading = false,
  className,
  height = 600
}) => {
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingRange, setLoadingRange] = useState<{ start: number; end: number } | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(
    typeof height === 'number' ? height - 60 : 440 // 减去header高度60px
  );

  const {
    player,
    user,
    addToQueue,
    addToFavorites,
    removeFromFavorites
  } = usePlayerStore();

  const { currentSong, isPlaying } = player;
  const { favorites } = user;

  // 监听容器高度变化
  useEffect(() => {
    if (typeof height === 'string' && containerRef.current) {
      const updateHeight = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          // 计算可用高度：容器高度减去header高度(60px)
          const availableHeight = Math.max(300, rect.height - 60);
          setContainerHeight(availableHeight);
          console.log('容器高度更新:', rect.height, '可用高度:', availableHeight);
        }
      };

      // 使用定时器延迟计算，确保DOM完全渲染
      const timer = setTimeout(updateHeight, 100);

      const resizeObserver = new ResizeObserver(() => {
        setTimeout(updateHeight, 10);
      });
      resizeObserver.observe(containerRef.current);

      return () => {
        clearTimeout(timer);
        resizeObserver.disconnect();
      };
    } else if (typeof height === 'number') {
      setContainerHeight(height - 60); // 固定高度也要减去header
    }
  }, [height]);

  // 处理收藏切换
  const handleToggleFavorite = useCallback((song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFavorite = favorites.some(fav => fav.id === song.id);
    
    if (isFavorite) {
      removeFromFavorites(String(song.id));
    } else {
      addToFavorites(song);
    }
  }, [favorites, addToFavorites, removeFromFavorites]);

  // 处理添加到队列
  const handleAddToQueue = useCallback((song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(song);
  }, [addToQueue]);

  // 检查项目是否已加载
  const isItemLoaded = useCallback((index: number) => {
    return !!songs[index];
  }, [songs]);

  // 加载更多项目
  const loadMoreItems = useCallback(async (startIndex: number, stopIndex: number) => {
    if (isLoading || !hasMore) return;
    
    setLoadingRange({ start: startIndex, end: stopIndex });
    try {
      await onLoadMore(startIndex, stopIndex);
    } finally {
      setLoadingRange(null);
    }
  }, [isLoading, hasMore, onLoadMore]);

  // 准备传递给子组件的数据
  const itemData: SongItemData = useMemo(() => ({
    songs,
    favorites,
    currentSong,
    isPlaying,
    onSongClick,
    onToggleFavorite: handleToggleFavorite,
    onAddToQueue: handleAddToQueue
  }), [songs, favorites, currentSong, isPlaying, onSongClick, handleToggleFavorite, handleAddToQueue]);

  // 计算实际的项目数量（包括未加载的）
  const itemCount = hasMore ? totalCount : songs.length;

  return (
    <div 
      ref={containerRef}
      className={cn("bg-white dark:bg-gray-800 rounded-lg overflow-hidden", className)}
      style={{ height: typeof height === 'number' ? height : '100%' }}
    >
      {/* 列表头部 */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
          <div className="w-8 text-center">#</div>
          <div className="flex-1 ml-4">歌曲</div>
          <div className="w-20 text-right">时长</div>
          <div className="w-20"></div>
        </div>
      </div>

      {/* 虚拟化列表 */}
      <div className="relative" style={{ height: `${containerHeight}px` }}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
          threshold={10} // 提前10项开始加载
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={(list) => {
                listRef.current = list;
                ref(list);
              }}
              height={containerHeight}
              width="100%"
              itemCount={itemCount}
              itemSize={ITEM_HEIGHT}
              itemData={itemData}
              onItemsRendered={onItemsRendered}
              overscanCount={5} // 预渲染5个额外项目
            >
              {SongItem}
            </List>
          )}
        </InfiniteLoader>

        {/* 加载指示器 */}
        {isLoading && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
            <Loader className="w-4 h-4 animate-spin text-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {loadingRange ? 
                `加载中 ${loadingRange.start + 1}-${loadingRange.end + 1}...` : 
                '加载中...'
              }
            </span>
          </div>
        )}
      </div>

      {/* 空状态 */}
      {songs.length === 0 && !isLoading && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
            暂无歌曲
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            加载失败或歌单为空
          </p>
        </div>
      )}
    </div>
  );
};

export default VirtualizedSongList;