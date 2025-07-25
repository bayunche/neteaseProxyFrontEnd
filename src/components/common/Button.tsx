import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500 text-white shadow-sm hover:shadow disabled:bg-primary-300',
    secondary: 'bg-gray-100 hover:bg-gray-200 focus:ring-gray-500 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:focus:ring-gray-400',
    ghost: 'hover:bg-gray-100 focus:ring-gray-500 text-gray-700 dark:hover:bg-gray-700 dark:text-gray-300 dark:focus:ring-gray-400',
    danger: 'bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white shadow-sm hover:shadow disabled:bg-red-300'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 className={cn("animate-spin", icon || children ? "mr-2" : "", size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
      )}
      {!loading && icon && (
        <span className={cn("flex-shrink-0", children ? "mr-2" : "", size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};

export default Button;