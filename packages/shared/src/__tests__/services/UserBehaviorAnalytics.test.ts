/**
 * 用户行为分析系统测试
 */

import { UserBehaviorAnalytics, UserEvent, UserSession, UserProfile } from '../../services/monitoring/UserBehaviorAnalytics';

// Mock DOM APIs
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: {
    referrer: 'https://example.com',
  },
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: {
    location: {
      pathname: '/test-page',
    },
    innerWidth: 1920,
    innerHeight: 1080,
    addEventListener: jest.fn(),
  },
  writable: true,
});

describe('UserBehaviorAnalytics', () => {
  let analytics: UserBehaviorAnalytics;

  beforeEach(() => {
    analytics = UserBehaviorAnalytics.getInstance();
    // 清理之前的数据
    (analytics as any).sessions.clear();
    (analytics as any).profiles.clear();
    (analytics as any).events = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('单例模式', () => {
    test('应该返回相同的实例', () => {
      const analytics1 = UserBehaviorAnalytics.getInstance();
      const analytics2 = UserBehaviorAnalytics.getInstance();
      expect(analytics1).toBe(analytics2);
    });
  });

  describe('会话管理', () => {
    test('应该能够创建新会话', () => {
      const userId = 'user123';
      const sessionId = analytics.startSession(userId);
      
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toMatch(/^session_/);
      
      const session = (analytics as any).sessions.get(sessionId);
      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.startTime).toBeLessThanOrEqual(Date.now());
    });

    test('应该能够结束会话', () => {
      const sessionId = analytics.startSession('user123');
      
      analytics.endSession(sessionId);
      
      const session = (analytics as any).sessions.get(sessionId);
      expect(session.endTime).toBeDefined();
      expect(session.duration).toBeGreaterThanOrEqual(0);
    });

    test('应该计算会话参与度分数', () => {
      const sessionId = analytics.startSession('user123');
      
      // 添加一些事件来提高参与度
      analytics.trackPageView('/home');
      analytics.trackInteraction('play-button', 'click');
      analytics.trackPlay('song123');
      
      analytics.endSession(sessionId);
      
      const session = (analytics as any).sessions.get(sessionId);
      expect(session.metrics.engagementScore).toBeGreaterThan(0);
    });
  });

  describe('事件跟踪', () => {
    test('应该能够跟踪通用事件', () => {
      analytics.track('click', 'ui', 'button_click', {
        button: 'play',
        position: { x: 100, y: 200 },
      });
      
      const events = (analytics as any).events;
      expect(events).toHaveLength(1);
      
      const event = events[0];
      expect(event.type).toBe('click');
      expect(event.category).toBe('ui');
      expect(event.action).toBe('button_click');
      expect(event.properties.button).toBe('play');
    });

    test('应该能够跟踪页面浏览', () => {
      analytics.trackPageView('/discover', { 
        category: 'music',
        source: 'navigation' 
      });
      
      const events = (analytics as any).events;
      const pageViewEvent = events.find((e: UserEvent) => e.type === 'page_view');
      
      expect(pageViewEvent).toBeDefined();
      expect(pageViewEvent.properties.page).toBe('/discover');
      expect(pageViewEvent.properties.category).toBe('music');
    });

    test('应该能够跟踪用户交互', () => {
      analytics.trackInteraction('volume-slider', 'drag', {
        value: 75,
        previousValue: 50,
      });
      
      const events = (analytics as any).events;
      const interactionEvent = events.find((e: UserEvent) => e.type === 'click');
      
      expect(interactionEvent).toBeDefined();
      expect(interactionEvent.action).toBe('drag');
      expect(interactionEvent.properties.element).toBe('volume-slider');
      expect(interactionEvent.properties.value).toBe(75);
    });

    test('应该能够跟踪音乐播放', () => {
      const songId = 'song456';
      
      analytics.trackPlay(songId, {
        artist: 'Test Artist',
        album: 'Test Album',
        duration: 240,
      });
      
      const events = (analytics as any).events;
      const playEvent = events.find((e: UserEvent) => e.type === 'play');
      
      expect(playEvent).toBeDefined();
      expect(playEvent.properties.songId).toBe(songId);
      expect(playEvent.properties.artist).toBe('Test Artist');
    });

    test('应该能够跟踪搜索行为', () => {
      const query = 'rock music';
      const results = 25;
      
      analytics.trackSearch(query, results, {
        filters: ['genre:rock'],
        sortBy: 'popularity',
      });
      
      const events = (analytics as any).events;
      const searchEvent = events.find((e: UserEvent) => e.type === 'search');
      
      expect(searchEvent).toBeDefined();
      expect(searchEvent.properties.query).toBe(query);
      expect(searchEvent.properties.results).toBe(results);
    });

    test('应该限制事件数量', () => {
      const maxEvents = 50000;
      
      // 添加超过限制的事件
      for (let i = 0; i < maxEvents + 100; i++) {
        analytics.track('test', 'test', 'test', { index: i });
      }
      
      const events = (analytics as any).events;
      expect(events.length).toBeLessThanOrEqual(maxEvents);
    });

    test('应该遵守采样率', () => {
      // 设置很低的采样率
      (analytics as any).config.samplingRate = 0.1;
      
      let trackedEvents = 0;
      for (let i = 0; i < 1000; i++) {
        const initialLength = (analytics as any).events.length;
        analytics.track('test', 'test', 'test', { index: i });
        if ((analytics as any).events.length > initialLength) {
          trackedEvents++;
        }
      }
      
      // 应该只有大约10%的事件被跟踪
      expect(trackedEvents).toBeLessThan(200);
      
      // 恢复采样率
      (analytics as any).config.samplingRate = 1.0;
    });
  });

  describe('用户旅程分析', () => {
    test('应该生成用户旅程地图', () => {
      const userId = 'journey-user';
      analytics.startSession(userId);
      
      // 模拟用户旅程
      analytics.trackPageView('/home');
      setTimeout(() => analytics.trackSearch('jazz music', 10), 100);
      setTimeout(() => analytics.trackPlay('song789'), 200);
      setTimeout(() => analytics.trackPageView('/playlist'), 300);
      
      setTimeout(() => {
        const journey = analytics.generateUserJourney(userId);
        
        expect(journey).toHaveLength(4);
        expect(journey[0].action).toBe('navigation.page_view');
        expect(journey[1].action).toBe('discovery.search');
        expect(journey[2].action).toBe('music.play_song');
        expect(journey[3].action).toBe('navigation.page_view');
        
        // 检查时间顺序
        for (let i = 1; i < journey.length; i++) {
          expect(journey[i].timestamp).toBeGreaterThanOrEqual(journey[i-1].timestamp);
        }
      }, 500);
    });
  });

  describe('漏斗分析', () => {
    test('应该分析转化漏斗', () => {
      // 创建测试用户和事件
      const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
      
      users.forEach((userId, index) => {
        analytics.startSession(userId);
        
        // 所有用户访问首页
        analytics.track('page_view', 'navigation', 'page_view', { page: '/home' }, userId);
        
        // 80%用户搜索
        if (index < 4) {
          analytics.track('search', 'discovery', 'search', { query: 'music' }, userId);
        }
        
        // 60%用户播放音乐
        if (index < 3) {
          analytics.track('play', 'music', 'play_song', { songId: 'song123' }, userId);
        }
        
        // 40%用户收藏
        if (index < 2) {
          analytics.track('like', 'engagement', 'like_song', { songId: 'song123' }, userId);
        }
      });
      
      const funnelSteps = [
        { name: '访问首页', events: ['navigation.page_view'] },
        { name: '搜索音乐', events: ['discovery.search'] },
        { name: '播放歌曲', events: ['music.play_song'] },
        { name: '收藏歌曲', events: ['engagement.like_song'] },
      ];
      
      const funnel = analytics.analyzeFunnel(funnelSteps);
      
      expect(funnel.steps).toHaveLength(4);
      expect(funnel.steps[0].users).toBe(5); // 所有用户访问首页
      expect(funnel.steps[1].users).toBe(4); // 4个用户搜索
      expect(funnel.steps[2].users).toBe(3); // 3个用户播放
      expect(funnel.steps[3].users).toBe(2); // 2个用户收藏
      
      // 检查转化率计算
      expect(funnel.steps[1].conversionRate).toBe(80); // 4/5 * 100
      expect(funnel.overallConversionRate).toBe(40); // 2/5 * 100
    });
  });

  describe('群组分析', () => {
    test('应该分析用户群组留存', () => {
      const now = Date.now();
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      
      // 创建不同周期的用户事件
      ['user1', 'user2', 'user3'].forEach((userId, index) => {
        // 第一周活动
        analytics.track('page_view', 'navigation', 'page_view', {}, userId);
        
        // 部分用户在第二周活动
        if (index < 2) {
          (analytics as any).events.push({
            id: `retention-${userId}-week2`,
            sessionId: 'test-session',
            userId,
            type: 'page_view',
            category: 'navigation',
            action: 'page_view',
            timestamp: now + weekMs,
            properties: {},
            context: {
              page: '/home',
              component: 'test',
              viewport: { width: 1920, height: 1080 },
            },
          });
        }
        
        // 只有部分用户在第三周活动
        if (index < 1) {
          (analytics as any).events.push({
            id: `retention-${userId}-week3`,
            sessionId: 'test-session',
            userId,
            type: 'page_view',
            category: 'navigation',
            action: 'page_view',
            timestamp: now + 2 * weekMs,
            properties: {},
            context: {
              page: '/home',
              component: 'test',
              viewport: { width: 1920, height: 1080 },
            },
          });
        }
      });
      
      const cohorts = analytics.analyzeCohort('weekly');
      
      expect(cohorts.length).toBeGreaterThan(0);
      const cohort = cohorts[0];
      
      expect(cohort.users).toHaveLength(3);
      expect(cohort.metrics.retention[0]).toBe(100); // 第0周100%留存
      expect(cohort.metrics.retention[1]).toBeGreaterThan(0); // 第1周有留存
    });
  });

  describe('热力图数据', () => {
    test('应该生成页面点击热力图数据', () => {
      const page = '/player';
      
      // 模拟点击事件
      const clicks = [
        { x: 100, y: 200 },
        { x: 105, y: 205 }, // 相近的点击会被聚合
        { x: 300, y: 400 },
        { x: 100, y: 200 }, // 重复点击增加权重
      ];
      
      clicks.forEach((position, index) => {
        analytics.track('click', 'ui', 'click', {
          position,
          component: 'button',
        });
        
        // 设置页面上下文
        const event = (analytics as any).events[(analytics as any).events.length - 1];
        event.context.page = page;
      });
      
      const heatmapData = analytics.getHeatmapData(page);
      
      expect(heatmapData.length).toBeGreaterThan(0);
      
      // 检查数据格式
      heatmapData.forEach(point => {
        expect(point).toHaveProperty('x');
        expect(point).toHaveProperty('y');
        expect(point).toHaveProperty('value');
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(typeof point.value).toBe('number');
      });
      
      // 相同区域的点击应该被聚合
      const point100_200 = heatmapData.find(p => p.x === 100 && p.y === 200);
      expect(point100_200?.value).toBeGreaterThan(1);
    });
  });

  describe('实时统计', () => {
    test('应该提供实时统计数据', () => {
      // 添加一些活动用户
      analytics.startSession('user1');
      analytics.startSession('user2');
      analytics.trackPageView('/popular-page');
      analytics.trackInteraction('popular-action', 'click');
      
      const realtimeStats = analytics.getRealtimeStats();
      
      expect(realtimeStats).toHaveProperty('activeUsers');
      expect(realtimeStats).toHaveProperty('currentSessions');
      expect(realtimeStats).toHaveProperty('eventsPerSecond');
      expect(realtimeStats).toHaveProperty('popularPages');
      expect(realtimeStats).toHaveProperty('popularActions');
      
      expect(realtimeStats.activeUsers).toBeGreaterThan(0);
      expect(realtimeStats.currentSessions).toBeGreaterThan(0);
      expect(Array.isArray(realtimeStats.popularPages)).toBe(true);
      expect(Array.isArray(realtimeStats.popularActions)).toBe(true);
    });
  });

  describe('用户画像', () => {
    test('应该创建和更新用户画像', () => {
      const userId = 'profile-user';
      const sessionId = analytics.startSession(userId);
      
      // 添加用户行为数据
      analytics.trackPlay('song1', { genre: 'jazz', artist: 'Miles Davis' });
      analytics.trackPlay('song2', { genre: 'jazz', artist: 'John Coltrane' });
      analytics.trackSearch('jazz music', 10);
      
      analytics.endSession(sessionId);
      
      const profile = analytics.getUserProfile(userId);
      
      expect(profile).toBeDefined();
      expect(profile?.userId).toBe(userId);
      expect(profile?.totalSessions).toBe(1);
      expect(profile?.value.engagement).toBeGreaterThan(0);
    });

    test('应该处理不存在的用户画像', () => {
      const profile = analytics.getUserProfile('nonexistent-user');
      expect(profile).toBeNull();
    });
  });

  describe('A/B测试分析', () => {
    test('应该分析A/B测试结果', () => {
      const testName = 'button-color-test';
      const variants = ['red', 'blue'];
      
      // 模拟A/B测试事件
      ['user1', 'user2', 'user3', 'user4'].forEach((userId, index) => {
        const variant = variants[index % 2];
        const converted = index < 2; // 50%转化率
        
        analytics.track('custom', 'ab_test', 'exposure', {
          abTest: testName,
          variant,
        }, userId);
        
        if (converted) {
          analytics.track('custom', 'ab_test', 'conversion', {
            abTest: testName,
            variant,
            conversion: true,
          }, userId);
        }
      });
      
      const results = analytics.analyzeABTest(testName, variants);
      
      expect(results).toHaveProperty('red');
      expect(results).toHaveProperty('blue');
      
      variants.forEach(variant => {
        expect(results[variant]).toHaveProperty('users');
        expect(results[variant]).toHaveProperty('conversions');
        expect(results[variant]).toHaveProperty('conversionRate');
        expect(results[variant]).toHaveProperty('confidence');
      });
    });
  });

  describe('边界情况处理', () => {
    test('应该处理无效的事件数据', () => {
      expect(() => {
        analytics.track('' as any, '', '', {});
      }).not.toThrow();
    });

    test('应该处理空的用户ID', () => {
      expect(() => {
        analytics.track('click', 'ui', 'click', {}, '');
        analytics.startSession('');
      }).not.toThrow();
    });

    test('应该处理大量并发事件', () => {
      const events = [];
      for (let i = 0; i < 1000; i++) {
        events.push(() => {
          analytics.track('test', 'performance', 'concurrent_test', { index: i });
        });
      }
      
      expect(() => {
        events.forEach(fn => fn());
      }).not.toThrow();
      
      const trackedEvents = (analytics as any).events;
      expect(trackedEvents.length).toBeGreaterThan(0);
    });

    test('应该处理内存清理', () => {
      // 添加大量事件
      for (let i = 0; i < 1000; i++) {
        analytics.track('test', 'cleanup', 'test', { index: i });
      }
      
      const initialLength = (analytics as any).events.length;
      
      // 触发清理
      (analytics as any).cleanupOldData();
      
      // 验证数据被清理（或保持在合理范围内）
      const finalLength = (analytics as any).events.length;
      expect(finalLength).toBeLessThanOrEqual(initialLength);
    });
  });

  describe('配置管理', () => {
    test('应该允许更新配置', () => {
      const originalTimeout = (analytics as any).config.sessionTimeout;
      
      // 更新配置
      (analytics as any).config.sessionTimeout = 60 * 60 * 1000; // 1小时
      
      expect((analytics as any).config.sessionTimeout).not.toBe(originalTimeout);
      expect((analytics as any).config.sessionTimeout).toBe(60 * 60 * 1000);
    });

    test('应该维护配置的有效性', () => {
      const config = (analytics as any).config;
      
      expect(config.maxEvents).toBeGreaterThan(0);
      expect(config.samplingRate).toBeGreaterThan(0);
      expect(config.samplingRate).toBeLessThanOrEqual(1);
      expect(config.sessionTimeout).toBeGreaterThan(0);
    });
  });
});