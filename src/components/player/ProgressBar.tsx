import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  buffered?: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  buffered = 0,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;
  const displayPercent = isDragging ? dragValue : progressPercent;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    setIsDragging(true);
    updateDragValue(e);
  };

  const updateDragValue = (e: MouseEvent | React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setDragValue(percent);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updateDragValue(e);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && duration) {
      const seekTime = (dragValue / 100) * duration;
      onSeek(seekTime);
      setIsDragging(false);
    }
  }, [isDragging, dragValue, duration, onSeek]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const seekTime = (percent / 100) * duration;
    onSeek(seekTime);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className={cn('flex-1 group cursor-pointer', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full"
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        {/* Buffered progress */}
        {bufferedPercent > 0 && (
          <div
            className="absolute top-0 left-0 h-full bg-gray-300 dark:bg-gray-600 rounded-full"
            style={{ width: `${bufferedPercent}%` }}
          />
        )}
        
        {/* Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-primary-500 rounded-full transition-all duration-150"
          style={{ width: `${displayPercent}%` }}
        />
        
        {/* Thumb */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-500 rounded-full -ml-1.5',
            'transition-all duration-150',
            (isHovering || isDragging) ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          )}
          style={{ left: `${displayPercent}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;