import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Song, Playlist, PlaybackState, UserSettings, Lyrics } from '../types';
import { PlayMode } from '../types';
import { audioService } from '../services/audio';
import { SearchAPI, SearchType, AuthAPI, PlaylistAPI, LyricAPI, logger, type User, type SearchResult as APISearchResult } from '../services/api';
import { statsService, type UserStats } from '../services/StatsService';

// Extended search result with pagination info
interface ExtendedSearchResult extends APISearchResult {
  total?: number;
  page?: number;
  pageSize?: number;
}

// Global app state interface
interface AppState {
  // Player state
  player: {
    currentSong: Song | null;
    isPlaying: boolean;
    isPaused: boolean;
    isLoading: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    playMode: PlayMode;
    playbackState: PlaybackState;
    error: string | null;
  };
  
  // Queue state
  queue: {
    songs: Song[];
    currentIndex: number;
    history: Song[];
    upcoming: Song[];
  };
  
  // User data state
  user: {
    isLoggedIn: boolean;
    profile: User | null;
    token: string | null;
    favorites: Song[];
    playlists: Playlist[];
    recentPlayed: Song[];
    settings: UserSettings;
  };
  
  // UI state
  ui: {
    theme: 'light' | 'dark';
    sidebarCollapsed: boolean;
    currentView: 'home' | 'search' | 'playlist' | 'player';
    showLyrics: boolean;
    showVisualizer: boolean;
    showQueue: boolean;
  };
  
  // Lyrics state
  lyrics: {
    current: Lyrics | null;
    currentLineIndex: number;
    isLoading: boolean;
    error: string | null;
  };
  
  // Search state
  search: {
    keyword: string;
    results: ExtendedSearchResult | null;
    isSearching: boolean;
    history: string[];
    suggestions: string[];
  };

  // Stats state
  stats: {
    isLoading: boolean;
    data: UserStats | null;
    error: string | null;
  };
}

// Actions interface
interface AppActions {
  // Player actions
  play: (song?: Song) => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlayMode: (mode: PlayMode) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackState: (state: PlaybackState) => void;
  setError: (error: string | null) => void;
  
  // Queue actions
  addToQueue: (song: Song, index?: number) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  moveInQueue: (fromIndex: number, toIndex: number) => void;
  playAllSongs: (songs: Song[]) => Promise<void>;
  
  // User data actions
  addToFavorites: (song: Song) => void;
  removeFromFavorites: (songId: string) => void;
  createPlaylist: (name: string, description?: string, songs?: Song[]) => void;
  deletePlaylist: (playlistId: string) => void;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  loadPlaylistDetail: (playlistId: string) => Promise<Playlist | null>;
  
  // Auth actions
  sendVerificationCode: (phone: string) => Promise<void>;
  loginWithCode: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  checkLoginStatus: () => Promise<boolean>;
  loadUserPlaylists: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  
  // Search actions
  performSearch: (keyword: string, type?: string) => Promise<void>;
  clearSearch: () => void;
  addToSearchHistory: (keyword: string) => void;
  clearSearchHistory: () => void;
  
  // UI actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentView: (view: string) => void;
  toggleLyrics: () => void;
  toggleVisualizer: () => void;
  toggleQueue: () => void;
  
  // Lyrics actions
  loadLyrics: (songId: string) => Promise<void>;
  updateCurrentLyricLine: (currentTime: number) => void;
  clearLyrics: () => void;

  // Stats actions
  loadStats: () => Promise<void>;
  clearStats: () => void;
  exportStats: () => string;
  importStats: (data: string) => boolean;

  // Recent played actions
  getRecentPlayed: () => Song[];
  clearRecentPlayed: () => void;
  updateRecentPlayed: (song: Song) => void;
}

// Initial state
const initialState: AppState = {
  player: {
    currentSong: null,
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    playMode: PlayMode.SEQUENCE,
    playbackState: 'idle',
    error: null,
  },
  queue: {
    songs: [],
    currentIndex: -1,
    history: [],
    upcoming: [],
  },
  user: {
    isLoggedIn: false,
    profile: null,
    token: null,
    favorites: [],
    playlists: [],
    recentPlayed: [],
    settings: {
      theme: 'light',
      volume: 0.8,
      playMode: PlayMode.SEQUENCE,
      autoPlay: true,
      crossfade: false,
      equalizer: null,
    },
  },
  ui: {
    theme: 'light',
    sidebarCollapsed: false,
    currentView: 'home',
    showLyrics: false,
    showVisualizer: false,
    showQueue: false,
  },
  
  lyrics: {
    current: null,
    currentLineIndex: -1,
    isLoading: false,
    error: null,
  },
  search: {
    keyword: '',
    results: null,
    isSearching: false,
    history: [],
    suggestions: [],
  },
  stats: {
    isLoading: false,
    data: null,
    error: null,
  },
};

