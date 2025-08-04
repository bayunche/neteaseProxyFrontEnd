import { APIClient, API_ENDPOINTS, APIError, APIErrorType, logger } from './base';
import { PlaylistDetailResponse, Song, Playlist } from './types';
import { neteaseAPI } from './netease';

export interface PlaylistDetailRequest {
  id: string | number;
  s?: number;
}

export interface PaginatedSongsRequest {
  playlistId: string | number;
  offset?: number;
  limit?: number;
}

export interface PaginatedSongsResponse {
  songs: Song[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

/**
 * 增强版歌单API - 支持大型歌单的分页加载
 */
export class EnhancedPlaylistAPI {
  private static songCache = new Map<string, Song[]>();
  private static readonly DEFAULT_PAGE_SIZE = 50;
  private static readonly MAX_CACHE_SIZE = 10; // 最多缓存10个歌单的数据

  /**
   * 获取歌单基本信息（不包含歌曲列表）
   */
  static async getPlaylistInfo(request: PlaylistDetailRequest): Promise<Omit<Playlist, 'songs'>> {
    const { id, s = 10 } = request;
    
    if (!id) {
      throw new APIError(APIErrorType.INVALID_PARAMS, '歌单ID不能为空');
    }

    try {
      logger.info(`获取歌单基本信息: ${id}`);
      
      const response = await neteaseAPI.get<PlaylistDetailResponse>(
        API_ENDPOINTS.PLAYLIST_DETAIL,
        {
          id: String(id),
          s
        }
      );
      
      if (response.code === 200 && response.playlist) {
        const apiPlaylist = response.playlist;
        
        const playlist = {
          id: String(apiPlaylist.id),
          title: apiPlaylist.name,
          description: apiPlaylist.description || '',
          coverUrl: this.formatImageUrl(apiPlaylist.coverImgUrl),
          creator: apiPlaylist.creator?.nickname || '未知',
          isPublic: !apiPlaylist.privacy,
          createdAt: new Date(apiPlaylist.createTime),
          updatedAt: new Date(apiPlaylist.updateTime),
          trackCount: apiPlaylist.trackCount,
          playCount: apiPlaylist.playCount
        };

        logger.info(`获取歌单基本信息成功: "${playlist.title}", 共${playlist.trackCount}首歌曲`);
        return playlist;
      } else {
        throw new APIError(
          APIErrorType.SERVER_ERROR,
          response.message || '获取歌单信息失败'
        );
      }
    } catch (error) {
      logger.error('获取歌单基本信息失败', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        APIErrorType.NETWORK_ERROR,
        '获取歌单信息网络错误'
      );
    }
  }

  /**
   * 分页获取歌单中的歌曲
   */
  static async getPlaylistSongs(request: PaginatedSongsRequest): Promise<PaginatedSongsResponse> {
    const { playlistId, offset = 0, limit = this.DEFAULT_PAGE_SIZE } = request;
    
    if (!playlistId) {
      throw new APIError(APIErrorType.INVALID_PARAMS, '歌单ID不能为空');
    }

    const cacheKey = `${playlistId}_${offset}_${limit}`;
    
    // 检查缓存
    if (this.songCache.has(cacheKey)) {
      const cachedSongs = this.songCache.get(cacheKey)!;
      logger.info(`从缓存获取歌曲列表: ${playlistId}, offset: ${offset}, 共${cachedSongs.length}首`);
      
      return {
        songs: cachedSongs,
        total: cachedSongs.length, // 这里需要从歌单信息中获取总数
        hasMore: false, // 缓存的是完整页面，暂时设为false
        offset,
        limit
      };
    }

    try {
      logger.info(`分页获取歌单歌曲: ${playlistId}, offset: ${offset}, limit: ${limit}`);
      
      // 首先获取歌单基本信息，确定歌曲总数
      const playlistInfo = await this.getPlaylistInfo({ id: playlistId });
      const totalCount = playlistInfo.trackCount || 0;
      
      if (offset >= totalCount) {
        return {
          songs: [],
          total: totalCount,
          hasMore: false,
          offset,
          limit
        };
      }

      // 使用新的歌单全量歌曲接口
      const response = await neteaseAPI.get(
        API_ENDPOINTS.PLAYLIST_TRACK_ALL,
        {
          id: String(playlistId),
          offset,
          limit
        }
      );

      if (response.code === 200) {
        let songs: Song[] = [];
        
        if (response.songs && response.songs.length > 0) {
          songs = response.songs.map((track: any) => this.formatSong(track));
        }

        const hasMore = offset + limit < totalCount;
        
        // 缓存结果
        this.addToCache(cacheKey, songs);
        
        logger.info(`分页获取歌曲成功: ${songs.length}首, hasMore: ${hasMore}`);
        
        return {
          songs,
          total: totalCount,
          hasMore,
          offset,
          limit
        };
      } else {
        throw new APIError(
          APIErrorType.SERVER_ERROR,
          response.message || '获取歌曲列表失败'
        );
      }
    } catch (error) {
      logger.error('分页获取歌单歌曲失败', error);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        APIErrorType.NETWORK_ERROR,
        '获取歌曲列表网络错误'
      );
    }
  }

  /**
   * 获取完整歌单（带分页加载支持）
   */
  static async getPlaylistWithPagination(
    request: PlaylistDetailRequest,
    initialPageSize: number = this.DEFAULT_PAGE_SIZE
  ): Promise<Playlist & { hasMoreSongs: boolean }> {
    try {
      // 获取歌单基本信息
      const playlistInfo = await this.getPlaylistInfo(request);
      
      // 获取第一页歌曲
      const firstPage = await this.getPlaylistSongs({
        playlistId: request.id,
        offset: 0,
        limit: initialPageSize
      });

      const playlist: Playlist & { hasMoreSongs: boolean } = {
        ...playlistInfo,
        songs: firstPage.songs,
        hasMoreSongs: firstPage.hasMore
      };

      return playlist;
    } catch (error) {
      logger.error('获取分页歌单失败', error);
      throw error;
    }
  }

  /**
   * 预加载下一页歌曲
   */
  static async preloadNextPage(
    playlistId: string | number,
    currentOffset: number,
    pageSize: number = this.DEFAULT_PAGE_SIZE
  ): Promise<Song[]> {
    try {
      const nextPage = await this.getPlaylistSongs({
        playlistId,
        offset: currentOffset + pageSize,
        limit: pageSize
      });
      
      return nextPage.songs;
    } catch (error) {
      logger.warn('预加载下一页失败', error);
      return [];
    }
  }

  /**
   * 批量获取多页歌曲（用于播放全部等操作）
   */
  static async getAllSongs(
    playlistId: string | number,
    maxSongs: number = 1000
  ): Promise<Song[]> {
    const allSongs: Song[] = [];
    let offset = 0;
    const pageSize = 100; // 批量获取时使用较大的页面
    
    while (allSongs.length < maxSongs) {
      const page = await this.getPlaylistSongs({
        playlistId,
        offset,
        limit: Math.min(pageSize, maxSongs - allSongs.length)
      });
      
      allSongs.push(...page.songs);
      
      if (!page.hasMore || page.songs.length === 0) {
        break;
      }
      
      offset += pageSize;
    }
    
    logger.info(`批量获取歌曲完成: ${allSongs.length}首`);
    return allSongs;
  }

  /**
   * 缓存管理
   */
  private static addToCache(key: string, songs: Song[]): void {
    // 如果缓存超过限制，清除最旧的缓存
    if (this.songCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.songCache.keys().next().value;
      this.songCache.delete(firstKey);
    }
    
    this.songCache.set(key, songs);
  }

  /**
   * 清除缓存
   */
  static clearCache(playlistId?: string | number): void {
    if (playlistId) {
      // 清除特定歌单的缓存
      const keysToDelete = Array.from(this.songCache.keys())
        .filter(key => key.startsWith(String(playlistId)));
      keysToDelete.forEach(key => this.songCache.delete(key));
    } else {
      // 清除所有缓存
      this.songCache.clear();
    }
  }

  /**
   * 工具方法
   */
  private static formatImageUrl(url: string | undefined): string {
    if (!url) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y5NzMxNiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qbm90Rm91bmQ8L3RleHQ+PC9zdmc+';
    }
    return url.replace('http://', 'https://');
  }

  private static formatSong(track: any): Song {
    return {
      id: String(track.id),
      title: track.name,
      artist: track.ar?.[0]?.name || track.artists?.[0]?.name || '未知艺术家',
      album: track.al?.name || track.album?.name || '未知专辑',
      duration: track.dt || track.duration || 0,
      coverUrl: this.formatImageUrl(track.al?.picUrl || track.album?.picUrl),
      source: 'api' as const
    };
  }
}