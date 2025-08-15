import React, { Suspense, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';

// 导入共享状态管理
import { usePlayerStore } from '@music-player/shared';

// 初始化移动端服务
import './src/services';

// 导入懒加载工具
import { 
  createMobileLazyComponent, 
  MobileRoutePreloader,
  MobileResourcePreloader,
  MobilePerformanceMonitor 
} from './src/utils/lazyload';

// 懒加载页面组件
const TabNavigator = createMobileLazyComponent(
  () => import('./src/navigation/TabNavigator'),
  { 
    preload: true, 
    priority: 'high', 
    chunkName: 'tab-navigator',
    waitForInteractions: false // 主导航不等待交互
  }
);

const PlayerScreen = createMobileLazyComponent(
  () => import('./src/screens/PlayerScreen'),
  { 
    preload: true, 
    priority: 'normal', 
    chunkName: 'player-screen',
    waitForInteractions: true
  }
);

// 懒加载底部播放器
const BottomPlayer = createMobileLazyComponent(
  () => import('./src/components/BottomPlayer'),
  { 
    preload: true, 
    priority: 'high', 
    chunkName: 'bottom-player',
    waitForInteractions: false // 播放器控件优先级高
  }
);

// 加载指示器组件
const AppLoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#ef4444" />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

const Stack = createNativeStackNavigator();

export default function App() {
  const routePreloader = MobileRoutePreloader.getInstance();

  useEffect(() => {
    // 应用启动性能监控
    MobilePerformanceMonitor.startMeasure('app_startup');

    // 注册屏幕预加载器
    routePreloader.registerScreen('TabNavigator', TabNavigator.preload);
    routePreloader.registerScreen('PlayerScreen', PlayerScreen.preload);

    // 预加载常用资源
    const preloadResources = async () => {
      try {
        // 预加载图标资源（示例）
        await MobileResourcePreloader.preloadImages([
          // 这里可以添加常用图标的路径
        ]);
      } catch (error) {
        console.warn('Resource preload failed:', error);
      }
    };

    preloadResources();

    // 结束启动性能监控
    setTimeout(() => {
      MobilePerformanceMonitor.endMeasure('app_startup');
    }, 100);
  }, [routePreloader]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <Suspense fallback={<AppLoadingIndicator />}>
          <Stack.Navigator 
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen 
              name="Player" 
              component={PlayerScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack.Navigator>
          
          {/* 底部播放器 - 全局组件 */}
          <BottomPlayer />
        </Suspense>
        
        <StatusBar style="auto" />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
});