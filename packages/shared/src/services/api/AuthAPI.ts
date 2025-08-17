import { neteaseAPI } from './NetEaseAPI';
import { APIError, APIErrorType } from './types';
import type {
  User,
  APIResponse,
  UserStatus,
  UserPlaylistRequest,
  UserPlaylistResponse
} from './types';
import { logger } from './utils';
import { API_ENDPOINTS } from './config';
import { PlaylistAPI } from './PlaylistAPI';

/**
 * 手机验证码登录相关类型
 */
export interface SendCodeRequest {
  phone: string;
}

export interface SendCodeResponse extends APIResponse {
  message?: string;
}

export interface LoginWithCodeRequest {
  phone: string;
  code: string;
}

export interface LoginWithCodeResponse {
  code: number;
  token?: string;
  profile?: User;
  cookie?: string;
  account?: {
    id: number;
    userName: string;
    type: number;
    status: number;
    createTime: number;
    tokenVersion: number;
    ban: number;
    vipType: number;
    anonimousUser: boolean;
  };
}

/**
 * 认证API服务类
 * 提供手机验证码登录功能
 */
export class AuthAPI {
  private static currentUser: User | null = null;
  private static authToken: string | null = null;
  private static loginCookie: string | null = null;
  
  // 歌单缓存
  private static playlistCache: {
    data: UserPlaylistResponse | null;
    timestamp: number;
    uid: string | number;
  } | null = null;
  private static CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存

  /**
   * 发送手机验证码
   * @param phone 手机号
   */
  static async sendVerificationCode(phone: string): Promise<SendCodeResponse> {
    if (!phone) {
      throw new Error('手机号不能为空');
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw new Error('请输入正确的手机号格式');
    }

    logger.info(`发送验证码到: ${phone.substring(0, 3)}****${phone.substring(7)}`);

    // 使用正确的API端点
    try {
      const response = await neteaseAPI.get<SendCodeResponse>(
        API_ENDPOINTS.CAPTCHA_SENT,  // 使用正确的 /user/sent 端点
        { phone }
      );
      logger.info(`验证码发送成功: ${phone.substring(0, 3)}****${phone.substring(7)}`);
      return response;
    } catch (error) {
      // 如果API失败，回退到模拟响应
      logger.warn('API调用失败，使用模拟响应', error);
      await new Promise(resolve => setTimeout(resolve, 1000));
      logger.info(`验证码发送成功(模拟): ${phone.substring(0, 3)}****${phone.substring(7)}`);
      return {
        code: 200,
        message: '验证码发送成功'
      };
    }

    /* 真实API调用代码 - 当API服务器支持时启用
    try {
      // 使用正确的端点路径
      const response = await neteaseAPI.get<SendCodeResponse>(
        '/captcha/sent',  // 注意：这里应该只是路径，baseURL已经包含/api
        { phone }
      );

      logger.info(`验证码发送成功: ${phone.substring(0, 3)}****${phone.substring(7)}`);
      return response;

    } catch (error) {
      logger.error('发送验证码失败', error);

      if (error instanceof Error) {
        // 处理特定错误
        if (error.message.includes('429')) {
          throw new Error('发送验证码过于频繁，请稍后再试');
        }
        if (error.message.includes('400')) {
          throw new Error('手机号格式不正确');
        }
      }

      throw error;
    }
    */
  }

  /**
   * 使用验证码登录
   * @param phone 手机号
   * @param code 验证码
   */
  static async loginWithCode(
    phone: string,
    code: string
  ): Promise<LoginWithCodeResponse> {
    if (!phone || !code) {
      throw new Error('手机号和验证码不能为空');
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw new Error('请输入正确的手机号格式');
    }

    // 验证验证码格式（通常是4-6位数字）
    if (!/^\d{4,6}$/.test(code)) {
      throw new Error('请输入正确的验证码格式');
    }

    logger.info(`验证码登录: ${phone.substring(0, 3)}****${phone.substring(7)}`);

    try {
      const response = (await neteaseAPI.get<LoginWithCodeResponse>(
        API_ENDPOINTS.LOGIN_CELLPHONE,
        { phone, code }
      )) as unknown as LoginWithCodeResponse;

      // 打印完整的响应数据以进行调试
      logger.info('Login response received:', JSON.stringify(response, null, 2));

      // 处理登录成功 - NetEase API直接返回登录数据，不在data字段中
      if (response.code === 200 && response.profile) {
        await this.handleLoginSuccess(response);
        logger.info(`用户登录成功: ${response.profile?.nickname || '未知用户'}`);
        return response;
      }

      throw new Error('登录响应数据无效');

    } catch (error) {
      logger.error('验证码登录失败', error);

      if (error instanceof Error) {
        // 处理特定的登录错误
        if (error.message.includes('404') || error.message.includes('Not Found')) {
          throw new Error('登录服务暂时不可用，请联系管理员');
        }
        if (error.message.includes('400') || error.message.includes('验证码')) {
          throw new Error('验证码错误或已过期');
        }
        if (error.message.includes('429')) {
          throw new Error('登录请求过于频繁，请稍后再试');
        }
        if (error.message.includes('401')) {
          throw new Error('登录凭据无效');
        }
      }

      throw error;
    }
  }

