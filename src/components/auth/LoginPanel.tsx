import React, { useState } from 'react';
import { Smartphone, Key, LogIn, User } from 'lucide-react';
import { Button, Input, Loading } from '../common';
import { AuthAPI } from '../../services/api/AuthAPI';

interface LoginPanelProps {
  className?: string;
  onLoginSuccess?: (user: any) => void;
}

/**
 * 登录面板组件
 * 支持手机验证码登录
 */
export const LoginPanel: React.FC<LoginPanelProps> = ({ 
  className = '', 
  onLoginSuccess 
}) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 当前用户状态
  const currentUser = AuthAPI.getCurrentUser();
  const isLoggedIn = AuthAPI.isLoggedIn();

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号格式');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await AuthAPI.sendVerificationCode(phone);
      setStep('code');
      startCountdown();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发送验证码失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 验证码登录
  const handleLogin = async () => {
    if (!code.trim()) {
      setError('请输入验证码');
      return;
    }

    if (!/^\d{4,6}$/.test(code)) {
      setError('请输入正确的验证码格式');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await AuthAPI.loginWithCode(phone, code);
      console.log('登录成功:', result);
      
      if (onLoginSuccess && result.profile) {
        onLoginSuccess(result.profile);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const handleLogout = async () => {
    setLoading(true);
    try {
      await AuthAPI.logout();
      setStep('phone');
      setPhone('');
      setCode('');
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登出失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    setStep('phone');
    setPhone('');
    setCode('');
    setError(null);
    setCountdown(0);
  };

  // 启动倒计时
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 如果已登录，显示用户信息
  if (isLoggedIn && currentUser) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">已登录</h3>
          <p className="text-sm text-gray-600">欢迎回来，{currentUser.nickname || '用户'}</p>
        </div>

        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-xs text-gray-500 mb-1">用户ID</div>
            <div className="text-sm font-medium text-gray-900">{currentUser.userId}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-xs text-gray-500 mb-1">昵称</div>
            <div className="text-sm font-medium text-gray-900">{currentUser.nickname}</div>
          </div>
          {currentUser.signature && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-xs text-gray-500 mb-1">个性签名</div>
              <div className="text-sm font-medium text-gray-900">{currentUser.signature}</div>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <Button
            onClick={handleLogout}
            disabled={loading}
            className="w-full"
            variant="secondary"
          >
            {loading ? <Loading size="sm" /> : '登出'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">登录到网易云音乐</h3>
        <p className="text-sm text-gray-600">使用手机验证码登录</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {step === 'phone' ? (
        // 输入手机号步骤
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              手机号
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号"
              icon={<Smartphone className="w-4 h-4" />}
              className="w-full"
              maxLength={11}
            />
          </div>

          <Button
            onClick={handleSendCode}
            disabled={loading || !phone.trim()}
            className="w-full"
            variant="primary"
          >
            {loading ? <Loading size="sm" text="发送中..." /> : '发送验证码'}
          </Button>
        </div>
      ) : (
        // 输入验证码步骤
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              验证码
            </label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入验证码"
              icon={<Key className="w-4 h-4" />}
              className="w-full"
              maxLength={6}
            />
            <p className="mt-1 text-xs text-gray-500">
              验证码已发送至 {phone.substring(0, 3)}****{phone.substring(7)}
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleLogin}
              disabled={loading || !code.trim()}
              className="flex-1"
              variant="primary"
            >
              {loading ? <Loading size="sm" text="登录中..." /> : '登录'}
            </Button>
            <Button
              onClick={countdown > 0 ? undefined : handleSendCode}
              disabled={loading || countdown > 0}
              className="px-4"
              variant="outline"
            >
              {countdown > 0 ? `${countdown}s` : '重发'}
            </Button>
          </div>

          <Button
            onClick={handleReset}
            disabled={loading}
            className="w-full"
            variant="ghost"
          >
            返回
          </Button>
        </div>
      )}

      {/* API状态信息 */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-700">
          📡 连接到 NetEase Music API 服务器进行登录验证
        </p>
      </div>
    </div>
  );
};