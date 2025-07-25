import { neteaseAPI } from './NetEaseAPI';
import { API_ENDPOINTS, AUDIO_QUALITY } from './config';
import { getProxyUrl } from './proxy-config';
import type { 
  SongUrlRequest,
  SongUrlResponse,
  SongDetailRequest,
  SongDetailResponse,
  Song,
  APIResponse
} from './types';
import { logger, isSongPlayable } from './utils';

/**
 * 歌曲API服务类
 * 提供歌曲相关功能
 */
export class SongAPI {
  /**
   * 获取歌曲播放URL
   * @param id 歌曲ID
   * @param br 音质码率
   */
  static async getSongUrl(
    id: number,
    br: number = AUDIO_QUALITY.HIGH
  ): Promise<string | null> {
    if (!id || id <= 0) {
      throw new Error('歌曲ID无效');
    }

    logger.info(`获取歌曲播放URL: ${id}, 音质: ${br}`);

    try {
      const response = await neteaseAPI.get<SongUrlResponse['data']>(
        API_ENDPOINTS.SONG_URL,
        { id, br }
      );

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        logger.warn(`歌曲 ${id} 未找到播放URL`);
        return null;
      }

      const songData = response.data[0];
      
      // 检查歌曲是否可用
      if (songData.code !== 200) {
        logger.warn(`歌曲 ${id} 不可播放，错误码: ${songData.code}`);
        return null;
      }

      if (!songData.url) {
        logger.warn(`歌曲 ${id} 播放URL为空`);
        return null;
      }

      logger.info(`成功获取歌曲 ${id} 播放URL，音质: ${songData.br}`);
      
      // 转换为代理URL以解决CORS问题
      const proxiedUrl = this.convertToProxyUrl(songData.url);
      return proxiedUrl;

    } catch (error) {
      logger.error(`获取歌曲 ${id} 播放URL失败`, error);
      throw error;
    }
  }

  /**
   * 批量获取歌曲播放URL
   * @param ids 歌曲ID数组
   * @param br 音质码率
   */
  static async getBatchSongUrls(
    ids: number[],
    br: number = AUDIO_QUALITY.HIGH
  ): Promise<Record<number, string | null>> {
    if (!ids || ids.length === 0) {
      return {};
    }

    logger.info(`批量获取歌曲播放URL: [${ids.join(', ')}], 音质: ${br}`);

    const results: Record<number, string | null> = {};

    // 并发获取URLs，但限制并发数
    const concurrencyLimit = 5;
    const promises: Promise<void>[] = [];

    for (let i = 0; i < ids.length; i += concurrencyLimit) {
      const batch = ids.slice(i, i + concurrencyLimit);
      
      const batchPromise = Promise.all(
        batch.map(async (id) => {
          try {
            const url = await this.getSongUrl(id, br);
            results[id] = url;
          } catch (error) {
            logger.warn(`获取歌曲 ${id} URL失败`, error);
            results[id] = null;
          }
        })
      );

      promises.push(batchPromise);
    }

    await Promise.all(promises);
    return results;
  }

  /**
   * 获取不同音质的歌曲URL
   * @param id 歌曲ID
   */
  static async getSongUrlWithQualities(
    id: number
  ): Promise<Record<keyof typeof AUDIO_QUALITY, string | null>> {
    const qualities = Object.values(AUDIO_QUALITY);
    const results: Record<string, string | null> = {};

    const promises = qualities.map(async (quality) => {
      try {
        const url = await this.getSongUrl(id, quality);
        const qualityName = Object.keys(AUDIO_QUALITY).find(
          key => AUDIO_QUALITY[key as keyof typeof AUDIO_QUALITY] === quality
        );
        if (qualityName) {
          results[qualityName] = url;
        }
      } catch (error) {
        logger.warn(`获取歌曲 ${id} 音质 ${quality} 失败`, error);
      }
    });

    await Promise.all(promises);
    return results as Record<keyof typeof AUDIO_QUALITY, string | null>;
  }

  /**
   * 获取歌曲详情
   * @param ids 歌曲ID数组或逗号分隔的字符串
   */
  static async getSongDetail(
    ids: number[] | string
  ): Promise<Song[]> {
    const idsString = Array.isArray(ids) ? ids.join(',') : ids;

    if (!idsString) {
      throw new Error('歌曲ID不能为空');
    }

    logger.info(`获取歌曲详情: ${idsString}`);

    try {
      const response = await neteaseAPI.get<SongDetailResponse['data']>(
        API_ENDPOINTS.SONG_DETAIL,
        { ids: idsString }
      );

      if (!response.data || !response.data.songs) {
        logger.warn(`未找到歌曲详情: ${idsString}`);
        return [];
      }

      const songs = response.data.songs.map(this.formatSongDetail);
      logger.info(`成功获取 ${songs.length} 首歌曲详情`);
      
      return songs;

    } catch (error) {
      logger.error(`获取歌曲详情失败: ${idsString}`, error);
      throw error;
    }
  }

  /**
   * 获取单首歌曲详情
   * @param id 歌曲ID
   */
  static async getSingleSongDetail(id: number): Promise<Song | null> {
    const songs = await this.getSongDetail([id]);
    return songs.length > 0 ? songs[0] : null;
  }

  /**
   * 获取歌曲完整信息（详情 + 播放URL）
   * @param id 歌曲ID
   * @param br 音质码率
   */
  static async getFullSongInfo(
    id: number,
    br: number = AUDIO_QUALITY.HIGH
  ): Promise<(Song & { playUrl: string | null }) | null> {
    try {
      const [songDetail, playUrl] = await Promise.all([
        this.getSingleSongDetail(id),
        this.getSongUrl(id, br)
      ]);

      if (!songDetail) {
        return null;
      }

      return {
        ...songDetail,
        playUrl
      };

    } catch (error) {
      logger.error(`获取歌曲完整信息失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 批量获取歌曲完整信息
   * @param ids 歌曲ID数组
   * @param br 音质码率
   */
  static async getBatchFullSongInfo(
    ids: number[],
    br: number = AUDIO_QUALITY.HIGH
  ): Promise<Array<Song & { playUrl: string | null }>> {
    if (!ids || ids.length === 0) {
      return [];
    }

    try {
      const [songDetails, playUrls] = await Promise.all([
        this.getSongDetail(ids),
        this.getBatchSongUrls(ids, br)
      ]);

      return songDetails.map(song => ({
        ...song,
        playUrl: playUrls[song.id] || null
      }));

    } catch (error) {
      logger.error(`批量获取歌曲完整信息失败`, error);
      throw error;
    }
  }

  /**
   * 检查歌曲是否可播放
   * @param id 歌曲ID
   */
  static async checkSongPlayable(id: number): Promise<boolean> {
    try {
      const url = await this.getSongUrl(id);
      return url !== null;
    } catch (error) {
      logger.warn(`检查歌曲 ${id} 可播放性失败`, error);
      return false;
    }
  }

  /**
   * 获取歌曲歌词
   * @param id 歌曲ID
   */
  static async getSongLyric(id: number): Promise<string> {
    if (!id || id <= 0) {
      throw new Error('歌曲ID无效');
    }

    logger.info(`获取歌曲歌词: ${id}`);

    try {
      const response = await neteaseAPI.get<any>(
        API_ENDPOINTS.SONG_LYRIC,
        { id }
      );

      if (!response.data) {
        return '';
      }

      // 合并歌词和翻译歌词
      let lyric = response.data.lrc?.lyric || '';
      const tlyric = response.data.tlyric?.lyric || '';

      if (tlyric) {
        // 这里可以实现歌词和翻译的合并逻辑
        lyric += '\n\n' + tlyric;
      }

      return lyric;

    } catch (error) {
      logger.error(`获取歌曲 ${id} 歌词失败`, error);
      throw error;
    }
  }

  /**
   * 转换为代理URL以解决CORS问题
   * @param originalUrl 原始音频URL
   */
  private static convertToProxyUrl(originalUrl: string): string {
    if (!originalUrl) return originalUrl;
    
    try {
      // 使用统一的代理配置
      const proxyUrl = getProxyUrl(originalUrl);
      logger.info(`转换代理URL: ${originalUrl} -> ${proxyUrl}`);
      return proxyUrl;
    } catch (error) {
      logger.warn('URL转换失败，返回原始URL', error);
      return originalUrl;
    }
  }

  /**
   * 格式化歌曲详情数据
   */
  private static formatSongDetail(rawSong: any): Song {
    return {
      id: rawSong.id,
      name: rawSong.name,
      artists: rawSong.ar?.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        picUrl: artist.picUrl,
        alias: artist.alias
      })) || [],
      album: {
        id: rawSong.al?.id,
        name: rawSong.al?.name,
        picUrl: rawSong.al?.picUrl,
        publishTime: rawSong.al?.publishTime
      },
      duration: rawSong.dt || 0,
      picUrl: rawSong.al?.picUrl,
      fee: rawSong.fee,
      mvid: rawSong.mv
    };
  }
}