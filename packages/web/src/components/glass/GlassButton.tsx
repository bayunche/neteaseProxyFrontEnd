import React from 'react';
import { styled } from '../../styles/stitches.config';
import { motion } from 'framer-motion';

// 毛玻璃按钮基础样式
export const GlassButtonBase = styled(motion.button, {
  // 重置默认样式
  border: 'none',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  
  // 毛玻璃效果
  glass: 'light',
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  
  // 字体样式
  fontSize: '$sm',
  fontWeight: '$medium',
  color: '$white',
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
  
  // 过渡效果
  transition: 'all $normal',
  
  // 悬停效果
  '@hover': {
    '&:hover': {
      backgroundColor: '$glassMedium',
      transform: 'translateY(-1px)',
      boxShadow: '$glassHeavy',
    },
  },
  
  // 按下效果
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: '$glass',
  },
  
  // 禁用状态
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
  },

  variants: {
    size: {
      sm: {
        padding: '$1 $3',
        fontSize: '$xs',
        borderRadius: '$md',
      },
      md: {
        padding: '$2 $4',
        fontSize: '$sm',
        borderRadius: '$lg',
      },
      lg: {
        padding: '$3 $6',
        fontSize: '$base',
        borderRadius: '$xl',
      },
      xl: {
        padding: '$4 $8',
        fontSize: '$lg',
        borderRadius: '$2xl',
      },
    },

    variant: {
      primary: {
        backgroundColor: '$primary500',
        border: '1px solid $primary400',
        
        '@hover': {
          '&:hover': {
            backgroundColor: '$primary600',
          },
        },
      },
      secondary: {
        glass: 'medium',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      },
      ghost: {
        backgroundColor: 'transparent',
        border: '1px solid transparent',
        
        '@hover': {
          '&:hover': {
            backgroundColor: '$glassLight',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        },
      },
      danger: {
        backgroundColor: '$error',
        border: '1px solid rgba(239, 68, 68, 0.5)',
        
        '@hover': {
          '&:hover': {
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
          },
        },
      },
    },

    rounded: {
      true: {
        borderRadius: '$full',
      },
    },

    glow: {
      true: {
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.3), $glass',
        
        '@hover': {
          '&:hover': {
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.5), $glassHeavy',
          },
        },
      },
    },
  },

  defaultVariants: {
    size: 'md',
    variant: 'secondary',
    rounded: false,
    glow: false,
  },
});

// 图标按钮样式
export const IconButton = styled(GlassButtonBase, {
  size: 40,
  padding: 0,
  borderRadius: '$full',
  
  variants: {
    size: {
      sm: {
        size: 32,
      },
      md: {
        size: 40,
      },
      lg: {
        size: 48,
      },
      xl: {
        size: 56,
      },
    },
  },

  defaultVariants: {
    size: 'md',
    variant: 'secondary',
  },
});

// 播放按钮专用样式
export const PlayButton = styled(IconButton, {
  backgroundColor: '$primary500',
  border: '2px solid $primary400',
  boxShadow: '0 0 20px rgba(239, 68, 68, 0.4), $glass',
  
  '@hover': {
    '&:hover': {
      backgroundColor: '$primary600',
      boxShadow: '0 0 30px rgba(239, 68, 68, 0.6), $glassHeavy',
      transform: 'translateY(-2px) scale(1.05)',
    },
  },
  
  '&:active': {
    transform: 'scale(0.95)',
  },
});

// 毛玻璃按钮组件接口
interface GlassButtonProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  rounded?: boolean;
  glow?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  size = 'md',
  variant = 'secondary',
  rounded = false,
  glow = false,
  disabled = false,
  onClick,
  className,
  type = 'button',
}) => {
  return (
    <GlassButtonBase
      size={size}
      variant={variant}
      rounded={rounded}
      glow={glow}
      disabled={disabled}
      onClick={onClick}
      className={className}
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </GlassButtonBase>
  );
};

export default GlassButton;