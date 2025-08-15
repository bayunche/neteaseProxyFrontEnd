import React from 'react';
import { usePlayerStore } from "@music-player/shared/stores";
import { styled, darkTheme } from '../../styles/stitches.config';
import { motion } from 'framer-motion';
import { GlassContainer } from '../glass/GlassCard';
import Header from './Header';
import Sidebar from './Sidebar';
import PlayerBar from '../player/PlayerBar';
import QueueSidebar from '../player/QueueSidebar';
import LyricsPanel from '../player/LyricsPanel';

// 样式化组件
const AppContainer = styled('div', {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  
  variants: {
    theme: {
      dark: {
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)',
      },
    },
  },
});

const MainLayout = styled(motion.div, {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  position: 'relative',
  zIndex: 1,
});

const ContentArea = styled('div', {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
});

const MainContent = styled('main', {
  flex: 1,
  overflowY: 'auto',
  transition: 'all $normal',
  position: 'relative',
});

const ContentWrapper = styled('div', {
  display: 'flex',
  height: '100%',
});

const PageContent = styled(motion.div, {
  flex: 1,
  minWidth: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all $normal',
  
  '& > div': {
    flex: 1,
    overflow: 'hidden',
  },
});

const LyricsPanelContainer = styled(GlassContainer, {
  width: 384, // w-96 = 24rem = 384px
  borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '0',
  padding: 0,
  margin: 0,
  intensity: 'heavy',
});

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { ui, toggleQueue } = usePlayerStore();
  const { theme, showQueue, showLyrics } = ui;

  return (
    <AppContainer 
      theme={theme === 'dark' ? 'dark' : undefined}
      className={theme === 'dark' ? darkTheme : ''}
    >
      <MainLayout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Header />
        
        {/* Main content area */}
        <ContentArea>
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main content */}
          <MainContent>
            <ContentWrapper>
              {/* Page content */}
              <PageContent
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div>
                  {children}
                </div>
              </PageContent>
              
              {/* Lyrics Panel */}
              {showLyrics && (
                <LyricsPanelContainer
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.3 }}
                >
                  <LyricsPanel />
                </LyricsPanelContainer>
              )}
            </ContentWrapper>
          </MainContent>

          {/* Queue Sidebar */}
          <QueueSidebar 
            isOpen={showQueue}
            onClose={toggleQueue}
          />
        </ContentArea>
        
        {/* Bottom player bar */}
        <PlayerBar />
      </MainLayout>
    </AppContainer>
  );
};

export default Layout;