// Create the store
export const usePlayerStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set, get) => {
        // 事件监听器清理函数集合
        const eventCleanupFunctions: Array<() => void> = [];
        
        // 设置音频服务事件监听
        const audioStateUnsubscribe = audioService.onStateChange((audioState: {
          currentSong: Song | null;
          isPlaying: boolean;
          isPaused: boolean;
          isLoading: boolean;
          currentTime: number;
          duration: number;
          volume: number;
          isMuted: boolean;
          playbackState: PlaybackState;
          error: string | null;
        }) => {
          set((state) => ({
            player: {
              ...state.player,
              currentSong: audioState.currentSong,
              isPlaying: audioState.isPlaying,
              isPaused: audioState.isPaused,
              isLoading: audioState.isLoading,
              currentTime: audioState.currentTime,
              duration: audioState.duration,
              volume: audioState.volume,
              isMuted: audioState.isMuted,
              playbackState: audioState.playbackState,
              error: audioState.error
            }
          }));
        });
        eventCleanupFunctions.push(audioStateUnsubscribe);

        // 监听队列变化
        const queueChangeUnsubscribe = audioService.on('queuechange', (queue: { songs: Song[]; currentIndex: number }) => {
          set((state) => ({
            queue: {
              ...state.queue,
              songs: queue.songs,
              currentIndex: queue.currentIndex
            }
          }));
        });
        eventCleanupFunctions.push(queueChangeUnsubscribe);
        
        // 监听队列播放完成
        const queueCompleteUnsubscribe = audioService.on('queuecomplete', () => {
          console.log('队列播放完成，可以点击播放按钮从头开始');
        });
        eventCleanupFunctions.push(queueCompleteUnsubscribe);
        
        // 在window对象上存储清理函数，供调试和手动清理使用
        if (typeof window !== 'undefined') {
          (window as any).__audioEventCleanup = () => {
            console.log('清理音频事件监听器:', eventCleanupFunctions.length, '个');
            eventCleanupFunctions.forEach(cleanup => cleanup());
            eventCleanupFunctions.length = 0; // 清空数组
          };
        }

        // 初始化时恢复播放状态
        const initializePersistedState = () => {
          const state = get();
          
          // 恢复音频服务配置
          if (state.player.volume !== undefined) {
            audioService.setVolume(state.player.volume);
          }
          
          if (state.player.playMode) {
            audioService.setPlayMode(state.player.playMode);
          }
          
          // 恢复播放队列
          if (state.queue.songs.length > 0) {
            console.log('恢复播放队列:', state.queue.songs.length, '首歌曲，当前索引:', state.queue.currentIndex);
            audioService.setQueue(state.queue.songs, state.queue.currentIndex);
            
            // 如果有当前歌曲且索引有效，预加载它但不自动播放
            if (state.player.currentSong && 
                state.queue.currentIndex >= 0 && 
                state.queue.currentIndex < state.queue.songs.length) {
              
              console.log('恢复当前播放歌曲:', state.player.currentSong.title);
              
              // 直接更新音频服务的状态，不实际播放
              set((currentState) => ({
                player: {
                  ...currentState.player,
                  currentSong: state.player.currentSong
                }
              }));
            }
          }
        };

        // 延迟初始化以确保组件完全加载
        setTimeout(initializePersistedState, 100);

        return {
          ...initialState,
        
        // Player actions implementation
        play: async (song?: Song) => {
          const state = get();
          
          try {
            if (song) {
              // 如果指定了歌曲，直接播放
              const currentQueue = audioService.getQueue();
              const existingIndex = currentQueue.songs.findIndex((s: Song) => s.id === song.id);
              
              if (existingIndex >= 0) {
                // 如果歌曲已在队列中，直接播放该位置
                await audioService.playFromQueue(existingIndex);
              } else {
                // 如果歌曲不在队列中，添加到队列并播放
                audioService.addToQueue(song);
                const newQueue = audioService.getQueue();
                const newIndex = newQueue.songs.length - 1;
                await audioService.playFromQueue(newIndex);
              }
              
              // 自动加载歌词
              get().loadLyrics(String(song.id));
              
              // 记录播放统计
              statsService.onSongChange(song, 'manual');
              
              // 更新最近播放
              get().updateRecentPlayed(song);
            } else {
              // 没有指定歌曲，使用智能播放逻辑
              await audioService.play();
              
              // 获取当前播放的歌曲
              const currentSong = audioService.getCurrentSong();
              if (currentSong) {
                get().loadLyrics(String(currentSong.id));
                statsService.onSongChange(currentSong, 'auto');
                get().updateRecentPlayed(currentSong);
              }
            }
          } catch (error) {
            console.error('播放失败:', error);
            set((state) => ({
              player: {
                ...state.player,
                error: (error as Error).message
              }
            }));
          }
        },
        
        pause: () => {
          audioService.pause();
        },
        
        stop: () => {
          audioService.stop();
        },
        
        seek: (time: number) => {
          audioService.seek(time);
        },
        
        next: async () => {
          try {
            const hasNext = await audioService.playNext();
            if (!hasNext) {
              // 如果没有下一首，根据播放模式决定行为
              const queue = audioService.getQueue();
              if (queue.mode === 'list_loop' && queue.songs.length > 0) {
                await audioService.playFromQueue(0); // 循环到第一首
              }
            }
          } catch (error) {
            console.error('播放下一首失败:', error);
          }
        },
        
        previous: async () => {
          try {
            await audioService.playPrevious();
          } catch (error) {
            console.error('播放上一首失败:', error);
          }
        },
        
        setVolume: (volume: number) => {
          audioService.setVolume(volume);
        },
        
        toggleMute: () => {
          audioService.toggleMute();
        },
        
        setPlayMode: (mode: PlayMode) => {
          audioService.setPlayMode(mode);
          statsService.onPlayModeChange(mode);
          set((state) => ({
            player: {
              ...state.player,
              playMode: mode
            }
          }));
        },
        
        setCurrentTime: (time: number) => {
          set((state) => ({
            player: {
              ...state.player,
              currentTime: time
            }
          }));
        },
        
        setDuration: (duration: number) => {
          set((state) => ({
            player: {
              ...state.player,
              duration
            }
          }));
        },
        
        setPlaybackState: (playbackState: PlaybackState) => {
          set((state) => ({
            player: {
              ...state.player,
              playbackState
            }
          }));
        },
        
        setError: (error: string | null) => {
          set((state) => ({
            player: {
              ...state.player,
              error
            }
          }));
        },
        
        // Queue actions
        addToQueue: (song: Song, index?: number) => {
          audioService.addToQueue(song, index);
          // Store状态会通过audioService的queuechange事件自动更新
        },
        
        removeFromQueue: (index: number) => {
          audioService.removeFromQueue(index);
          // Store状态会通过audioService的queuechange事件自动更新
        },
        
        clearQueue: () => {
          audioService.clearQueue();
          // 清空队列后重置播放状态
          set((state) => ({
            player: {
              ...state.player,
              currentSong: null,
              isPlaying: false,
              isPaused: false,
              playbackState: 'idle'
            }
          }));
        },
        
        shuffleQueue: () => {
          const state = get();
          if (state.queue.songs.length <= 1) return;
          
          const currentSong = state.player.currentSong;
          const shuffled = [...state.queue.songs].sort(() => Math.random() - 0.5);
          
          // 如果有当前播放的歌曲，确保它在第一位
          if (currentSong) {
            const currentIndex = shuffled.findIndex(s => s.id === currentSong.id);
            if (currentIndex > 0) {
              [shuffled[0], shuffled[currentIndex]] = [shuffled[currentIndex], shuffled[0]];
            }
          }
          
          // 更新 AudioService 的队列
          audioService.setQueue(shuffled, 0);
        },
        
        moveInQueue: (fromIndex: number, toIndex: number) => {
          set((state) => {
            const newSongs = [...state.queue.songs];
            const [movedSong] = newSongs.splice(fromIndex, 1);
            newSongs.splice(toIndex, 0, movedSong);
            
            return {
              queue: {
                ...state.queue,
                songs: newSongs
              }
            };
          });
        },

        // 播放所有歌曲（清空队列并播放歌曲列表）
        playAllSongs: async (songs: Song[]) => {
          if (!songs || songs.length === 0) {
            return;
          }

          try {
            // 清空当前队列
            audioService.clearQueue();
            
            // 设置新的队列
            audioService.setQueue(songs, 0);
            
            // 播放第一首歌曲
            await audioService.playFromQueue(0);
            
            // 自动加载歌词
            get().loadLyrics(String(songs[0].id));
            
            // 记录播放统计
            statsService.onSongChange(songs[0], 'playlist');
            
            // 更新最近播放
            get().updateRecentPlayed(songs[0]);

            logger.info(`开始播放歌曲列表: ${songs.length}首歌曲`);
          } catch (error) {
            logger.error('播放歌曲列表失败:', error);
            set((state) => ({
              player: {
                ...state.player,
                error: '播放列表失败'
              }
            }));
          }
        },
        
        // User data actions
        addToFavorites: (song: Song) => {
          set((state) => ({
            user: {
              ...state.user,
              favorites: [song, ...state.user.favorites.filter(s => s.id !== song.id)]
            }
          }));
        },
        
        removeFromFavorites: (songId: string) => {
          set((state) => ({
            user: {
              ...state.user,
              favorites: state.user.favorites.filter(s => s.id !== songId)
            }
          }));
        },
        
        createPlaylist: (name: string, description = '', songs: Song[] = []) => {
          const newPlaylist: Playlist = {
            id: `playlist_${Date.now()}`,
            title: name,
            description,
            coverUrl: songs[0]?.coverUrl || '',
            creator: 'User',
            songs,
            isPublic: false,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          set((state) => ({
            user: {
              ...state.user,
              playlists: [newPlaylist, ...state.user.playlists]
            }
          }));
        },
        
        deletePlaylist: (playlistId: string) => {
          set((state) => ({
            user: {
              ...state.user,
              playlists: state.user.playlists.filter(p => p.id !== playlistId)
            }
          }));
        },
        
        addToPlaylist: (playlistId: string, song: Song) => {
          set((state) => ({
            user: {
              ...state.user,
              playlists: state.user.playlists.map(playlist => 
                playlist.id === playlistId
                  ? {
                      ...playlist,
                      songs: [...playlist.songs.filter(s => s.id !== song.id), song],
                      updatedAt: new Date()
                    }
                  : playlist
              )
            }
          }));
        },
        
        removeFromPlaylist: (playlistId: string, songId: string) => {
          set((state) => ({
            user: {
              ...state.user,
              playlists: state.user.playlists.map(playlist => 
                playlist.id === playlistId
                  ? {
                      ...playlist,
                      songs: playlist.songs.filter(s => s.id !== songId),
                      updatedAt: new Date()
                    }
                  : playlist
              )
            }
          }));
        },
        
        updateUserSettings: (newSettings: Partial<UserSettings>) => {
          set((state) => ({
            user: {
              ...state.user,
              settings: {
                ...state.user.settings,
                ...newSettings
              }
            }
          }));
        },

        // 加载歌单详情（增强版）
        loadPlaylistDetail: async (playlistId: string): Promise<Playlist | null> => {
          if (!playlistId) {
            logger.warn('歌单ID不能为空');
            return null;
          }

          try {
            logger.info(`开始加载歌单详情: ${playlistId}`);
            
            // 尝试使用增强版API
            try {
              const { EnhancedPlaylistAPI } = await import('../services/api/PlaylistAPI.enhanced');
              const enhancedPlaylist = await EnhancedPlaylistAPI.getPlaylistWithPagination(
                { id: playlistId }, 
                100 // 初始加载100首歌曲
              );
              
              // 转换为标准格式
              const playlist: Playlist = {
                ...enhancedPlaylist,
                songs: enhancedPlaylist.songs
              };
              
              // 更新store中的歌单信息（如果存在）
              set((state) => ({
                user: {
                  ...state.user,
                  playlists: state.user.playlists.map(p => 
                    p.id === playlistId ? { ...p, ...playlist } : p
                  )
                }
              }));

              logger.info(`加载增强歌单详情成功: "${playlist.title}", ${playlist.songs.length}首歌曲, 总计${enhancedPlaylist.trackCount}首`);
              return playlist;
            } catch (enhancedError) {
              logger.warn('增强版API失败，回退到标准API', enhancedError);
              
              // 回退到原有API
              const playlist = await PlaylistAPI.getPlaylistDetail({ id: playlistId });
              
              // 更新store中的歌单信息（如果存在）
              set((state) => ({
                user: {
                  ...state.user,
                  playlists: state.user.playlists.map(p => 
                    p.id === playlistId ? { ...p, ...playlist } : p
                  )
                }
              }));

              logger.info(`加载标准歌单详情成功: "${playlist.title}", ${playlist.songs.length}首歌曲`);
              return playlist;
            }
          } catch (error) {
            logger.error('加载歌单详情失败', error);
            return null;
          }
        },

        // Auth actions implementation
        sendVerificationCode: async (phone: string) => {
          try {
            await AuthAPI.sendVerificationCode(phone);
            console.log('验证码发送成功');
          } catch (error) {
            console.error('发送验证码失败:', error);
            throw error;
          }
        },

        loginWithCode: async (phone: string, code: string) => {
          try {
            const loginResult = await AuthAPI.loginWithCode(phone, code);
            
            set((state) => ({
              user: {
                ...state.user,
                isLoggedIn: true,
                profile: loginResult.profile || null,
                token: loginResult.token || null
              }
            }));

            console.log('登录成功:', loginResult.profile?.nickname);
            
            // 登录成功后自动加载用户数据
            get().refreshUserData();
          } catch (error) {
            console.error('登录失败:', error);
            throw error;
          }
        },

        logout: async () => {
          try {
            await AuthAPI.logout();
            
            set((state) => ({
              user: {
                ...state.user,
                isLoggedIn: false,
                profile: null,
                token: null,
                playlists: [], // 清空歌单
                favorites: [], // 清空收藏
                recentPlayed: [] // 清空最近播放
              }
            }));

            console.log('登出成功');
          } catch (error) {
            console.error('登出失败:', error);
          }
        },

        checkLoginStatus: async () => {
          try {
            const isLoggedIn = AuthAPI.isLoggedIn();
            const currentUser = AuthAPI.getCurrentUser();
            const token = AuthAPI.getAuthToken();

            if (isLoggedIn && currentUser) {
              set((state) => ({
                user: {
                  ...state.user,
                  isLoggedIn: true,
                  profile: currentUser,
                  token: token
                }
              }));
              
              // 自动加载用户数据
              get().refreshUserData();
              return true;
            } else {
              set((state) => ({
                user: {
                  ...state.user,
                  isLoggedIn: false,
                  profile: null,
                  token: null
                }
              }));
              return false;
            }
          } catch (error) {
            console.error('检查登录状态失败:', error);
            return false;
          }
        },

        // 加载用户歌单
        loadUserPlaylists: async () => {
          const state = get();
          if (!state.user.isLoggedIn || !state.user.profile) {
            console.warn('用户未登录，无法加载歌单');
            return;
          }

          try {
            console.log('开始加载用户歌单...');
            const playlistResponse = await AuthAPI.getCurrentUserPlaylist(50, 0);
            
            if (playlistResponse.playlist) {
              // 转换API数据格式为本地Playlist格式
              const playlists: Playlist[] = playlistResponse.playlist.map(apiPlaylist => ({
                id: String(apiPlaylist.id),
                title: apiPlaylist.name,
                description: apiPlaylist.description || '',
                coverUrl: apiPlaylist.coverImgUrl || '',
                creator: apiPlaylist.creator?.nickname || '未知',
                songs: [], // 初始为空，点击时再加载
                isPublic: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                trackCount: apiPlaylist.trackCount || 0,
                playCount: apiPlaylist.playCount || 0
              }));

              set((state) => ({
                user: {
                  ...state.user,
                  playlists
                }
              }));

              console.log(`加载用户歌单成功: ${playlists.length}个歌单`);
            }
          } catch (error) {
            console.error('加载用户歌单失败:', error);
          }
        },

        // 刷新用户数据
        refreshUserData: async () => {
          const state = get();
          if (!state.user.isLoggedIn) {
            return;
          }

          try {
            // 并行获取用户状态和歌单
            const [userStatus] = await Promise.allSettled([
              AuthAPI.getUserStatus(),
              get().loadUserPlaylists()
            ]);

            // 更新用户详细信息
            if (userStatus.status === 'fulfilled' && userStatus.value.data?.profile) {
              set((state) => ({
                user: {
                  ...state.user,
                  profile: userStatus.value.data.profile
                }
              }));
            }

            console.log('用户数据刷新完成');
          } catch (error) {
            console.error('刷新用户数据失败:', error);
          }
        },
        
        // Search actions
        performSearch: async (keyword: string, type = 'all') => {
          if (!keyword.trim()) {
            return;
          }

          set((state) => ({
            search: {
              ...state.search,
              keyword: keyword.trim(),
              isSearching: true,
            }
          }));
          
          try {
            let searchResults: ExtendedSearchResult;

            if (type === 'all') {
              // 多类型综合搜索
              const multiResults = await SearchAPI.multiSearch(
                keyword.trim(),
                [SearchType.SONG, SearchType.ALBUM, SearchType.ARTIST, SearchType.PLAYLIST],
                20
              );

              searchResults = {
                songs: multiResults[SearchType.SONG] || [],
                albums: multiResults[SearchType.ALBUM] || [],
                artists: multiResults[SearchType.ARTIST] || [],
                playlists: multiResults[SearchType.PLAYLIST] || [],
                total: (multiResults[SearchType.SONG]?.length || 0) +
                       (multiResults[SearchType.ALBUM]?.length || 0) +
                       (multiResults[SearchType.ARTIST]?.length || 0) +
                       (multiResults[SearchType.PLAYLIST]?.length || 0),
                page: 1,
                pageSize: 20
              };
            } else {
              // 单类型搜索
              let searchType: SearchType;
              switch (type) {
                case 'song':
                  searchType = SearchType.SONG;
                  break;
                case 'album':
                  searchType = SearchType.ALBUM;
                  break;
                case 'artist':
                  searchType = SearchType.ARTIST;
                  break;
                case 'playlist':
                  searchType = SearchType.PLAYLIST;
                  break;
                default:
                  searchType = SearchType.SONG;
              }

              const result = await SearchAPI.search(keyword.trim(), searchType, 30, 0);
              
              searchResults = {
                ...result,
                total: result.songCount || result.albumCount || result.artistCount || result.playlistCount || 0,
                page: 1,
                pageSize: 30
              };
            }
            
            console.log('搜索成功，设置结果:', searchResults);
            
            set((state) => ({
              search: {
                ...state.search,
                results: searchResults,
                isSearching: false,
                history: [
                  keyword.trim(),
                  ...state.search.history.filter(h => h !== keyword.trim())
                ].slice(0, 10)
              }
            }));

            console.log('搜索完成:', keyword, '结果数量:', searchResults.total);

          } catch (error) {
            console.error('搜索失败:', error);
            
            set((state) => ({
              search: {
                ...state.search,
                isSearching: false,
                results: {
                  songs: [],
                  albums: [],
                  artists: [],
                  playlists: [],
                  total: 0,
                  page: 1,
                  pageSize: 20
                }
              }
            }));
          }
        },
        
        clearSearch: () => {
          set((state) => ({
            search: {
              ...state.search,
              keyword: '',
              results: null
            }
          }));
        },
        
        addToSearchHistory: (keyword: string) => {
          set((state) => ({
            search: {
              ...state.search,
              history: [
                keyword,
                ...state.search.history.filter(h => h !== keyword)
              ].slice(0, 10)
            }
          }));
        },
        
        clearSearchHistory: () => {
          set((state) => ({
            search: {
              ...state.search,
              history: []
            }
          }));
        },
        
        // UI actions
        setTheme: (theme: 'light' | 'dark') => {
          set((state) => ({
            ui: {
              ...state.ui,
              theme
            }
          }));
        },
        
        toggleSidebar: () => {
          set((state) => ({
            ui: {
              ...state.ui,
              sidebarCollapsed: !state.ui.sidebarCollapsed
            }
          }));
        },
        
        setSidebarCollapsed: (collapsed: boolean) => {
          set((state) => ({
            ui: {
              ...state.ui,
              sidebarCollapsed: collapsed
            }
          }));
        },
        
        setCurrentView: (view: string) => {
          set((state) => ({
            ui: {
              ...state.ui,
              currentView: view as any
            }
          }));
        },
        
        toggleLyrics: () => {
          set((state) => ({
            ui: {
              ...state.ui,
              showLyrics: !state.ui.showLyrics
            }
          }));
        },
        
        toggleVisualizer: () => {
          set((state) => ({
            ui: {
              ...state.ui,
              showVisualizer: !state.ui.showVisualizer
            }
          }));
        },
        
        toggleQueue: () => {
          set((state) => ({
            ui: {
              ...state.ui,
              showQueue: !state.ui.showQueue
            }
          }));
        },
        
        // Lyrics actions implementation
        loadLyrics: async (songId: string) => {
          if (!songId) {
            return;
          }

          set((state) => ({
            lyrics: {
              ...state.lyrics,
              isLoading: true,
              error: null
            }
          }));

          try {
            logger.info(`开始加载歌词: ${songId}`);
            const lyrics = await LyricAPI.getLyric({ id: songId });

            set((state) => ({
              lyrics: {
                ...state.lyrics,
                current: lyrics,
                currentLineIndex: -1,
                isLoading: false,
                error: null
              }
            }));

            if (lyrics) {
              logger.info(`歌词加载成功: ${lyrics.lines.length}行`);
            } else {
              logger.info('当前歌曲无歌词');
            }
          } catch (error) {
            logger.error('歌词加载失败:', error);
            
            set((state) => ({
              lyrics: {
                ...state.lyrics,
                current: null,
                currentLineIndex: -1,
                isLoading: false,
                error: error instanceof Error ? error.message : '歌词加载失败'
              }
            }));
          }
        },

        updateCurrentLyricLine: (currentTime: number) => {
          const state = get();
          
          if (!state.lyrics.current || !state.lyrics.current.lines.length) {
            return;
          }

          const currentLineIndex = LyricAPI.getCurrentLyricLine(
            state.lyrics.current, 
            currentTime * 1000 // 转换为毫秒
          );

          if (currentLineIndex !== state.lyrics.currentLineIndex) {
            set((state) => ({
              lyrics: {
                ...state.lyrics,
                currentLineIndex
              }
            }));
          }
        },

        clearLyrics: () => {
          set((state) => ({
            lyrics: {
              ...state.lyrics,
              current: null,
              currentLineIndex: -1,
              error: null
            }
          }));
        },

        // Stats actions implementation
        loadStats: async () => {
          set((state) => ({
            stats: {
              ...state.stats,
              isLoading: true,
              error: null
            }
          }));

          try {
            const statsData = statsService.getPlayStats();
            
            set((state) => ({
              stats: {
                ...state.stats,
                isLoading: false,
                data: statsData
              }
            }));
          } catch (error) {
            set((state) => ({
              stats: {
                ...state.stats,
                isLoading: false,
                error: error instanceof Error ? error.message : '加载统计数据失败'
              }
            }));
          }
        },

        clearStats: () => {
          statsService.clearStats();
          set((state) => ({
            stats: {
              ...state.stats,
              data: null
            }
          }));
        },

        exportStats: () => {
          return statsService.exportStats();
        },

        importStats: (data: string) => {
          const success = statsService.importStats(data);
          if (success) {
            // 重新加载统计数据
            get().loadStats();
          }
          return success;
        },

        // Recent played actions implementation
        getRecentPlayed: () => {
          return get().user.recentPlayed;
        },

        clearRecentPlayed: () => {
          set((state) => ({
            user: {
              ...state.user,
              recentPlayed: []
            }
          }));
        },

        updateRecentPlayed: (song: Song) => {
          set((state) => ({
            user: {
              ...state.user,
              recentPlayed: [
                song,
                ...state.user.recentPlayed.filter(s => s.id !== song.id)
              ].slice(0, 100) // 只保留最近100首
            }
          }));
        },
        };
      },
      {
        name: 'music-player-store',
        partialize: (state) => ({
          user: state.user,
          ui: {
            theme: state.ui.theme,
            sidebarCollapsed: state.ui.sidebarCollapsed
          },
          search: {
            history: state.search.history
          },
          // 持久化播放相关状态
          player: {
            currentSong: state.player.currentSong,
            volume: state.player.volume,
            isMuted: state.player.isMuted,
            playMode: state.player.playMode
          },
          queue: {
            songs: state.queue.songs,
            currentIndex: state.queue.currentIndex
          },
          // 确保用户数据包含最近播放
          user: {
            ...state.user,
            recentPlayed: state.user.recentPlayed
          }
        })
      }
    ),
    {
      name: 'music-player-store'
    }
  )
);