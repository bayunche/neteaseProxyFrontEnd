import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAHook {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  installPrompt: (() => Promise<boolean>) | null;
  showInstallPrompt: () => Promise<boolean>;
  updateAvailable: boolean;
  updateApp: () => Promise<void>;
  shareSupported: boolean;
  share: (data: ShareData) => Promise<boolean>;
}

/**
 * PWA功能管理Hook
 */
export const usePWA = (): PWAHook => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // 检查是否已安装
  useEffect(() => {
    const checkInstallation = () => {
      // 检查是否在独立模式下运行（已安装）
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as { standalone?: boolean }).standalone ||
                           document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkInstallation();
    
    // 监听显示模式变化
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstallation);
    
    return () => mediaQuery.removeEventListener('change', checkInstallation);
  }, []);

  // 监听安装提示事件
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setInstallPromptEvent(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 注册Service Worker并监听更新
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          setServiceWorkerRegistration(registration);

          // 监听更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // 检查是否有等待中的Service Worker
          if (registration.waiting) {
            setUpdateAvailable(true);
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // 监听来自Service Worker的消息
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type } = event.data;
        
        switch (type) {
          case 'SW_UPDATE_AVAILABLE':
            setUpdateAvailable(true);
            break;
          case 'SW_UPDATED':
            window.location.reload();
            break;
          default:
            break;
        }
      });
    }
  }, []);

  // 显示安装提示
  const showInstallPrompt = useCallback(async (): Promise<boolean> => {
    if (!installPromptEvent) {
      return false;
    }

    try {
      await installPromptEvent.prompt();
      const choiceResult = await installPromptEvent.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setInstallPromptEvent(null);
        setIsInstallable(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }, [installPromptEvent]);

  // 更新应用
  const updateApp = useCallback(async (): Promise<void> => {
    if (!serviceWorkerRegistration || !updateAvailable) {
      return;
    }

    if (serviceWorkerRegistration.waiting) {
      // 发送消息让等待中的Service Worker跳过等待
      serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // 监听Service Worker状态变化
      serviceWorkerRegistration.waiting.addEventListener('statechange', () => {
        if (serviceWorkerRegistration.waiting?.state === 'activated') {
          window.location.reload();
        }
      });
    }
    
    setUpdateAvailable(false);
  }, [serviceWorkerRegistration, updateAvailable]);

  // Web Share API支持
  const shareSupported = 'share' in navigator;

  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    if (!shareSupported) {
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
      return false;
    }
  }, [shareSupported]);

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installPrompt: installPromptEvent ? showInstallPrompt : null,
    showInstallPrompt,
    updateAvailable,
    updateApp,
    shareSupported,
    share
  };
};