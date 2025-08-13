/**
 * 键盘快捷键服务
 * 提供全局键盘快捷键支持，增强用户体验
 */

// 快捷键配置接口
export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: string;
  description: string;
  category: 'playback' | 'navigation' | 'volume' | 'general';
  preventDefault?: boolean;
  global?: boolean; // 是否在任何元素获得焦点时都生效
}

// 默认快捷键配置
const defaultShortcuts: ShortcutConfig[] = [
  // 播放控制
  {
    key: 'Space',
    action: 'togglePlayPause',
    description: '播放/暂停',
    category: 'playback',
    preventDefault: true,
    global: true,
  },
  {
    key: 'ArrowLeft',
    action: 'seekBackward',
    description: '后退10秒',
    category: 'playback',
    preventDefault: true,
    global: true,
  },
  {
    key: 'ArrowRight',
    action: 'seekForward',
    description: '前进10秒',
    category: 'playback',
    preventDefault: true,
    global: true,
  },
  {
    key: 'ArrowLeft',
    ctrl: true,
    action: 'previousTrack',
    description: '上一首',
    category: 'playback',
    preventDefault: true,
    global: true,
  },
  {
    key: 'ArrowRight',
    ctrl: true,
    action: 'nextTrack',
    description: '下一首',
    category: 'playback',
    preventDefault: true,
    global: true,
  },
  
  // 音量控制
  {
    key: 'ArrowUp',
    action: 'volumeUp',
    description: '音量+10%',
    category: 'volume',
    preventDefault: true,
    global: true,
  },
  {
    key: 'ArrowDown',
    action: 'volumeDown',
    description: '音量-10%',
    category: 'volume',
    preventDefault: true,
    global: true,
  },
  {
    key: 'm',
    action: 'toggleMute',
    description: '静音/取消静音',
    category: 'volume',
    preventDefault: true,
    global: true,
  },
  
  // 导航
  {
    key: 'h',
    ctrl: true,
    action: 'goHome',
    description: '首页',
    category: 'navigation',
    preventDefault: true,
  },
  {
    key: 's',
    ctrl: true,
    action: 'focusSearch',
    description: '搜索',
    category: 'navigation',
    preventDefault: true,
  },
  {
    key: 'l',
    ctrl: true,
    action: 'goLibrary',
    description: '音乐库',
    category: 'navigation',
    preventDefault: true,
  },
  {
    key: 'r',
    ctrl: true,
    action: 'goRecent',
    description: '最近播放',
    category: 'navigation',
    preventDefault: true,
  },
  
  // 播放模式
  {
    key: 'r',
    action: 'toggleRepeat',
    description: '切换重复模式',
    category: 'playback',
    preventDefault: true,
    global: true,
  },
  {
    key: 's',
    action: 'toggleShuffle',
    description: '切换随机播放',
    category: 'playback',
    preventDefault: true,
    global: true,
  },
  
  // 通用
  {
    key: 'Escape',
    action: 'closeModal',
    description: '关闭弹窗',
    category: 'general',
    preventDefault: true,
  },
  {
    key: 'f',
    action: 'toggleFullscreen',
    description: '全屏/退出全屏',
    category: 'general',
    preventDefault: true,
    global: true,
  },
  {
    key: '/',
    action: 'showShortcuts',
    description: '显示快捷键帮助',
    category: 'general',
    preventDefault: true,
  },
  
  // 数字键选择歌曲
  {
    key: '1',
    ctrl: true,
    action: 'selectSong',
    description: '选择第1首歌',
    category: 'navigation',
    preventDefault: true,
  },
  {
    key: '2',
    ctrl: true,
    action: 'selectSong',
    description: '选择第2首歌',
    category: 'navigation',
    preventDefault: true,
  },
  {
    key: '3',
    ctrl: true,
    action: 'selectSong',
    description: '选择第3首歌',
    category: 'navigation',
    preventDefault: true,
  },
  {
    key: '4',
    ctrl: true,
    action: 'selectSong',
    description: '选择第4首歌',
    category: 'navigation',
    preventDefault: true,
  },
  {
    key: '5',
    ctrl: true,
    action: 'selectSong',
    description: '选择第5首歌',
    category: 'navigation',
    preventDefault: true,
  },
];

// 快捷键处理器类型
export type ShortcutHandler = (action: string, event: KeyboardEvent, shortcut: ShortcutConfig) => void;

/**
 * 键盘快捷键管理服务
 */
