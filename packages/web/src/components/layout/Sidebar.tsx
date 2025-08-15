import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Heart, 
  Clock, 
  Music, 
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Library,
  Settings
} from 'lucide-react';
import { usePlayerStore } from "@music-player/shared/stores";
import { styled } from '../../styles/stitches.config';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarGlassContainer } from '../glass/GlassCard';
import { IconButton } from '../glass/GlassButton';
import { navigationItems } from '../../router';

// 图标映射
const iconMap = {
  Home,
  Search,
  Heart,
  Clock,
  Music,
  Library,
  BarChart: BarChart3,
  Settings
};

// 样式化组件
const SidebarWrapper = styled('div', {
  position: 'relative',
  zIndex: 30,
});

const SidebarContainer = styled(SidebarGlassContainer, {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  
  '@desktop': {
    position: 'relative',
    height: '100%',
    flexShrink: 0,
    transition: 'width $normal',
  },
  
  '@mobile': {
    position: 'fixed',
    left: 0,
    top: 64, // Header height
    height: 'calc(100vh - 8rem)', // Full height minus header and player bar
    zIndex: 50,
    transition: 'transform $normal',
  },
  
  variants: {
    collapsed: {
      true: {
        '@desktop': {
          width: 64, // w-16
        },
        '@mobile': {
          transform: 'translateX(-100%)',
          width: 256, // w-64
        },
      },
      false: {
        '@desktop': {
          width: 256, // w-64
        },
        '@mobile': {
          transform: 'translateX(0)',
          width: 256, // w-64
        },
      },
    },
  },
});

const SidebarHeader = styled('div', {
  flexShrink: 0,
  display: 'flex',
  padding: '$2',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'justify-content $normal',
  
  variants: {
    collapsed: {
      true: {
        justifyContent: 'center',
      },
      false: {
        justifyContent: 'flex-end',
      },
    },
  },
});

const NavigationSection = styled('div', {
  flexShrink: 0,
  padding: '$2 $2 $4 $2',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
});

const NavigationList = styled('ul', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$1',
});

const NavigationItem = styled(motion.button, {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  padding: '$3',
  borderRadius: '$lg',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  color: 'rgba(255, 255, 255, 0.8)',
  transition: 'all $normal',
  position: 'relative',
  
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '$white',
    transform: 'scale(1.02)',
  },
  
  '&:active': {
    transform: 'scale(0.98)',
  },
  
  variants: {
    active: {
      true: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        color: '$primary400',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
        
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '20%',
          bottom: '20%',
          width: '3px',
          background: '$primary500',
          borderRadius: '0 2px 2px 0',
        },
      },
    },
    collapsed: {
      true: {
        justifyContent: 'center',
        paddingX: '$3',
        paddingY: '$3',
      },
      false: {
        justifyContent: 'flex-start',
        paddingX: '$3',
        paddingY: '$3',
      },
    },
  },
});

const NavigationIcon = styled('div', {
  width: 20,
  height: 20,
  flexShrink: 0,
  transition: 'transform $normal',
  
  variants: {
    collapsed: {
      true: {
        '&:hover': {
          transform: 'scale(1.1)',
        },
      },
    },
  },
});

const NavigationText = styled('span', {
  marginLeft: '$3',
  fontWeight: '$medium',
  fontSize: '$sm',
  transition: 'all $normal',
});

const Tooltip = styled('div', {
  position: 'absolute',
  left: 'calc(100% + 8px)',
  paddingX: '$2',
  paddingY: '$1',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  color: '$white',
  fontSize: '$xs',
  borderRadius: '$md',
  whiteSpace: 'nowrap',
  zIndex: 50,
  pointerEvents: 'none',
  opacity: 0,
  transition: 'opacity $normal',
  
  '$NavigationItem:hover &': {
    opacity: 1,
  },
});

const PlaylistSection = styled('div', {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
});

const PlaylistHeader = styled('div', {
  flexShrink: 0,
  padding: '$2 $2 $4 $2',
});

const PlaylistHeaderContent = styled('div', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingX: '$3',
  marginBottom: '$2',
});

const PlaylistTitle = styled('h3', {
  fontSize: '$sm',
  fontWeight: '$medium',
  color: 'rgba(255, 255, 255, 0.6)',
});

const PlaylistActions = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$1',
});

const PlaylistContent = styled('div', {
  flex: 1,
  overflowY: 'auto',
  paddingX: '$2',
  paddingBottom: '$4',
});

const PlaylistGrid = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$0_5',
});

const PlaylistItemButton = styled(motion.button, {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  padding: '$3',
  borderRadius: '$xl',
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  color: 'rgba(255, 255, 255, 0.8)',
  transition: 'all $normal',
  
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '$glass',
    color: '$white',
  },
  
  '&:focus': {
    outline: 'none',
    boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)',
  },
});

