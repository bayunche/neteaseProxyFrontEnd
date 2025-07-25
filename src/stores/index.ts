import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Song, Playlist, PlaybackState, UserSettings } from '../types';
import { PlayMode } from '../types';
import { audioService } from '../services/audio';
import { SearchAPI, SearchType, AuthAPI, type User, type SearchResult as APISearchResult } from '../services/api';

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
  
  // Search state
  search: {
    keyword: string;
    results: ExtendedSearchResult | null;
    isSearching: boolean;
    history: string[];
    suggestions: string[];
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
  
  // User data actions
  addToFavorites: (song: Song) => void;
  removeFromFavorites: (songId: string) => void;
  createPlaylist: (name: string, description?: string, songs?: Song[]) => void;
  deletePlaylist: (playlistId: string) => void;
  addToPlaylist: (playlistId: string, song: Song) => void;
  removeFromPlaylist: (playlistId: string, songId: string) => void;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  
  // Auth actions
  sendVerificationCode: (phone: string) => Promise<void>;
  loginWithCode: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  checkLoginStatus: () => Promise<boolean>;
  
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
  search: {
    keyword: '',
    results: null,
    isSearching: false,
    history: [],
    suggestions: [],
  },
};

// Create the store
export const usePlayerStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set, get) => {
        // 设置音频服务事件监听
        audioService.onStateChange((audioState: any) => {
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

        // 监听队列变化
        audioService.on('queuechange', (queue: any) => {
          set((state) => ({
            queue: {
              ...state.queue,
              songs: queue.songs,
              currentIndex: queue.currentIndex
            }
          }));
        });

        return {
          ...initialState,
        
        // Player actions implementation
        play: async (song?: Song) => {
          const state = get();
          const targetSong = song || state.player.currentSong;
          
          if (!targetSong) {
            // 如果没有指定歌曲，尝试从队列播放
            await audioService.play();
            return;
          }
          
          try {
            // 添加到队列（如果还没有）
            const currentQueue = audioService.getQueue();
            if (!currentQueue.songs.find((s: any) => s.id === targetSong.id)) {
              audioService.addToQueue(targetSong);
            }
            
            // 播放歌曲
            await audioService.playSong(targetSong);
            
            // 更新最近播放
            set((state) => ({
              user: {
                ...state.user,
                recentPlayed: [
                  targetSong,
                  ...state.user.recentPlayed.filter(s => s.id !== targetSong.id)
                ].slice(0, 50)
              }
            }));
          } catch (error) {
            console.error('播放失败:', error);
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
          await audioService.playNext();
        },
        
        previous: async () => {
          await audioService.playPrevious();
        },
        
        setVolume: (volume: number) => {
          audioService.setVolume(volume);
        },
        
        toggleMute: () => {
          audioService.toggleMute();
        },
        
        setPlayMode: (mode: PlayMode) => {
          audioService.setPlayMode(mode);
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
          
          set((state) => {
            const newSongs = [...state.queue.songs];
            if (index !== undefined) {
              newSongs.splice(index, 0, song);
            } else {
              newSongs.push(song);
            }
            
            return {
              queue: {
                ...state.queue,
                songs: newSongs
              }
            };
          });
        },
        
        removeFromQueue: (index: number) => {
          audioService.removeFromQueue(index);
          
          set((state) => ({
            queue: {
              ...state.queue,
              songs: state.queue.songs.filter((_, i) => i !== index),
              currentIndex: state.queue.currentIndex > index 
                ? state.queue.currentIndex - 1 
                : state.queue.currentIndex
            }
          }));
        },
        
        clearQueue: () => {
          audioService.clearQueue();
          
          set((state) => ({
            queue: {
              ...state.queue,
              songs: [],
              currentIndex: -1
            }
          }));
        },
        
        shuffleQueue: () => {
          set((state) => {
            const shuffled = [...state.queue.songs].sort(() => Math.random() - 0.5);
            return {
              queue: {
                ...state.queue,
                songs: shuffled,
                currentIndex: 0
              }
            };
          });
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
                token: null
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
          }
        })
      }
    ),
    {
      name: 'music-player-store'
    }
  )
);