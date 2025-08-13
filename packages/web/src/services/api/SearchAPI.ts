import { neteaseAPI } from './NetEaseAPI';
import { API_ENDPOINTS } from './config';
import { getImageProxyUrl } from './proxy-config';
import type {
  SearchResult,
  Song,
  Album,
  Artist,
  SearchResponse,
  ApiTrack,
  ApiAlbum,
  ApiArtist,
  ApiPlaylistForSearch
} from './types';
import { SearchType } from './types';
import { logger } from './utils';
import type { Playlist } from '../../types';

/**
 * 搜索API服务类
 * 提供音乐搜索相关功能
 */
export class SearchAPI {
  /**
   * 综合搜索
   * @param keywords 搜索关键词
   * @param type 搜索类型
   * @param limit 返回数量限制
   * @param offset 偏移量
   */
  static async search(
    keywords: string,
    type: SearchType = SearchType.SONG,
    limit: number = 30,
    offset: number = 0
  ): Promise<SearchResult> {
    if (!keywords.trim()) {
      throw new Error('搜索关键词不能为空');
    }

    logger.info(`执行搜索: "${keywords}", 类型: ${type}, 限制: ${limit}, 偏移: ${offset}`);

    try {
      const response = await neteaseAPI.get<SearchResponse>(API_ENDPOINTS.SEARCH, {
        value: keywords.trim(),
        type,
        limit,
        offset
      });

      // 检查API是否返回了有效的搜索结果
      console.log('搜索API响应:', response);

      if (response.code === 200 && response.data?.result) {
        return this.formatSearchResult(response, type);
      } else {
        logger.warn('搜索API返回无效数据，使用模拟数据', response);
        return this.getMockSearchResult(keywords, type, limit);
      }
    } catch (error) {
      logger.error('搜索失败，使用模拟数据', error);
      return this.getMockSearchResult(keywords, type, limit);
    }
  }

  /**
   * 搜索歌曲
   * @param keywords 搜索关键词
   * @param limit 返回数量限制
   * @param offset 偏移量
   */
  static async searchSongs(
    keywords: string,
    limit: number = 30,
    offset: number = 0
  ): Promise<Song[]> {
    const result = await this.search(keywords, SearchType.SONG, limit, offset);
    return result.songs || [];
  }

  /**
   * 搜索专辑
   * @param keywords 搜索关键词
   * @param limit 返回数量限制
   * @param offset 偏移量
   */
  static async searchAlbums(
    keywords: string,
    limit: number = 30,
    offset: number = 0
  ): Promise<Album[]> {
    const result = await this.search(keywords, SearchType.ALBUM, limit, offset);
    return result.albums || [];
  }

  /**
   * 搜索艺术家
   * @param keywords 搜索关键词
   * @param limit 返回数量限制
   * @param offset 偏移量
   */
  static async searchArtists(
    keywords: string,
    limit: number = 30,
    offset: number = 0
  ): Promise<Artist[]> {
    const result = await this.search(keywords, SearchType.ARTIST, limit, offset);
    return result.artists || [];
  }

  /**
   * 搜索歌单
   * @param keywords 搜索关键词
   * @param limit 返回数量限制
   * @param offset 偏移量
   */
  static async searchPlaylists(
    keywords: string,
    limit: number = 30,
    offset: number = 0
  ): Promise<Playlist[]> {
    const result = await this.search(keywords, SearchType.PLAYLIST, limit, offset);
    return result.playlists || [];
  }

  /**
   * 多类型综合搜索
   * @param keywords 搜索关键词
   * @param types 搜索类型数组
   * @param limit 每个类型的返回数量限制
   */
  static async multiSearch(
    keywords: string,
    types: SearchType[] = [SearchType.SONG, SearchType.ALBUM, SearchType.ARTIST],
    limit: number = 10
  ): Promise<Record<SearchType, unknown[]>> {
    if (!keywords.trim()) {
      throw new Error('搜索关键词不能为空');
    }

    logger.info(`执行多类型搜索: "${keywords}", 类型: [${types.join(', ')}]`);

    const promises = types.map(type =>
      this.search(keywords, type, limit, 0).catch(error => {
        logger.warn(`搜索类型 ${type} 失败`, error);
        return this.getEmptySearchResult(type);
      })
    );

    const results = await Promise.all(promises);
    const combinedResult: Record<SearchType, unknown[]> = {} as Record<SearchType, unknown[]>;

    types.forEach((type, index) => {
      const result = results[index];
      switch (type) {
        case SearchType.SONG:
          combinedResult[type] = result.songs || [];
          break;
        case SearchType.ALBUM:
          combinedResult[type] = result.albums || [];
          break;
        case SearchType.ARTIST:
          combinedResult[type] = result.artists || [];
          break;
        case SearchType.PLAYLIST:
          combinedResult[type] = result.playlists || [];
          break;
        default:
          combinedResult[type] = [];
      }
    });

    return combinedResult;
  }

