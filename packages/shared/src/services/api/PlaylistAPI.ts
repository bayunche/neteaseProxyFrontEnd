import { neteaseAPI } from './NetEaseAPI';
import { API_ENDPOINTS } from './config';
import { getImageProxyUrl } from './proxy-config';
import type {
  PlaylistDetailRequest,
  PlaylistDetailResponse,
  SongDetailResponse,
  ApiTrack,
  ApiArtist,
  ApiAlbum
} from './types';
import { APIError, APIErrorType } from './types';
import { logger } from './utils';
import type { Song, Album, Artist, Playlist } from '../../types';

/**
 * 歌单API服务类
 * 提供歌单相关功能
 */
export class PlaylistAPI {
  // 歌单详情缓存
  private static playlistCache = new Map<string, {
    data: Playlist;
    timestamp: number;
    songsLoaded: boolean; // 标记是否已加载完整歌曲列表
  }>();
  
  // 歌曲详情缓存（用于批量获取的歌曲）
  private static songCache = new Map<number, {
    data: Song;
    timestamp: number;
  }>();
  
  private static CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存
  private static MAX_CACHE_SIZE = 50; // 最多缓存50个歌单
  private static MAX_SONG_CACHE_SIZE = 5000; // 最多缓存5000首歌曲
  /**
   * 获取歌单详情
   * 说明: 1000首以下有歌曲详情,1000首以上须调用/api/song/detail
   * @param id 歌单id（必选）
   * @param s 最近的收藏者数量,默认为10（可选）
   */
  static async getPlaylistDetail(request: PlaylistDetailRequest): Promise<Playlist> {
    const { id, s = 10 } = request;

    if (!id) {
      throw new APIError(
        APIErrorType.VALIDATION_ERROR,
        '歌单ID不能为空'
      );
    }

    // 检查缓存
    const cacheKey = String(id);
    const cached = this.playlistCache.get(cacheKey);
    if (cached) {
      const now = Date.now();
      const age = now - cached.timestamp;
      
      if (age < this.CACHE_DURATION) {
        logger.info(`使用缓存的歌单详情 [${id}] (缓存年龄: ${Math.round(age / 1000)}秒)`);
        return cached.data;
      } else {
        // 缓存过期，删除
        this.playlistCache.delete(cacheKey);
      }
    }

    logger.info(`获取歌单详情: id=${id}, s=${s}`);

    try {
      const response = await neteaseAPI.get<PlaylistDetailResponse>(
        API_ENDPOINTS.PLAYLIST_DETAIL,
        {
          id: String(id),
          s
        }
      );

      if (response.code === 200 && (response as any).playlist) {
        const apiPlaylist = (response as any).playlist;

        // 处理歌曲列表
        let songs: Song[] = [];

        if (apiPlaylist.tracks && apiPlaylist.tracks.length > 0) {
          // 歌单在1000首以下，直接有歌曲详情
          songs = apiPlaylist.tracks.map((track: ApiTrack) => this.formatSong(track));
          logger.info(`歌单包含歌曲详情: ${songs.length}首`);
        } else if (apiPlaylist.trackIds && apiPlaylist.trackIds.length > 0) {
          // 歌单超过1000首，需要调用歌曲详情接口
          const trackIds = apiPlaylist.trackIds.slice(0, 1000).map((item: { id: number }) => item.id);
          logger.info(`歌单超过1000首，获取前1000首歌曲详情: ${trackIds.length}首`);

          try {
            const songDetails = await this.getSongDetails(trackIds);
            songs = songDetails;
          } catch (error) {
            logger.warn('获取歌曲详情失败，使用空列表', error);
            songs = [];
          }
        }

        // 转换为本地Playlist格式
        const playlist: Playlist = {
          id: String(apiPlaylist.id),
          title: apiPlaylist.name,
          description: apiPlaylist.description || '',
          coverUrl: this.formatImageUrl(apiPlaylist.coverImgUrl),
          creator: apiPlaylist.creator?.nickname || '未知',
          songs,
          isPublic: !apiPlaylist.privacy,
          createdAt: new Date(apiPlaylist.createTime),
          updatedAt: new Date(apiPlaylist.updateTime),
          trackCount: apiPlaylist.trackCount,
          playCount: apiPlaylist.playCount
        };

        logger.info(`获取歌单详情成功: "${playlist.title}", ${playlist.songs.length}首歌曲`);
        
        // 保存到缓存
        this.saveToCache(cacheKey, playlist, songs.length > 0);
        
        return playlist;
      } else {
        throw new APIError(
          APIErrorType.SERVER_ERROR,
          response.message || '获取歌单详情失败'
        );
      }
    } catch (error) {
      logger.error('获取歌单详情失败', error);

      if (error instanceof APIError) {
        throw error;
      }

      throw new APIError(
        APIErrorType.NETWORK_ERROR,
        '获取歌单详情网络错误'
      );
    }
  }

