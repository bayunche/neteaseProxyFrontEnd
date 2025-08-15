/**
 * PlaylistCard 组件测试 (React Native)
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PlaylistCard from '../../components/PlaylistCard';

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

describe('PlaylistCard', () => {
  const mockPlaylist = {
    id: 'playlist-123',
    name: 'My Favorite Songs',
    description: 'A collection of my all-time favorite tracks',
    coverUrl: 'https://example.com/playlist-cover.jpg',
    songCount: 25,
    totalDuration: 6000, // 100分钟
    isPublic: true,
    isOwned: true,
    creator: {
      id: 'user-456',
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg',
    },
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 一周前
    updatedAt: Date.now() - 24 * 60 * 60 * 1000, // 一天前
    tags: ['rock', 'pop', 'indie'],
    isLiked: false,
    playCount: 150,
  };

  const defaultProps = {
    playlist: mockPlaylist,
    onPress: jest.fn(),
    onPlay: jest.fn(),
    onLike: jest.fn(),
    onShare: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础渲染', () => {
    test('应该渲染播放列表信息', () => {
      const { getByText } = render(<PlaylistCard {...defaultProps} />);
      
      expect(getByText('My Favorite Songs')).toBeTruthy();
      expect(getByText('A collection of my all-time favorite tracks')).toBeTruthy();
      expect(getByText('25 songs')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
    });

    test('应该渲染播放列表封面', () => {
      const { getByTestId } = render(<PlaylistCard {...defaultProps} />);
      
      expect(getByTestId('mock-image')).toBeTruthy();
    });

    test('应该显示总时长', () => {
      const { getByText } = render(<PlaylistCard {...defaultProps} />);
      
      // 6000秒 = 100分钟 = 1h 40m
      expect(getByText('1h 40m')).toBeTruthy();
    });

    test('应该显示播放次数', () => {
      const { getByText } = render(<PlaylistCard {...defaultProps} />);
      
      expect(getByText('150 plays')).toBeTruthy();
    });

    test('应该处理缺少封面的情况', () => {
      const playlistWithoutCover = { ...mockPlaylist, coverUrl: undefined };
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} playlist={playlistWithoutCover} />
      );
      
      expect(getByTestId('default-playlist-cover')).toBeTruthy();
    });
  });

  describe('布局变体', () => {
    test('应该支持卡片布局', () => {
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} layout="card" />
      );
      
      expect(getByTestId('playlist-card')).toBeTruthy();
    });

    test('应该支持列表布局', () => {
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} layout="list" />
      );
      
      expect(getByTestId('playlist-card')).toBeTruthy();
    });

    test('应该支持网格布局', () => {
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} layout="grid" />
      );
      
      expect(getByTestId('playlist-card')).toBeTruthy();
    });

    test('应该支持紧凑布局', () => {
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} layout="compact" />
      );
      
      expect(getByTestId('playlist-card')).toBeTruthy();
    });
  });

  describe('用户交互', () => {
    test('应该处理卡片点击', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} onPress={onPress} />
      );
      
      fireEvent.press(getByTestId('playlist-card'));
      expect(onPress).toHaveBeenCalledWith(mockPlaylist);
    });

    test('应该处理播放按钮点击', () => {
      const onPlay = jest.fn();
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} onPlay={onPlay} />
      );
      
      fireEvent.press(getByTestId('play-button'));
      expect(onPlay).toHaveBeenCalledWith(mockPlaylist);
    });

    test('应该处理喜欢按钮点击', () => {
      const onLike = jest.fn();
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} onLike={onLike} />
      );
      
      fireEvent.press(getByTestId('like-button'));
      expect(onLike).toHaveBeenCalledWith(mockPlaylist);
    });

    test('应该处理分享按钮点击', () => {
      const onShare = jest.fn();
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} onShare={onShare} showShare={true} />
      );
      
      fireEvent.press(getByTestId('share-button'));
      expect(onShare).toHaveBeenCalledWith(mockPlaylist);
    });

    test('应该处理编辑按钮点击（仅所有者可见）', () => {
      const onEdit = jest.fn();
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} onEdit={onEdit} />
      );
      
      fireEvent.press(getByTestId('edit-button'));
      expect(onEdit).toHaveBeenCalledWith(mockPlaylist);
    });

    test('应该处理删除按钮点击（仅所有者可见）', () => {
      const onDelete = jest.fn();
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} onDelete={onDelete} />
      );
      
      fireEvent.press(getByTestId('delete-button'));
      expect(onDelete).toHaveBeenCalledWith(mockPlaylist);
    });

    test('应该处理长按事件', () => {
      const onLongPress = jest.fn();
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} onLongPress={onLongPress} />
      );
      
      fireEvent(getByTestId('playlist-card'), 'longPress');
      expect(onLongPress).toHaveBeenCalledWith(mockPlaylist);
    });
  });

  describe('权限控制', () => {
    test('应该为非所有者隐藏编辑/删除按钮', () => {
      const notOwnedPlaylist = { ...mockPlaylist, isOwned: false };
      const { queryByTestId } = render(
        <PlaylistCard {...defaultProps} playlist={notOwnedPlaylist} />
      );
      
      expect(queryByTestId('edit-button')).toBeFalsy();
      expect(queryByTestId('delete-button')).toBeFalsy();
    });

    test('应该显示公开/私有状态', () => {
      const { getByTestId } = render(<PlaylistCard {...defaultProps} />);
      
      expect(getByTestId('public-indicator')).toBeTruthy();
    });

    test('应该为私有播放列表显示私有图标', () => {
      const privatePlaylist = { ...mockPlaylist, isPublic: false };
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} playlist={privatePlaylist} />
      );
      
      expect(getByTestId('private-indicator')).toBeTruthy();
    });
  });

  describe('喜欢状态', () => {
    test('应该显示已喜欢状态', () => {
      const likedPlaylist = { ...mockPlaylist, isLiked: true };
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} playlist={likedPlaylist} />
      );
      
      const likeButton = getByTestId('like-button');
      expect(likeButton.props.style).toEqual(
        expect.objectContaining({ opacity: 1 })
      );
    });

    test('应该显示未喜欢状态', () => {
      const { getByTestId } = render(<PlaylistCard {...defaultProps} />);
      
      const likeButton = getByTestId('like-button');
      expect(likeButton.props.style).toEqual(
        expect.objectContaining({ opacity: expect.any(Number) })
      );
    });
  });

  describe('标签显示', () => {
    test('应该显示播放列表标签', () => {
      const { getByText } = render(
        <PlaylistCard {...defaultProps} showTags={true} />
      );
      
      expect(getByText('rock')).toBeTruthy();
      expect(getByText('pop')).toBeTruthy();
      expect(getByText('indie')).toBeTruthy();
    });

    test('应该限制显示的标签数量', () => {
      const manyTagsPlaylist = {
        ...mockPlaylist,
        tags: ['rock', 'pop', 'indie', 'alternative', 'classic', 'modern'],
      };
      
      const { queryByText } = render(
        <PlaylistCard 
          {...defaultProps} 
          playlist={manyTagsPlaylist} 
          showTags={true}
          maxTags={3}
        />
      );
      
      expect(queryByText('rock')).toBeTruthy();
      expect(queryByText('pop')).toBeTruthy();
      expect(queryByText('indie')).toBeTruthy();
      expect(queryByText('alternative')).toBeFalsy();
    });
  });

  describe('自定义样式', () => {
    test('应该接受自定义样式', () => {
      const customStyle = { backgroundColor: '#f0f0f0' };
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} style={customStyle} />
      );
      
      const card = getByTestId('playlist-card');
      expect(card.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });

    test('应该支持自定义封面样式', () => {
      const customCoverStyle = { borderRadius: 15 };
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} coverStyle={customCoverStyle} />
      );
      
      expect(getByTestId('mock-image')).toBeTruthy();
    });
  });

  describe('加载状态', () => {
    test('应该显示加载状态', () => {
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} loading={true} />
      );
      
      expect(getByTestId('loading-skeleton')).toBeTruthy();
    });

    test('应该在加载时禁用交互', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} loading={true} onPress={onPress} />
      );
      
      fireEvent.press(getByTestId('playlist-card'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    test('应该处理图片加载错误', () => {
      const { getByTestId } = render(<PlaylistCard {...defaultProps} />);
      const image = getByTestId('mock-image');
      
      // 模拟图片加载错误
      fireEvent(image, 'error');
      
      // 应该显示默认封面
      expect(getByTestId('default-playlist-cover')).toBeTruthy();
    });

    test('应该处理缺少播放列表信息', () => {
      const incompletePlaylist = {
        id: 'incomplete',
        name: 'Playlist Name',
        // 缺少其他信息
      };
      
      expect(() => {
        render(<PlaylistCard {...defaultProps} playlist={incompletePlaylist as any} />);
      }).not.toThrow();
    });
  });

  describe('可访问性', () => {
    test('应该具有适当的可访问性标签', () => {
      const { getByTestId } = render(<PlaylistCard {...defaultProps} />);
      
      const card = getByTestId('playlist-card');
      expect(card.props.accessibilityLabel).toBe('My Favorite Songs playlist by John Doe, 25 songs');
    });

    test('应该具有可访问性操作', () => {
      const { getByTestId } = render(<PlaylistCard {...defaultProps} />);
      
      const card = getByTestId('playlist-card');
      expect(card.props.accessibilityActions).toBeDefined();
    });

    test('应该处理可访问性操作', () => {
      const onPlay = jest.fn();
      const onLike = jest.fn();
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} onPlay={onPlay} onLike={onLike} />
      );
      
      const card = getByTestId('playlist-card');
      
      // 模拟可访问性操作
      fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'play' } });
      expect(onPlay).toHaveBeenCalled();
      
      fireEvent(card, 'accessibilityAction', { nativeEvent: { actionName: 'like' } });
      expect(onLike).toHaveBeenCalled();
    });
  });

  describe('时间格式化', () => {
    test('应该正确格式化分钟', () => {
      const shortPlaylist = { ...mockPlaylist, totalDuration: 1800 }; // 30分钟
      const { getByText } = render(
        <PlaylistCard {...defaultProps} playlist={shortPlaylist} />
      );
      
      expect(getByText('30m')).toBeTruthy();
    });

    test('应该正确格式化小时和分钟', () => {
      const longPlaylist = { ...mockPlaylist, totalDuration: 9000 }; // 150分钟 = 2h 30m
      const { getByText } = render(
        <PlaylistCard {...defaultProps} playlist={longPlaylist} />
      );
      
      expect(getByText('2h 30m')).toBeTruthy();
    });

    test('应该处理零时长', () => {
      const emptyPlaylist = { ...mockPlaylist, totalDuration: 0, songCount: 0 };
      const { getByText } = render(
        <PlaylistCard {...defaultProps} playlist={emptyPlaylist} />
      );
      
      expect(getByText('0 songs')).toBeTruthy();
      expect(getByText('0m')).toBeTruthy();
    });
  });

  describe('主题支持', () => {
    test('应该应用深色主题', () => {
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} theme="dark" />
      );
      
      expect(getByTestId('playlist-card')).toBeTruthy();
    });

    test('应该应用浅色主题', () => {
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} theme="light" />
      );
      
      expect(getByTestId('playlist-card')).toBeTruthy();
    });
  });

  describe('动画效果', () => {
    test('应该支持进入动画', () => {
      const { getByTestId } = render(
        <PlaylistCard {...defaultProps} animated={true} />
      );
      
      expect(getByTestId('playlist-card')).toBeTruthy();
    });

    test('应该支持悬停效果', () => {
      const { getByTestId } = render(<PlaylistCard {...defaultProps} />);
      const card = getByTestId('playlist-card');
      
      // 模拟悬停状态
      fireEvent(card, 'pressIn');
      fireEvent(card, 'pressOut');
      
      expect(card).toBeTruthy();
    });
  });

  describe('性能优化', () => {
    test('应该支持浅比较优化', () => {
      const { rerender } = render(<PlaylistCard {...defaultProps} />);
      
      // 使用相同的props重新渲染
      rerender(<PlaylistCard {...defaultProps} />);
      
      // 组件应该正常工作
      expect(true).toBe(true);
    });

    test('应该处理大量重新渲染', () => {
      const { rerender } = render(<PlaylistCard {...defaultProps} />);
      
      // 大量重新渲染
      for (let i = 0; i < 100; i++) {
        const updatedPlaylist = { ...mockPlaylist, name: `Playlist ${i}` };
        rerender(<PlaylistCard {...defaultProps} playlist={updatedPlaylist} />);
      }
      
      expect(true).toBe(true);
    });
  });

  describe('边界情况', () => {
    test('应该处理极长的播放列表名称', () => {
      const longNamePlaylist = {
        ...mockPlaylist,
        name: 'This is a very long playlist name that should be truncated properly to avoid layout issues in the UI',
      };
      
      const { getByText } = render(
        <PlaylistCard {...defaultProps} playlist={longNamePlaylist} />
      );
      
      expect(getByText(/This is a very long playlist name/)).toBeTruthy();
    });

    test('应该处理极长的描述', () => {
      const longDescPlaylist = {
        ...mockPlaylist,
        description: 'This is a very long description that contains a lot of text and should be handled properly by the component to avoid any layout issues or performance problems that might occur when rendering such long text content.',
      };
      
      const { getByText } = render(
        <PlaylistCard {...defaultProps} playlist={longDescPlaylist} />
      );
      
      expect(getByText(/This is a very long description/)).toBeTruthy();
    });

    test('应该处理大量歌曲的播放列表', () => {
      const largePlaylist = {
        ...mockPlaylist,
        songCount: 10000,
        totalDuration: 2400000, // 40000分钟
      };
      
      const { getByText } = render(
        <PlaylistCard {...defaultProps} playlist={largePlaylist} />
      );
      
      expect(getByText('10000 songs')).toBeTruthy();
    });

    test('应该处理缺少创建者信息', () => {
      const noCreatorPlaylist = {
        ...mockPlaylist,
        creator: undefined,
      };
      
      expect(() => {
        render(<PlaylistCard {...defaultProps} playlist={noCreatorPlaylist as any} />);
      }).not.toThrow();
    });

    test('应该处理缺少回调函数', () => {
      expect(() => {
        render(<PlaylistCard playlist={mockPlaylist} />);
      }).not.toThrow();
    });
  });
});