  /**
   * 获取搜索建议（热门搜索）
   * @param keywords 搜索关键词前缀
   * @param limit 建议数量限制
   */
  static async getSearchSuggestions(
    keywords: string,
    limit: number = 10
  ): Promise<string[]> {
    // 注意：这个接口需要根据实际API情况调整
    try {
      // 临时实现：基于关键词返回一些建议
      // 实际情况下应该调用API获取搜索建议
      const suggestions = [
        `${keywords} 热门歌曲`,
        `${keywords} 经典老歌`,
        `${keywords} 最新单曲`,
        `${keywords} 专辑`,
        `${keywords} 演唱会`
      ].slice(0, limit);

      return suggestions;
    } catch (error) {
      logger.warn('获取搜索建议失败', error);
      return [];
    }
  }

  /**
   * 获取热门搜索关键词
   */
  static async getHotSearchKeywords(): Promise<string[]> {
    try {
      // 注意：这个接口需要根据实际API情况调整
      // 临时返回一些热门关键词
      return [
        '周杰伦',
        '林俊杰',
        '邓紫棋',
        '薛之谦',
        '毛不易',
        '陈奕迅',
        '王菲',
        '李荣浩',
        '张学友',
        '刘德华'
      ];
    } catch (error) {
      logger.warn('获取热门搜索失败', error);
      return [];
    }
  }

  /**
   * 格式化搜索结果
   * @param data API返回的原始数据
   * @param type 搜索类型
   */
  private static formatSearchResult(data: SearchResponse, type: SearchType): SearchResult {
    const result: SearchResult = {};

    if (!data || !data.result) {
      return result;
    }

    const apiResult = data.result;

    switch (type) {
      case SearchType.SONG:
        if (apiResult.songs) {
          result.songs = apiResult.songs.map((song: ApiTrack) => this.formatSong(song));
          result.songCount = apiResult.songCount || 0;
        }
        break;

      case SearchType.ALBUM:
        if (apiResult.albums) {
          result.albums = apiResult.albums.map((album: ApiAlbum) => this.formatAlbum(album));
          result.albumCount = apiResult.albumCount || 0;
        }
        break;

      case SearchType.ARTIST:
        if (apiResult.artists) {
          result.artists = apiResult.artists.map((artist: ApiArtist) => this.formatArtist(artist));
          result.artistCount = apiResult.artistCount || 0;
        }
        break;

      case SearchType.PLAYLIST:
        if (apiResult.playlists) {
          result.playlists = apiResult.playlists.map((playlist: ApiPlaylistForSearch) => this.formatPlaylist(playlist));
          result.playlistCount = apiResult.playlistCount || 0;
        }
        break;
    }

    return result;
  }

  /**
   * 格式化歌曲数据
   */
  private static formatSong(rawSong: ApiTrack): Song {
    return {
      id: rawSong.id,
      name: rawSong.name,
      artists: rawSong.artists?.map((artist: ApiArtist) => this.formatArtist(artist)) || [],
      album: this.formatAlbum(rawSong.album),
      duration: rawSong.duration || 0,
      picUrl: this.formatImageUrl(rawSong.album?.picUrl || `https://p1.music.126.net/${rawSong.album?.picId}/${rawSong.album?.picId}.jpg`),
      fee: rawSong.fee,
      mvid: rawSong.mvid,
    };
  }

