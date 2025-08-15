/**
 * Service Worker for Progressive Web App
 * 实现缓存策略、离线支持和后台同步
 */

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE_NAME = `music-player-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `music-player-dynamic-${CACHE_VERSION}`;
const AUDIO_CACHE_NAME = `music-player-audio-${CACHE_VERSION}`;

// 需要预缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// 音频文件缓存配置
const AUDIO_CACHE_CONFIG = {
  maxSize: 500 * 1024 * 1024, // 500MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
  strategy: 'cacheFirst' // 音频文件优先使用缓存
};

// 动态资源缓存配置
const DYNAMIC_CACHE_CONFIG = {
  maxSize: 100 * 1024 * 1024, // 100MB
  maxAge: 24 * 60 * 60 * 1000, // 1天
  strategy: 'staleWhileRevalidate' // 动态资源使用陈旧内容同时重新验证
};

/**
 * Service Worker 安装事件
 */
self.addEventListener('install', (event) => {
  console.log(`SW ${CACHE_VERSION}: Installing...`);
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log(`SW ${CACHE_VERSION}: Pre-caching static assets`);
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log(`SW ${CACHE_VERSION}: Installation complete`);
        // 强制激活新的 Service Worker
        return self.skipWaiting();
      })
  );
});

/**
 * Service Worker 激活事件
 */
self.addEventListener('activate', (event) => {
  console.log(`SW ${CACHE_VERSION}: Activating...`);
  
  event.waitUntil(
    Promise.all([
      // 清理旧版本缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              (cacheName.startsWith('music-player-static-') && cacheName !== STATIC_CACHE_NAME) ||
              (cacheName.startsWith('music-player-dynamic-') && cacheName !== DYNAMIC_CACHE_NAME) ||
              (cacheName.startsWith('music-player-audio-') && cacheName !== AUDIO_CACHE_NAME)
            ) {
              console.log(`SW ${CACHE_VERSION}: Deleting old cache ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // 立即控制所有客户端
      self.clients.claim()
    ]).then(() => {
      console.log(`SW ${CACHE_VERSION}: Activation complete`);
    })
  );
});

/**
 * 网络请求拦截
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 GET 请求和 Chrome 扩展请求
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // 根据请求类型使用不同的缓存策略
  if (isAudioRequest(request)) {
    event.respondWith(handleAudioRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

/**
 * 判断是否为音频请求
 */
function isAudioRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/audio/') || 
         request.headers.get('accept')?.includes('audio/') ||
         /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(url.pathname);
}

/**
 * 判断是否为静态资源
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
         STATIC_ASSETS.includes(url.pathname);
}

/**
 * 判断是否为API请求
 */
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('music.163.com') ||
         url.hostname.includes('netease');
}

/**
 * 处理音频请求 - 缓存优先策略
 */
async function handleAudioRequest(request) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // 检查缓存是否过期
    const cacheDate = new Date(cachedResponse.headers.get('sw-cached-date') || 0);
    const isExpired = Date.now() - cacheDate.getTime() > AUDIO_CACHE_CONFIG.maxAge;
    
    if (!isExpired) {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 检查缓存大小限制
      const cacheSize = await getCacheSize(AUDIO_CACHE_NAME);
      if (cacheSize < AUDIO_CACHE_CONFIG.maxSize) {
        const responseClone = networkResponse.clone();
        const headers = new Headers(responseClone.headers);
        headers.set('sw-cached-date', new Date().toISOString());
        
        const modifiedResponse = new Response(responseClone.body, {
          status: responseClone.status,
          statusText: responseClone.statusText,
          headers
        });
        
        cache.put(request, modifiedResponse);
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('SW: Audio request failed, returning cached version:', error);
    return cachedResponse || new Response('Audio not available offline', { status: 404 });
  }
}

/**
 * 处理静态资源请求 - 缓存优先策略
 */
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('SW: Static asset request failed:', error);
    return new Response('Resource not available offline', { status: 404 });
  }
}

/**
 * 处理API请求 - 网络优先策略
 */
