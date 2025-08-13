/**
 * 本地音乐扫描服务
 * 扫描设备本地音乐文件，提取元数据，构建本地音乐库
 */

import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Song } from '@music-player/shared';

// 扫描配置
export interface ScanConfig {
  includeSystemFiles: boolean;
  minDuration: number; // 最小时长(秒)
  maxDuration: number; // 最大时长(秒)
  supportedFormats: string[];
  scanFolders: string[];
  excludeFolders: string[];
  enableMetadataExtraction: boolean;
  batchSize: number;
}

// 扫描进度回调
export interface ScanProgress {
  total: number;
  scanned: number;
  currentFile: string;
  percentage: number;
  phase: 'scanning' | 'metadata' | 'indexing' | 'complete';
}

// 扫描结果
export interface ScanResult {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  genres: Genre[];
  totalFiles: number;
  validFiles: number;
  errors: ScanError[];
  duration: number; // 扫描耗时(ms)
}

// 专辑信息
export interface Album {
  id: string;
  name: string;
  artist: string;
  artwork?: string;
  year?: number;
  songCount: number;
  duration: number;
}

// 艺人信息
export interface Artist {
  id: string;
  name: string;
  albumCount: number;
  songCount: number;
  genres: string[];
}

// 流派信息
export interface Genre {
  id: string;
  name: string;
  songCount: number;
  artists: string[];
}

// 扫描错误
export interface ScanError {
  file: string;
  error: string;
  type: 'permission' | 'format' | 'metadata' | 'corruption';
}

// 默认配置
const defaultScanConfig: ScanConfig = {
  includeSystemFiles: false,
  minDuration: 10, // 10秒
  maxDuration: 3600, // 1小时
  supportedFormats: ['mp3', 'aac', 'm4a', 'flac', 'wav', 'ogg'],
  scanFolders: [],
  excludeFolders: ['system', 'android', '.cache', '.temp'],
  enableMetadataExtraction: true,
  batchSize: 50,
};

/**
 * 本地音乐扫描器
 */
export class LocalMusicScanner {
  private static instance: LocalMusicScanner;
  private config: ScanConfig;
  private isScanning = false;
  private scanAbortController: AbortController | null = null;
  
  // 缓存
  private static readonly CACHE_KEY = 'local_music_cache';
  private static readonly CACHE_VERSION = '1.0';
  
  private constructor(config: Partial<ScanConfig> = {}) {
    this.config = { ...defaultScanConfig, ...config };
  }
  
  static getInstance(config?: Partial<ScanConfig>): LocalMusicScanner {
    if (!LocalMusicScanner.instance) {
      LocalMusicScanner.instance = new LocalMusicScanner(config);
    }
    return LocalMusicScanner.instance;
  }
  
