import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  Shuffle,
  ChevronLeft,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "../utils/cn";
import { usePlayerStore } from "@music-player/shared/stores";
import { formatPlayCount, EnhancedPlaylistAPI } from "@music-player/shared";
import VirtualizedSongList from "../components/music/VirtualizedSongList";
import type { Playlist, Song } from "@music-player/shared/types";

interface PlaylistState {
  info: Omit<Playlist, "songs"> | null;
  songs: Song[];
  totalSongs: number;
  hasMoreSongs: boolean;
  currentOffset: number;
}

const EnhancedPlaylistDetailPage: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();

  // 状态管理
  const [playlist, setPlaylist] = useState<PlaylistState>({
    info: null,
    songs: [],
    totalSongs: 0,
    hasMoreSongs: false,
    currentOffset: 0,
  });

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { play, playAllSongs } = usePlayerStore();

  // 加载歌单基本信息
  const loadPlaylistInfo = useCallback(async () => {
    if (!playlistId) {
      setError("歌单ID不存在");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const info = await EnhancedPlaylistAPI.getPlaylistDetail({
        id: playlistId,
      });

      setPlaylist((prev) => ({
        ...prev,
        info,
        totalSongs: info.trackCount || 0,
        // 初始化songs数组，用undefined填充
        songs: new Array(info.trackCount || 0).fill(undefined),
      }));
    } catch (err) {
      console.error("加载歌单信息失败:", err);
      setError(err instanceof Error ? err.message : "加载歌单信息失败");
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  // 加载歌曲（分页）
  const loadSongs = useCallback(
    async (offset: number, limit: number) => {
      if (!playlistId) return;

      try {
        setLoadingMore(true);

        const response = await EnhancedPlaylistAPI.loadMoreSongs(
          playlistId,
          offset,
          limit
        );

        setPlaylist((prev) => {
          const newSongs = [...prev.songs];

          // 填充新数据到对应位置
          response.songs.forEach((song: Song, index: number) => {
            newSongs[offset + index] = song;
          });

          return {
            ...prev,
            songs: newSongs,
            hasMoreSongs: response.hasMore,
            currentOffset: Math.max(
              prev.currentOffset,
              offset + response.songs.length
            ),
          };
        });
      } catch (err) {
        console.error("加载歌曲失败:", err);
        // 不设置全局错误，避免影响已加载的内容
      } finally {
        setLoadingMore(false);
      }
    },
    [playlistId]
  );

  // 处理加载更多
  const handleLoadMore = useCallback(
    async (startIndex: number) => {
      const pageSize = 20;
      const startPage = Math.floor(startIndex / pageSize);
      const offset = startPage * pageSize;

      // 检查是否已经加载过这个范围
      const needsLoading = playlist.songs
        .slice(offset, offset + pageSize)
        .some((song) => !song);

      if (needsLoading && !loadingMore) {
        await loadSongs(offset, pageSize);
      }
    },
    [playlist.songs, loadSongs, loadingMore]
  );

  // 初始化加载
  useEffect(() => {
    loadPlaylistInfo();
  }, [loadPlaylistInfo]);

  // 加载第一页数据
  useEffect(() => {
    if (
      playlist.info &&
      playlist.totalSongs > 0 &&
      playlist.songs.length > 0 &&
      !playlist.songs[0]
    ) {
      loadSongs(0, 20); // 加载第一页
    }
  }, [playlist.info, playlist.totalSongs, playlist.songs, loadSongs]);

  // 处理播放/暂停 (暂时不使用，留作备用)
  // const handlePlayPause = useCallback(() => {
  //   if (!playlist.info || playlist.songs.length === 0) return;

  //   const currentPlaylistSong = playlist.songs.find(
  //     (song) => song?.id === currentSong?.id
  //   );

  //   if (currentPlaylistSong && isPlaying) {
  //     pause();
  //   } else {
  //     // 播放第一首可用歌曲
  //     const firstSong = playlist.songs.find((song) => song);
  //     if (firstSong) {
  //       play(firstSong);
  //     }
  //   }
  // }, [playlist, currentSong, isPlaying, play, pause]);

  // 处理歌曲点击
  const handleSongClick = useCallback(
    (song: Song) => {
      play(song);
    },
    [play]
  );

  // 处理播放全部
  const handlePlayAll = useCallback(async () => {
    if (!playlist.info || playlist.totalSongs === 0) return;

    try {
      setLoadingMore(true);

      // 首先尝试使用已加载的歌曲
      const loadedSongs = playlist.songs.filter(song => song);
      
      if (loadedSongs.length > 0) {
        // 如果已经有足够的歌曲，直接播放
        await playAllSongs(loadedSongs);
      } else {
        // 否则，获取完整歌单数据
        const fullPlaylist = await EnhancedPlaylistAPI.getPlaylistDetail({
          id: playlistId!,
        });
        
        if (fullPlaylist.songs.length > 0) {
          await playAllSongs(fullPlaylist.songs);
        }
      }
    } catch (error) {
      console.error("播放全部失败:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [playlist.info, playlist.totalSongs, playlist.songs, playlistId, playAllSongs]);

  // 处理随机播放
  const handleShufflePlay = useCallback(async () => {
    if (!playlist.info || playlist.totalSongs === 0) return;

    try {
      setLoadingMore(true);

      // 首先尝试使用已加载的歌曲
      const loadedSongs = playlist.songs.filter(song => song);
      
      let songsToShuffle;
      if (loadedSongs.length >= Math.min(50, playlist.totalSongs)) {
        // 如果已加载的歌曲足够多，直接使用
        songsToShuffle = loadedSongs;
      } else {
        // 否则，获取完整歌单数据
        const fullPlaylist = await EnhancedPlaylistAPI.getPlaylistDetail({
          id: playlistId!,
        });
        songsToShuffle = fullPlaylist.songs;
      }

      if (songsToShuffle.length > 0) {
        const shuffledSongs = [...songsToShuffle].sort(() => Math.random() - 0.5);
        await playAllSongs(shuffledSongs);
      }
    } catch (error) {
      console.error("随机播放失败:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [playlist.info, playlist.totalSongs, playlist.songs, playlistId, playAllSongs]);

  // 返回上一页
  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // 重试加载
  const handleRetry = useCallback(() => {
    loadPlaylistInfo();
  }, [loadPlaylistInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载歌单信息中...</p>
        </div>
      </div>
    );
  }

  if (error || !playlist.info) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-center mb-6">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            加载失败
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || "歌单加载失败，请检查网络连接"}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            返回
          </button>
          <button
            onClick={handleRetry}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重试</span>
          </button>
        </div>
      </div>
    );
  }

  const totalDuration = playlist.songs
    .filter((song) => song)
    .reduce((acc, song) => acc + song.duration, 0);

  return (
    <div className="h-screen flex flex-col">
      {/* 紧凑的头部区域 */}
      <div className="flex-shrink-0 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {/* 返回按钮和基本信息 */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            返回
          </button>
          
          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayAll}
              disabled={playlist.totalSongs === 0 || loadingMore}
              className={cn(
                "px-4 py-1.5 rounded-full font-medium transition-all flex items-center text-sm",
                playlist.totalSongs > 0 && !loadingMore
                  ? "bg-primary-500 hover:bg-primary-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <Play className="w-3 h-3 mr-1" />
              {loadingMore ? "加载中..." : "播放全部"}
            </button>

            <button
              onClick={handleShufflePlay}
              disabled={playlist.totalSongs === 0 || loadingMore}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-500 hover:text-primary-500 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
            >
              <Shuffle className="w-3 h-3 mr-1" />
              随机
            </button>
          </div>
        </div>

        {/* 歌单信息 - 水平布局 */}
        <div className="flex items-center gap-4">
          {/* 小封面 */}
          <div className="flex-shrink-0">
            <img
              src={playlist.info.coverUrl}
              alt={playlist.info.title}
              className="w-16 h-16 object-cover rounded-lg shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiA0OEM0MCAyNCA0OCAzMiA0MCAzMkM0MCA0MCAzMiA0OCAzMiA0OFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==";
              }}
            />
          </div>

          {/* 标题和基本信息 */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
              {playlist.info.title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{playlist.info.creator}</span>
              <span>{playlist.totalSongs} 首歌曲</span>
              <span>{Math.floor(totalDuration / 60000)} 分钟</span>
              {playlist.info.playCount && (
                <span>{formatPlayCount(playlist.info.playCount)} 播放</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 歌曲列表 - 使用剩余的全部空间 */}
      <div className="flex-1 overflow-hidden">
        <VirtualizedSongList
          songs={playlist.songs}
          totalCount={playlist.totalSongs}
          hasMore={playlist.hasMoreSongs}
          onLoadMore={handleLoadMore}
          onSongClick={handleSongClick}
          isLoading={loadingMore}
          height="100%"
          className="h-full"
        />
      </div>
    </div>
  );
};

export default EnhancedPlaylistDetailPage;
