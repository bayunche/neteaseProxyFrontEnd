import { neteaseAPI } from './NetEaseAPI';
import { API_ENDPOINTS } from './config';
import type {
  LyricRequest,
  LyricResponse,
  LyricLine
} from './types';
import { APIError, APIErrorType } from './types';
import { logger } from './utils';
import type { Lyrics } from '../../types';

/**
 * 歌词API服务类
 * 提供歌词相关功能
 */
export class LyricAPI {
  /**
   * 获取歌词
   * @param id 歌曲id
   */
  static async getLyric(request: LyricRequest): Promise<Lyrics | null> {
    const { id } = request;

    if (!id) {
      throw new APIError(
        APIErrorType.VALIDATION_ERROR,
        '歌曲ID不能为空'
      );
    }

    logger.info(`获取歌词: id=${id}`);

    try {
      const response = await neteaseAPI.get<LyricResponse>(
        API_ENDPOINTS.SONG_LYRIC,
        {
          id: String(id)
        }
      );

      if (response.code === 200) {
        // 解析歌词
        const lyricData = response.data || response;
        const lyrics = this.parseLyric(lyricData as LyricResponse);

        if (lyrics && lyrics.length > 0) {
          logger.info(`获取歌词成功: ${lyrics.length}行`);
          return {
            songId: String(id),
            lines: lyrics,
            offset: 0
          };
        } else {
          logger.info('歌曲无歌词');
          return null;
        }
      } else {
        throw new APIError(
          APIErrorType.SERVER_ERROR,
          response.message || '获取歌词失败'
        );
      }
    } catch (error) {
      logger.error('获取歌词失败', error);

      if (error instanceof APIError) {
        throw error;
      }

      throw new APIError(
        APIErrorType.NETWORK_ERROR,
        '获取歌词网络错误'
      );
    }
  }

  /**
   * 解析歌词文本，支持原文和翻译歌词合并
   * @param response 歌词响应数据
   */
  private static parseLyric(response: LyricResponse): LyricLine[] | null {
    const originalLyric = response.lrc?.lyric;
    const translatedLyric = response.tlyric?.lyric;

    if (!originalLyric) {
      return null;
    }

    // 解析原文歌词
    const originalLines = this.parseRawLyric(originalLyric);
    if (!originalLines || originalLines.length === 0) {
      return null;
    }

    // 如果没有翻译歌词，直接返回原文
    if (!translatedLyric) {
      return originalLines;
    }

    // 解析翻译歌词
    const translatedLines = this.parseRawLyric(translatedLyric);
    if (!translatedLines || translatedLines.length === 0) {
      return originalLines;
    }

    // 创建翻译映射
    const translationMap = new Map<number, string>();
    translatedLines.forEach(line => {
      translationMap.set(line.time, line.text);
    });

    // 合并原文和翻译
    const mergedLines: LyricLine[] = originalLines.map(line => ({
      time: line.time,
      text: line.text,
      translation: translationMap.get(line.time)
    }));

    return mergedLines;
  }

  /**
   * 解析原始歌词文本
   * @param lyricText 原始歌词文本
   */
  private static parseRawLyric(lyricText: string): { time: number; text: string }[] {
    const lines: { time: number; text: string }[] = [];
    const lyricLines = lyricText.split('\n');

    for (const line of lyricLines) {
      // 匹配时间戳格式 [mm:ss.xxx] 或 [mm:ss]
      const timeMatch = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/);

      if (timeMatch) {
        const minutes = parseInt(timeMatch[1], 10);
        const seconds = parseInt(timeMatch[2], 10);
        const milliseconds = timeMatch[3] ? parseInt(timeMatch[3].padEnd(3, '0'), 10) : 0;

        // 计算时间（毫秒）
        const time = minutes * 60 * 1000 + seconds * 1000 + milliseconds;

        // 提取歌词文本
        const text = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();

        // 过滤空行和纯时间戳行
        if (text && text.length > 0) {
          lines.push({
            time,
            text
          });
        }
      }
    }

    // 按时间排序
    lines.sort((a, b) => a.time - b.time);

    return lines;
  }

  /**
   * 格式化时间为歌词时间格式
   * @param time 时间（毫秒）
   */
  static formatLyricTime(time: number): string {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }

  /**
   * 根据当前播放时间查找当前歌词行
   * @param lyrics 歌词数据
   * @param currentTime 当前播放时间（毫秒）
   */
  static getCurrentLyricLine(lyrics: Lyrics, currentTime: number): number {
    if (!lyrics.lines.length) return -1;

    for (let i = lyrics.lines.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics.lines[i].time) {
        return i;
      }
    }

    return -1;
  }
}