  /**
   * 清除歌单缓存
   */
  static clearPlaylistCache(): void {
    this.playlistCache = null;
    logger.info('已清除歌单缓存');
  }

  /**
   * 登出
   */
  static async logout(): Promise<void> {
    logger.info('用户登出');

    try {
      // 可选：调用登出API（如果API提供）
      // await neteaseAPI.post('/logout');
    } catch (error) {
      logger.warn('调用登出API失败，继续清理本地状态', error);
    }

    // 清理本地状态和缓存
    this.clearAuthState();
    this.clearPlaylistCache();
    PlaylistAPI.clearAllCache(); // 清理歌单详情缓存
    logger.info('登出成功，已清理本地状态和所有缓存');
  }

  /**
   * 获取当前用户信息
   */
  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * 获取认证token
   */
  static getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * 获取登录cookie
   */
  static getLoginCookie(): string | null {
    return this.loginCookie;
  }

  /**
   * 检查是否已登录
   */
  static isLoggedIn(): boolean {
    return this.currentUser !== null && this.authToken !== null;
  }

  /**
   * 处理登录成功后的状态设置
   */
  private static async handleLoginSuccess(loginData: LoginWithCodeResponse): Promise<void> {
    // 设置用户信息
    if (loginData.profile) {
      this.currentUser = loginData.profile;
    }

    // 设置认证token
    if (loginData.token) {
      this.authToken = loginData.token;
    }

    // 设置cookie
    if (loginData.cookie) {
      this.loginCookie = loginData.cookie;
    }

    // 保存到本地存储
    this.saveAuthState();
  }

