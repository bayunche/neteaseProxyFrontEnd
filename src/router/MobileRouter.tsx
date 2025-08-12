import React from 'react';
import ErrorBoundary from '../components/common/ErrorBoundary';

// 占位组件，实际移动端路由会在React Native项目中实现
const MobileRouter: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-4">移动端路由</h2>
        <p className="text-gray-600">
          此组件将在React Native环境中使用React Navigation实现
        </p>
      </div>
    </ErrorBoundary>
  );
};

export default MobileRouter;