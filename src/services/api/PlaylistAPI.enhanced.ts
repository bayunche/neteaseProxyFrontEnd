import { PlaylistAPI } from './PlaylistAPI';
import { logger } from './utils';
import type { PlaylistDetailRequest } from './types';
import type { Playlist } from '../../types';

/**
 * 增强版歌单API - 支持分页和更多功能
 */
export class EnhancedPlaylistAPI extends PlaylistAPI {
    /**
     * 获取歌单详情（支持分页）
     * @param request 歌单请求参数
     * @param limit 每页歌曲数量，默认100
     * @param offset 偏移量，默认0
     */
    static async getPlaylistWithPagination(
        request: PlaylistDetailRequest,
        limit: number = 100,
        offset: number = 0
    ): Promise<Playlist & { trackCount: number }> {
        const { id } = request;

        if (!id) {
            throw new Error('歌单ID不能为空');
        }

        logger.info(`获取增强歌单详情: id=${id}, limit=${limit}, offset=${offset}`);

        try {
            // 首先获取基本的歌单信息
            const basePlaylist = await super.getPlaylistDetail(request);

            // 如果歌单歌曲数量较少，直接返回
            if (basePlaylist.songs.length <= limit) {
                logger.info(`歌单歌曲数量较少(${basePlaylist.songs.length}首)，直接返回完整列表`);
                return {
                    ...basePlaylist,
                    trackCount: basePlaylist.songs.length
                };
            }

            // 如果需要分页，截取指定范围的歌曲
            const paginatedSongs = basePlaylist.songs.slice(offset, offset + limit);

            logger.info(`分页获取歌单歌曲: 总计${basePlaylist.songs.length}首，返回第${offset}-${offset + paginatedSongs.length}首`);

            return {
                ...basePlaylist,
                songs: paginatedSongs,
                trackCount: basePlaylist.songs.length
            };
        } catch (error) {
            logger.error('获取增强歌单详情失败', error);
            throw error;
        }
    }

    /**
     * 加载更多歌曲（用于分页加载）
     * @param playlistId 歌单ID
     * @param offset 偏移量
     * @param limit 每页数量
     */
    static async loadMoreSongs(
        playlistId: string,
        offset: number,
        limit: number = 50
    ) {
        logger.info(`加载更多歌曲: playlistId=${playlistId}, offset=${offset}, limit=${limit}`);

        try {
            const playlist = await this.getPlaylistWithPagination(
                { id: playlistId },
                limit,
                offset
            );

            return {
                songs: playlist.songs,
                hasMore: offset + limit < playlist.trackCount,
                total: playlist.trackCount
            };
        } catch (error) {
            logger.error('加载更多歌曲失败', error);
            throw error;
        }
    }

    /**
     * 获取歌单的完整统计信息
     * @param playlistId 歌单ID
     */
    static async getPlaylistStats(playlistId: string) {
        logger.info(`获取歌单统计信息: ${playlistId}`);

        try {
            const playlist = await this.getPlaylistDetail({ id: playlistId });

            // 计算统计信息
            const totalDuration = playlist.songs.reduce((total, song) => total + (song.duration || 0), 0);
            const artistCount = new Set(playlist.songs.flatMap(song => song.artists?.map(a => a.id) || [])).size;

            return {
                trackCount: playlist.songs.length,
                totalDuration,
                artistCount,
                averageDuration: playlist.songs.length > 0 ? totalDuration / playlist.songs.length : 0
            };
        } catch (error) {
            logger.error('获取歌单统计信息失败', error);
            throw error;
        }
    }
}