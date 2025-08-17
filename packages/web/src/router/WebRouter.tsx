import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getPlatformRoutes } from './index';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import ProtectedRoute from '../components/auth/ProtectedRoute';

/**
 * Web平台路由配置
 * 使用React Router DOM进行路由管理
 */
const WebRouter: React.FC = () => {
  const webRoutes = getPlatformRoutes('web');
  const loginRoute = webRoutes.find(r => r.path === '/login');
  const otherRoutes = webRoutes.filter(r => r.path !== '/login');

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* 登录页面路由 - 独立渲染，不需要Layout */}
            {loginRoute && (() => {
              const LoginComponent = loginRoute.component;
              return (
                <Route
                  path={loginRoute.path}
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <LoginComponent />
                    </ProtectedRoute>
                  }
                />
              );
            })()}
            
            {/* 带Layout的路由组 */}
            <Route element={<Layout />}>
              {otherRoutes.map(({ path, component: Component, requireAuth }) => {
                // 对于根路径，使用index route
                if (path === '/') {
                  return (
                    <Route
                      key={path}
                      index
                      element={
                        <ProtectedRoute requireAuth={requireAuth}>
                          <Component />
                        </ProtectedRoute>
                      }
                    />
                  );
                }
                // 其他路径去掉前导斜杠
                const cleanPath = path.startsWith('/') ? path.slice(1) : path;
                return (
                  <Route
                    key={path}
                    path={cleanPath}
                    element={
                      <ProtectedRoute requireAuth={requireAuth}>
                        <Component />
                      </ProtectedRoute>
                    }
                  />
                );
              })}
            </Route>

            {/* 404重定向到首页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default WebRouter;