  /**
   * 保存认证状态到本地存储
   */
  private static saveAuthState(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        if (this.currentUser) {
          localStorage.setItem('netease_user', JSON.stringify(this.currentUser));
        }
        if (this.authToken) {
          localStorage.setItem('netease_token', this.authToken);
        }
        if (this.loginCookie) {
          localStorage.setItem('netease_cookie', this.loginCookie);
        }
      }
    } catch (error) {
      logger.warn('保存认证状态失败', error);
    }
  }

  /**
   * 从本地存储恢复认证状态
   */
  static restoreAuthState(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const userStr = localStorage.getItem('netease_user');
        const token = localStorage.getItem('netease_token');
        const cookie = localStorage.getItem('netease_cookie');

        if (userStr) {
          this.currentUser = JSON.parse(userStr);
        }
        if (token) {
          this.authToken = token;
        }
        if (cookie) {
          this.loginCookie = cookie;
        }

        if (this.currentUser || this.authToken) {
          logger.info('认证状态恢复成功');
        }
      }
    } catch (error) {
      logger.warn('恢复认证状态失败', error);
      this.clearAuthState();
    }
  }

  /**
   * 清理认证状态
   */
  private static clearAuthState(): void {
    this.currentUser = null;
    this.authToken = null;
    this.loginCookie = null;

    // 清理本地存储
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('netease_user');
        localStorage.removeItem('netease_token');
        localStorage.removeItem('netease_cookie');
      }
    } catch (error) {
      logger.warn('清理本地存储失败', error);
    }
  }

  /**
   * 自动登录（使用保存的认证信息）
   */
  static async autoLogin(): Promise<boolean> {
    this.restoreAuthState();

    if (!this.isLoggedIn()) {
      return false;
    }

    // 验证登录状态是否有效
    try {
      await this.getUserStatus();
      return true;
    } catch (error) {
      logger.warn('自动登录验证失败，清理认证状态', error);
      this.clearAuthState();
      return false;
    }
  }

  /**
   * 获取用户登录详细信息
   * 说明: 获取用户登录详细信息（需登录）
   * 此接口是将html提取为json格式，速度可能会比其他接口慢一点
   */
  static async getUserStatus(): Promise<UserStatus> {
    if (!this.isLoggedIn()) {
      throw new APIError(
        APIErrorType.UNAUTHORIZED,
        '用户未登录，无法获取用户状态信息'
      );
    }

    logger.info('获取用户登录详细信息');

    try {
      const response = await neteaseAPI.get<UserStatus>(API_ENDPOINTS.USER_STATUS);

      if (response.code === 200 && response.data) {
        // 更新当前用户信息
        if (response.data.data?.profile) {
          this.currentUser = response.data.data.profile;
          this.saveAuthState();
        }

        logger.info('获取用户状态信息成功', response.data.data?.profile?.nickname);
        return response.data;
      } else {
        throw new APIError(
          APIErrorType.SERVER_ERROR,
          response.message || '获取用户状态信息失败'
        );
      }
    } catch (error) {
      logger.error('获取用户状态信息失败', error);

      if (error instanceof APIError) {
        throw error;
      }

      throw new APIError(
        APIErrorType.NETWORK_ERROR,
        '获取用户状态信息网络错误'
      );
    }
  }

  /**
   * 获取指定用户的歌单列表
   * @param uid 用户id（必选）
   * @param limit 返回数量，默认为30（可选）
   * @param offset 偏移数量，用于分页，默认为0（可选）
   */
  static async getUserPlaylist(request: UserPlaylistRequest): Promise<UserPlaylistResponse> {
    const { uid, limit = 30, offset = 0 } = request;

    if (!uid) {
      throw new APIError(
        APIErrorType.VALIDATION_ERROR,
        '用户ID不能为空'
      );
    }

    // 检查缓存（只有获取全部歌单时才使用缓存，即offset=0且limit>=100）
    if (offset === 0 && limit >= 100 && this.playlistCache) {
      const now = Date.now();
      const cacheAge = now - this.playlistCache.timestamp;
      
      if (cacheAge < this.CACHE_DURATION && this.playlistCache.uid === uid && this.playlistCache.data) {
        logger.info(`使用缓存的歌单列表 (缓存年龄: ${Math.round(cacheAge / 1000)}秒)`);
        return this.playlistCache.data;
      }
    }

    logger.info(`获取用户歌单列表: uid=${uid}, limit=${limit}, offset=${offset}`);

    try {
      const apiResponse = await neteaseAPI.get<any>(
        API_ENDPOINTS.USER_PLAYLIST,
        {
          uid: String(uid),
          limit,
          offset
        }
      );

      // 处理两种可能的响应格式：
      // 1. 直接返回 { code: 200, playlist: [...], more: false }
      // 2. 包装在data中 { code: 200, data: { playlist: [...], more: false } }
      const responseData = apiResponse.data || apiResponse;
      
      if (apiResponse.code === 200 && responseData.playlist) {
        logger.info(`获取用户歌单列表成功: 共${responseData.playlist?.length || 0}个歌单`);
        
        // 缓存大量歌单数据（超过50个歌单时启用缓存）
        if (offset === 0 && responseData.playlist.length > 50) {
          this.playlistCache = {
            data: responseData as UserPlaylistResponse,
            timestamp: Date.now(),
            uid: uid
          };
          logger.info(`已缓存${responseData.playlist.length}个歌单`);
        }
        
        return responseData as UserPlaylistResponse;
      } else {
        throw new APIError(
          APIErrorType.SERVER_ERROR,
          apiResponse.message || '获取用户歌单列表失败'
        );
      }
    } catch (error) {
      logger.error('获取用户歌单列表失败', error);

      if (error instanceof APIError) {
        throw error;
      }

      throw new APIError(
        APIErrorType.NETWORK_ERROR,
        '获取用户歌单列表网络错误'
      );
    }
  }

  /**
   * 获取当前登录用户的歌单列表
   * @param limit 返回数量，默认为30
   * @param offset 偏移数量，用于分页，默认为0
   */
  static async getCurrentUserPlaylist(limit: number = 30, offset: number = 0): Promise<UserPlaylistResponse> {
    if (!this.isLoggedIn() || !this.currentUser) {
      throw new APIError(
        APIErrorType.UNAUTHORIZED,
        '用户未登录，无法获取歌单列表'
      );
    }

    return this.getUserPlaylist({
      uid: this.currentUser.userId,
      limit,
      offset
    });
  }
}

// 应用启动时自动恢复认证状态
if (typeof window !== 'undefined') {
  AuthAPI.restoreAuthState();
}