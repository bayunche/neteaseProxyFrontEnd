import React from 'react';
import { ArrowLeft } from 'lucide-react';
import LyricsArea from '../components/lyrics/LyricsArea';

const LyricsPage: React.FC = () => {
  const handleBackClick = () => {
    window.history.back();
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {/* 返回按钮 */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={handleBackClick}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </button>
      </div>

      {/* 歌词区域 */}
      <LyricsArea />
    </div>
  );
};

export default LyricsPage;