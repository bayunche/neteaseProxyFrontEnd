import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  overlay?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  overlay = false,
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const content = (
    <div className={cn(
      "flex items-center justify-center",
      overlay ? "flex-col" : "space-x-2",
      className
    )}>
      <Loader2 className={cn(
        "animate-spin text-primary-500",
        sizeClasses[size],
        overlay && text && "mb-2"
      )} />
      {text && (
        <span className={cn(
          "text-gray-600 dark:text-gray-400",
          textSizeClasses[size]
        )}>
          {text}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-80 dark:bg-opacity-80 z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// 页面级别的加载组件
export const PageLoading: React.FC<{ text?: string }> = ({ text = "加载中..." }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loading size="lg" text={text} />
  </div>
);

// 内联加载组件
export const InlineLoading: React.FC<{ text?: string }> = ({ text }) => (
  <Loading size="sm" text={text} />
);

// 按钮加载状态
export const ButtonLoading: React.FC = () => (
  <Loader2 className="w-4 h-4 animate-spin" />
);

export default Loading;