import { APIError, APIErrorType } from './types';
import { HTTP_STATUS, NETEASE_CODE } from './config';

// 延迟工具函数
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// 构建查询参数字符串
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
};

// 构建完整URL
export const buildURL = (baseURL: string, path: string, params?: Record<string, any>): string => {
  const url = `${baseURL}${path}`;
  
  if (params && Object.keys(params).length > 0) {
    const queryString = buildQueryString(params);
    return `${url}?${queryString}`;
  }
  
  return url;
};

// HTTP错误处理
export const handleHTTPError = (status: number, statusText: string): APIError => {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return new APIError(APIErrorType.VALIDATION_ERROR, '请求参数错误', status);
    case HTTP_STATUS.UNAUTHORIZED:
      return new APIError(APIErrorType.UNAUTHORIZED, '未授权，请先登录', status);
    case HTTP_STATUS.FORBIDDEN:
      return new APIError(APIErrorType.FORBIDDEN, '访问被拒绝', status);
    case HTTP_STATUS.NOT_FOUND:
      return new APIError(APIErrorType.NOT_FOUND, '请求的资源不存在', status);
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return new APIError(APIErrorType.SERVER_ERROR, '服务器内部错误', status);
    case HTTP_STATUS.BAD_GATEWAY:
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
    case HTTP_STATUS.GATEWAY_TIMEOUT:
      return new APIError(APIErrorType.SERVER_ERROR, '服务暂时不可用', status);
    default:
      return new APIError(APIErrorType.SERVER_ERROR, `HTTP错误: ${statusText}`, status);
  }
};

// NetEase API响应码处理
export const handleNeteaseError = (code: number, message?: string): APIError => {
  switch (code) {
    case NETEASE_CODE.SUCCESS:
      return new APIError(APIErrorType.SERVER_ERROR, '意外的成功码处理', code);
    case NETEASE_CODE.NEED_LOGIN:
      return new APIError(APIErrorType.UNAUTHORIZED, '需要登录', code);
    case NETEASE_CODE.WRONG_PASSWORD:
      return new APIError(APIErrorType.UNAUTHORIZED, '用户名或密码错误', code);
    case NETEASE_CODE.TOO_MANY_REQUESTS:
      return new APIError(APIErrorType.SERVER_ERROR, '请求过于频繁，请稍后再试', code);
    case NETEASE_CODE.NETWORK_ERROR:
      return new APIError(APIErrorType.NETWORK_ERROR, '网络连接错误', code);
    default:
      return new APIError(
        APIErrorType.SERVER_ERROR, 
        message || `API错误，错误码: ${code}`, 
        code
      );
  }
};

// 网络错误处理
export const handleNetworkError = (error: Error): APIError => {
  if (error.name === 'AbortError') {
    return new APIError(APIErrorType.NETWORK_ERROR, '请求超时', undefined, error);
  }
  
  if (error.message.includes('fetch')) {
    return new APIError(APIErrorType.NETWORK_ERROR, '网络连接失败', undefined, error);
  }
  
  return new APIError(APIErrorType.NETWORK_ERROR, '网络错误', undefined, error);
};

// 数据格式化工具
export const formatSongDuration = (duration: number): string => {
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// 图片URL处理 - 确保HTTPS
export const formatImageUrl = (url?: string, size?: string): string => {
  if (!url) return '';
  
  // 替换HTTP为HTTPS
  let formattedUrl = url.replace(/^http:/, 'https:');
  
  // 添加尺寸参数
  if (size) {
    formattedUrl = formattedUrl.replace(/\?.*$/, '') + `?param=${size}`;
  }
  
  return formattedUrl;
};

// 艺术家名称格式化
export const formatArtistNames = (artists: Array<{ name: string }>): string => {
  return artists.map(artist => artist.name).join(' / ');
};

// 播放次数格式化
export const formatPlayCount = (count: number): string => {
  if (count >= 100000000) {
    return `${(count / 100000000).toFixed(1)}亿`;
  }
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万`;
  }
  return count.toString();
};

// 检查歌曲是否可播放
export const isSongPlayable = (song: any): boolean => {
  // fee: 0免费, 1VIP, 4付费, 8非会员可免费播放低音质
  return song.fee === 0 || song.fee === 8;
};

// Cookie解析工具
export const parseCookie = (cookieString: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  
  cookieString.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  
  return cookies;
};

// 生成请求ID（用于日志追踪）
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 日志工具
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[NetEase API] ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[NetEase API] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[NetEase API] ${message}`, error || '');
  }
};