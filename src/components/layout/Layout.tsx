import React from 'react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';
import Header from './Header';
import Sidebar from './Sidebar';
import PlayerBar from '../player/PlayerBar';
import QueueSidebar from '../player/QueueSidebar';
import LyricsPanel from '../player/LyricsPanel';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { ui, toggleQueue } = usePlayerStore();
  const { theme, showQueue, showLyrics } = ui;

  return (
    <div className={cn('min-h-screen', theme === 'dark' && 'dark')}>
      <div className="flex flex-col h-screen bg-background dark:bg-darkBackground">
        {/* Header */}
        <Header />
        
        {/* Main content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar />
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto transition-all duration-300 ease-out">
            <div className="flex h-full">
              {/* Page content */}
              <div className={cn(
                'transition-all duration-300 h-full flex flex-col',
                'flex-1 min-w-0' // 确保内容区域可以收缩
              )}>
                <div className="flex-1 overflow-hidden">
                  {children}
                </div>
              </div>
              
              {/* Lyrics Panel */}
              {showLyrics && (
                <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <LyricsPanel />
                </div>
              )}
            </div>
          </main>

          {/* Queue Sidebar */}
          <QueueSidebar 
            isOpen={showQueue}
            onClose={toggleQueue}
          />
        </div>
        
        {/* Bottom player bar */}
        <PlayerBar />
      </div>
    </div>
  );
};

export default Layout;