  /**
   * 扫描本地音乐
   */
  async scanLocalMusic(
    onProgress?: (progress: ScanProgress) => void
  ): Promise<ScanResult> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }
    
    const startTime = Date.now();
    this.isScanning = true;
    this.scanAbortController = new AbortController();
    
    try {
      // 检查权限
      await this.checkPermissions();
      
      // 阶段1: 扫描文件
      onProgress?.({
        total: 0,
        scanned: 0,
        currentFile: '',
        percentage: 0,
        phase: 'scanning',
      });
      
      const audioAssets = await this.scanAudioFiles();
      
      if (this.scanAbortController.signal.aborted) {
        throw new Error('Scan was cancelled');
      }
      
      // 阶段2: 提取元数据
      onProgress?.({
        total: audioAssets.length,
        scanned: 0,
        currentFile: '',
        percentage: 0,
        phase: 'metadata',
      });
      
      const songs: Song[] = [];
      const errors: ScanError[] = [];
      
      // 批量处理音频文件
      for (let i = 0; i < audioAssets.length; i += this.config.batchSize) {
        if (this.scanAbortController.signal.aborted) {
          throw new Error('Scan was cancelled');
        }
        
        const batch = audioAssets.slice(i, i + this.config.batchSize);
        const batchResults = await this.processBatch(batch, i, audioAssets.length, onProgress);
        
        songs.push(...batchResults.songs);
        errors.push(...batchResults.errors);
      }
      
      // 阶段3: 构建索引
      onProgress?.({
        total: songs.length,
        scanned: songs.length,
        currentFile: '',
        percentage: 90,
        phase: 'indexing',
      });
      
      const { albums, artists, genres } = this.buildIndexes(songs);
      
      const result: ScanResult = {
        songs,
        albums,
        artists,
        genres,
        totalFiles: audioAssets.length,
        validFiles: songs.length,
        errors,
        duration: Date.now() - startTime,
      };
      
      // 缓存结果
      await this.cacheResults(result);
      
      onProgress?.({
        total: songs.length,
        scanned: songs.length,
        currentFile: '',
        percentage: 100,
        phase: 'complete',
      });
      
      return result;
      
    } finally {
      this.isScanning = false;
      this.scanAbortController = null;
    }
  }
  
  /**
   * 检查权限
   */
  private async checkPermissions() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permission not granted');
    }
  }
  
  /**
   * 扫描音频文件
   */
  private async scanAudioFiles(): Promise<MediaLibrary.Asset[]> {
    const options: MediaLibrary.AssetsOptions = {
      mediaType: MediaLibrary.MediaType.audio,
      first: 10000, // 最多扫描10000个文件
      sortBy: MediaLibrary.SortBy.creationTime,
    };
    
    const assets = await MediaLibrary.getAssetsAsync(options);
    
    // 过滤支持的格式
    return assets.assets.filter(asset => {
      const extension = this.getFileExtension(asset.filename);
      return this.config.supportedFormats.includes(extension.toLowerCase());
    });
  }
  
  /**
   * 批量处理音频文件
   */
  private async processBatch(
    assets: MediaLibrary.Asset[],
    startIndex: number,
    totalCount: number,
    onProgress?: (progress: ScanProgress) => void
  ) {
    const songs: Song[] = [];
    const errors: ScanError[] = [];
    
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const currentIndex = startIndex + i;
      
      onProgress?.({
        total: totalCount,
        scanned: currentIndex,
        currentFile: asset.filename,
        percentage: (currentIndex / totalCount) * 80, // 80%用于元数据提取
        phase: 'metadata',
      });
      
      try {
        const song = await this.extractSongMetadata(asset);
        if (song && this.isValidSong(song)) {
          songs.push(song);
        }
      } catch (error) {
        errors.push({
          file: asset.filename,
          error: (error as Error).message,
          type: 'metadata',
        });
      }
    }
    
    return { songs, errors };
  }
  
  /**
   * 提取歌曲元数据
   */
  private async extractSongMetadata(asset: MediaLibrary.Asset): Promise<Song | null> {
    try {
      // 获取文件信息
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
      
      if (!assetInfo.localUri) {
        throw new Error('No local URI available');
      }
      
      // 基础信息
      const song: Song = {
        id: asset.id,
        title: this.extractTitle(asset.filename),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: asset.duration,
        url: assetInfo.localUri,
        localPath: assetInfo.localUri,
        fileSize: assetInfo.size || 0,
        format: this.getFileExtension(asset.filename),
        addedAt: new Date(asset.creationTime),
        lastPlayedAt: null,
        playCount: 0,
        isLocal: true,
      };
      
      // 如果启用了元数据提取，尝试获取更详细的信息
      if (this.config.enableMetadataExtraction) {
        const metadata = await this.extractDetailedMetadata(assetInfo.localUri);
        Object.assign(song, metadata);
      }
      
      return song;
      
    } catch (error) {
      console.warn(`Failed to extract metadata for ${asset.filename}:`, error);
      return null;
    }
  }
  
  /**
   * 提取详细元数据
   */
  private async extractDetailedMetadata(uri: string): Promise<Partial<Song>> {
    try {
      // 使用Expo AV获取音频信息
      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        null,
        false
      );
      
      let metadata: Partial<Song> = {};
      
      if (status.isLoaded) {
        metadata.duration = (status.durationMillis || 0) / 1000;
      }
      
      // 卸载音频对象
      await sound.unloadAsync();
      
      // 尝试从文件系统获取更多信息
      if (Platform.OS === 'ios') {
        // iOS可以使用AVAsset获取更详细的元数据
        // 这里需要原生模块支持
      } else if (Platform.OS === 'android') {
        // Android可以使用MediaMetadataRetriever
        // 这里需要原生模块支持
      }
      
      return metadata;
      
    } catch (error) {
      console.warn('Failed to extract detailed metadata:', error);
      return {};
    }
  }
  
  /**
   * 验证歌曲是否有效
   */
  private isValidSong(song: Song): boolean {
    // 检查时长
    if (song.duration < this.config.minDuration || song.duration > this.config.maxDuration) {
      return false;
    }
    
    // 检查文件大小
    if (song.fileSize && song.fileSize < 1024) { // 小于1KB
      return false;
    }
    
    // 检查标题
    if (!song.title || song.title.trim().length === 0) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 构建索引
   */
  private buildIndexes(songs: Song[]) {
    const albumsMap = new Map<string, Album>();
    const artistsMap = new Map<string, Artist>();
    const genresMap = new Map<string, Genre>();
    
    songs.forEach(song => {
      // 构建专辑索引
      const albumKey = `${song.artist}-${song.album}`;
      if (!albumsMap.has(albumKey)) {
        albumsMap.set(albumKey, {
          id: this.generateId(),
          name: song.album || 'Unknown Album',
          artist: song.artist,
          artwork: song.albumCover,
          year: song.year,
          songCount: 0,
          duration: 0,
        });
      }
      
      const album = albumsMap.get(albumKey)!;
      album.songCount++;
      album.duration += song.duration;
      
      // 构建艺人索引
      if (!artistsMap.has(song.artist)) {
        artistsMap.set(song.artist, {
          id: this.generateId(),
          name: song.artist,
          albumCount: 0,
          songCount: 0,
          genres: [],
        });
      }
      
      const artist = artistsMap.get(song.artist)!;
      artist.songCount++;
      if (song.genre && !artist.genres.includes(song.genre)) {
        artist.genres.push(song.genre);
      }
      
      // 构建流派索引
      if (song.genre) {
        if (!genresMap.has(song.genre)) {
          genresMap.set(song.genre, {
            id: this.generateId(),
            name: song.genre,
            songCount: 0,
            artists: [],
          });
        }
        
        const genre = genresMap.get(song.genre)!;
        genre.songCount++;
        if (!genre.artists.includes(song.artist)) {
          genre.artists.push(song.artist);
        }
      }
    });
    
    // 计算艺人的专辑数量
    artistsMap.forEach(artist => {
      artist.albumCount = Array.from(albumsMap.values())
        .filter(album => album.artist === artist.name).length;
    });
    
    return {
      albums: Array.from(albumsMap.values()),
      artists: Array.from(artistsMap.values()),
      genres: Array.from(genresMap.values()),
    };
  }
  
  /**
   * 从文件名提取标题
   */
  private extractTitle(filename: string): string {
    // 移除扩展名
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // 移除常见的前缀模式
    const cleaned = nameWithoutExt
      .replace(/^\d+[\s\-\.]*/, '') // 移除开头的数字
      .replace(/^[\s\-\.]+/, '') // 移除开头的分隔符
      .trim();
    
    return cleaned || nameWithoutExt;
  }
  
  /**
   * 获取文件扩展名
   */
  private getFileExtension(filename: string): string {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1] : '';
  }
  
  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 缓存扫描结果
   */
  private async cacheResults(result: ScanResult) {
    try {
      const cacheData = {
        version: LocalMusicScanner.CACHE_VERSION,
        timestamp: Date.now(),
        result,
      };
      
      await AsyncStorage.setItem(
        LocalMusicScanner.CACHE_KEY,
        JSON.stringify(cacheData)
      );
      
      console.log('Local music scan results cached');
    } catch (error) {
      console.warn('Failed to cache scan results:', error);
    }
  }
  
  /**
   * 获取缓存的扫描结果
   */
  async getCachedResults(): Promise<ScanResult | null> {
    try {
      const cached = await AsyncStorage.getItem(LocalMusicScanner.CACHE_KEY);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      
      // 检查版本和时效性
      if (cacheData.version !== LocalMusicScanner.CACHE_VERSION) {
        return null;
      }
      
      // 检查是否过期（7天）
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
      if (Date.now() - cacheData.timestamp > maxAge) {
        return null;
      }
      
      return cacheData.result;
      
    } catch (error) {
      console.warn('Failed to get cached results:', error);
      return null;
    }
  }
  
  /**
   * 清除缓存
   */
  async clearCache() {
    try {
      await AsyncStorage.removeItem(LocalMusicScanner.CACHE_KEY);
      console.log('Local music cache cleared');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }
  
  /**
   * 取消扫描
   */
  cancelScan() {
    if (this.scanAbortController) {
      this.scanAbortController.abort();
    }
  }
  
  /**
   * 检查是否正在扫描
   */
  isCurrentlyScanning(): boolean {
    return this.isScanning;
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<ScanConfig>) {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取当前配置
   */
  getConfig(): ScanConfig {
    return { ...this.config };
  }
  
  /**
   * 获取支持的音频格式
   */
  static getSupportedFormats(): string[] {
    return defaultScanConfig.supportedFormats;
  }
  
  /**
   * 检查文件是否为支持的音频格式
   */
  static isSupportedFormat(filename: string): boolean {
    const extension = filename.match(/\.([^.]+)$/)?.[1]?.toLowerCase();
    return extension ? defaultScanConfig.supportedFormats.includes(extension) : false;
  }
}