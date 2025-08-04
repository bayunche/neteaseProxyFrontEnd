import React from 'react';
import { 
  Volume2, 
  Moon, 
  Sun, 
  Shuffle, 
  Repeat, 
  Download,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  User
} from 'lucide-react';
import { usePlayerStore } from '../stores';
import { PlayMode } from '../types';
import { cn } from '../utils/cn';

const SettingsPage: React.FC = () => {
  const {
    ui,
    user,
    player,
    setTheme,
    setVolume,
    setPlayMode,
    updateUserSettings,
    logout
  } = usePlayerStore();

  const { theme } = ui;
  const { isLoggedIn, profile, settings } = user;
  const { volume, playMode } = player;

  const handlePlayModeChange = (mode: PlayMode) => {
    setPlayMode(mode);
    updateUserSettings({ playMode: mode });
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    updateUserSettings({ volume: newVolume });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    updateUserSettings({ theme: newTheme });
  };

  const playModeOptions = [
    { value: PlayMode.SEQUENCE, label: '顺序播放', icon: Repeat },
    { value: PlayMode.LIST_LOOP, label: '列表循环', icon: Repeat },
    { value: PlayMode.RANDOM, label: '随机播放', icon: Shuffle },
    { value: PlayMode.SINGLE, label: '单曲循环', icon: Repeat }
  ];

  const settingSections = [
    {
      title: '账户设置',
      items: [
        {
          icon: User,
          title: '个人资料',
          description: isLoggedIn ? profile?.nickname || '未设置昵称' : '未登录',
          action: () => {
            // 跳转到个人资料页面或登录
          }
        }
      ]
    },
    {
      title: '播放设置',
      items: [
        {
          icon: Volume2,
          title: '音量',
          description: `${Math.round(volume * 100)}%`,
          component: (
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          )
        },
        {
          icon: playModeOptions.find(opt => opt.value === playMode)?.icon || Repeat,
          title: '播放模式',
          description: playModeOptions.find(opt => opt.value === playMode)?.label || '顺序播放',
          component: (
            <select
              value={playMode}
              onChange={(e) => handlePlayModeChange(e.target.value as PlayMode)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {playModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        }
      ]
    },
    {
      title: '界面设置',
      items: [
        {
          icon: theme === 'dark' ? Moon : Sun,
          title: '主题模式',
          description: theme === 'dark' ? '深色模式' : '浅色模式',
          component: (
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => handleThemeChange('light')}
                className={cn(
                  'flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors',
                  theme === 'light'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                <Sun className="w-4 h-4" />
                <span>浅色</span>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={cn(
                  'flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors',
                  theme === 'dark'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                <Moon className="w-4 h-4" />
                <span>深色</span>
              </button>
            </div>
          )
        }
      ]
    },
    {
      title: '存储设置',
      items: [
        {
          icon: Download,
          title: '离线下载',
          description: '管理已下载的音乐',
          action: () => {
            // 跳转到下载管理页面
          }
        }
      ]
    },
    {
      title: '通知设置',
      items: [
        {
          icon: Bell,
          title: '推送通知',
          description: '接收播放和活动通知',
          component: (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked={settings.autoPlay}
                onChange={(e) => updateUserSettings({ autoPlay: e.target.checked })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          )
        }
      ]
    },
    {
      title: '其他设置',
      items: [
        {
          icon: Shield,
          title: '隐私设置',
          description: '管理数据和隐私偏好',
          action: () => {
            // 跳转到隐私设置页面
          }
        },
        {
          icon: HelpCircle,
          title: '帮助与反馈',
          description: '获取帮助或反馈问题',
          action: () => {
            // 跳转到帮助页面
          }
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          设置
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          个性化您的音乐播放体验
        </p>
      </div>

      <div className="space-y-8">
        {settingSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <div
                    key={itemIndex}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {item.component || (
                        <button
                          onClick={item.action}
                          className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                        >
                          设置
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 登出按钮 */}
        {isLoggedIn && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <button
              onClick={logout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">退出登录</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;