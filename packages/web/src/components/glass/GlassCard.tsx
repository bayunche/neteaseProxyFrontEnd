import React from 'react';
import { styled } from '../../styles/stitches.config';
import { motion } from 'framer-motion';

// 基础毛玻璃容器
export const GlassContainer = styled(motion.div, {
  glass: 'medium',
  position: 'relative',
  overflow: 'hidden',
  
  variants: {
    intensity: {
      light: {
        glass: 'light',
      },
      medium: {
        glass: 'medium',
      },
      heavy: {
        glass: 'heavy',
      },
    },
    
    rounded: {
      none: {
        borderRadius: 'none',
      },
      sm: {
        borderRadius: '$sm',
      },
      md: {
        borderRadius: '$md',
      },
      lg: {
        borderRadius: '$lg',
      },
      xl: {
        borderRadius: '$xl',
      },
      '2xl': {
        borderRadius: '$2xl',
      },
      '3xl': {
        borderRadius: '$3xl',
      },
      full: {
        borderRadius: '$full',
      },
    },

    padding: {
      none: {
        padding: 0,
      },
      sm: {
        padding: '$2',
      },
      md: {
        padding: '$4',
      },
      lg: {
        padding: '$6',
      },
      xl: {
        padding: '$8',
      },
    },

    hover: {
      true: {
        '@hover': {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '$glassHeavy',
            backgroundColor: '$glassMedium',
          },
        },
      },
    },

    glow: {
      true: {
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        },
        
        '&:hover::before': {
          opacity: 1,
        },
      },
    },
  },

  defaultVariants: {
    intensity: 'medium',
    rounded: 'xl',
    padding: 'md',
    hover: false,
    glow: false,
  },
});

// 毛玻璃卡片组件
interface GlassCardProps {
  children: React.ReactNode;
  intensity?: 'light' | 'medium' | 'heavy';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 'medium',
  rounded = 'xl',
  padding = 'md',
  hover = false,
  glow = false,
  className,
  onClick,
  style,
}) => {
  return (
    <GlassContainer
      intensity={intensity}
      rounded={rounded}
      padding={padding}
      hover={hover}
      glow={glow}
      className={className}
      onClick={onClick}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={hover ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {children}
    </GlassContainer>
  );
};

// 专用的播放器玻璃容器
export const PlayerGlassContainer = styled(motion.div, {
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  borderRadius: '$3xl',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '$glassHeavy',
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
  },
});

// 侧边栏玻璃容器
export const SidebarGlassContainer = styled(motion.div, {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(60px)',
  WebkitBackdropFilter: 'blur(60px)',
  borderRadius: '0 $xl $xl 0',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderLeft: 'none',
  boxShadow: '$glass',
  position: 'relative',
  
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '10%',
    right: 0,
    bottom: '10%',
    width: '1px',
    background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.2), transparent)',
  },
});

export default GlassCard;