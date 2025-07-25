import { neteaseAPI } from './NetEaseAPI';
import { APIError } from './types';
import type { 
  User,
  APIResponse,
  APIErrorType
} from './types';
import { logger } from './utils';

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

export interface LoginWithCodeResponse extends APIResponse {
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

    try {
      const response = await neteaseAPI.get<SendCodeResponse>(
        '/user/sent',
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
      const response = await neteaseAPI.get<LoginWithCodeResponse>(
        '/user/cellphone',
        { phone, code }
      );

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

    // 清理本地状态
    this.clearAuthState();
    logger.info('登出成功，已清理本地状态');
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

    // 这里可以添加验证登录状态是否有效的逻辑
    // 例如调用用户信息接口验证token是否有效

    return true;
  }
}

// 应用启动时自动恢复认证状态
if (typeof window !== 'undefined') {
  AuthAPI.restoreAuthState();
}