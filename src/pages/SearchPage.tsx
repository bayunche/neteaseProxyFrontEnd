import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { usePlayerStore } from '../stores';
import { cn } from '../utils/cn';
import SearchResults from '../components/search/SearchResults';

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const { 
    search, 
    performSearch, 
    clearSearch, 
    addToSearchHistory,
    clearSearchHistory 
  } = usePlayerStore();

  const { keyword, results, isSearching, history } = search;

  const searchTabs = [
    { id: 'all', label: '综合' },
    { id: 'song', label: '歌曲' },
    { id: 'album', label: '专辑' },
    { id: 'artist', label: '歌手' },
    { id: 'playlist', label: '歌单' }
  ];

  const handleSearch = async (term: string, type: string = 'all') => {
    if (!term.trim()) return;
    
    setSearchTerm(term);
    addToSearchHistory(term);
    await performSearch(term, type);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    clearSearch();
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (searchTerm) {
      handleSearch(searchTerm, tabId);
    }
  };

  useEffect(() => {
    // 如果有搜索关键词，自动执行搜索
    if (keyword && keyword !== searchTerm) {
      setSearchTerm(keyword);
    }
  }, [keyword]);

  return (
    <div className="h-full flex flex-col">
      {/* 搜索头部 */}
      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchTerm, activeTab);
              }
            }}
            placeholder="搜索音乐、歌手、专辑..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 搜索历史 */}
        {!searchTerm && history.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                搜索历史
              </h3>
              <button
                onClick={clearSearchHistory}
                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                清空
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 10).map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(item, activeTab)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 搜索标签 */}
        <div className="flex space-x-1 overflow-x-auto">
          {searchTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索结果 */}
      <div className="flex-1 overflow-hidden">
        {isSearching ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : results ? (
          <SearchResults 
            results={results} 
            activeTab={activeTab}
            searchTerm={searchTerm}
          />
        ) : searchTerm ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <Search className="w-16 h-16 mb-4 opacity-50" />
            <p>没有找到相关结果</p>
            <p className="text-sm">尝试使用其他关键词</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <Search className="w-16 h-16 mb-4 opacity-50" />
            <p>输入关键词开始搜索</p>
            <p className="text-sm">发现更多精彩音乐</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;