const PlaylistCover = styled('div', {
  width: 44, // 11 * 4 = 44px
  height: 44,
  flexShrink: 0,
  marginRight: '$3',
  position: 'relative',
  borderRadius: '$xl',
  overflow: 'hidden',
});

const PlaylistCoverImg = styled('img', {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  transition: 'transform $normal',
  
  '$PlaylistItemButton:hover &': {
    transform: 'scale(1.05)',
  },
});

const PlaylistCoverPlaceholder = styled('div', {
  width: '100%',
  height: '100%',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255, 255, 255, 0.4)',
});

const PlaylistInfo = styled('div', {
  flex: 1,
  minWidth: 0,
  textAlign: 'left',
});

const PlaylistName = styled('p', {
  fontSize: '$sm',
  fontWeight: '$medium',
  color: 'inherit',
  marginBottom: '$0_5',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  transition: 'color $normal',
  
  '$PlaylistItemButton:hover &': {
    color: '$primary400',
  },
});

const PlaylistMeta = styled('div', {
  display: 'flex',
  alignItems: 'center',
  fontSize: '$xs',
  color: 'rgba(255, 255, 255, 0.5)',
  
  '& span': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  
  '& .separator': {
    marginX: '$1',
  },
});

const MobileBackdrop = styled(motion.div, {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  zIndex: 10,
  
  '@desktop': {
    display: 'none',
  },
});

const EmptyState = styled('div', {
  padding: '$8 $3',
  textAlign: 'center',
  color: 'rgba(255, 255, 255, 0.5)',
  
  '& .icon': {
    width: 48,
    height: 48,
    margin: '0 auto $3',
    opacity: 0.5,
  },
  
  '& .title': {
    fontSize: '$sm',
    fontWeight: '$medium',
    marginBottom: '$1',
  },
  
  '& .subtitle': {
    fontSize: '$xs',
  },
});

const CollapsedPlaylistIndicator = styled('div', {
  flexShrink: 0,
  padding: '$2 $2 $4 $2',
});

const CollapsedPlaylistIcon = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  position: 'relative',
});

const PlaylistBadge = styled(motion.div, {
  width: 40,
  height: 40,
  background: 'linear-gradient(135deg, $primary500, $primary600)',
  borderRadius: '$xl',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '$white',
  cursor: 'pointer',
  boxShadow: '$glass',
  transition: 'all $normal',
  
  '&:hover': {
    boxShadow: '$glassHeavy',
    transform: 'scale(1.05)',
  },
});

