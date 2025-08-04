import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { routes, getPlatformRoutes } from './index';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';

/**
 * Web平台路由配置
 * 使用React Router DOM进行路由管理
 */
const WebRouter: React.FC = () => {
  const webRoutes = getPlatformRoutes('web');

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Layout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {webRoutes.map(({ path, component: Component }) => (
                <Route
                  key={path}
                  path={path}
                  element={<Component />}
                />
              ))}
            </Routes>
          </Suspense>
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default WebRouter;