export class KeyboardShortcutService {
  private static instance: KeyboardShortcutService;
  private shortcuts = new Map<string, ShortcutConfig>();
  private handlers = new Set<ShortcutHandler>();
  private isEnabled = true;
  private modalOpen = false;
  
  // 状态追踪
  private pressedKeys = new Set<string>();
  private lastKeyTime = 0;
  private keySequence: string[] = [];
  
  private constructor() {
    this.loadDefaultShortcuts();
    this.setupEventListeners();
  }
  
  static getInstance(): KeyboardShortcutService {
    if (!KeyboardShortcutService.instance) {
      KeyboardShortcutService.instance = new KeyboardShortcutService();
    }
    return KeyboardShortcutService.instance;
  }
  
  /**
   * 加载默认快捷键
   */
  private loadDefaultShortcuts() {
    defaultShortcuts.forEach(shortcut => {
      this.addShortcut(shortcut);
    });
  }
  
  /**
   * 设置事件监听器
   */
  private setupEventListeners() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    document.addEventListener('keyup', this.handleKeyUp.bind(this), true);
    
    // 监听焦点变化
    document.addEventListener('focusin', this.handleFocusChange.bind(this));
    document.addEventListener('focusout', this.handleFocusChange.bind(this));
    
    // 监听弹窗状态
    window.addEventListener('modalOpen', () => { this.modalOpen = true; });
    window.addEventListener('modalClose', () => { this.modalOpen = false; });
  }
  
  /**
   * 处理按键按下
   */
  private handleKeyDown(event: KeyboardEvent) {
    if (!this.isEnabled) return;
    
    const now = Date.now();
    this.lastKeyTime = now;
    
    // 记录按下的键
    this.pressedKeys.add(event.code);
    
    // 生成快捷键标识
    const shortcutKey = this.generateShortcutKey(event);
    const shortcut = this.shortcuts.get(shortcutKey);
    
    if (shortcut) {
      // 检查是否应该处理这个快捷键
      if (this.shouldHandleShortcut(shortcut, event)) {
        if (shortcut.preventDefault) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        // 触发快捷键处理
        this.triggerShortcut(shortcut, event);
      }
    }
    
    // 记录按键序列（用于组合键）
    this.updateKeySequence(event.key);
  }
  
  /**
   * 处理按键抬起
   */
  private handleKeyUp(event: KeyboardEvent) {
    this.pressedKeys.delete(event.code);
  }
  
  /**
   * 处理焦点变化
   */
  private handleFocusChange() {
    // 清除按键状态
    this.pressedKeys.clear();
  }
  
  /**
   * 生成快捷键标识
   */
  private generateShortcutKey(event: KeyboardEvent): string {
    const modifiers = [];
    if (event.ctrlKey) modifiers.push('ctrl');
    if (event.shiftKey) modifiers.push('shift');
    if (event.altKey) modifiers.push('alt');
    if (event.metaKey) modifiers.push('meta');
    
    return [...modifiers, event.key.toLowerCase()].join('+');
  }
  
  /**
   * 检查是否应该处理快捷键
   */
  private shouldHandleShortcut(shortcut: ShortcutConfig, event: KeyboardEvent): boolean {
    // 如果弹窗打开，只处理通用快捷键
    if (this.modalOpen && shortcut.category !== 'general') {
      return false;
    }
    
    // 如果是输入框，只处理全局快捷键
    const target = event.target as HTMLElement;
    if (this.isInputElement(target) && !shortcut.global) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 检查是否是输入元素
   */
  private isInputElement(element: HTMLElement): boolean {
    const inputTypes = ['input', 'textarea', 'select'];
    const tagName = element.tagName.toLowerCase();
    
    return inputTypes.includes(tagName) || 
           element.contentEditable === 'true' ||
           element.hasAttribute('contenteditable');
  }
  
  /**
   * 触发快捷键处理
   */
  private triggerShortcut(shortcut: ShortcutConfig, event: KeyboardEvent) {
    console.log(`Shortcut triggered: ${shortcut.action}`);
    
    // 通知所有处理器
    this.handlers.forEach(handler => {
      try {
        handler(shortcut.action, event, shortcut);
      } catch (error) {
        console.error('Shortcut handler error:', error);
      }
    });
    
    // 发送自定义事件
    const customEvent = new CustomEvent('shortcut', {
      detail: {
        action: shortcut.action,
        shortcut,
        originalEvent: event,
      }
    });
    window.dispatchEvent(customEvent);
  }
  
  /**
   * 更新按键序列
   */
  private updateKeySequence(key: string) {
    const now = Date.now();
    
    // 如果距离上次按键超过1秒，重置序列
    if (now - this.lastKeyTime > 1000) {
      this.keySequence = [];
    }
    
    this.keySequence.push(key);
    
    // 限制序列长度
    if (this.keySequence.length > 5) {
      this.keySequence = this.keySequence.slice(-5);
    }
  }
  
  /**
   * 添加快捷键
   */
  addShortcut(config: ShortcutConfig) {
    const key = this.generateShortcutKeyFromConfig(config);
    this.shortcuts.set(key, config);
  }
  
  /**
   * 移除快捷键
   */
  removeShortcut(config: ShortcutConfig) {
    const key = this.generateShortcutKeyFromConfig(config);
    this.shortcuts.delete(key);
  }
  
  /**
   * 从配置生成快捷键标识
   */
  private generateShortcutKeyFromConfig(config: ShortcutConfig): string {
    const modifiers = [];
    if (config.ctrl) modifiers.push('ctrl');
    if (config.shift) modifiers.push('shift');
    if (config.alt) modifiers.push('alt');
    if (config.meta) modifiers.push('meta');
    
    return [...modifiers, config.key.toLowerCase()].join('+');
  }
  
  /**
   * 添加快捷键处理器
   */
  addHandler(handler: ShortcutHandler) {
    this.handlers.add(handler);
  }
  
  /**
   * 移除快捷键处理器
   */
  removeHandler(handler: ShortcutHandler) {
    this.handlers.delete(handler);
  }
  
  /**
   * 启用/禁用快捷键
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
  
  /**
   * 获取所有快捷键
   */
  getAllShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }
  
  /**
   * 按分类获取快捷键
   */
  getShortcutsByCategory(category: ShortcutConfig['category']): ShortcutConfig[] {
    return this.getAllShortcuts().filter(shortcut => shortcut.category === category);
  }
  
  /**
   * 获取快捷键帮助文本
   */
  getShortcutHelp(): string {
    const categories = {
      playback: '播放控制',
      navigation: '导航',
      volume: '音量控制',
      general: '通用',
    };
    
    let help = '键盘快捷键:\n\n';
    
    Object.entries(categories).forEach(([category, title]) => {
      const shortcuts = this.getShortcutsByCategory(category as ShortcutConfig['category']);
      if (shortcuts.length > 0) {
        help += `${title}:\n`;
        shortcuts.forEach(shortcut => {
          const keyText = this.formatShortcutKey(shortcut);
          help += `  ${keyText} - ${shortcut.description}\n`;
        });
        help += '\n';
      }
    });
    
    return help;
  }
  
  /**
   * 格式化快捷键显示
   */
  private formatShortcutKey(shortcut: ShortcutConfig): string {
    const parts = [];
    
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta) parts.push('Cmd');
    
    // 格式化按键名称
    let keyName = shortcut.key;
    const keyMap: Record<string, string> = {
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'Space': '空格',
      'Escape': 'Esc',
    };
    
    if (keyMap[keyName]) {
      keyName = keyMap[keyName];
    }
    
    parts.push(keyName);
    
    return parts.join(' + ');
  }
  
  /**
   * 导出快捷键配置
   */
  exportConfig(): ShortcutConfig[] {
    return this.getAllShortcuts();
  }
  
  /**
   * 导入快捷键配置
   */
  importConfig(shortcuts: ShortcutConfig[]) {
    this.shortcuts.clear();
    shortcuts.forEach(shortcut => {
      this.addShortcut(shortcut);
    });
  }
  
  /**
   * 重置为默认配置
   */
  resetToDefaults() {
    this.shortcuts.clear();
    this.loadDefaultShortcuts();
  }
  
  /**
   * 检查快捷键冲突
   */
  checkConflicts(newShortcut: ShortcutConfig): ShortcutConfig[] {
    const key = this.generateShortcutKeyFromConfig(newShortcut);
    const conflicts = [];
    
    for (const [existingKey, existingShortcut] of this.shortcuts.entries()) {
      if (existingKey === key && existingShortcut.action !== newShortcut.action) {
        conflicts.push(existingShortcut);
      }
    }
    
    return conflicts;
  }
  
  /**
   * 销毁服务
   */
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this), true);
    document.removeEventListener('keyup', this.handleKeyUp.bind(this), true);
    document.removeEventListener('focusin', this.handleFocusChange.bind(this));
    document.removeEventListener('focusout', this.handleFocusChange.bind(this));
    
    this.shortcuts.clear();
    this.handlers.clear();
  }
}