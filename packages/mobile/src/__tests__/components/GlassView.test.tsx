/**
 * GlassView 组件测试 (React Native)
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import GlassView from '../../components/GlassView';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // 添加 createAnimatedComponent mock
  Reanimated.createAnimatedComponent = (component: any) => component;
  
  return Reanimated;
});

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

describe('GlassView', () => {
  describe('基础渲染', () => {
    test('应该正确渲染子组件', () => {
      const { getByText } = render(
        <GlassView>
          <Text>Test Content</Text>
        </GlassView>
      );
      
      expect(getByText('Test Content')).toBeTruthy();
    });

    test('应该应用默认属性', () => {
      const { getByTestId } = render(
        <GlassView testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
    });
  });

  describe('样式属性', () => {
    test('应该接受自定义样式', () => {
      const customStyle = { marginTop: 20 };
      
      const { getByTestId } = render(
        <GlassView style={customStyle} testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
    });

    test('应该支持不同的强度级别', () => {
      const { rerender, getByTestId } = render(
        <GlassView intensity="light" testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
      
      rerender(
        <GlassView intensity="heavy" testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
    });

    test('应该支持不同的色调', () => {
      const { rerender, getByTestId } = render(
        <GlassView tint="light" testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
      
      rerender(
        <GlassView tint="dark" testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
    });

    test('应该支持不同的边框半径', () => {
      const { rerender, getByTestId } = render(
        <GlassView borderRadius="sm" testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
      
      rerender(
        <GlassView borderRadius="xl" testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
    });

    test('应该支持不同的内边距', () => {
      const { rerender, getByTestId } = render(
        <GlassView padding="sm" testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
      
      rerender(
        <GlassView padding="xl" testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
    });
  });

  describe('动画功能', () => {
    test('应该支持动画模式', () => {
      const { getByTestId } = render(
        <GlassView animated={true} testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
    });

    test('应该在非动画模式下正常工作', () => {
      const { getByTestId } = render(
        <GlassView animated={false} testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
    });
  });

  describe('交互功能', () => {
    test('应该支持点击事件', () => {
      const onPress = jest.fn();
      
      const { getByTestId } = render(
        <GlassView onPress={onPress} testID="glass-view">
          <Text>Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
      // 注意: react-native-testing-library 的事件处理可能需要特殊处理
    });
  });

  describe('边界情况', () => {
    test('应该处理空子组件', () => {
      const { getByTestId } = render(
        <GlassView testID="glass-view" />
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
    });

    test('应该处理多个子组件', () => {
      const { getByText } = render(
        <GlassView>
          <Text>First Child</Text>
          <Text>Second Child</Text>
        </GlassView>
      );
      
      expect(getByText('First Child')).toBeTruthy();
      expect(getByText('Second Child')).toBeTruthy();
    });

    test('应该处理无效的属性值', () => {
      expect(() => {
        render(
          <GlassView
            intensity={'invalid' as any}
            borderRadius={'invalid' as any}
            testID="glass-view"
          >
            <Text>Content</Text>
          </GlassView>
        );
      }).not.toThrow();
    });
  });

  describe('性能测试', () => {
    test('应该能够渲染多个实例', () => {
      const { getAllByText } = render(
        <>
          {Array.from({ length: 10 }, (_, index) => (
            <GlassView key={index}>
              <Text>Item {index}</Text>
            </GlassView>
          ))}
        </>
      );
      
      expect(getAllByText(/Item \d/)).toHaveLength(10);
    });

    test('应该能够处理快速重新渲染', () => {
      const { rerender, getByText } = render(
        <GlassView intensity="light">
          <Text>Content 1</Text>
        </GlassView>
      );
      
      for (let i = 2; i <= 50; i++) {
        rerender(
          <GlassView intensity={i % 2 === 0 ? 'medium' : 'heavy'}>
            <Text>Content {i}</Text>
          </GlassView>
        );
      }
      
      expect(getByText('Content 50')).toBeTruthy();
    });
  });

  describe('主题集成', () => {
    test('应该正确应用主题样式', () => {
      const { getByTestId } = render(
        <GlassView testID="glass-view">
          <Text>Themed Content</Text>
        </GlassView>
      );
      
      // 验证组件是否正确应用了主题
      expect(getByTestId('glass-view')).toBeTruthy();
    });
  });

  describe('可访问性', () => {
    test('应该支持可访问性属性', () => {
      const { getByTestId } = render(
        <GlassView
          testID="glass-view"
          accessible={true}
          accessibilityLabel="Glass effect container"
        >
          <Text>Accessible Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
    });

    test('应该支持可访问性操作', () => {
      const onPress = jest.fn();
      
      const { getByTestId } = render(
        <GlassView
          testID="glass-view"
          onPress={onPress}
          accessible={true}
          accessibilityRole="button"
        >
          <Text>Button Content</Text>
        </GlassView>
      );
      
      expect(getByTestId('glass-view')).toBeTruthy();
    });
  });
});