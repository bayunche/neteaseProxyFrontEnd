// Core music data models
export interface Song {
  id: string | number;
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
  description: string;
  coverUrl: string;
  creator: string;
  songs: Song[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Constants (instead of enums to avoid TypeScript issues)
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
  | 'queuechange' | 'playmodechange';

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