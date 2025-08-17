import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, Key, Music } from 'lucide-react';
import { cn } from '../utils/cn';
import { usePlayerStore } from "@music-player/shared/stores";
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sendVerificationCode, loginWithCode } = usePlayerStore();
  
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendVerificationCode(phone);
      setStep('code');
      startCountdown();
    } catch (error) {
      setError(error instanceof Error ? error.message : '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!code || !/^\d{4,6}$/.test(code)) {
      setError('请输入正确的验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginWithCode(phone, code);
      // 登录成功后跳转到之前尝试访问的页面，或者首页
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

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

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    try {
      await sendVerificationCode(phone);
      startCountdown();
    } catch (error) {
      setError(error instanceof Error ? error.message : '重发验证码失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md p-8">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            欢迎回来
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            使用手机号登录以继续
          </p>
        </div>

        {/* 登录表单卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* 步骤指示器 */}
          <div className="flex items-center space-x-2 mb-6">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
              step === 'phone' ? "bg-primary-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            )}>
              1
            </div>
            <div className={cn(
              "flex-1 h-0.5 transition-colors",
              step === 'code' ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"
            )} />
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
              step === 'code' ? "bg-primary-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            )}>
              2
            </div>
          </div>

          {/* 手机号输入 */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  手机号码
                </label>
                <Input
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="w-4 h-4" />}
                  disabled={loading}
                  maxLength={11}
                  className="w-full"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button
                onClick={handleSendCode}
                loading={loading}
                disabled={!phone || loading}
                className="w-full"
                size="lg"
              >
                {loading ? '发送中...' : '获取验证码'}
              </Button>
            </div>
          )}

          {/* 验证码输入 */}
          {step === 'code' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  验证码已发送至 {phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  验证码
                </label>
                <Input
                  type="text"
                  placeholder="请输入验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  leftIcon={<Key className="w-4 h-4" />}
                  disabled={loading}
                  maxLength={6}
                  className="w-full"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button
                onClick={handleLogin}
                loading={loading}
                disabled={!code || loading}
                className="w-full"
                size="lg"
              >
                {loading ? '登录中...' : '立即登录'}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => {
                    setStep('phone');
                    setError('');
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  disabled={loading}
                >
                  修改手机号
                </button>
                
                <button
                  onClick={handleResendCode}
                  disabled={countdown > 0 || loading}
                  className={cn(
                    "transition-colors",
                    countdown > 0 || loading
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-primary-500 hover:text-primary-600"
                  )}
                >
                  {countdown > 0 ? `${countdown}秒后重发` : '重新发送'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            登录即表示您同意我们的
            <a href="#" className="text-primary-500 hover:text-primary-600 mx-1">服务条款</a>
            和
            <a href="#" className="text-primary-500 hover:text-primary-600 mx-1">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;