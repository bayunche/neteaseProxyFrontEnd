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

    logger.info(`获取歌单详情: id=${id}, s=${s}`);

    try {
      const response = await neteaseAPI.get<PlaylistDetailResponse>(
        API_ENDPOINTS.PLAYLIST_DETAIL,
        {
          id: String(id),
          s
        }
      );

      if (response.code === 200 && response.playlist) {
        const apiPlaylist = response.playlist;

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

    logger.info(`获取歌曲详情: ${ids.length}首`);

    try {
      const response = await neteaseAPI.get<SongDetailResponse>(
        API_ENDPOINTS.SONG_DETAIL,
        {
          ids: ids.join(',')
        }
      );

      if (response.code === 200 && response.songs) {
        const songs = response.songs.map((song: ApiTrack) => this.formatSong(song));
        logger.info(`获取歌曲详情成功: ${songs.length}首`);
        return songs;
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
  }

  /**
   * 格式化歌曲数据
   */
  private static formatSong(rawSong: ApiTrack): Song {
    const artists = rawSong.artists?.map((artist: ApiArtist) => ({
      id: artist.id,
      name: artist.name,
      picUrl: artist.picUrl || artist.img1v1Url,
      alias: artist.alias || []
    })) || rawSong.ar?.map((artist: ApiArtist) => ({
      id: artist.id,
      name: artist.name,
      picUrl: artist.picUrl || artist.img1v1Url,
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
}