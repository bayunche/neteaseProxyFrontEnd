// Constants (first, so they can be used in interfaces)
export const MusicSource = {
  QQ_MUSIC: 'qq',
  KUGOU: 'kugou',
  MIGU: 'migu',
  LOCAL: 'local',
  API: 'api', // 来自NetEase API的歌曲
  NETEASE: 'netease'
} as const;

export type MusicSource = typeof MusicSource[keyof typeof MusicSource];

export const AudioQuality = {
  LOW: '128k',
  STANDARD: '192k',
  HIGH: '320k',
  LOSSLESS: 'flac'
} as const;

export type AudioQuality = typeof AudioQuality[keyof typeof AudioQuality];

// Core music data models (now that types are defined)
export interface Song {
  id: number | string;  // 兼容两种类型，但优先使用number
  title?: string;
  name?: string; // API字段
  artist?: string;
  artists?: Array<{ id: number; name: string; picUrl?: string; alias?: string[] }>; // API字段
  album?: string | { id: number; name: string; picUrl?: string; publishTime?: number }; // API字段
  duration: number;
  coverUrl?: string;
  picUrl?: string; // API字段
  audioUrl?: string;
  source?: MusicSource;
  quality?: AudioQuality;
  lyricId?: string;
  fee?: number; // API字段 - 费用类型
  mvid?: number; // API字段 - MV ID
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  releaseDate: Date;
  songs: Song[];
  source: MusicSource;
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  description: string;
  albums: Album[];
  topSongs: Song[];
  source: MusicSource;
}

export interface Playlist {
  id: string;
  title: string;
  name?: string;  // API兼容字段
  description: string;
  coverUrl: string;
  creator: string;
  songs: Song[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  trackCount?: number;  // 歌曲数量
  playCount?: number;   // 播放次数
}

export const PlayMode = {
  SEQUENCE: 'sequence',
  RANDOM: 'random',
  SINGLE: 'single',
  LIST_LOOP: 'list_loop'
} as const;

export type PlayMode = typeof PlayMode[keyof typeof PlayMode];

// Player state types
export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export type AudioEvent = 
  | 'loadstart' | 'loadeddata' | 'canplay' | 'canplaythrough'
  | 'play' | 'pause' | 'ended' | 'timeupdate' | 'progress'
  | 'volumechange' | 'error' | 'stalled' | 'stop' | 'seek'
  | 'queuechange' | 'playmodechange' | 'queuecomplete';

// Search related types
export interface SearchResult {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SearchOptions {
  page?: number;
  pageSize?: number;
  source?: MusicSource;
}

// Lyrics types
export interface LyricLine {
  time: number;
  text: string;
  translation?: string;
}

export interface Lyrics {
  songId: string;
  lines: LyricLine[];
  offset: number;
}

// User settings and preferences
export interface UserSettings {
  theme: 'light' | 'dark';
  volume: number;
  playMode: PlayMode;
  autoPlay: boolean;
  crossfade: boolean;
  equalizer: EqualizerSettings | null;
}

// 播放历史统计相关类型
export interface PlayHistoryEntry {
  id: string;
  songId: string | number;
  song: Song;
  playedAt: Date;
  duration: number; // 播放时长（秒）
  completed: boolean; // 是否播放完整
  source: 'manual' | 'auto' | 'shuffle' | 'repeat'; // 播放来源
  deviceInfo?: {
    platform: string;
    userAgent: string;
  };
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalPlayTime: number; // 总播放时长（秒）
  songCount: number; // 播放歌曲数量
  uniqueSongCount: number; // 不重复歌曲数量
  topSongs: Array<{
    song: Song;
    playCount: number;
    totalDuration: number;
  }>;
  topArtists: Array<{
    artist: string;
    playCount: number;
    totalDuration: number;
  }>;
  playModeStats: Record<PlayMode, number>; // 各播放模式使用次数
}

export interface WeeklyStats {
  weekStart: string; // YYYY-MM-DD (周一)
  weekEnd: string; // YYYY-MM-DD (周日)
  totalPlayTime: number;
  dailyBreakdown: DailyStats[];
  topSongs: Array<{
    song: Song;
    playCount: number;
    totalDuration: number;
  }>;
  topArtists: Array<{
    artist: string;
    playCount: number;
    totalDuration: number;
  }>;
  genreStats?: Array<{
    genre: string;
    playCount: number;
    totalDuration: number;
  }>;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalPlayTime: number;
  weeklyBreakdown: WeeklyStats[];
  topSongs: Array<{
    song: Song;
    playCount: number;
    totalDuration: number;
  }>;
  topArtists: Array<{
    artist: string;
    playCount: number;
    totalDuration: number;
  }>;
  discoveryStats: {
    newSongsCount: number;
    newArtistsCount: number;
  };
}

export interface PlayStats {
  allTime: {
    totalPlayTime: number;
    totalSongs: number;
    uniqueSongs: number;
    uniqueArtists: number;
    avgSessionLength: number;
    longestSession: number;
    favoriteSong: Song | null;
    favoriteArtist?: string;
  };
  recent: {
    lastWeek: WeeklyStats;
    lastMonth: MonthlyStats;
    yesterday: DailyStats | null;
  };
  trends: {
    playTimeGrowth: number; // 相比上周/月的增长百分比
    discoveryRate: number; // 新歌发现率
    repeatRate: number; // 重复播放率
  };
}

export interface EqualizerSettings {
  enabled: boolean;
  preset: string;
  bands: number[];
}

// Cache and storage types
export interface CacheMetadata {
  key: string;
  timestamp: number;
  ttl: number;
  size: number;
  type: 'audio' | 'image' | 'api_response';
}

export interface PlayHistory {
  id: string;
  songId: string;
  playedAt: Date;
  duration: number;
  completionRate: number;
}

export interface PlaybackQueue {
  songs: Song[];
  currentIndex: number;
  mode: PlayMode;
}

// API and error types
export interface APIError {
  code: string;
  message: string;
  status?: number;
}

export interface APIResponse<T> {
  data: T;
  error?: APIError;
  success: boolean;
}

// Component prop types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Re-export API types that are commonly used
export type { User, Album as APIAlbum, Artist as APIArtist } from '../services/api/types';