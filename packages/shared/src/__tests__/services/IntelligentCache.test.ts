/**
 * 智能缓存系统测试
 */

import { IntelligentCache, PredictionModel, UserBehaviorData } from '../../services/cache/IntelligentCache';

// Mock 预测模型
class MockPredictionModel implements PredictionModel {
  async predictNextSongs(userId: string, currentSong: string): Promise<string[]> {
    return ['song1', 'song2', 'song3'];
  }

  async updateModel(behaviorData: UserBehaviorData): Promise<void> {
    // Mock implementation
  }

  async getPopularityScore(songId: string): Promise<number> {
    return Math.random();
  }

  async getPersonalizedScore(userId: string, songId: string): Promise<number> {
    return Math.random();
  }
}

describe('IntelligentCache', () => {
  let cache: IntelligentCache;
  let mockModel: MockPredictionModel;

  beforeEach(() => {
    mockModel = new MockPredictionModel();
    cache = IntelligentCache.getInstance(mockModel);
    cache.clear();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('基础缓存功能', () => {
    test('应该能够设置和获取缓存数据', async () => {
      const key = 'test-key';
      const data = { test: 'data' };
      const metadata = { category: 'test', tags: [] };

      await cache.set(key, data, metadata);
      const retrieved = await cache.get<typeof data>(key);

      expect(retrieved).toEqual(data);
    });

    test('应该在数据过期时返回null', async () => {
      const key = 'expired-key';
      const data = { test: 'data' };
      const metadata = { 
        category: 'test', 
        tags: [],
        expiresAt: Date.now() - 1000 // 已过期
      };

      await cache.set(key, data, metadata);
      const retrieved = await cache.get(key);

      expect(retrieved).toBeNull();
    });

    test('应该能够删除缓存项', async () => {
      const key = 'delete-key';
      const data = { test: 'data' };
      const metadata = { category: 'test', tags: [] };

      await cache.set(key, data, metadata);
      const deleted = cache.delete(key);
      const retrieved = await cache.get(key);

      expect(deleted).toBe(true);
      expect(retrieved).toBeNull();
    });

    test('应该能够清空所有缓存', async () => {
      await cache.set('key1', 'data1', { category: 'test', tags: [] });
      await cache.set('key2', 'data2', { category: 'test', tags: [] });

      cache.clear();

      const retrieved1 = await cache.get('key1');
      const retrieved2 = await cache.get('key2');

      expect(retrieved1).toBeNull();
      expect(retrieved2).toBeNull();
    });
  });

  describe('用户行为记录', () => {
    test('应该能够记录用户行为数据', () => {
      const userId = 'user123';
      const behaviorData = {
        listenHistory: [{
          songId: 'song1',
          timestamp: Date.now(),
          duration: 180
        }],
        searchHistory: ['test query'],
        playlistInteractions: [{
          playlistId: 'playlist1',
          action: 'play' as const,
          timestamp: Date.now()
        }]
      };

      expect(() => {
        cache.recordUserBehavior(userId, behaviorData);
      }).not.toThrow();
    });
  });

  describe('统计信息', () => {
    test('应该返回正确的缓存统计信息', async () => {
      await cache.set('key1', 'data1', { category: 'audio', tags: [] });
      await cache.get('key1');

      const stats = cache.getStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('currentSize');
      expect(stats).toHaveProperty('currentEntries');
      expect(stats.hits).toBeGreaterThan(0);
    });

    test('应该能够导出缓存状态', async () => {
      await cache.set('key1', 'data1', { category: 'test', tags: [] });

      const state = cache.exportState();

      expect(state).toHaveProperty('config');
      expect(state).toHaveProperty('stats');
      expect(state).toHaveProperty('entries');
      expect(Array.isArray(state.entries)).toBe(true);
    });
  });

  describe('性能测试', () => {
    test('应该能够处理大量缓存操作', async () => {
      const startTime = Date.now();
      const operations = [];

      // 并发设置1000个缓存项
      for (let i = 0; i < 1000; i++) {
        operations.push(
          cache.set(`key${i}`, `data${i}`, { 
            category: 'test', 
            tags: [`tag${i % 10}`] 
          })
        );
      }

      await Promise.all(operations);

      // 并发获取所有缓存项
      const getOperations = [];
      for (let i = 0; i < 1000; i++) {
        getOperations.push(cache.get(`key${i}`));
      }

      const results = await Promise.all(getOperations);
      const endTime = Date.now();

      expect(results.filter(r => r !== null)).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // 应该在5秒内完成
    });
  });
});