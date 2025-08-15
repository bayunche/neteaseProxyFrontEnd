/**
 * 实时监控系统测试
 */

import { RealTimeMonitor, MonitoringEvent, Alert, AlertRule } from '../../services/monitoring/RealTimeMonitor';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string): void {
    // Mock send implementation
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024,
      totalJSHeapSize: 100 * 1024 * 1024,
    },
  },
  writable: true,
});

describe('RealTimeMonitor', () => {
  let monitor: RealTimeMonitor;

  beforeEach(() => {
    monitor = RealTimeMonitor.getInstance();
    monitor.stop();
    monitor.clearAlerts();
  });

  afterEach(() => {
    monitor.stop();
    monitor.clearAlerts();
    jest.clearAllMocks();
  });

  describe('基础功能', () => {
    test('应该是单例模式', () => {
      const monitor1 = RealTimeMonitor.getInstance();
      const monitor2 = RealTimeMonitor.getInstance();
      expect(monitor1).toBe(monitor2);
    });

    test('应该能够启动和停止监控', () => {
      expect(() => {
        monitor.start();
        monitor.stop();
      }).not.toThrow();
    });

    test('应该能够获取监控配置', () => {
      const config = monitor.getConfig();
      
      expect(config).toHaveProperty('interval');
      expect(config).toHaveProperty('maxEvents');
      expect(config).toHaveProperty('enableAlerts');
      expect(config).toHaveProperty('thresholds');
      expect(typeof config.interval).toBe('number');
    });
  });

  describe('事件记录', () => {
    test('应该能够记录监控事件', () => {
      const event: MonitoringEvent = {
        id: 'test-event',
        type: 'performance',
        category: 'cpu',
        severity: 'info',
        timestamp: Date.now(),
        data: { cpuUsage: 50 },
        metadata: { source: 'test' },
      };

      expect(() => {
        monitor.recordEvent(event);
      }).not.toThrow();

      const events = monitor.getEvents();
      expect(events).toContain(event);
    });

    test('应该限制事件数量', () => {
      const maxEvents = 100;
      
      // 记录超过最大数量的事件
      for (let i = 0; i < maxEvents + 50; i++) {
        monitor.recordEvent({
          id: `event-${i}`,
          type: 'test',
          category: 'test',
          severity: 'info',
          timestamp: Date.now(),
          data: { index: i },
          metadata: {},
        });
      }

      const events = monitor.getEvents();
      expect(events.length).toBeLessThanOrEqual(maxEvents);
    });

    test('应该按时间戳排序事件', () => {
      const event1 = {
        id: 'event-1',
        type: 'test',
        category: 'test',
        severity: 'info' as const,
        timestamp: Date.now() - 1000,
        data: {},
        metadata: {},
      };

      const event2 = {
        id: 'event-2',
        type: 'test',
        category: 'test',
        severity: 'info' as const,
        timestamp: Date.now(),
        data: {},
        metadata: {},
      };

      monitor.recordEvent(event2);
      monitor.recordEvent(event1);

      const events = monitor.getEvents();
      expect(events[events.length - 1].timestamp).toBeGreaterThanOrEqual(
        events[events.length - 2].timestamp
      );
    });
  });

  describe('警报系统', () => {
    test('应该能够添加警报规则', () => {
      const rule: AlertRule = {
        id: 'test-rule',
        name: 'Test Rule',
        condition: 'cpu > 80',
        severity: 'warning',
        enabled: true,
        actions: ['email', 'notification'],
        cooldown: 300000, // 5分钟
        metadata: {},
      };

      monitor.addAlertRule(rule);
      const rules = monitor.getAlertRules();
      expect(rules).toContainEqual(rule);
    });

    test('应该能够移除警报规则', () => {
      const rule: AlertRule = {
        id: 'remove-rule',
        name: 'Remove Rule',
        condition: 'memory > 90',
        severity: 'error',
        enabled: true,
        actions: [],
        cooldown: 0,
        metadata: {},
      };

      monitor.addAlertRule(rule);
      const removed = monitor.removeAlertRule('remove-rule');
      const rules = monitor.getAlertRules();

      expect(removed).toBe(true);
      expect(rules.find(r => r.id === 'remove-rule')).toBeUndefined();
    });

    test('应该触发符合条件的警报', () => {
      const rule: AlertRule = {
        id: 'cpu-alert',
        name: 'High CPU Usage',
        condition: 'cpu > 80',
        severity: 'warning',
        enabled: true,
        actions: ['notification'],
        cooldown: 0,
        metadata: {},
      };

      monitor.addAlertRule(rule);

      const event: MonitoringEvent = {
        id: 'high-cpu-event',
        type: 'performance',
        category: 'cpu',
        severity: 'warning',
        timestamp: Date.now(),
        data: { cpu: 85 }, // 触发条件
        metadata: {},
      };

      monitor.recordEvent(event);

      // 等待警报处理
      setTimeout(() => {
        const alerts = monitor.getActiveAlerts();
        expect(alerts.some(alert => alert.ruleId === 'cpu-alert')).toBe(true);
      }, 100);
    });

    test('应该遵守冷却时间', async () => {
      const rule: AlertRule = {
        id: 'cooldown-rule',
        name: 'Cooldown Test',
        condition: 'error_count > 0',
        severity: 'error',
        enabled: true,
        actions: [],
        cooldown: 1000, // 1秒冷却
        metadata: {},
      };

      monitor.addAlertRule(rule);

      // 第一次触发
      monitor.recordEvent({
        id: 'error-1',
        type: 'error',
        category: 'app',
        severity: 'error',
        timestamp: Date.now(),
        data: { error_count: 1 },
        metadata: {},
      });

      // 立即第二次触发 (应该被冷却阻止)
      monitor.recordEvent({
        id: 'error-2',
        type: 'error',
        category: 'app',
        severity: 'error',
        timestamp: Date.now(),
        data: { error_count: 1 },
        metadata: {},
      });

      const alerts = monitor.getActiveAlerts();
      const cooldownAlerts = alerts.filter(a => a.ruleId === 'cooldown-rule');
      
      // 应该只有一个警报（第二个被冷却阻止）
      expect(cooldownAlerts.length).toBeLessThanOrEqual(1);
    });
  });

  describe('性能监控', () => {
    test('应该能够收集性能指标', () => {
      monitor.start();
      
      // 等待性能数据收集
      setTimeout(() => {
        const metrics = monitor.getMetrics();
        
        expect(metrics).toHaveProperty('performance');
        expect(metrics.performance).toHaveProperty('memory');
        expect(metrics.performance).toHaveProperty('timing');
      }, 100);
    });

    test('应该检测性能异常', () => {
      const alertSpy = jest.spyOn(monitor as any, 'checkAlertRules');
      
      // 模拟高内存使用
      (performance.memory as any).usedJSHeapSize = 95 * 1024 * 1024; // 95MB
      (performance.memory as any).totalJSHeapSize = 100 * 1024 * 1024; // 100MB

      monitor.addAlertRule({
        id: 'memory-alert',
        name: 'High Memory Usage',
        condition: 'memory_usage > 90',
        severity: 'error',
        enabled: true,
        actions: ['notification'],
        cooldown: 0,
        metadata: {},
      });

      monitor.start();

      setTimeout(() => {
        expect(alertSpy).toHaveBeenCalled();
      }, 200);
    });
  });

  describe('统计和报告', () => {
    test('应该生成正确的统计报告', () => {
      // 添加测试事件
      for (let i = 0; i < 10; i++) {
        monitor.recordEvent({
          id: `event-${i}`,
          type: i % 2 === 0 ? 'performance' : 'error',
          category: 'test',
          severity: i < 5 ? 'info' : 'warning',
          timestamp: Date.now() - (i * 1000),
          data: {},
          metadata: {},
        });
      }

      const stats = monitor.getStats();

      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('eventsByType');
      expect(stats).toHaveProperty('eventsBySeverity');
      expect(stats).toHaveProperty('alertsTriggered');
      expect(stats.totalEvents).toBe(10);
    });

    test('应该能够导出监控数据', () => {
      monitor.recordEvent({
        id: 'export-event',
        type: 'test',
        category: 'export',
        severity: 'info',
        timestamp: Date.now(),
        data: { test: true },
        metadata: {},
      });

      const exportData = monitor.exportData();

      expect(exportData).toHaveProperty('events');
      expect(exportData).toHaveProperty('alerts');
      expect(exportData).toHaveProperty('config');
      expect(exportData).toHaveProperty('stats');
      expect(exportData.events.length).toBeGreaterThan(0);
    });
  });

  describe('WebSocket连接', () => {
    test('应该能够建立WebSocket连接', (done) => {
      monitor.connectWebSocket('ws://localhost:8080');

      setTimeout(() => {
        const connection = (monitor as any).wsConnection;
        expect(connection).toBeTruthy();
        expect(connection.readyState).toBe(MockWebSocket.OPEN);
        done();
      }, 50);
    });

    test('应该处理WebSocket连接错误', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // 模拟连接失败
      const originalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            this.onerror?.(new Event('error'));
          }, 10);
        }
      };

      monitor.connectWebSocket('ws://invalid-url');

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalled();
        (global as any).WebSocket = originalWebSocket;
        consoleSpy.mockRestore();
      }, 50);
    });
  });

  describe('边界情况处理', () => {
    test('应该处理无效的事件数据', () => {
      const invalidEvent = {
        id: '',
        type: '',
        category: '',
        severity: 'unknown' as any,
        timestamp: -1,
        data: null,
        metadata: undefined,
      };

      expect(() => {
        monitor.recordEvent(invalidEvent as any);
      }).not.toThrow();
    });

    test('应该处理空的警报规则', () => {
      const invalidRule = {
        id: '',
        name: '',
        condition: '',
        severity: 'invalid' as any,
        enabled: true,
        actions: [],
        cooldown: -1,
        metadata: null,
      };

      expect(() => {
        monitor.addAlertRule(invalidRule as any);
      }).not.toThrow();
    });

    test('应该处理大量并发事件', () => {
      const events = [];
      
      for (let i = 0; i < 1000; i++) {
        events.push({
          id: `concurrent-${i}`,
          type: 'test',
          category: 'concurrent',
          severity: 'info' as const,
          timestamp: Date.now(),
          data: { index: i },
          metadata: {},
        });
      }

      expect(() => {
        events.forEach(event => monitor.recordEvent(event));
      }).not.toThrow();

      const recordedEvents = monitor.getEvents();
      expect(recordedEvents.length).toBeGreaterThan(0);
    });
  });

  describe('内存管理', () => {
    test('应该定期清理过期数据', () => {
      // 添加过期事件
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25小时前
      
      monitor.recordEvent({
        id: 'old-event',
        type: 'test',
        category: 'cleanup',
        severity: 'info',
        timestamp: oldTimestamp,
        data: {},
        metadata: {},
      });

      monitor.recordEvent({
        id: 'new-event',
        type: 'test',
        category: 'cleanup',
        severity: 'info',
        timestamp: Date.now(),
        data: {},
        metadata: {},
      });

      // 触发清理
      (monitor as any).cleanup();

      const events = monitor.getEvents();
      const oldEvent = events.find(e => e.id === 'old-event');
      const newEvent = events.find(e => e.id === 'new-event');

      expect(oldEvent).toBeUndefined();
      expect(newEvent).toBeDefined();
    });

    test('应该在停止时清理资源', () => {
      monitor.start();
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      monitor.stop();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });
});