  /**
   * 获取歌曲详情列表（用于超过1000首的歌单）
   * @param ids 歌曲ID数组
   */
  static async getSongDetails(ids: number[]): Promise<Song[]> {
    if (!ids || ids.length === 0) {
      return [];
    }

    // 从缓存获取已有的歌曲
    const cachedSongs = this.getSongsFromCache(ids);
    const cachedIds = new Set(cachedSongs.map(song => Number(song.id)));
    const missingIds = ids.filter(id => !cachedIds.has(id));

    let allSongs = [...cachedSongs];

    // 只请求缺失的歌曲
    if (missingIds.length > 0) {
      logger.info(`获取歌曲详情: ${missingIds.length}首 (${cachedSongs.length}首来自缓存)`);

      try {
        const response = await neteaseAPI.get<SongDetailResponse>(
          API_ENDPOINTS.SONG_DETAIL,
          {
            ids: missingIds.join(',')
          }
        );

        if (response.code === 200 && (response as any).songs) {
          const newSongs = ((response as any).songs || []).map((song: ApiTrack) => this.formatSong(song));
          
          // 缓存新获取的歌曲
          this.cacheSongs(newSongs);
          
          allSongs.push(...newSongs);
          logger.info(`获取歌曲详情成功: ${newSongs.length}首新歌曲`);
        } else {
          throw new APIError(
            APIErrorType.SERVER_ERROR,
            response.message || '获取歌曲详情失败'
          );
        }
      } catch (error) {
        logger.error('获取歌曲详情失败', error);

        if (error instanceof APIError) {
          throw error;
        }

        throw new APIError(
          APIErrorType.NETWORK_ERROR,
          '获取歌曲详情网络错误'
        );
      }
    } else {
      logger.info(`所有 ${ids.length} 首歌曲都来自缓存`);
    }

    // 按原始ids顺序返回歌曲
    const songMap = new Map(allSongs.map(song => [Number(song.id), song]));
    return ids.map(id => songMap.get(id)).filter(Boolean) as Song[];
  }

  /**
   * 格式化歌曲数据
   */
  private static formatSong(rawSong: ApiTrack): Song {
    const artists = rawSong.artists?.map((artist: ApiArtist) => ({
      id: artist.id,
      name: artist.name,
      picUrl: this.formatImageUrl(artist.picUrl || artist.img1v1Url || ''),
      alias: artist.alias || []
    })) || rawSong.ar?.map((artist: ApiArtist) => ({
      id: artist.id,
      name: artist.name,
      picUrl: this.formatImageUrl(artist.picUrl || artist.img1v1Url || ''),
      alias: artist.alias || []
    })) || [];

    return {
      id: String(rawSong.id),
      title: rawSong.name || '',
      name: rawSong.name || '', // API字段
      artist: artists.map((a: { name: string }) => a.name).join(', ') || '未知艺术家',
      artists: artists,
      album: rawSong.album?.name || rawSong.al?.name || '未知专辑',
      duration: rawSong.duration || rawSong.dt || 0,
      coverUrl: this.formatImageUrl(
        rawSong.album?.picUrl ||
        rawSong.al?.picUrl ||
        `https://p1.music.126.net/${rawSong.album?.picId || rawSong.al?.picId}/${rawSong.album?.picId || rawSong.al?.picId}.jpg`
      ),
      picUrl: this.formatImageUrl(
        rawSong.album?.picUrl ||
        rawSong.al?.picUrl ||
        `https://p1.music.126.net/${rawSong.album?.picId || rawSong.al?.picId}/${rawSong.album?.picId || rawSong.al?.picId}.jpg`
      ),
      audioUrl: '', // 播放URL需要单独获取
      source: 'api' as const,
      fee: rawSong.fee,
      mvid: rawSong.mvid || rawSong.mv
    };
  }

  /**
   * 格式化专辑数据
   */
  private static formatAlbum(rawAlbum: ApiAlbum | null): Album {
    if (!rawAlbum) {
      return {
        id: '',
        title: '未知专辑',
        artist: '未知艺术家',
        coverUrl: '',
        releaseDate: new Date(),
        songs: [],
        source: 'api' as const
      };
    }

    return {
      id: String(rawAlbum.id || ''),
      title: rawAlbum.name || '未知专辑',
      artist: '未知艺术家',
      coverUrl: this.formatImageUrl(rawAlbum.picUrl || `https://p1.music.126.net/${rawAlbum.picId}/${rawAlbum.picId}.jpg`),
      releaseDate: new Date(rawAlbum.publishTime),
      songs: [],
      source: 'api' as const
    };
  }

