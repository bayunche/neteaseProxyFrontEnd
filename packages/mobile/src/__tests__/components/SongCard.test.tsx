/**
 * SongCard 组件测试 (React Native)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SongCard from '../../components/SongCard';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // 添加 createAnimatedComponent mock
  Reanimated.createAnimatedComponent = (component: any) => component;
  
  return Reanimated;
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock Image component
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Image: (props: any) => <RN.View testID="mock-image" {...props} />,
  };
});

describe('SongCard', () => {
  const mockSong = {
    id: 'song-123',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 240, // 4分钟
    coverUrl: 'https://example.com/cover.jpg',
    isLiked: false,
    isPlaying: false,
    genre: 'Rock',
    year: 2023,
  };

  const defaultProps = {
    song: mockSong,
    onPress: jest.fn(),
    onPlay: jest.fn(),
    onPause: jest.fn(),
    onLike: jest.fn(),
    onAddToQueue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染', () => {
    test('应该渲染歌曲信息', () => {
      const { getByText } = render(<SongCard {...defaultProps} />);
      
      expect(getByText('Test Song')).toBeTruthy();
      expect(getByText('Test Artist')).toBeTruthy();
      expect(getByText('Test Album')).toBeTruthy();
    });

    test('应该渲染专辑封面', () => {
      const { getByTestId } = render(<SongCard {...defaultProps} />);
      
      expect(getByTestId('mock-image')).toBeTruthy();
    });

    test('应该显示歌曲时长', () => {
      const { getByText } = render(<SongCard {...defaultProps} />);
      
      // 240秒 = 4:00
      expect(getByText('4:00')).toBeTruthy();
    });

    test('应该处理缺少专辑封面的情况', () => {
      const songWithoutCover = { ...mockSong, coverUrl: undefined };
      const { getByTestId } = render(
        <SongCard {...defaultProps} song={songWithoutCover} />
      );
      
      // 应该显示默认封面或占位符
      expect(getByTestId('default-cover')).toBeTruthy();
    });
  });

  describe('播放状态', () => {
    test('应该显示播放中状态', () => {
      const playingSong = { ...mockSong, isPlaying: true };
      const { getByTestId } = render(
        <SongCard {...defaultProps} song={playingSong} />
      );
      
      expect(getByTestId('pause-button')).toBeTruthy();
    });

    test('应该显示暂停状态', () => {
      const pausedSong = { ...mockSong, isPlaying: false };
      const { getByTestId } = render(
        <SongCard {...defaultProps} song={pausedSong} />
      );
      
      expect(getByTestId('play-button')).toBeTruthy();
    });

    test('应该在播放中时显示音频波形动画', () => {
      const playingSong = { ...mockSong, isPlaying: true };
      const { getByTestId } = render(
        <SongCard {...defaultProps} song={playingSong} showWaveform={true} />
      );
      
      expect(getByTestId('audio-waveform')).toBeTruthy();
    });
  });

  describe('用户交互', () => {
    test('应该处理卡片点击', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <SongCard {...defaultProps} onPress={onPress} />
      );
      
      fireEvent.press(getByTestId('song-card'));
      expect(onPress).toHaveBeenCalledWith(mockSong);
    });

    test('应该处理播放按钮点击', () => {
      const onPlay = jest.fn();
      const { getByTestId } = render(
        <SongCard {...defaultProps} onPlay={onPlay} />
      );
      
      fireEvent.press(getByTestId('play-button'));
      expect(onPlay).toHaveBeenCalledWith(mockSong);
    });

    test('应该处理暂停按钮点击', () => {
      const onPause = jest.fn();
      const playingSong = { ...mockSong, isPlaying: true };
      const { getByTestId } = render(
        <SongCard {...defaultProps} song={playingSong} onPause={onPause} />
      );
      
      fireEvent.press(getByTestId('pause-button'));
      expect(onPause).toHaveBeenCalledWith(playingSong);
    });

    test('应该处理喜欢按钮点击', () => {
      const onLike = jest.fn();
      const { getByTestId } = render(
        <SongCard {...defaultProps} onLike={onLike} />
      );
      
      fireEvent.press(getByTestId('like-button'));
      expect(onLike).toHaveBeenCalledWith(mockSong);
    });

    test('应该处理添加到队列按钮点击', () => {
      const onAddToQueue = jest.fn();
      const { getByTestId } = render(
        <SongCard {...defaultProps} onAddToQueue={onAddToQueue} showAddToQueue={true} />
      );
      
      fireEvent.press(getByTestId('add-to-queue-button'));
      expect(onAddToQueue).toHaveBeenCalledWith(mockSong);
    });

    test('应该处理长按事件', () => {
      const onLongPress = jest.fn();
      const { getByTestId } = render(
        <SongCard {...defaultProps} onLongPress={onLongPress} />
      );
      
      fireEvent(getByTestId('song-card'), 'longPress');
      expect(onLongPress).toHaveBeenCalledWith(mockSong);
    });
  });

  describe('喜欢状态', () => {
    test('应该显示已喜欢状态', () => {
      const likedSong = { ...mockSong, isLiked: true };
      const { getByTestId } = render(
        <SongCard {...defaultProps} song={likedSong} />
      );
      
      const likeButton = getByTestId('like-button');
      expect(likeButton.props.style).toEqual(
        expect.objectContaining({ opacity: 1 })
      );
    });

    test('应该显示未喜欢状态', () => {
      const { getByTestId } = render(<SongCard {...defaultProps} />);
      
      const likeButton = getByTestId('like-button');
      expect(likeButton.props.style).toEqual(
        expect.objectContaining({ opacity: expect.any(Number) })
      );
    });
  });

  describe('布局变体', () => {
    test('应该支持紧凑布局', () => {
      const { getByTestId } = render(
        <SongCard {...defaultProps} layout="compact" />
      );
      
      expect(getByTestId('song-card')).toBeTruthy();
      // 紧凑布局应该有不同的样式
    });

    test('应该支持详细布局', () => {
      const { getByTestId, getByText } = render(
        <SongCard {...defaultProps} layout="detailed" />
      );
      
      expect(getByTestId('song-card')).toBeTruthy();
      // 详细布局应该显示更多信息
      expect(getByText('Rock')).toBeTruthy(); // 显示流派
      expect(getByText('2023')).toBeTruthy(); // 显示年份
    });

    test('应该支持网格布局', () => {
      const { getByTestId } = render(
        <SongCard {...defaultProps} layout="grid" />
      );
      
      expect(getByTestId('song-card')).toBeTruthy();
      // 网格布局应该是方形的
    });
  });

  describe('自定义样式', () => {
    test('应该接受自定义样式', () => {
      const customStyle = { backgroundColor: '#f0f0f0' };
      const { getByTestId } = render(
        <SongCard {...defaultProps} style={customStyle} />
      );
      
      const card = getByTestId('song-card');
      expect(card.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });

    test('应该支持自定义封面样式', () => {
      const customCoverStyle = { borderRadius: 20 };
      const { getByTestId } = render(
        <SongCard {...defaultProps} coverStyle={customCoverStyle} />
      );
      
      expect(getByTestId('mock-image')).toBeTruthy();
    });
  });

  describe('加载状态', () => {
    test('应该显示加载状态', () => {
      const { getByTestId } = render(
        <SongCard {...defaultProps} loading={true} />
      );
      
      expect(getByTestId('loading-skeleton')).toBeTruthy();
    });

    test('应该在加载时禁用交互', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <SongCard {...defaultProps} loading={true} onPress={onPress} />
      );
      
      fireEvent.press(getByTestId('song-card'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    test('应该处理图片加载错误', () => {
      const { getByTestId } = render(<SongCard {...defaultProps} />);
      const image = getByTestId('mock-image');
      
      // 模拟图片加载错误
      fireEvent(image, 'error');
      
      // 应该显示默认封面
      expect(getByTestId('default-cover')).toBeTruthy();
    });

    test('应该处理缺少歌曲信息', () => {
      const incompleteSong = {
        id: 'incomplete',
        title: 'Song Title',
        // 缺少其他信息
      };
      
      expect(() => {
        render(<SongCard {...defaultProps} song={incompleteSong as any} />);
      }).not.toThrow();
    });
  });

  describe('可访问性', () => {
    test('应该具有适当的可访问性标签', () => {
      const { getByTestId } = render(<SongCard {...defaultProps} />);
      
      const card = getByTestId('song-card');
      expect(card.props.accessibilityLabel).toBe('Test Song by Test Artist');
    });

    test('应该具有可访问性操作', () => {
      const { getByTestId } = render(<SongCard {...defaultProps} />);
      
      const card = getByTestId('song-card');
      expect(card.props.accessibilityActions).toBeDefined();
    });

    test('应该处理可访问性操作', () => {
      const onPlay = jest.fn();
      const onLike = jest.fn();
      const { getByTestId } = render(
        <SongCard {...defaultProps} onPlay={onPlay} onLike={onLike} />
      );
      
      const card = getByTestId('song-card');
      
      // 模拟可访问性操作
      fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'play' } });
      expect(onPlay).toHaveBeenCalled();
      
      fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'like' } });
      expect(onLike).toHaveBeenCalled();
    });
  });

  describe('主题支持', () => {
    test('应该应用深色主题', () => {
      const { getByTestId } = render(
        <SongCard {...defaultProps} theme="dark" />
      );
      
      expect(getByTestId('song-card')).toBeTruthy();
    });

    test('应该应用浅色主题', () => {
      const { getByTestId } = render(
        <SongCard {...defaultProps} theme="light" />
      );
      
      expect(getByTestId('song-card')).toBeTruthy();
    });
  });

  describe('动画效果', () => {
    test('应该支持进入动画', () => {
      const { getByTestId } = render(
        <SongCard {...defaultProps} animated={true} />
      );
      
      expect(getByTestId('song-card')).toBeTruthy();
    });

    test('应该支持悬停效果', () => {
      const { getByTestId } = render(<SongCard {...defaultProps} />);
      const card = getByTestId('song-card');
      
      // 模拟悬停状态
      fireEvent(card, 'pressIn');
      fireEvent(card, 'pressOut');
      
      expect(card).toBeTruthy();
    });
  });

  describe('性能优化', () => {
    test('应该支持浅比较优化', () => {
      const { rerender } = render(<SongCard {...defaultProps} />);
      
      // 使用相同的props重新渲染
      rerender(<SongCard {...defaultProps} />);
      
      // 组件应该正常工作
      expect(true).toBe(true);
    });

    test('应该处理大量重新渲染', () => {
      const { rerender } = render(<SongCard {...defaultProps} />);
      
      // 大量重新渲染
      for (let i = 0; i < 100; i++) {
        const updatedSong = { ...mockSong, title: `Song ${i}` };
        rerender(<SongCard {...defaultProps} song={updatedSong} />);
      }
      
      expect(true).toBe(true);
    });
  });

  describe('边界情况', () => {
    test('应该处理极长的歌曲标题', () => {
      const longTitleSong = {
        ...mockSong,
        title: 'This is a very long song title that should be truncated properly to avoid layout issues',
      };
      
      const { getByText } = render(
        <SongCard {...defaultProps} song={longTitleSong} />
      );
      
      expect(getByText(/This is a very long song title/)).toBeTruthy();
    });

    test('应该处理零时长歌曲', () => {
      const zeroLengthSong = { ...mockSong, duration: 0 };
      const { getByText } = render(
        <SongCard {...defaultProps} song={zeroLengthSong} />
      );
      
      expect(getByText('0:00')).toBeTruthy();
    });

    test('应该处理极长时长歌曲', () => {
      const longSong = { ...mockSong, duration: 3661 }; // 1小时1分1秒
      const { getByText } = render(
        <SongCard {...defaultProps} song={longSong} />
      );
      
      expect(getByText('1:01:01')).toBeTruthy();
    });

    test('应该处理缺少回调函数', () => {
      expect(() => {
        render(<SongCard song={mockSong} />);
      }).not.toThrow();
    });
  });
});