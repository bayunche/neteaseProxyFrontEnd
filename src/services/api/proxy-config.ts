/**
 * 音频代理配置
 * 支持本地开发和生产环境的代理切换
 */

// 代理服务器配置
export const PROXY_CONFIG = {
  // 本地开发环境代理
  LOCAL: import.meta.env.VITE_AUDIO_PROXY_LOCAL || 'http://localhost:3001',
  
  // 生产环境代理（从环境变量读取或使用默认值）
  PRODUCTION: import.meta.env.VITE_AUDIO_PROXY_PRODUCTION || 'https://audio-proxy.your-domain.com',
  
  // 代理端点路径
  ENDPOINT: '/audio-proxy'
} as const;

/**
 * 获取当前环境的代理服务器地址
 */
export function getProxyBaseUrl(): string {
  // 检测环境
  const isDevelopment = import.meta.env.DEV || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('192.168.');

  return isDevelopment ? PROXY_CONFIG.LOCAL : PROXY_CONFIG.PRODUCTION;
}

/**
 * 获取完整的代理URL
 * @param originalUrl 原始音频URL
 */
export function getProxyUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  
  // 如果已经是代理URL，直接返回
  if (originalUrl.includes('audio-proxy')) {
    return originalUrl;
  }
  
  const baseUrl = getProxyBaseUrl();
  const endpoint = PROXY_CONFIG.ENDPOINT;
  
  return `${baseUrl}${endpoint}?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * 检查代理服务器是否可用
 */
export async function checkProxyHealth(): Promise<boolean> {
  try {
    const baseUrl = getProxyBaseUrl();
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'ok';
    }
    
    return false;
  } catch (error) {
    console.warn('代理服务器健康检查失败:', error);
    return false;
  }
}

/**
 * 代理配置信息
 */
export function getProxyInfo() {
  const baseUrl = getProxyBaseUrl();
  const isDevelopment = baseUrl === PROXY_CONFIG.LOCAL;
  
  return {
    baseUrl,
    endpoint: PROXY_CONFIG.ENDPOINT,
    isDevelopment,
    environment: isDevelopment ? 'development' : 'production',
    healthCheckUrl: `${baseUrl}/health`,
    infoUrl: `${baseUrl}/info`
  };
}