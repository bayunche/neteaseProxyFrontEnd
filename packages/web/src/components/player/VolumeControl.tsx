import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../utils/cn';

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  className?: string;
}

const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(volume);
  const [isHovering, setIsHovering] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const displayVolume = isDragging ? dragValue : volume;
  const displayPercent = (isMuted ? 0 : displayVolume) * 100;

  const updateVolumeFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newVolume = percent / 100;
    
    return newVolume;
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    const newVolume = updateVolumeFromEvent(e);
    if (newVolume !== undefined) {
      setDragValue(newVolume);
      // 鼠标按下时立即更改音量
      onVolumeChange(newVolume);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newVolume = updateVolumeFromEvent(e);
      if (newVolume !== undefined) {
        setDragValue(newVolume);
        // 拖拽过程中实时更改音量
        onVolumeChange(newVolume);
      }
    }
  }, [isDragging, updateVolumeFromEvent, onVolumeChange]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    
    const newVolume = updateVolumeFromEvent(e);
    if (newVolume !== undefined) {
      onVolumeChange(newVolume);
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (!isDragging) {
      setShowTooltip(false);
    }
  };

  // 键盘支持
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    const step = 0.05; // 5% steps
    let newVolume = volume;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        newVolume = Math.max(0, volume - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        newVolume = Math.min(1, volume + step);
        break;
      case ' ':
        onToggleMute();
        return;
      default:
        return;
    }

    onVolumeChange(newVolume);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        setShowTooltip(false);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={cn('flex items-center w-64 justify-end', className)}>
      <button
        onClick={onToggleMute}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        title={isMuted ? '取消静音' : '静音'}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>
      
      <div className="ml-2 w-24 relative">
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
            {Math.round((isMuted ? 0 : displayVolume) * 100)}%
          </div>
        )}
        
        <div
          ref={sliderRef}
          className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer group"
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="slider"
          aria-label="音量"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((isMuted ? 0 : displayVolume) * 100)}
        >
          {/* Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-primary-500 rounded-full transition-all duration-100"
            style={{ width: `${displayPercent}%` }}
          />
          
          {/* Thumb */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-500 rounded-full -ml-1.5',
              'transition-all duration-100 shadow-sm',
              (isHovering || isDragging) ? 'opacity-100 scale-110' : 'opacity-0 scale-75'
            )}
            style={{ left: `${displayPercent}%` }}
          />
        </div>
      </div>
      
      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 w-8 text-center">
        {Math.round((isMuted ? 0 : displayVolume) * 100)}
      </span>
    </div>
  );
};

export default VolumeControl;