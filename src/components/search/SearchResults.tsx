import React, { useState } from 'react';
import { Play, Plus, Heart, MoreHorizontal, Music, User, Disc, ListMusic } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';
import type { Song } from '../../types';

interface SearchResultsProps {
  className?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({ className }) => {
  const { search, play, addToQueue, addToFavorites } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<'songs' | 'albums' | 'artists' | 'playlists'>('songs');

  const { results, keyword, isSearching } = search;

  // 调试日志
  React.useEffect(() => {
    console.log('SearchResults - search state:', { results, keyword, isSearching });
    if (results) {
      console.log('SearchResults - results data:', {
        songs: results.songs?.length || 0,
        albums: results.albums?.length || 0,
        artists: results.artists?.length || 0,
        playlists: results.playlists?.length || 0,
        total: results.total
      });
    }
  }, [results, keyword, isSearching]);

  // 当搜索结果变化时，自动选择有数据的第一个标签
  React.useEffect(() => {
    if (results) {
      if (results.songs && results.songs.length > 0) {
        setActiveTab('songs');
      } else if (results.albums && results.albums.length > 0) {
        setActiveTab('albums');
      } else if (results.artists && results.artists.length > 0) {
        setActiveTab('artists');
      } else if (results.playlists && results.playlists.length > 0) {
        setActiveTab('playlists');
      }
    }
  }, [results]);

  if (isSearching) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">搜索中...</p>
        </div>
      </div>
    );
  }

  if (!results && !keyword) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">搜索发现音乐</p>
        </div>
      </div>
    );
  }

  if (!results || (
    (results.songs?.length || 0) === 0 && 
    (results.albums?.length || 0) === 0 && 
    (results.artists?.length || 0) === 0 && 
    (results.playlists?.length || 0) === 0
  )) {
    return (
      <div className={cn("flex items-center justify-center py-20", className)}>
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">未找到相关结果</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'songs' as const, label: '单曲', count: results.songs?.length || 0, icon: Music },
    { key: 'albums' as const, label: '专辑', count: results.albums?.length || 0, icon: Disc },
    { key: 'artists' as const, label: '歌手', count: results.artists?.length || 0, icon: User },
    { key: 'playlists' as const, label: '歌单', count: results.playlists?.length || 0, icon: ListMusic },
  ];

  const handleSongPlay = (song: Song) => {
    // 为API来源的歌曲添加标识
    const songWithSource = {
      ...song,
      source: 'api' as const,
      title: song.name || song.title,
      artist: song.artists?.map(a => a.name).join(' / ') || song.artist
    };
    play(songWithSource);
  };

  const handleSongAddToQueue = (song: Song) => {
    const songWithSource = {
      ...song,
      source: 'api' as const,
      title: song.name || song.title,
      artist: song.artists?.map(a => a.name).join(' / ') || song.artist
    };
    addToQueue(songWithSource);
  };

  const handleSongAddToFavorites = (song: Song) => {
    const songWithSource = {
      ...song,
      source: 'api' as const,
      title: song.name || song.title,
      artist: song.artists?.map(a => a.name).join(' / ') || song.artist
    };
    addToFavorites(songWithSource);
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatArtistNames = (artists: Array<{ name: string }>) => {
    return artists.map(artist => artist.name).join(' / ');
  };

  const renderSongs = () => (
    <div className="space-y-1">
      {(results.songs || []).map((song, index) => (
        <div
          key={`song-${song.id}-${index}`}
          className="group flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          {/* 序号/播放按钮 */}
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center mr-3">
            <span className="text-sm text-gray-400 group-hover:hidden">
              {(index + 1).toString().padStart(2, '0')}
            </span>
            <button
              onClick={() => handleSongPlay(song)}
              className="hidden group-hover:flex w-8 h-8 items-center justify-center bg-primary-500 hover:bg-primary-600 text-white rounded-full transition-colors"
            >
              <Play className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          {/* 歌曲信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <img
                src={song.picUrl || song.album?.picUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyOEMyNCA0IDI4IDIwIDI0IDIwQzI0IDI0IDIwIDI4IDIwIDI4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'}
                alt={song.name}
                className="w-10 h-10 rounded-md object-cover mr-3"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyOEMyNCA0IDI4IDIwIDI0IDIwQzI0IDI0IDIwIDI4IDIwIDI4WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                }}
              />
              <div className="min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {song.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {formatArtistNames(song.artists)} • {song.album?.name}
                </div>
              </div>
            </div>
          </div>

          {/* 时长 */}
          <div className="flex-shrink-0 text-sm text-gray-400 mr-4">
            {formatDuration(song.duration)}
          </div>

          {/* 操作按钮 */}
          <div className="flex-shrink-0 flex items-center space-x-1">
            <button
              onClick={() => handleSongAddToFavorites(song)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              title="收藏"
            >
              <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
            <button
              onClick={() => handleSongAddToQueue(song)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100"
              title="添加到播放队列"
            >
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAlbums = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {(results.albums || []).map((album) => (
        <div key={`album-${album.id}`} className="group cursor-pointer">
          <div className="relative">
            <img
              src={album.picUrl}
              alt={album.name}
              className="w-full aspect-square object-cover rounded-lg group-hover:shadow-lg transition-all duration-300"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-300 flex items-center justify-center">
              <button className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300">
                <Play className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {album.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {album.artist?.name}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderArtists = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {(results.artists || []).map((artist) => (
        <div key={`artist-${artist.id}`} className="group text-center cursor-pointer">
          <div className="relative">
            <img
              src={artist.picUrl}
              alt={artist.name}
              className="w-full aspect-square object-cover rounded-full group-hover:shadow-lg transition-all duration-300"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-300"></div>
          </div>
          <div className="mt-3">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {artist.name}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPlaylists = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {(results.playlists || []).map((playlist) => (
        <div key={`playlist-${playlist.id}`} className="group cursor-pointer">
          <div className="relative">
            <img
              src={playlist.coverImgUrl}
              alt={playlist.name}
              className="w-full aspect-square object-cover rounded-lg group-hover:shadow-lg transition-all duration-300"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-300 flex items-center justify-center">
              <button className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300">
                <Play className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {playlist.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {playlist.creator?.nickname} • {playlist.trackCount}首
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={className}>
      {/* 结果概览 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          搜索 "{keyword}" 的结果
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          找到 {((results.songs?.length || 0) + (results.albums?.length || 0) + (results.artists?.length || 0) + (results.playlists?.length || 0))} 个结果
        </p>
      </div>

      {/* 分类标签 */}
      <div className="flex space-x-6 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center space-x-2 pb-3 border-b-2 transition-colors",
              activeTab === key
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
            disabled={count === 0}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* 结果内容 */}
      <div>
        {activeTab === 'songs' && renderSongs()}
        {activeTab === 'albums' && renderAlbums()}
        {activeTab === 'artists' && renderArtists()}
        {activeTab === 'playlists' && renderPlaylists()}
      </div>
    </div>
  );
};

export default SearchResults;