import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle,
  Repeat,
  Repeat1,
  List,
  Type
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';
import { PlayMode } from '../../types';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';

const PlayerBar: React.FC = () => {
  const navigate = useNavigate();
  const { 
    player, 
    ui,
    play, 
    pause, 
    next, 
    previous, 
    setVolume, 
    toggleMute,
    setPlayMode,
    toggleQueue
  } = usePlayerStore();
  
  const { 
    currentSong, 
    isPlaying, 
    currentTime, 
    duration, 
    volume, 
    isMuted, 
    playMode 
  } = player;
  
  const { showQueue } = ui;

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };


  const getPlayModeIcon = () => {
    switch (playMode) {
      case PlayMode.RANDOM:
        return <Shuffle className="w-4 h-4" />;
      case PlayMode.SINGLE:
        return <Repeat1 className="w-4 h-4" />;
      case PlayMode.LIST_LOOP:
        return <Repeat className="w-4 h-4" />;
      default:
        return <Repeat className="w-4 h-4 opacity-50" />;
    }
  };

  const handlePlayModeToggle = () => {
    const modes = [PlayMode.SEQUENCE, PlayMode.LIST_LOOP, PlayMode.RANDOM, PlayMode.SINGLE];
    const currentIndex = modes.indexOf(playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPlayMode(modes[nextIndex]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSongImageClick = () => {
    if (currentSong) {
      navigate('/lyrics');
    }
  };

  return (
    <div className="h-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6">
      <div className="flex items-center h-full">
        {/* Song info */}
        <div className="flex items-center min-w-0 w-64">
          {currentSong ? (
            <>
              <img
                src={currentSong.coverUrl}
                alt={currentSong.title}
                className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleSongImageClick}
                title="点击查看歌词"
              />
              <div className="ml-3 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {currentSong.title}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {currentSong.artist}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              未播放音乐
            </div>
          )}
        </div>

        {/* Player controls */}
        <div className="flex-1 flex flex-col items-center max-w-2xl mx-8">
          {/* Control buttons */}
          <div className="flex items-center space-x-4 mb-2">
            <button
              onClick={handlePlayModeToggle}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="播放模式"
            >
              {getPlayModeIcon()}
            </button>
            
            <button
              onClick={previous}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              disabled={!currentSong}
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            <button
              onClick={handlePlayPause}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-full transition-colors',
                'bg-primary-500 hover:bg-primary-600 text-white',
                !currentSong && 'opacity-50 cursor-not-allowed'
              )}
              disabled={!currentSong}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            
            <button
              onClick={next}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              disabled={!currentSong}
            >
              <SkipForward className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => {
                if (currentSong) {
                  navigate('/lyrics');
                }
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="查看歌词"
              disabled={!currentSong}
            >
              <Type className="w-4 h-4" />
            </button>
            
            <button
              onClick={toggleQueue}
              className={cn(
                'p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors',
                showQueue && 'bg-gray-100 dark:bg-gray-800'
              )}
              title="播放队列"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full flex items-center space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={(time: number) => {
                const { seek } = usePlayerStore.getState();
                seek(time);
              }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume control */}
        <VolumeControl
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
        />
      </div>
    </div>
  );
};

export default PlayerBar;