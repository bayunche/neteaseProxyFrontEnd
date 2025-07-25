import type { 
  APIResponse, 
  RequestOptions, 
  APIErrorType
} from './types';
import { APIError } from './types';
import { API_CONFIG, HTTP_STATUS, NETEASE_CODE } from './config';
import { 
  buildURL, 
  handleHTTPError, 
  handleNeteaseError, 
  handleNetworkError,
  delay,
  generateRequestId,
  logger
} from './utils';

/**
 * NetEase Music API 核心类
 * 提供统一的HTTP请求封装和错误处理
 */
export class NetEaseAPI {
  private static instance: NetEaseAPI;
  private baseURL: string;
  private timeout: number;
  private retryCount: number;
  private retryDelay: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.retryCount = API_CONFIG.retryCount;
    this.retryDelay = API_CONFIG.retryDelay;
  }

  /**
   * 获取单例实例
   */
  static getInstance(): NetEaseAPI {
    if (!NetEaseAPI.instance) {
      NetEaseAPI.instance = new NetEaseAPI();
    }
    return NetEaseAPI.instance;
  }

  /**
   * 核心请求方法
   */
  async request<T = any>(
    path: string, 
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const requestId = generateRequestId();
    const method = options.method || 'GET';
    
    logger.info(`请求开始 [${requestId}] ${method} ${path}`, options.params || options.body);

    // 构建请求URL
    const url = method === 'GET' && options.params 
      ? buildURL(this.baseURL, path, options.params)
      : `${this.baseURL}${path}`;

    // 构建请求配置 - 最小化配置以避免CORS预检
    const requestConfig: RequestInit = {
      method,
      // 移除mode和credentials以使用默认值
      // 只有在POST请求且有body时才添加Content-Type
      ...(method !== 'GET' && options.body ? {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      } : {}),
      signal: AbortSignal.timeout(options.timeout || this.timeout)
    };

    // 添加请求体
    if (options.body && method !== 'GET') {
      // 使用URLSearchParams来避免CORS预检
      const formData = new URLSearchParams();
      Object.entries(options.body).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      requestConfig.body = formData.toString();
    }

    // 执行带重试的请求
    return this.executeWithRetry<T>(url, requestConfig, requestId);
  }

  /**
   * 带重试机制的请求执行
   */
  private async executeWithRetry<T>(
    url: string, 
    config: RequestInit, 
    requestId: string,
    attempt: number = 1
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(url, config);
      
      // 处理HTTP错误
      if (!response.ok) {
        const error = handleHTTPError(response.status, response.statusText);
        logger.error(`HTTP错误 [${requestId}] ${response.status}`, error.message);
        
        // 如果是服务器错误且还有重试次数，则重试
        if (response.status >= 500 && attempt < this.retryCount) {
          logger.info(`重试请求 [${requestId}] 第${attempt}次，${this.retryDelay}ms后重试`);
          await delay(this.retryDelay);
          return this.executeWithRetry<T>(url, config, requestId, attempt + 1);
        }
        
        throw error;
      }

      // 解析响应
      const data: APIResponse<T> = await response.json();
      
      // 处理NetEase API错误码
      if (data.code !== NETEASE_CODE.SUCCESS) {
        const error = handleNeteaseError(data.code, data.message);
        logger.error(`API错误 [${requestId}] ${data.code}`, error.message);
        throw error;
      }

      logger.info(`请求成功 [${requestId}] ${data.code}`);
      return data;

    } catch (error) {
      // 如果是网络错误且还有重试次数，则重试
      if (error instanceof Error && attempt < this.retryCount) {
        logger.warn(`网络错误 [${requestId}] 第${attempt}次重试`, error.message);
        await delay(this.retryDelay);
        return this.executeWithRetry<T>(url, config, requestId, attempt + 1);
      }

      // 处理各种错误类型
      if (error instanceof APIError) {
        throw error;
      }

      const networkError = handleNetworkError(error as Error);
      logger.error(`请求失败 [${requestId}]`, networkError.message);
      throw networkError;
    }
  }

  /**
   * GET 请求简化方法
   */
  async get<T = any>(
    path: string, 
    params?: Record<string, any>, 
    options?: Omit<RequestOptions, 'method' | 'params'>
  ): Promise<APIResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'GET',
      params
    });
  }

  /**
   * POST 请求简化方法
   */
  async post<T = any>(
    path: string, 
    body?: any, 
    options?: Omit<RequestOptions, 'method' | 'body'>
  ): Promise<APIResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body
    });
  }

  /**
   * 设置全局配置
   */
  setConfig(config: Partial<typeof API_CONFIG>): void {
    if (config.baseURL) this.baseURL = config.baseURL;
    if (config.timeout) this.timeout = config.timeout;
    if (config.retryCount) this.retryCount = config.retryCount;
    if (config.retryDelay) this.retryDelay = config.retryDelay;
  }

  /**
   * 获取当前配置
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      retryCount: this.retryCount,
      retryDelay: this.retryDelay
    };
  }
}

// 导出单例实例
export const neteaseAPI = NetEaseAPI.getInstance();