import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';

const app = express();

// 环境变量配置
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:5173'];

// URL白名单配置
const ALLOWED_DOMAINS = [
  'music.163.com',
  'p1.music.126.net',
  'p2.music.126.net',
  'p3.music.126.net',
  'p4.music.126.net',
  'm7.music.126.net',
  'm8.music.126.net',
  'm10.music.126.net'
];

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // 代理服务器不需要CSP
}));

// 压缩响应
app.use(compression());

// 信任代理（用于负载均衡器）
app.set('trust proxy', 1);

// 速率限制
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => NODE_ENV === 'development' // 开发环境跳过限制
});

// 全局速率限制
app.use(createRateLimiter(
  15 * 60 * 1000, // 15分钟
  1000, // 每IP最多1000次请求
  '请求过于频繁，请稍后再试'
));

// 代理端点专用速率限制
const proxyRateLimit = createRateLimiter(
  60 * 1000, // 1分钟
  100, // 每IP最多100次代理请求
  '代理请求过于频繁，请稍后再试'
);

// CORS配置
app.use(cors({
  origin: (origin, callback) => {
    // 开发环境允许所有来源
    if (NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // 生产环境检查白名单
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`来源 ${origin} 不在允许的CORS白名单中`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// URL验证函数
function validateUrl(url) {
  try {
    const parsedUrl = new URL(url);
    
    // 检查协议
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('不支持的协议');
    }
    
    // 检查域名白名单
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith('.' + domain)
    );
    
    if (!isAllowed) {
      throw new Error(`域名 ${parsedUrl.hostname} 不在允许的白名单中`);
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// 请求日志中间件（生产环境）
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${clientIP} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
};

app.use(requestLogger);

// 通用代理中间件函数
const createGenericProxy = (type = 'audio') => createProxyMiddleware({
  target: 'http://placeholder.com',
  changeOrigin: true,
  secure: true, // 生产环境启用SSL验证
  timeout: 30000, // 30秒超时
  proxyTimeout: 30000,
  router: (req) => {
    const originalUrl = req.query.url;
    if (originalUrl && validateUrl(originalUrl)) {
      try {
        const url = new URL(originalUrl);
        return `${url.protocol}//${url.host}`;
      } catch (error) {
        console.error('URL解析错误:', originalUrl, error.message);
        return null;
      }
    }
    return null;
  },
  pathRewrite: (path, req) => {
    const originalUrl = req.query.url;
    if (originalUrl && validateUrl(originalUrl)) {
      try {
        const url = new URL(originalUrl);
        return url.pathname + url.search;
      } catch (error) {
        console.error('路径重写错误:', originalUrl, error.message);
        return '/';
      }
    }
    return '/';
  },
  onProxyReq: (proxyReq, req, res) => {
    // 验证URL
    if (!req.query.url || !validateUrl(req.query.url)) {
      res.status(400).json({ 
        error: '无效的URL或不在允许的域名白名单中',
        allowedDomains: ALLOWED_DOMAINS 
      });
      return;
    }
    
    // 设置请求头
    proxyReq.setHeader('Referer', 'https://music.163.com/');
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    if (type === 'audio') {
      proxyReq.setHeader('Accept', 'audio/mpeg,audio/*,*/*');
    } else if (type === 'image') {
      proxyReq.setHeader('Accept', 'image/webp,image/apng,image/*,*/*;q=0.8');
    }
    
    // 移除可能的敏感请求头
    proxyReq.removeHeader('Cookie');
    proxyReq.removeHeader('Authorization');
    
    if (NODE_ENV === 'development') {
      console.log(`${type}代理请求: ${req.query.url}`);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // 安全头设置
    proxyRes.headers['X-Content-Type-Options'] = 'nosniff';
    proxyRes.headers['X-Frame-Options'] = 'DENY';
    
    // CORS头
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
      proxyRes.headers['Access-Control-Allow-Origin'] = origin;
    }
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
    
    // 缓存控制
    if (type === 'image' && proxyRes.statusCode === 200) {
      proxyRes.headers['Cache-Control'] = 'public, max-age=3600'; // 图片缓存1小时
    }
    
    if (NODE_ENV === 'development') {
      console.log(`${type}代理响应: ${proxyRes.statusCode} - ${req.query.url}`);
    }
  },
  onError: (err, req, res) => {
    console.error(`${type}代理错误:`, {
      message: err.message,
      url: req.query.url,
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
    
    if (!res.headersSent) {
      res.status(502).json({ 
        error: `${type}代理服务器错误`,
        message: NODE_ENV === 'development' ? err.message : '代理请求失败'
      });
    }
  }
});

// 创建代理实例
const audioProxy = createGenericProxy('audio');
const imageProxy = createGenericProxy('image');

// 代理路由（应用速率限制）
app.use('/audio-proxy', proxyRateLimit, audioProxy);
app.use('/image-proxy', proxyRateLimit, imageProxy);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 监控端点（生产环境）
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', {
    message: err.message,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  res.status(500).json({
    error: '服务器内部错误',
    message: NODE_ENV === 'development' ? err.message : '请稍后重试'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    availableEndpoints: [
      '/health',
      '/metrics',
      '/audio-proxy?url=<音频URL>',
      '/image-proxy?url=<图片URL>'
    ]
  });
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 音频/图片代理服务器启动成功!`);
  console.log(`📡 服务地址: http://0.0.0.0:${PORT}`);
  console.log(`🌍 环境: ${NODE_ENV}`);
  console.log(`🔒 允许的来源: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`🔗 音频代理: /audio-proxy?url=<音频URL>`);
  console.log(`🖼️  图片代理: /image-proxy?url=<图片URL>`);
  console.log(`💚 健康检查: /health`);
  console.log(`📊 监控端点: /metrics`);
});

// 优雅关闭
const gracefulShutdown = (signal) => {
  console.log(`收到${signal}信号，开始优雅关闭...`);
  
  server.close((err) => {
    if (err) {
      console.error('关闭服务器时出错:', err);
      process.exit(1);
    }
    
    console.log('服务器已关闭');
    process.exit(0);
  });
  
  // 强制退出保护
  setTimeout(() => {
    console.error('强制退出服务器');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  gracefulShutdown('unhandledRejection');
});