import React, { useState } from 'react';
import { SearchAPI } from '../../services/api/SearchAPI';
import { SongAPI } from '../../services/api/SongAPI';
import { AuthAPI } from '../../services/api/AuthAPI';
import { SearchType } from '../../services/api/types';
import { Button, Input, Loading } from '../common';
import { LoginPanel } from '../auth/LoginPanel';

interface APITestPanelProps {
  className?: string;
}

/**
 * API测试面板组件
 * 用于测试和验证API服务层功能
 */
export const APITestPanel: React.FC<APITestPanelProps> = ({ className = '' }) => {
  const [searchKeyword, setSearchKeyword] = useState('周杰伦');
  const [songId, setSongId] = useState('186016');
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 清除结果
  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  // 执行API测试
  const executeTest = async (testName: string, testFn: () => Promise<unknown>) => {
    setLoading(testName);
    setError(null);
    setResults(null);

    try {
      const result = await testFn();
      setResults(result as Record<string, unknown>);
      console.log(`${testName} 成功:`, result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(`${testName} 失败: ${errorMessage}`);
      console.error(`${testName} 失败:`, err);
    } finally {
      setLoading(null);
    }
  };

  // 测试搜索功能
  const testSearch = async () => {
    await executeTest('搜索测试', async () => {
      return await SearchAPI.search(searchKeyword, SearchType.SONG, 5);
    });
  };

  // 测试歌曲URL获取
  const testSongUrl = async () => {
    await executeTest('歌曲URL测试', async () => {
      return await SongAPI.getSongUrl(Number(songId));
    });
  };

  // 测试歌曲详情获取
  const testSongDetail = async () => {
    await executeTest('歌曲详情测试', async () => {
      return await SongAPI.getSingleSongDetail(Number(songId));
    });
  };

  // 测试搜索建议
  const testSearchSuggestions = async () => {
    await executeTest('搜索建议测试', async () => {
      return await SearchAPI.getSearchSuggestions(searchKeyword);
    });
  };

  // 测试热门搜索
  const testHotSearch = async () => {
    await executeTest('热门搜索测试', async () => {
      return await SearchAPI.getHotSearchKeywords();
    });
  };

  // 测试API连接状态
  const testApiConnection = async () => {
    await executeTest('API连接测试', async () => {
      // 使用一个简单的搜索请求来测试连接
      const result = await SearchAPI.search('test', SearchType.SONG, 1);
      return {
        connected: true,
        environment: import.meta.env.DEV ? 'development' : 'production',
        proxyPath: import.meta.env.DEV ? '/api → http://8.134.196.44:8210' : 'direct',
        server: import.meta.env.DEV ? 'Vite Proxy' : 'http://8.134.196.44:8210',
        testResult: result,
        timestamp: new Date().toISOString()
      };
    });
  };

  // 测试登录状态
  const testLoginStatus = async () => {
    await executeTest('登录状态检查', async () => {
      return {
        isLoggedIn: AuthAPI.isLoggedIn(),
        currentUser: AuthAPI.getCurrentUser(),
        authToken: AuthAPI.getAuthToken() ? '已设置' : '未设置',
        loginCookie: AuthAPI.getLoginCookie() ? '已设置' : '未设置'
      };
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 登录面板 */}
      <LoginPanel onLoginSuccess={(user) => console.log('登录成功:', user)} />
      
      {/* API测试面板 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 API服务层测试面板</h3>
          <p className="text-sm text-gray-600 mb-4">
            测试NetEase Music API集成功能，验证服务器连接和数据获取
          </p>
        </div>

      {/* 测试输入 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            搜索关键词
          </label>
          <Input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="输入搜索关键词"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            歌曲ID
          </label>
          <Input
            value={songId}
            onChange={(e) => setSongId(e.target.value)}
            placeholder="输入歌曲ID"
            className="w-full"
          />
        </div>
      </div>

      {/* 测试按钮 */}
      <div className="space-y-4 mb-6">
        {/* 基础API测试 */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">🔧 基础功能测试</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={testApiConnection}
              disabled={loading !== null}
              className="w-full"
              variant="primary"
            >
              🌐 API连接测试
            </Button>
            <Button
              onClick={testLoginStatus}
              disabled={loading !== null}
              className="w-full"
              variant="primary"
            >
              👤 登录状态检查
            </Button>
          </div>
        </div>

        {/* 搜索功能测试 */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">🔍 搜索功能测试</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={testSearch}
              disabled={loading !== null || !searchKeyword.trim()}
              className="w-full"
              variant="primary"
            >
              🔍 测试搜索
            </Button>
            <Button
              onClick={testSearchSuggestions}
              disabled={loading !== null || !searchKeyword.trim()}
              className="w-full"
              variant="secondary"
            >
              💡 搜索建议
            </Button>
            <Button
              onClick={testHotSearch}
              disabled={loading !== null}
              className="w-full"
              variant="secondary"
            >
              🔥 热门搜索
            </Button>
          </div>
        </div>

        {/* 歌曲功能测试 */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">🎵 歌曲功能测试</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={testSongUrl}
              disabled={loading !== null || !songId.trim()}
              className="w-full"
              variant="primary"
            >
              🎵 测试歌曲URL
            </Button>
            <Button
              onClick={testSongDetail}
              disabled={loading !== null || !songId.trim()}
              className="w-full"
              variant="primary"
            >
              📄 测试歌曲详情
            </Button>
          </div>
        </div>

        {/* 工具按钮 */}
        <div className="flex justify-center">
          <Button
            onClick={clearResults}
            disabled={loading !== null}
            className="px-6"
            variant="secondary"
          >
            🗑️ 清除结果
          </Button>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="mb-6">
          <Loading size="sm" text={`正在执行: ${loading}...`} />
        </div>
      )}

      {/* 错误显示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="text-red-400">❌</div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800">API测试失败</h4>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 结果显示 */}
      {results && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">✅ API测试结果</h4>
            <span className="text-xs text-gray-500">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <pre className="text-xs text-gray-700 overflow-auto max-h-96 bg-white p-3 border rounded">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

        {/* API状态信息 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">📊 API服务状态</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• 开发环境: 通过Vite代理 (/api → http://8.134.196.44:8210)</div>
            <div>• 生产环境: 直接访问 http://8.134.196.44:8210</div>
            <div>• 音频代理: http://8.134.196.44:3001</div>
            <div>• 超时设置: 15秒 | 重试次数: 2次</div>
          </div>
        </div>
      </div>
    </div>
  );
};