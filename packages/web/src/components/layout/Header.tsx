import React, { useState, useEffect } from 'react';
import { Search, Menu, Sun, Moon, User, LogOut } from 'lucide-react';
import { usePlayerStore } from "@music-player/shared/stores";
import { styled } from '../../styles/stitches.config';
import { motion } from 'framer-motion';
import { GlassContainer } from '../glass/GlassCard';
import { GlassButton, IconButton } from '../glass/GlassButton';
import LoginModal from '../auth/LoginModal';

// 样式化组件
const HeaderContainer = styled(GlassContainer, {
  height: 64, // h-16 = 4rem = 64px
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingX: '$6',
  position: 'sticky',
  top: 0,
  zIndex: 50,
  borderRadius: 0,
  border: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  intensity: 'heavy',
  
  backdropFilter: 'blur(80px)',
  WebkitBackdropFilter: 'blur(80px)',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
});

const HeaderSection = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$4',
});

const Logo = styled(motion.div, {
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
});

const LogoIcon = styled('div', {
  width: 32,
  height: 32,
  background: 'linear-gradient(135deg, $primary500, $primary600)',
  borderRadius: '$lg',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
  
  '& span': {
    color: '$white',
    fontWeight: '$bold',
    fontSize: '$sm',
  },
});

const LogoText = styled('span', {
  fontWeight: '$bold',
  fontSize: '$lg',
  color: '$white',
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  
  '@mobile': {
    display: 'none',
  },
});

const SearchContainer = styled('div', {
  flex: 1,
  maxWidth: 512, // max-w-2xl = 42rem = 672px -> 调整为更合理的宽度
  marginX: '$8',
  position: 'relative',
});

const SearchInput = styled('input', {
  width: '100%',
  paddingLeft: 40, // pl-10 = 2.5rem = 40px
  paddingRight: '$4',
  paddingY: '$2',
  glass: 'light',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '$lg',
  fontSize: '$sm',
  color: '$white',
  
  '&::placeholder': {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  
  '&:focus': {
    outline: 'none',
    border: '1px solid $primary500',
    boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
    glass: 'medium',
  },
  
  transition: 'all $normal',
});

const SearchIcon = styled(Search, {
  position: 'absolute',
  left: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'rgba(255, 255, 255, 0.4)',
  size: 16,
  pointerEvents: 'none',
});

const UserMenuContainer = styled('div', {
  position: 'relative',
});

const UserMenuDropdown = styled(motion.div, {
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 8px)',
  width: 192, // w-48 = 12rem = 192px
  glass: 'heavy',
  borderRadius: '$lg',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '$2',
  zIndex: 50,
  boxShadow: '$glassHeavy',
});

const UserInfo = styled('div', {
  padding: '$4 $4 $2 $4',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: '$2',
  
  '& .name': {
    fontSize: '$sm',
    fontWeight: '$medium',
    color: '$white',
    marginBottom: '$1',
  },
  
  '& .id': {
    fontSize: '$xs',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

const UserAvatar = styled('div', {
  width: 32,
  height: 32,
  background: 'linear-gradient(135deg, $primary500, $primary600)',
  borderRadius: '$full',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
  
  '& span': {
    color: '$white',
    fontSize: '$sm',
    fontWeight: '$medium',
  },
});

const UserButton = styled(motion.button, {
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  padding: '$2',
  glass: 'light',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '$lg',
  cursor: 'pointer',
  transition: 'all $normal',
  
  '&:hover': {
    glass: 'medium',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  
  '& .username': {
    fontSize: '$sm',
    fontWeight: '$medium',
    color: '$white',
    
    '@mobile': {
      display: 'none',
    },
  },
});

const LogoutButton = styled(motion.button, {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
  padding: '$2 $4',
  fontSize: '$sm',
  color: 'rgba(255, 255, 255, 0.8)',
  background: 'transparent',
  border: 'none',
  borderRadius: '$md',
  cursor: 'pointer',
  transition: 'all $normal',
  
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '$white',
  },
});

const Header: React.FC = () => {
  const { ui, user, toggleSidebar, setTheme, logout, checkLoginStatus } = usePlayerStore();
  const { theme } = ui;
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 组件加载时检查登录状态
  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  return (
    <HeaderContainer
      as="header"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <HeaderSection>
        {/* Menu toggle for mobile */}
        <IconButton
          onClick={toggleSidebar}
          size="sm"
          variant="ghost"
          css={{ '@desktop': { display: 'none' } }}
        >
          <Menu size={20} />
        </IconButton>
        
        {/* Logo */}
        <Logo
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogoIcon>
            <span>M</span>
          </LogoIcon>
          <LogoText>音乐播放器</LogoText>
        </Logo>
      </HeaderSection>
      
      {/* Search bar */}
      <SearchContainer>
        <SearchIcon />
        <SearchInput
          type="text"
          placeholder="搜索歌曲、歌手、专辑..."
        />
      </SearchContainer>
      
      <HeaderSection>
        {/* Theme toggle */}
        <IconButton
          onClick={handleThemeToggle}
          size="sm"
          variant="ghost"
          title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
        >
          {theme === 'light' ? (
            <Moon size={20} />
          ) : (
            <Sun size={20} />
          )}
        </IconButton>

        {/* User section */}
        {user.isLoggedIn ? (
          <UserMenuContainer>
            <UserButton
              onClick={() => setShowUserMenu(!showUserMenu)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserAvatar>
                <span>
                  {user.profile?.nickname?.charAt(0) || 'U'}
                </span>
              </UserAvatar>
              <span className="username">
                {user.profile?.nickname || '用户'}
              </span>
            </UserButton>

            {/* User menu dropdown */}
            {showUserMenu && (
              <UserMenuDropdown
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <UserInfo>
                  <div className="name">
                    {user.profile?.nickname || '用户'}
                  </div>
                  <div className="id">
                    ID: {user.profile?.userId}
                  </div>
                </UserInfo>
                <LogoutButton
                  onClick={handleLogout}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <LogOut size={16} />
                  <span>登出</span>
                </LogoutButton>
              </UserMenuDropdown>
            )}
          </UserMenuContainer>
        ) : (
          <GlassButton
            variant="primary"
            size="sm"
            glow
            onClick={() => setShowLoginModal(true)}
          >
            <User size={16} />
            <span>登录</span>
          </GlassButton>
        )}
      </HeaderSection>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </HeaderContainer>
  );
};

export default Header;