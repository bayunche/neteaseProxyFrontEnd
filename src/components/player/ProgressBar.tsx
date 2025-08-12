import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { formatTime } from '../../utils/timeFormat';

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
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTime, setTooltipTime] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;
  const displayPercent = isDragging ? dragValue : progressPercent;


  const updateFromEvent = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!progressRef.current || !duration) return null;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const time = (percent / 100) * duration;
    
    return { percent, time };
  }, [duration]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    e.preventDefault();
    
    const result = updateFromEvent(e);
    if (result) {
      setIsDragging(true);
      setDragValue(result.percent);
      setShowTooltip(true);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    const result = updateFromEvent(e);
    if (result) {
      if (isDragging) {
        setDragValue(result.percent);
      }
      // Update tooltip for both dragging and hovering
      setTooltipTime(result.time);
      setTooltipPosition(result.percent);
    }
  }, [isDragging, updateFromEvent]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && duration) {
      const seekTime = (dragValue / 100) * duration;
      onSeek(seekTime);
      setIsDragging(false);
      if (!isHovering) {
        setShowTooltip(false);
      }
    }
  }, [isDragging, dragValue, duration, onSeek, isHovering]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration || isDragging) return;
    
    const result = updateFromEvent(e);
    if (result) {
      onSeek(result.time);
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
      className={cn('flex-1 group cursor-pointer relative', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Tooltip */}
      {showTooltip && duration > 0 && (
        <div 
          className="absolute -top-8 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs px-2 py-1 rounded whitespace-nowrap z-10 transition-all duration-100"
          style={{ left: `${tooltipPosition}%` }}
        >
          {formatTime(tooltipTime)}
        </div>
      )}
      
      <div
        ref={progressRef}
        className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full hover:h-1.5 transition-all duration-150"
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
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
  );
};

export default ProgressBar;