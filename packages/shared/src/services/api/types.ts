// NetEase Music API 类型定义
export interface APIResponse<T = unknown> {
  code: number;
  message?: string;
  data?: T;
}

// 用户绑定信息类型
export interface UserBinding {
  id: number;
  type: number;
  userId: number;
  url: string;
  expired: boolean;
  bindingTime: number;
  tokenJsonStr?: string;
  expiresIn?: number;
  refreshTime?: number;
}

// 搜索相关类型
export const SearchType = {
  SONG: 1,
  ALBUM: 10,
  ARTIST: 100,
  PLAYLIST: 1000,
  USER: 1002,
  MV: 1004,
  LYRIC: 1006,
  DJ: 1009,
  VIDEO: 1014
} as const;

export type SearchType = typeof SearchType[keyof typeof SearchType];

export interface SearchRequest {
  keywords: string;
  type?: SearchType;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  songs?: Song[];
  albums?: Album[];
  artists?: Artist[];
  playlists?: ApiPlaylist[];
  songCount?: number;
  albumCount?: number;
  artistCount?: number;
  playlistCount?: number;
}

// 歌曲相关类型
export interface Song {
  id: number;
  name: string;
  artists: Artist[];
  album: Album;
  duration: number;
  picUrl?: string;
  fee?: number;
  mvid?: number;
}

export interface Artist {
  id: number;
  name: string;
  picUrl?: string;
  alias?: string[];
}

export interface Album {
  id: number;
  name: string;
  picUrl?: string;
  artist?: Artist;
  publishTime?: number;
}

export interface ApiPlaylist {
  id: number;
  name: string;
  coverImgUrl?: string;
  description?: string;
  creator?: User;
  trackCount?: number;
  playCount?: number;
}

// 歌曲播放URL相关类型
export interface SongUrlRequest {
  id: number;
  br?: number; // 音质码率: 128000, 192000, 320000, 999000
}

export interface SongUrlData {
  id: number;
  url: string | null;
  br: number;
  size: number;
  md5: string | null;
  code: number;
  expi: number;
  type: string | null;
  gain: number;
  fee: number;
  uf: null;
  payed: number;
  flag: number;
  canExtend: boolean;
  freeTrialInfo: null;
  level: string | null;
  encodeType: string | null;
  freeTrialPrivilege: {
    resConsumable: boolean;
    userConsumable: boolean;
    listenType: null;
  };
  freeTimeTrialPrivilege: {
    resConsumable: boolean;
    userConsumable: boolean;
    type: number;
    remainTime: number;
  };
  urlSource: number;
  rightSource: number;
  time: number;
  message: string | null;
}

export interface SongUrlResponse extends APIResponse {
  data: SongUrlData[];
}

// 用户和登录相关类型
export interface User {
  id: number;
  userId: number;
  nickname: string;
  avatarUrl: string;
  signature?: string;
  gender?: number;
  province?: number;
  city?: number;
  birthday?: number;
  type?: string;
  createdAt?: number | Date;
}

// Playlist API 类型定义
export interface ApiTrack {
  id: number;
  name: string;
  artists?: ApiArtist[];
  ar?: ApiArtist[];
  album?: ApiAlbum;
  al?: ApiAlbum;
  duration?: number;
  dt?: number;
  fee?: number;
  mvid?: number;
  mv?: number;
}

export interface ApiArtist {
  id: number;
  name: string;
  picUrl?: string;
  img1v1Url?: string;
  alias?: string[];
}

export interface ApiAlbum {
  id: number;
  name: string;
  picUrl?: string;
  picId?: string;
  artist?: ApiArtist;
  publishTime?: number;
}

export interface ApiPlaylistData {
  id: number;
  name: string;
  description?: string;
  coverImgUrl?: string;
  creator?: {
    nickname: string;
  };
  tracks?: ApiTrack[];
  trackIds?: { id: number }[];
  privacy?: boolean;
  createTime?: number;
  updateTime?: number;
  trackCount?: number;
  playCount?: number;
}