  /**
   * 格式化艺术家数据
   */
  private static formatArtist(rawArtist: ApiArtist | null): Artist {
    if (!rawArtist) {
      return {
        id: '',
        name: '未知艺术家',
        avatarUrl: '',
        description: '',
        albums: [],
        topSongs: [],
        source: 'api' as const
      };
    }

    return {
      id: String(rawArtist.id || ''),
      name: rawArtist.name || '未知艺术家',
      avatarUrl: this.formatImageUrl(rawArtist.picUrl || rawArtist.img1v1Url || ''),
      description: '',
      albums: [],
      topSongs: [],
      source: 'api' as const
    };
  }

  /**
   * 格式化图片URL，通过代理服务器
   */
  private static formatImageUrl(imageUrl: string): string {
    if (!imageUrl) return imageUrl;
    return getImageProxyUrl(imageUrl);
  }

  /**
   * 保存歌单到缓存
   */
  private static saveToCache(key: string, playlist: Playlist, songsLoaded: boolean): void {
    // 检查缓存大小，如果超过限制，删除最老的缓存
    if (this.playlistCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.findOldestCacheKey();
      if (oldestKey) {
        this.playlistCache.delete(oldestKey);
        logger.info(`缓存已满，删除最老的歌单缓存 [${oldestKey}]`);
      }
    }

    this.playlistCache.set(key, {
      data: playlist,
      timestamp: Date.now(),
      songsLoaded
    });

    // 缓存歌曲数据
    if (songsLoaded && playlist.songs) {
      this.cacheSongs(playlist.songs);
    }

    logger.info(`已缓存歌单 [${key}]: ${playlist.title}, ${playlist.songs.length}首歌曲`);
  }

  /**
   * 缓存歌曲列表
   */
  private static cacheSongs(songs: Song[]): void {
    // 清理过期的歌曲缓存
    this.cleanExpiredSongCache();

    const now = Date.now();
    let cachedCount = 0;

    for (const song of songs) {
      // 检查歌曲缓存大小
      if (this.songCache.size >= this.MAX_SONG_CACHE_SIZE) {
        break; // 达到缓存上限，停止缓存
      }

      const songId = Number(song.id);
      if (!this.songCache.has(songId)) {
        this.songCache.set(songId, {
          data: song,
          timestamp: now
        });
        cachedCount++;
      }
    }

    if (cachedCount > 0) {
      logger.info(`缓存了 ${cachedCount} 首新歌曲，当前歌曲缓存总数: ${this.songCache.size}`);
    }
  }

  /**
   * 从歌曲缓存获取歌曲
   */
  private static getSongsFromCache(songIds: number[]): Song[] {
    const now = Date.now();
    const cachedSongs: Song[] = [];
    const missingIds: number[] = [];

    for (const id of songIds) {
      const cached = this.songCache.get(id);
      if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
        cachedSongs.push(cached.data);
      } else {
        missingIds.push(id);
        if (cached) {
          this.songCache.delete(id); // 删除过期缓存
        }
      }
    }

    if (cachedSongs.length > 0) {
      logger.info(`从缓存获取了 ${cachedSongs.length} 首歌曲，还需获取 ${missingIds.length} 首`);
    }

    return cachedSongs;
  }

  /**
   * 清理过期的歌曲缓存
   */
  private static cleanExpiredSongCache(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [id, cached] of this.songCache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.songCache.delete(id);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info(`清理了 ${deletedCount} 个过期的歌曲缓存`);
    }
  }

  /**
   * 找到最老的缓存键
   */
  private static findOldestCacheKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.playlistCache.entries()) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * 清除所有缓存
   */
  static clearAllCache(): void {
    const playlistCount = this.playlistCache.size;
    const songCount = this.songCache.size;
    
    this.playlistCache.clear();
    this.songCache.clear();
    
    logger.info(`已清除所有缓存: ${playlistCount} 个歌单, ${songCount} 首歌曲`);
  }

  /**
   * 获取缓存统计信息
   */
  static getCacheStats(): {
    playlistCount: number;
    songCount: number;
    totalSize: number;
  } {
    return {
      playlistCount: this.playlistCache.size,
      songCount: this.songCache.size,
      totalSize: this.playlistCache.size + this.songCache.size
    };
  }
}