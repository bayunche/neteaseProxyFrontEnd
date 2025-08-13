// API服务统一导出文件
export { NetEaseAPI, neteaseAPI } from './NetEaseAPI';
export { SearchAPI } from './SearchAPI';
export { SongAPI } from './SongAPI';
export { AuthAPI } from './AuthAPI';
export { PlaylistAPI } from './PlaylistAPI';
export { LyricAPI } from './LyricAPI';
export { EnhancedPlaylistAPI } from './PlaylistAPI.enhanced';

// 导出枚举和类
export { SearchType, APIError } from './types';

// 导出类型定义
export type {
  APIResponse,
  APIErrorType,
  RequestOptions,
  APIConfig,

  // 搜索相关类型
  SearchRequest,
  SearchResult,

  // 歌曲相关类型
  Song,
  Artist,
  Album,
  SongUrlRequest,
  SongUrlResponse,
  SongDetailRequest,
  SongDetailResponse,

  // 歌单相关类型
  PlaylistDetailRequest,
  PlaylistDetailResponse,

  // 歌词相关类型
  LyricRequest,
  LyricResponse,
  LyricLine,

  // 用户相关类型
  User,

  // 认证相关类型（从AuthAPI导入）
} from './types';

export type {
  SendCodeRequest,
  SendCodeResponse,
  LoginWithCodeRequest,
  LoginWithCodeResponse
} from './AuthAPI';

// 导出配置和工具
export {
  API_CONFIG,
  AUDIO_QUALITY,
  SEARCH_TYPE_NAMES,
  API_ENDPOINTS
} from './config';

export {
  delay,
  buildQueryString,
  buildURL,
  formatSongDuration,
  formatImageUrl,
  formatArtistNames,
  formatPlayCount,
  isSongPlayable,
  logger
} from './utils';