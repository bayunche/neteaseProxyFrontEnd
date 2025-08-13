import type { APIConfig } from './types';

// 环境配置
const IS_DEVELOPMENT = import.meta.env.DEV;
const API_BASE_URL = IS_DEVELOPMENT 
  ? '/api'  // 开发环境：使用Vite代理
  : 'http://8.134.196.44:8210'; // 生产环境：直接访问API服务器

// NetEase Music API 配置
export const API_CONFIG: APIConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒超时（歌单详情数据量大时需要更长时间）
  retryCount: 2, // 减少重试次数避免过长等待
  retryDelay: 1000 // 1秒重试延迟
};

// 音质码率配置
export const AUDIO_QUALITY = {
  LOW: 128000,      // 128k
  MEDIUM: 192000,   // 192k
  HIGH: 320000,     // 320k
  LOSSLESS: 999000  // 无损
} as const;

// 搜索类型映射
export const SEARCH_TYPE_NAMES = {
  1: '歌曲',
  10: '专辑', 
  100: '艺术家',
  1000: '歌单',
  1002: '用户',
  1004: 'MV',
  1006: '歌词',
  1009: '电台',
  1014: '视频'
} as const;

// API端点路径
export const API_ENDPOINTS = {
  // 搜索相关
  SEARCH: '/search',
  
  // 歌曲相关
  SONG_URL: '/song/url',
  SONG_DETAIL: '/song/detail',
  SONG_LYRIC: '/song/lyric',
  
  // 用户和认证相关
  LOGIN_CELLPHONE: '/login/cellphone',
  LOGIN_EMAIL: '/login',
  LOGOUT: '/logout',
  LOGIN_STATUS: '/login/status',
  LOGIN_REFRESH: '/login/refresh',
  USER_STATUS: '/user/status',
  USER_PLAYLIST: '/user/playlist',
  
  // 专辑相关
  ALBUM: '/album',
  ALBUM_DETAIL_DYNAMIC: '/album/detail/dynamic',
  
  // 艺术家相关
  ARTISTS: '/artists',
  ARTIST_ALBUM: '/artist/album',
  ARTIST_TOP_SONG: '/artist/top/song',
  
  // 歌单相关
  PLAYLIST_DETAIL: '/playlist/detail',
  PLAYLIST_TRACK_ALL: '/playlist/track/all',
  
  // 推荐相关
  RECOMMEND_SONGS: '/recommend/songs',
  RECOMMEND_RESOURCE: '/recommend/resource',
  
  // 排行榜相关
  TOPLIST: '/toplist',
  TOPLIST_DETAIL: '/toplist/detail'
} as const;

// HTTP状态码映射
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

// NetEase API 响应码映射
export const NETEASE_CODE = {
  SUCCESS: 200,
  NEED_LOGIN: 301,
  WRONG_PASSWORD: 502,
  TOO_MANY_REQUESTS: 509,
  NETWORK_ERROR: -1
} as const;