const PlaylistCount = styled('div', {
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: '$error',
  color: '$white',
  fontSize: '$xs',
  borderRadius: '$full',
  minWidth: 18,
  height: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '$medium',
  boxShadow: '$glass',
});

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ui, user, toggleSidebar, loadUserPlaylists } = usePlayerStore();
  const { sidebarCollapsed } = ui;
  const { playlists, isLoggedIn } = user;

  // 处理歌单点击 - 导航到歌单详情页面
  const handlePlaylistClick = (playlistId: string) => {
    console.log(`导航到歌单详情页面: ${playlistId}`);
    navigate(`/playlist/${playlistId}`);
  };

  // 登录状态变化时加载歌单
  useEffect(() => {
    if (isLoggedIn && playlists.length === 0) {
      loadUserPlaylists();
    }
  }, [isLoggedIn, loadUserPlaylists, playlists.length]);

  // 检查当前路径是否激活
  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarWrapper>
      {/* Sidebar */}
      <SidebarContainer
        as="aside"
        collapsed={sidebarCollapsed}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Toggle button */}
        <SidebarHeader collapsed={sidebarCollapsed}>
          <IconButton
            onClick={toggleSidebar}
            size="sm"
            variant="ghost"
            title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronLeft size={16} />
            )}
          </IconButton>
        </SidebarHeader>
        
        {/* Navigation - Fixed */}
        <NavigationSection>
          <NavigationList>
            {navigationItems.map((item) => {
              const IconComponent = iconMap[item.icon as keyof typeof iconMap] || Home;
              const isActive = isActiveRoute(item.path);
              
              return (
                <li key={item.path}>
                  <NavigationItem
                    onClick={() => navigate(item.path)}
                    active={isActive}
                    collapsed={sidebarCollapsed}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <NavigationIcon collapsed={sidebarCollapsed}>
                      <IconComponent size={20} />
                    </NavigationIcon>
                    {!sidebarCollapsed && (
                      <NavigationText>
                        {item.title}
                      </NavigationText>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {sidebarCollapsed && (
                      <Tooltip>
                        {item.title}
                      </Tooltip>
                    )}
                  </NavigationItem>
                </li>
              );
            })}
          </NavigationList>
        </NavigationSection>
        
        {/* Playlists section indicator for collapsed state */}
        {sidebarCollapsed && (
          <CollapsedPlaylistIndicator>
            <CollapsedPlaylistIcon>
              <PlaylistBadge
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Music size={20} />
                {playlists.length > 0 && (
                  <PlaylistCount>
                    {playlists.length > 99 ? '99+' : playlists.length}
                  </PlaylistCount>
                )}
                
                {/* Tooltip */}
                <Tooltip>
                  我的歌单 ({playlists.length})
                </Tooltip>
              </PlaylistBadge>
            </CollapsedPlaylistIcon>
          </CollapsedPlaylistIndicator>
        )}
        
        {/* Playlists section - Scrollable */}
        {!sidebarCollapsed && (
          <PlaylistSection>
            {/* Playlists header - Fixed */}
            <PlaylistHeader>
              <PlaylistHeaderContent>
                <PlaylistTitle>
                  我的歌单
                </PlaylistTitle>
                <PlaylistActions>
                  {isLoggedIn && (
                    <IconButton
                      onClick={loadUserPlaylists}
                      size="sm"
                      variant="ghost"
                      title="刷新歌单"
                    >
                      <RefreshCw size={16} />
                    </IconButton>
                  )}
                  <IconButton
                    size="sm"
                    variant="ghost"
                    title="创建歌单"
                  >
                    <Plus size={16} />
                  </IconButton>
                </PlaylistActions>
              </PlaylistHeaderContent>
            </PlaylistHeader>

            {/* Playlists content - Scrollable */}
            <PlaylistContent>
              {!isLoggedIn ? (
                <EmptyState>
                  <Music className="icon" />
                  <p className="title">登录后查看您的歌单</p>
                  <p className="subtitle">发现更多精彩音乐内容</p>
                </EmptyState>
              ) : (
                <PlaylistGrid>
                  <AnimatePresence>
                    {playlists.map((playlist, index) => (
                      <motion.div 
                        key={playlist.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <PlaylistItemButton
                          onClick={() => handlePlaylistClick(playlist.id)}
                          title={`${playlist.title} - ${playlist.creator}`}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <PlaylistCover>
                            {playlist.coverUrl ? (
                              <PlaylistCoverImg
                                src={playlist.coverUrl}
                                alt={playlist.title}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDQiIGhlaWdodD0iNDQiIHZpZXdCb3g9IjAgMCA0NCA0NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ0IiBoZWlnaHQ9IjQ0IiBmaWxsPSIjRjNGNEY2IiByeD0iOCIvPgo8cGF0aCBkPSJNMjIgMzNDMjguNSAxNiAzMyAyMiAyOC41IDIyQzI4LjUgMjguNSAyMiAzMyAyMiAzM1oiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+Cg==';
                                }}
                              />
                            ) : (
                              <PlaylistCoverPlaceholder>
                                <Music size={20} />
                              </PlaylistCoverPlaceholder>
                            )}
                            
                            {/* 播放指示器 */}
                            <motion.div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0, 0, 0, 0)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                              }}
                              whileHover={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                opacity: 1,
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              <motion.div
                                style={{
                                  width: 24,
                                  height: 24,
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                                }}
                                whileHover={{ scale: 1.1 }}
                              >
                                <Music size={12} color="rgba(0, 0, 0, 0.8)" />
                              </motion.div>
                            </motion.div>
                          </PlaylistCover>
                          
                          <PlaylistInfo>
                            <PlaylistName>
                              {playlist.title}
                            </PlaylistName>
                            <PlaylistMeta>
                              <span>
                                {playlist.trackCount !== undefined ? `${playlist.trackCount}首` : `${playlist.songs.length}首`}
                              </span>
                              {playlist.creator && (
                                <>
                                  <span className="separator">·</span>
                                  <span>{playlist.creator}</span>
                                </>
                              )}
                            </PlaylistMeta>
                          </PlaylistInfo>
                          
                          {/* 右侧箭头 */}
                          <motion.div
                            style={{ 
                              flexShrink: 0,
                              opacity: 0,
                              color: 'rgba(255, 255, 255, 0.4)'
                            }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight size={16} />
                          </motion.div>
                        </PlaylistItemButton>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {playlists.length === 0 && (
                    <EmptyState>
                      <Music className="icon" />
                      <p className="title">暂无歌单</p>
                      <p className="subtitle">点击上方 + 创建歌单</p>
                    </EmptyState>
                  )}
                </PlaylistGrid>
              )}
            </PlaylistContent>
          </PlaylistSection>
        )}
      </SidebarContainer>
      
      {/* Mobile backdrop */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <MobileBackdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>
    </SidebarWrapper>
  );
};

export default Sidebar;