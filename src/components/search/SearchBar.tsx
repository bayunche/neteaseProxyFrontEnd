import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from '../../stores';
import { SearchAPI } from '../../services/api';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  className,
  placeholder = "搜索音乐、歌手、专辑",
  onFocus,
  onBlur
}) => {
  const {
    search,
    performSearch,
    clearSearch,
    addToSearchHistory
  } = usePlayerStore();

  const [localValue, setLocalValue] = useState(search.keyword || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hotSuggestions, setHotSuggestions] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setLocalValue(search.keyword || '');
  }, [search.keyword]);

  // 加载热门搜索关键词
  useEffect(() => {
    const loadHotSuggestions = async () => {
      try {
        const suggestions = await SearchAPI.getHotSearchKeywords();
        setHotSuggestions(suggestions);
      } catch (error) {
        console.warn('获取热门搜索失败:', error);
        // 使用默认热门搜索
        setHotSuggestions([
          "周杰伦",
          "稻香", 
          "告白气球",
          "晴天",
          "青花瓷"
        ]);
      }
    };

    loadHotSuggestions();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);

    // 防抖搜索建议
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      searchTimeoutRef.current = window.setTimeout(async () => {
        await loadSearchSuggestions(value.trim());
      }, 300);
    } else {
      setSearchSuggestions([]);
    }
  };

  // 加载搜索建议
  const loadSearchSuggestions = async (keywords: string) => {
    if (!keywords.trim()) return;

    setIsLoadingSuggestions(true);
    try {
      const suggestions = await SearchAPI.getSearchSuggestions(keywords, 8);
      setSearchSuggestions(suggestions);
    } catch (error) {
      console.warn('获取搜索建议失败:', error);
      setSearchSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && localValue?.trim()) {
      e.preventDefault();
      handleSearch(localValue?.trim() || '');
    }
  };

  // 执行搜索
  const handleSearch = async (keywords: string) => {
    if (!keywords.trim()) return;

    try {
      performSearch(keywords);
      addToSearchHistory(keywords);
      setShowSuggestions(false);
      inputRef.current?.blur();
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalValue(suggestion);
    handleSearch(suggestion);
  };

  const handleClear = () => {
    setLocalValue('');
    clearSearch();
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setShowSuggestions(true);
    onFocus?.();
  };

  const handleBlur = () => {
    // 延迟隐藏建议，以便点击建议项
    setTimeout(() => {
      setShowSuggestions(false);
      onBlur?.();
    }, 150);
  };

  return (
    <div className={cn("relative", className)}>
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "w-full pl-10 pr-10 py-2.5 text-sm",
            "bg-gray-50 dark:bg-gray-800",
            "border border-gray-200 dark:border-gray-600",
            "rounded-full",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
            "transition-all duration-200",
            "placeholder-gray-500 dark:placeholder-gray-400",
            "text-gray-900 dark:text-white"
          )}
        />
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        )}
        {(search.isSearching || isLoadingSuggestions) && !localValue && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* 搜索建议下拉框 */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 max-h-80 overflow-y-auto">
          {/* 搜索建议 */}
          {localValue?.trim() && searchSuggestions.length > 0 && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                <Search className="w-3 h-3 mr-1" />
                搜索建议
                {isLoadingSuggestions && (
                  <div className="ml-2 w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              <div className="space-y-1">
                {searchSuggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 搜索历史 */}
          {search.history.length > 0 && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                <Clock className="w-3 h-3 mr-1" />
                搜索历史
              </div>
              <div className="flex flex-wrap gap-1">
                {search.history.slice(0, 5).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 热门搜索 */}
          {(!localValue?.trim() || searchSuggestions.length === 0) && hotSuggestions.length > 0 && (
            <div className="p-3">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                <TrendingUp className="w-3 h-3 mr-1" />
                热门搜索
              </div>
              <div className="space-y-1">
                {hotSuggestions.slice(0, 8).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item)}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors flex items-center"
                  >
                    <span className="flex-shrink-0 w-4 text-xs text-gray-400 mr-2">
                      {index + 1}
                    </span>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {localValue?.trim() && !isLoadingSuggestions && searchSuggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              暂无搜索建议
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;