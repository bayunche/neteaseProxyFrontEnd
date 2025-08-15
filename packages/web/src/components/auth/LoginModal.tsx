import React, { useState } from 'react';
import { X, Phone, Key } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePlayerStore } from "@music-player/shared/stores";
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
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
      onClose();
      // 重置状态
      setPhone('');
      setCode('');
      setStep('phone');
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

  const handleClose = () => {
    setPhone('');
    setCode('');
    setStep('phone');
    setError('');
    setCountdown(0);
    onClose();
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      className="max-w-md"
    >
      <div className="p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            手机登录
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="space-y-4">
          {/* 步骤指示器 */}
          <div className="flex items-center space-x-2 mb-6">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              step === 'phone' ? "bg-primary-500 text-white" : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
            )}>
              1
            </div>
            <div className={cn(
              "flex-1 h-0.5",
              step === 'code' ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-600"
            )} />
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
              step === 'code' ? "bg-primary-500 text-white" : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
            )}>
              2
            </div>
          </div>

          {/* 手机号输入 */}
          {step === 'phone' && (
            <div className="space-y-4">
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                disabled={loading}
                maxLength={11}
              />
              
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                onClick={handleSendCode}
                loading={loading}
                disabled={!phone || loading}
                className="w-full"
              >
                {loading ? '发送中...' : '发送验证码'}
              </Button>
            </div>
          )}

          {/* 验证码输入 */}
          {step === 'code' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                验证码已发送至 {phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
              </div>

              <Input
                type="text"
                placeholder="请输入验证码"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                leftIcon={<Key className="w-4 h-4" />}
                disabled={loading}
                maxLength={6}
              />

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button
                onClick={handleLogin}
                loading={loading}
                disabled={!code || loading}
                className="w-full"
              >
                {loading ? '登录中...' : '登录'}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => setStep('phone')}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
                  {countdown > 0 ? `${countdown}s后重发` : '重新发送'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 提示信息 */}
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            登录即表示您同意我们的服务条款和隐私政策。验证码有效期为5分钟。
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default LoginModal;