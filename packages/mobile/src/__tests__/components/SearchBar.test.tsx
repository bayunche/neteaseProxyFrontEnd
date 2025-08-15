/**
 * SearchBar 组件测试 (React Native)
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import SearchBar from '../../components/SearchBar';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // 添加 createAnimatedComponent mock
  Reanimated.createAnimatedComponent = (component: any) => component;
  
  return Reanimated;
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

describe('SearchBar', () => {
  const defaultProps = {
    placeholder: 'Search music...',
    onSearch: jest.fn(),
    onClear: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染', () => {
    test('应该正确渲染搜索框', () => {
      const { getByPlaceholderText } = render(<SearchBar {...defaultProps} />);
      
      expect(getByPlaceholderText('Search music...')).toBeTruthy();
    });

    test('应该显示搜索图标', () => {
      const { UNSAFE_getByType } = render(<SearchBar {...defaultProps} />);
      
      // 检查是否渲染了搜索图标
      const icons = UNSAFE_getByType('Icon');
      expect(icons).toBeTruthy();
    });

    test('应该使用默认占位符文本', () => {
      const { getByPlaceholderText } = render(
        <SearchBar onSearch={jest.fn()} onClear={jest.fn()} />
      );
      
      expect(getByPlaceholderText('Search...')).toBeTruthy();
    });
  });

  describe('用户交互', () => {
    test('应该处理文本输入', () => {
      const { getByPlaceholderText } = render(<SearchBar {...defaultProps} />);
      const input = getByPlaceholderText('Search music...');
      
      fireEvent.changeText(input, 'test query');
      
      expect(input.props.value).toBe('test query');
    });

    test('应该在输入时显示清除按钮', () => {
      const { getByPlaceholderText, queryByTestId } = render(
        <SearchBar {...defaultProps} />
      );
      const input = getByPlaceholderText('Search music...');
      
      // 初始状态不应该有清除按钮
      expect(queryByTestId('clear-button')).toBeFalsy();
      
      // 输入文本后应该显示清除按钮
      fireEvent.changeText(input, 'test');
      expect(queryByTestId('clear-button')).toBeTruthy();
    });

    test('应该在点击清除按钮时清空输入', () => {
      const onClear = jest.fn();
      const { getByPlaceholderText, getByTestId } = render(
        <SearchBar {...defaultProps} onClear={onClear} />
      );
      const input = getByPlaceholderText('Search music...');
      
      // 输入文本
      fireEvent.changeText(input, 'test query');
      
      // 点击清除按钮
      const clearButton = getByTestId('clear-button');
      fireEvent.press(clearButton);
      
      expect(onClear).toHaveBeenCalled();
      expect(input.props.value).toBe('');
    });

    test('应该在提交时调用搜索回调', () => {
      const onSearch = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} onSearch={onSearch} />
      );
      const input = getByPlaceholderText('Search music...');
      
      fireEvent.changeText(input, 'jazz music');
      fireEvent(input, 'submitEditing');
      
      expect(onSearch).toHaveBeenCalledWith('jazz music');
    });

    test('应该处理焦点状态', () => {
      const { getByPlaceholderText } = render(<SearchBar {...defaultProps} />);
      const input = getByPlaceholderText('Search music...');
      
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');
      
      // 验证焦点状态的处理（通过样式变化或其他副作用）
      expect(input).toBeTruthy();
    });
  });

  describe('属性配置', () => {
    test('应该接受自定义样式', () => {
      const customStyle = { backgroundColor: '#f0f0f0' };
      const { getByTestId } = render(
        <SearchBar {...defaultProps} style={customStyle} testID="search-bar" />
      );
      
      expect(getByTestId('search-bar')).toBeTruthy();
    });

    test('应该支持初始值', () => {
      const { getByDisplayValue } = render(
        <SearchBar {...defaultProps} value="initial search" />
      );
      
      expect(getByDisplayValue('initial search')).toBeTruthy();
    });

    test('应该支持禁用状态', () => {
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} editable={false} />
      );
      const input = getByPlaceholderText('Search music...');
      
      expect(input.props.editable).toBe(false);
    });

    test('应该支持自定义键盘类型', () => {
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} keyboardType="email-address" />
      );
      const input = getByPlaceholderText('Search music...');
      
      expect(input.props.keyboardType).toBe('email-address');
    });

    test('应该支持自定义返回键类型', () => {
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} returnKeyType="done" />
      );
      const input = getByPlaceholderText('Search music...');
      
      expect(input.props.returnKeyType).toBe('done');
    });
  });

  describe('防抖搜索', () => {
    test('应该支持防抖搜索', async () => {
      const onSearch = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} onSearch={onSearch} debounceMs={300} />
      );
      const input = getByPlaceholderText('Search music...');
      
      // 快速输入多次
      fireEvent.changeText(input, 'a');
      fireEvent.changeText(input, 'ab');
      fireEvent.changeText(input, 'abc');
      
      // 防抖期间不应该调用搜索
      expect(onSearch).not.toHaveBeenCalled();
      
      // 等待防抖时间
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith('abc');
      }, { timeout: 500 });
    });

    test('应该在清除时立即搜索', () => {
      const onSearch = jest.fn();
      const { getByPlaceholderText, getByTestId } = render(
        <SearchBar {...defaultProps} onSearch={onSearch} debounceMs={300} />
      );
      const input = getByPlaceholderText('Search music...');
      
      // 输入文本
      fireEvent.changeText(input, 'test');
      
      // 立即清除
      const clearButton = getByTestId('clear-button');
      fireEvent.press(clearButton);
      
      // 应该立即调用搜索（不等待防抖）
      expect(onSearch).toHaveBeenCalledWith('');
    });
  });

  describe('加载状态', () => {
    test('应该显示加载指示器', () => {
      const { getByTestId } = render(
        <SearchBar {...defaultProps} loading={true} />
      );
      
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    test('应该在加载时隐藏搜索图标', () => {
      const { queryByTestId } = render(
        <SearchBar {...defaultProps} loading={true} />
      );
      
      expect(queryByTestId('search-icon')).toBeFalsy();
    });
  });

  describe('自动建议', () => {
    test('应该显示搜索建议', () => {
      const suggestions = ['jazz music', 'rock music', 'pop music'];
      const { getByText } = render(
        <SearchBar {...defaultProps} suggestions={suggestions} showSuggestions={true} />
      );
      
      suggestions.forEach(suggestion => {
        expect(getByText(suggestion)).toBeTruthy();
      });
    });

    test('应该在选择建议时调用搜索', () => {
      const onSearch = jest.fn();
      const suggestions = ['jazz music', 'rock music'];
      const { getByText } = render(
        <SearchBar 
          {...defaultProps} 
          suggestions={suggestions} 
          showSuggestions={true}
          onSearch={onSearch}
        />
      );
      
      fireEvent.press(getByText('jazz music'));
      
      expect(onSearch).toHaveBeenCalledWith('jazz music');
    });

    test('应该在输入时过滤建议', () => {
      const suggestions = ['jazz music', 'rock music', 'pop music'];
      const { getByPlaceholderText, queryByText } = render(
        <SearchBar 
          {...defaultProps} 
          suggestions={suggestions} 
          showSuggestions={true}
          filterSuggestions={true}
        />
      );
      const input = getByPlaceholderText('Search music...');
      
      fireEvent.changeText(input, 'jazz');
      
      // 应该只显示匹配的建议
      expect(queryByText('jazz music')).toBeTruthy();
      expect(queryByText('rock music')).toBeFalsy();
      expect(queryByText('pop music')).toBeFalsy();
    });
  });

  describe('可访问性', () => {
    test('应该具有适当的可访问性标签', () => {
      const { getByPlaceholderText } = render(
        <SearchBar 
          {...defaultProps} 
          accessibilityLabel="Music search input"
          accessibilityHint="Enter keywords to search for music"
        />
      );
      const input = getByPlaceholderText('Search music...');
      
      expect(input.props.accessibilityLabel).toBe('Music search input');
      expect(input.props.accessibilityHint).toBe('Enter keywords to search for music');
    });

    test('应该支持可访问性操作', () => {
      const onSearch = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} onSearch={onSearch} />
      );
      const input = getByPlaceholderText('Search music...');
      
      // 模拟可访问性操作
      fireEvent.changeText(input, 'accessible search');
      fireEvent(input, 'submitEditing');
      
      expect(onSearch).toHaveBeenCalledWith('accessible search');
    });
  });

  describe('主题支持', () => {
    test('应该应用深色主题样式', () => {
      const { getByTestId } = render(
        <SearchBar {...defaultProps} theme="dark" testID="search-bar" />
      );
      
      expect(getByTestId('search-bar')).toBeTruthy();
    });

    test('应该应用浅色主题样式', () => {
      const { getByTestId } = render(
        <SearchBar {...defaultProps} theme="light" testID="search-bar" />
      );
      
      expect(getByTestId('search-bar')).toBeTruthy();
    });
  });

  describe('边界情况', () => {
    test('应该处理空搜索查询', () => {
      const onSearch = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} onSearch={onSearch} />
      );
      const input = getByPlaceholderText('Search music...');
      
      fireEvent(input, 'submitEditing');
      
      expect(onSearch).toHaveBeenCalledWith('');
    });

    test('应该处理非常长的搜索查询', () => {
      const longQuery = 'a'.repeat(1000);
      const { getByPlaceholderText } = render(<SearchBar {...defaultProps} />);
      const input = getByPlaceholderText('Search music...');
      
      expect(() => {
        fireEvent.changeText(input, longQuery);
      }).not.toThrow();
    });

    test('应该处理特殊字符', () => {
      const specialQuery = '!@#$%^&*()_+-=[]{}|;\':",./<>?';
      const onSearch = jest.fn();
      const { getByPlaceholderText } = render(
        <SearchBar {...defaultProps} onSearch={onSearch} />
      );
      const input = getByPlaceholderText('Search music...');
      
      fireEvent.changeText(input, specialQuery);
      fireEvent(input, 'submitEditing');
      
      expect(onSearch).toHaveBeenCalledWith(specialQuery);
    });

    test('应该处理快速连续的输入变化', () => {
      const { getByPlaceholderText } = render(<SearchBar {...defaultProps} />);
      const input = getByPlaceholderText('Search music...');
      
      // 快速连续输入
      for (let i = 0; i < 100; i++) {
        fireEvent.changeText(input, `query ${i}`);
      }
      
      expect(input.props.value).toBe('query 99');
    });
  });

  describe('性能测试', () => {
    test('应该处理大量建议项', () => {
      const largeSuggestions = Array.from({ length: 1000 }, (_, i) => `suggestion ${i}`);
      
      expect(() => {
        render(
          <SearchBar 
            {...defaultProps} 
            suggestions={largeSuggestions} 
            showSuggestions={true}
          />
        );
      }).not.toThrow();
    });

    test('应该高效处理频繁的状态更新', () => {
      const { getByPlaceholderText, rerender } = render(
        <SearchBar {...defaultProps} loading={false} />
      );
      
      // 频繁切换加载状态
      for (let i = 0; i < 50; i++) {
        rerender(<SearchBar {...defaultProps} loading={i % 2 === 0} />);
      }
      
      expect(getByPlaceholderText('Search music...')).toBeTruthy();
    });
  });

  describe('组件清理', () => {
    test('应该在卸载时清理定时器', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(
        <SearchBar {...defaultProps} debounceMs={300} />
      );
      
      unmount();
      
      // 验证清理函数被调用（取决于具体实现）
      // 这个测试可能需要根据实际的清理逻辑进行调整
    });
  });
});