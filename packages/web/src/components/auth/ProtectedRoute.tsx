import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePlayerStore } from '@music-player/shared/stores';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = false 
}) => {
  const location = useLocation();
  const { user, checkLoginStatus } = usePlayerStore();

  useEffect(() => {
    // 检查登录状态
    checkLoginStatus();
  }, [checkLoginStatus]);

  // 移除了isLoading检查，因为checkLoginStatus是同步的

  // 需要认证但未登录，重定向到登录页
  if (requireAuth && !user.isLoggedIn) {
    // 保存当前尝试访问的路径，登录后可以重定向回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 已登录但访问登录页，重定向到首页
  if (location.pathname === '/login' && user.isLoggedIn) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;