export interface SongDetailResponse extends APIResponse {
  songs?: ApiTrack[];
}

export interface PlaylistDetailResponse extends APIResponse {
  playlist?: ApiPlaylistData;
}

// Search API 类型定义
export interface SearchResponse extends APIResponse {
  result?: {
    songs?: ApiTrack[];
    albums?: ApiAlbum[];
    artists?: ApiArtist[];
    playlists?: ApiPlaylistData[];
    songCount?: number;
    albumCount?: number;
    artistCount?: number;
    playlistCount?: number;
  };
}

export interface ApiPlaylistForSearch {
  id: number;
  name: string;
  coverImgUrl?: string;
  description?: string;
  creator?: {
    id: number;
    userId: number;
    nickname: string;
    avatarUrl: string;
  };
  trackCount?: number;
  playCount?: number;
}

// Song API 类型定义（重新定义 SongUrlResponse 覆盖之前的定义）

export interface SongLyricResponse extends APIResponse {
  data?: {
    lrc?: {
      lyric?: string;
    };
    tlyric?: {
      lyric?: string;
    };
  };
}

export interface SongDetailApiResponse extends APIResponse {
  songs: Array<{
    id: number;
    name: string;
    ar?: Array<{
      id: number;
      name: string;
      picUrl?: string;
      alias?: string[];
    }>;
    al?: {
      id: number;
      name: string;
      picUrl?: string;
      publishTime?: number;
    };
    dt?: number;
    fee?: number;
    mv?: number;
  }>;
}

export interface LoginRequest {
  phone: string;
  password: string;
  countrycode?: string;
  rememberLogin?: boolean;
}

export interface LoginResponse extends APIResponse {
  loginType: number;
  code: number;
  account: {
    id: number;
    userName: string;
    type: number;
    status: number;
    whitelistAuthority: number;
    createTime: number;
    tokenVersion: number;
    ban: number;
    baoyueVersion: number;
    donateVersion: number;
    vipType: number;
    anonimousUser: boolean;
  };
  token: string;
  profile: User;
  bindings: UserBinding[];
  cookie: string;
}

// 用户详细状态信息
export interface UserStatus {
  data: {
    profile: User;
    level: number;
    mobileSign: boolean;
    pcSign: boolean;
  };
}

// 用户歌单列表请求参数
export interface UserPlaylistRequest {
  uid: number | string;
  limit?: number;
  offset?: number;
}

// 用户歌单列表响应
export interface UserPlaylistResponse {
  code: number;
  version: string;
  more: boolean;
  playlist: ApiPlaylist[];
}

// 歌单详情请求参数
export interface PlaylistDetailRequest {
  id: number | string;
  s?: number; // 最近的收藏者数量,默认为10
}

// API 错误类型定义
export const APIErrorType = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PARAMS: 'INVALID_PARAMS'
} as const;

export type APIErrorType = typeof APIErrorType[keyof typeof APIErrorType];

export class APIError extends Error {
  constructor(
    public type: APIErrorType,
    public message: string,
    public code?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// API请求配置类型
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown> | string;
  params?: Record<string, string | number>;
  timeout?: number;
}

// API配置类型
export interface APIConfig {
  baseURL: string;
  timeout: number;
  retryCount: number;
  retryDelay: number;
}

// 缺失的类型定义

// 歌曲详情请求参数
export interface SongDetailRequest {
  ids: number[];
}

// 歌词相关类型
export interface LyricRequest {
  id: number;
}

export interface LyricResponse extends APIResponse {
  lrc?: {
    lyric?: string;
  };
  tlyric?: {
    lyric?: string;
  };
}

export interface LyricLine {
  time: number;
  text: string;
  translation?: string;
}

// 统计相关类型
export interface DailyStats {
  date: string;
  totalPlayTime: number;
  songsPlayed: number;
  topArtists: Array<{
    id: number;
    name: string;
    playCount: number;
    playTime: number;
  }>;
  topSongs: Array<{
    id: number;
    name: string;
    artist: string;
    playCount: number;
  }>;
  genres: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
}