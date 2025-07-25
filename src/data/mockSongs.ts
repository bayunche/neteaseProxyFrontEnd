import type { Song } from '../types';
import { generateTestAudio, generateTestSounds, checkAudioSupport } from '../utils/audioGenerator';

// 免费可用的音频文件示例
export const mockSongs: Song[] = [
  {
    id: 'song-1',
    title: 'Sample Audio 1',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 30, // 30秒
    coverUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFsYnVtIDwhL3RleHQ+PC9zdmc+',
    audioUrl: 'https://www.w3schools.com/html/horse.mp3', // CORS friendly audio
    source: 'local',
    quality: '128k'
  },
  {
    id: 'song-2',
    title: 'Sample Audio 2',
    artist: 'Test Artist 2',
    album: 'Test Album 2',
    duration: 45, // 45秒
    coverUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFsYnVtIDI8L3RleHQ+PC9zdmc+',
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3', // CORS friendly audio
    source: 'local',
    quality: '192k'
  },
  {
    id: 'song-3',
    title: 'Sample Audio 3',
    artist: 'Test Artist 3',
    album: 'Test Album 3',
    duration: 60, // 60秒
    coverUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkFsYnVtIDM8L3RleHQ+PC9zdmc+',
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg', // CORS friendly audio
    source: 'local',
    quality: '320k'
  },
  {
    id: 'song-4',
    title: 'Local Test Song',
    artist: 'Local Artist',
    album: 'Local Album',
    duration: 180, // 3分钟
    coverUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvY2FsIEFsYnVtPC90ZXh0Pjwvc3ZnPg==',
    // 注意：这个需要用户自己提供本地音频文件
    audioUrl: '', // 将在运行时设置
    source: 'local',
    quality: 'flac'
  }
];

// 为测试提供一些可用的在线音频资源
export const testAudioUrls = [
  // 使用支持CORS的音频文件
  'https://www.w3schools.com/html/horse.mp3',
  'https://www.w3schools.com/html/mov_bbb.mp4', // 也包含音频
  'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3',
  'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg'
];

// 应用启动时设置示例歌曲的音频URL
export const initializeMockSongs = (): Song[] => {
  // 检查音频支持
  const audioSupport = checkAudioSupport();
  console.log('音频支持情况:', audioSupport);

  // 生成测试音频
  const generatedSounds = generateTestSounds();
  
  // 创建混合音频源（生成的音频 + 外部音频）
  const audioSources = [
    generatedSounds.piano,
    generatedSounds.bass, 
    generatedSounds.beep,
    generatedSounds.sweep,
    ...testAudioUrls
  ];

  return mockSongs.map((song, index) => ({
    ...song,
    audioUrl: song.audioUrl || audioSources[index] || generatedSounds.piano,
    // 更新歌曲信息以反映音频类型
    title: index < 4 ? `生成音频 ${index + 1}` : song.title,
    artist: index < 4 ? '测试音频生成器' : song.artist
  }));
};

// 获取单个测试歌曲
export const getTestSong = (id?: string): Song => {
  const songs = initializeMockSongs();
  if (id) {
    return songs.find(song => song.id === id) || songs[0];
  }
  return songs[0];
};

// 获取测试播放列表
export const getTestPlaylist = (count = 3): Song[] => {
  const songs = initializeMockSongs();
  return songs.slice(0, count);
};