// NetEase Music API 类型定义
export interface APIResponse<T = any> {
  code: number;
  message?: string;
  data?: T;
}

// 搜索相关类型
export enum SearchType {
  SONG = 1,
  ALBUM = 10,
  ARTIST = 100,
  PLAYLIST = 1000,
  USER = 1002,
  MV = 1004,
  LYRIC = 1006,
  DJ = 1009,
  VIDEO = 1014
}

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
  playlists?: Playlist[];
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

export interface Playlist {
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
  userId: number;
  nickname: string;
  avatarUrl: string;
  signature?: string;
  gender?: number;
  province?: number;
  city?: number;
  birthday?: number;
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
  bindings: any[];
  cookie: string;
}

// 用户详细状态信息
export interface UserStatus {
  data: {
    profile: User;
    level: number;
    mobileSign: boolean;
    pcSign: boolean;
    profile: {
      userId: number;
      userType: number;
      nickname: string;
      avatarImgId: number;
      avatarUrl: string;
      backgroundImgId: number;
      backgroundUrl: string;
      signature: string;
      createTime: number;
      userName: string;
      accountType: number;
      shortUserName: string;
      birthday: number;
      authority: number;
      gender: number;
      accountStatus: number;
      province: number;
      city: number;
      authStatus: number;
      description: string;
      detailDescription: string;
      defaultAvatar: boolean;
      expertTags: any[];
      experts: any[];
      djStatus: number;
      locationStatus: number;
      vipType: number;
      followed: boolean;
      mutual: boolean;
      authenticated: boolean;
      lastLoginTime: number;
      lastLoginIP: string;
      remarkName: string;
      viptypeVersion: number;
      authenticationTypes: number;
      avatarDetail: any;
      anchor: boolean;
    };
  };
}

// 用户歌单列表请求参数
export interface UserPlaylistRequest {
  uid: number | string;
  limit?: number;
  offset?: number;
}

// 用户歌单列表响应
export interface UserPlaylistResponse extends APIResponse {
  version: string;
  more: boolean;
  playlist: Playlist[];
}

// 歌单详情请求参数
export interface PlaylistDetailRequest {
  id: number | string;
  s?: number; // 最近的收藏者数量,默认为10
}

// 歌单详情响应
export interface PlaylistDetailResponse extends APIResponse {
  playlist: {
    id: number;
    name: string;
    coverImgId: number;
    coverImgUrl: string;
    coverImgId_str: string;
    adType: number;
    userId: number;
    createTime: number;
    status: number;
    opRecommend: boolean;
    highQuality: boolean;
    newImported: boolean;
    updateTime: number;
    trackCount: number;
    specialType: number;
    privacy: number;
    trackUpdateTime: number;
    commentThreadId: string;
    playCount: number;
    trackNumberUpdateTime: number;
    subscribedCount: number;
    cloudTrackCount: number;
    ordered: boolean;
    description: string;
    tags: string[];
    updateFrequency: string;
    backgroundCoverId: number;
    backgroundCoverUrl: string;
    titleImage: number;
    titleImageUrl: string;
    englishTitle: string;
    officialPlaylistType: string;
    copied: boolean;
    relateResType: string;
    subscribers: any[];
    subscribed: boolean;
    creator: {
      defaultAvatar: boolean;
      province: number;
      authStatus: number;
      followed: boolean;
      avatarUrl: string;
      accountStatus: number;
      gender: number;
      city: number;
      birthday: number;
      userId: number;
      userType: number;
      nickname: string;
      signature: string;
      description: string;
      detailDescription: string;
      avatarImgId: number;
      backgroundImgId: number;
      backgroundUrl: string;
      authority: number;
      mutual: boolean;
      expertTags: any[];
      experts: any[];
      djStatus: number;
      vipType: number;
      remarkName: string;
      authenticationTypes: number;
      avatarDetail: any;
      avatarImgIdStr: string;
      backgroundImgIdStr: string;
      anchor: boolean;
      avatarImgId_str: string;
    };
    tracks: any[]; // 歌曲列表，可能为空（超过1000首时）
    videoIds: any[];
    videos: any[];
    trackIds: Array<{
      id: number;
      v: number;
      t: number;
      at: number;
      alg: string;
      uid: number;
      rcmdReason: string;
      sc: any;
      f: any;
      sr: any;
    }>;
    shareCount: number;
    commentCount: number;
    remixVideo: any;
    sharedUsers: any[];
    historySharedUsers: any[];
    gradeStatus: string;
    score: any;
    algTags: any[];
    trialMode: number;
    displayTags: any[];
    platFormAlgTags: any[];
    upateTime: number;
  };
  privileges: any[];
}

// 歌曲详情相关类型
export interface SongDetailRequest {
  ids: number[] | string;
}

export interface SongDetailResponse extends APIResponse {
  songs: Song[];
  privileges: any[];
}

// 歌词相关类型
export interface LyricRequest {
  id: number | string;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface LyricResponse extends APIResponse {
  sgc: boolean;
  sfy: boolean;
  qfy: boolean;
  lrc?: {
    version: number;
    lyric: string;
  };
  klyric?: {
    version: number;
    lyric: string;
  };
  tlyric?: {
    version: number;
    lyric: string;
  };
  romalrc?: {
    version: number;
    lyric: string;
  };
}

// API错误类型
export enum APIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

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
  body?: any;
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