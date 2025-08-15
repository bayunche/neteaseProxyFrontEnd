import { useEffect } from 'react';
import { usePlayerStore } from '@music-player/shared/stores';
import WebRouter from './router/WebRouter';

function App() {
  const { checkLoginStatus } = usePlayerStore();

  // 应用启动时检查登录状态
  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  // 检测平台类型
  const platform = typeof window !== 'undefined' && window.navigator?.userAgent ? 'web' : 'web';
  
  // 根据平台返回对应的路由组件
  // 目前只实现Web版本，Mobile版本将在React Native项目中实现
  switch (platform) {
    case 'web':
    default:
      return <WebRouter />;
  }
}

export default App;