  /**
   * 格式化专辑数据
   */
  private static formatAlbum(rawAlbum: ApiAlbum | null): Album {
    if (!rawAlbum) {
      return {
        id: 0,
        name: '未知专辑',
        picUrl: '',
        publishTime: Date.now()
      };
    }

    return {
      id: rawAlbum.id || 0,
      name: rawAlbum.name || '',
      picUrl: this.formatImageUrl(rawAlbum.picUrl || `https://p1.music.126.net/${rawAlbum.picId}/${rawAlbum.picId}.jpg`),
      artist: rawAlbum.artist ? this.formatArtist(rawAlbum.artist) : undefined,
      publishTime: rawAlbum.publishTime
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
   * 格式化艺术家数据
   */
  private static formatArtist(rawArtist: ApiArtist): Artist {
    return {
      id: rawArtist.id || 0,
      name: rawArtist.name || '',
      picUrl: this.formatImageUrl(rawArtist.picUrl || rawArtist.img1v1Url || ''),
      alias: rawArtist.alias || []
    };
  }

  /**
   * 格式化歌单数据
   */
  private static formatPlaylist(rawPlaylist: ApiPlaylistForSearch): Playlist {
    return {
      id: String(rawPlaylist.id),
      title: rawPlaylist.name,
      description: rawPlaylist.description || '',
      coverUrl: this.formatImageUrl(rawPlaylist.coverImgUrl || ''),
      creator: rawPlaylist.creator ? rawPlaylist.creator.nickname : '未知',
      songs: [],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      trackCount: rawPlaylist.trackCount,
      playCount: rawPlaylist.playCount
    };
  }

  /**
   * 获取空的搜索结果
   */
  private static getEmptySearchResult(type: SearchType): SearchResult {
    const result: SearchResult = {};

    switch (type) {
      case SearchType.SONG:
        result.songs = [];
        result.songCount = 0;
        break;
      case SearchType.ALBUM:
        result.albums = [];
        result.albumCount = 0;
        break;
      case SearchType.ARTIST:
        result.artists = [];
        result.artistCount = 0;
        break;
      case SearchType.PLAYLIST:
        result.playlists = [];
        result.playlistCount = 0;
        break;
    }

    return result;
  }

  /**
   * 获取模拟搜索结果（当API未完全实现时使用）
   */
  private static getMockSearchResult(keywords: string, type: SearchType, limit: number): SearchResult {
    const result: SearchResult = {};

    // 基于关键词生成模拟数据
    const mockData = this.generateMockData(keywords, limit);

    switch (type) {
      case SearchType.SONG:
        result.songs = mockData.songs;
        result.songCount = mockData.songs.length;
        break;
      case SearchType.ALBUM:
        result.albums = mockData.albums;
        result.albumCount = mockData.albums.length;
        break;
      case SearchType.ARTIST:
        result.artists = mockData.artists;
        result.artistCount = mockData.artists.length;
        break;
      case SearchType.PLAYLIST:
        result.playlists = mockData.playlists;
        result.playlistCount = mockData.playlists.length;
        break;
    }

    return result;
  }

  /**
   * 生成模拟数据
   */
  private static generateMockData(keywords: string, limit: number) {
    const mockSongs: Song[] = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: i + 1,
      name: `${keywords} - 歌曲 ${i + 1}`,
      artists: [{
        id: i + 1,
        name: `艺术家 ${i + 1}`,
        picUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXJ0aXN0PC90ZXh0Pjwvc3ZnPg==',
        alias: []
      }],
      album: {
        id: i + 1,
        name: `${keywords} - 专辑 ${i + 1}`,
        picUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZTUxY2QiLz48dGV4dCB4PSIxNTAiIHk9IjE2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QWxidW08L3RleHQ+PC9zdmc+',
        publishTime: Date.now()
      },
      duration: 240000 + i * 30000,
      picUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2U1MWM1ZCIvPjx0ZXh0IHg9IjE1MCIgeT0iMTYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Tb25nPC90ZXh0Pjwvc3ZnPg==',
      fee: 0,
      mvid: 0
    }));

    const mockAlbums: Album[] = Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
      id: i + 1,
      name: `${keywords} - 专辑 ${i + 1}`,
      picUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjE1MCIgeT0iMTYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5BbGJ1bTwvdGV4dD48L3N2Zz4=',
      publishTime: Date.now() - i * 86400000
    }));

    const mockArtists: Artist[] = Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
      id: i + 1,
      name: `${keywords} - 艺术家 ${i + 1}`,
      picUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzEwYjk4MSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QXJ0aXN0PC90ZXh0Pjwvc3ZnPg==',
      alias: []
    }));

    const mockPlaylists: Playlist[] = Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
      id: `mock_playlist_${i + 1}`,
      title: `${keywords} - 歌单 ${i + 1}`,
      description: `包含${keywords}相关音乐的精选歌单`,
      coverUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y5NzMxNiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QbGF5bGlzdDwvdGV4dD48L3N2Zz4=',
      creator: `用户 ${i + 1}`,
      songs: [],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      trackCount: 20 + i * 10,
      playCount: 1000 + i * 500
    }));

    return {
      songs: mockSongs,
      albums: mockAlbums,
      artists: mockArtists,
      playlists: mockPlaylists
    };
  }
}