async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('SW: API request failed, checking cache:', error);
    
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(
      JSON.stringify({ error: 'API not available offline' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * 处理动态请求 - 陈旧内容同时重新验证策略
 */
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  // 同时启动缓存查找和网络请求
  const cachePromise = cache.match(request);
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // 首先尝试从缓存返回
  const cachedResponse = await cachePromise;
  if (cachedResponse) {
    // 后台更新缓存
    networkPromise.catch(() => {}); // 忽略网络错误
    return cachedResponse;
  }
  
  // 如果缓存中没有，等待网络响应
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // 网络和缓存都失败，返回离线页面
  return caches.match('/offline.html') || 
         new Response('Page not available offline', { status: 404 });
}

/**
 * 获取缓存大小
 */
async function getCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  let totalSize = 0;
  
  for (const key of keys) {
    const response = await cache.match(key);
    if (response && response.headers.has('content-length')) {
      totalSize += parseInt(response.headers.get('content-length'), 10);
    }
  }
  
  return totalSize;
}

/**
 * 后台同步事件
 */
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync event:', event.tag);
  
  if (event.tag === 'sync-playback-data') {
    event.waitUntil(syncPlaybackData());
  } else if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

/**
 * 同步播放数据
 */
async function syncPlaybackData() {
  try {
    // 从 IndexedDB 获取离线播放数据
    const playbackData = await getOfflinePlaybackData();
    
    if (playbackData.length > 0) {
      // 发送到服务器
      const response = await fetch('/api/sync/playback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playbackData)
      });
      
      if (response.ok) {
        // 同步成功，清理本地数据
        await clearOfflinePlaybackData();
        console.log('SW: Playback data synced successfully');
      }
    }
  } catch (error) {
    console.error('SW: Failed to sync playback data:', error);
  }
}

/**
 * 同步离线操作
 */
async function syncOfflineActions() {
  try {
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.warn('SW: Failed to process offline action:', action, error);
      }
    }
    
    console.log('SW: Offline actions synced successfully');
  } catch (error) {
    console.error('SW: Failed to sync offline actions:', error);
  }
}

/**
 * 推送通知事件
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [
      {
        action: 'play',
        title: '播放',
        icon: '/icons/play-24x24.png'
      },
      {
        action: 'dismiss',
        title: '关闭',
        icon: '/icons/close-24x24.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * 通知点击事件
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 尝试找到已经打开的应用窗口
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            
            // 发送消息处理通知动作
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              action,
              data
            });
            
            return;
          }
        }
        
        // 没有找到已打开的窗口，打开新窗口
        if (clients.openWindow) {
          const url = data.url || '/';
          return clients.openWindow(url);
        }
      })
  );
});

/**
 * 消息事件处理
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'CACHE_AUDIO':
      cacheAudioFile(data.url).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    default:
      console.warn('SW: Unknown message type:', type);
  }
});

/**
 * 清理所有缓存
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

/**
 * 缓存音频文件
 */
async function cacheAudioFile(url) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const request = new Request(url);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response);
    }
  } catch (error) {
    console.warn('SW: Failed to cache audio file:', url, error);
  }
}

// 模拟 IndexedDB 操作（实际实现需要更复杂的数据库操作）
async function getOfflinePlaybackData() {
  // 这里应该从 IndexedDB 读取数据
  return [];
}

async function clearOfflinePlaybackData() {
  // 这里应该清理 IndexedDB 中的数据
}

async function getOfflineActions() {
  // 这里应该从 IndexedDB 读取离线操作
  return [];
}

async function removeOfflineAction(id) {
  // 这里应该从 IndexedDB 删除已处理的操作
}

async function processOfflineAction(action) {
  // 这里应该处理各种离线操作
  switch (action.type) {
    case 'like_song':
      await fetch('/api/songs/like', {
        method: 'POST',
        body: JSON.stringify(action.data)
      });
      break;
      
    case 'add_to_playlist':
      await fetch('/api/playlists/add', {
        method: 'POST',
        body: JSON.stringify(action.data)
      });
      break;
      
    // 其他离线操作...
  }
}