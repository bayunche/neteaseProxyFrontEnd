import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 日志工具
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, ...args)
};

// CORS配置 - 生产环境下只允许特定域名
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? [
        /^https:\/\/.*\.your-domain\.com$/,  // 替换为你的域名
        'https://your-domain.com'            // 替换为你的域名
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5173', 
        'http://localhost:5174', 
        'http://localhost:5175',
        /^http:\/\/localhost:\d+$/
      ],
  credentials: true,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

app.use(cors(corsOptions));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// 音频代理中间件
const audioProxy = createProxyMiddleware({
  target: 'http://placeholder.com', // 占位符，会被动态替换
  changeOrigin: true,
  secure: false,
  timeout: 30000, // 30秒超时
  proxyTimeout: 30000,
  router: (req) => {
    const originalUrl = req.query.url;
    if (originalUrl) {
      try {
        const url = new URL(originalUrl);
        const target = `${url.protocol}//${url.host}`;
        logger.info(`代理目标: ${target}`);
        return target;
      } catch (error) {
        logger.error('Invalid URL in router:', originalUrl, error.message);
        return 'http://localhost:3001';
      }
    }
    return 'http://localhost:3001';
  },
  pathRewrite: (path, req) => {
    const originalUrl = req.query.url;
    if (originalUrl) {
      try {
        const url = new URL(originalUrl);
        const newPath = url.pathname + url.search;
        logger.info(`路径重写: ${path} -> ${newPath}`);
        return newPath;
      } catch (error) {
        logger.error('Invalid URL for path rewrite:', originalUrl, error.message);
        return '/';
      }
    }
    return '/';
  },
  onProxyReq: (proxyReq, req, res) => {
    // 设置必要的请求头
    proxyReq.setHeader('Referer', 'https://music.163.com/');
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    proxyReq.setHeader('Accept', 'audio/mpeg,audio/ogg,audio/wav,audio/*,*/*;q=0.9');
    proxyReq.setHeader('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8');
    proxyReq.setHeader('Cache-Control', 'no-cache');
    proxyReq.setHeader('Pragma', 'no-cache');
    
    // 移除可能引起问题的请求头
    proxyReq.removeHeader('host');
    proxyReq.removeHeader('origin');
    
    logger.info(`代理请求: ${req.query.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // 设置CORS响应头
    const origin = req.headers.origin;
    if (corsOptions.origin.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') return allowedOrigin === origin;
      if (allowedOrigin instanceof RegExp) return allowedOrigin.test(origin);
      return false;
    })) {
      proxyRes.headers['Access-Control-Allow-Origin'] = origin;
    }
    
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
    
    // 设置缓存头
    if (proxyRes.statusCode === 200) {
      proxyRes.headers['Cache-Control'] = 'public, max-age=3600'; // 缓存1小时
    }
    
    logger.info(`代理响应: ${proxyRes.statusCode} - ${req.query.url}`);
  },
  onError: (err, req, res) => {
    logger.error('代理错误:', err.message, '- URL:', req.query.url);
    
    if (!res.headersSent) {
      res.status(502).json({ 
        error: '代理服务器错误', 
        message: NODE_ENV === 'development' ? err.message : '服务暂时不可用',
        url: req.query.url,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// 通用代理验证中间件
const validateProxyRequest = (req, res, next) => {
  // 验证URL参数
  if (!req.query.url) {
    return res.status(400).json({
      error: '缺少必需的URL参数',
      usage: '/audio-proxy?url=<encoded_url> 或 /image-proxy?url=<encoded_url>',
      timestamp: new Date().toISOString()
    });
  }
  
  // 验证URL格式
  try {
    new URL(req.query.url);
  } catch (error) {
    return res.status(400).json({
      error: 'URL格式无效',
      url: req.query.url,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// 音频代理路由
app.use('/audio-proxy', validateProxyRequest, audioProxy);

// 图片代理路由（使用相同的代理逻辑）
app.use('/image-proxy', validateProxyRequest, audioProxy);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'audio-proxy-server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// API信息端点
app.get('/info', (req, res) => {
  res.json({
    name: 'Audio & Image Proxy Server',
    description: '音频和图片代理服务器 - 解决CORS跨域问题',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      audioProxy: '/audio-proxy?url=<encoded_audio_url>',
      imageProxy: '/image-proxy?url=<encoded_image_url>',
      info: '/info'
    },
    usage: {
      audioExample: `/audio-proxy?url=${encodeURIComponent('http://example.com/audio.mp3')}`,
      imageExample: `/image-proxy?url=${encodeURIComponent('http://example.com/image.jpg')}`,
      note: 'URL参数必须进行URL编码'
    },
    timestamp: new Date().toISOString()
  });
});

// 根路径重定向到信息页面
app.get('/', (req, res) => {
  res.redirect('/info');
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '端点不存在',
    path: req.originalUrl,
    availableEndpoints: ['/health', '/info', '/audio-proxy', '/image-proxy'],
    timestamp: new Date().toISOString()
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  logger.error('服务器错误:', err.stack);
  
  if (!res.headersSent) {
    res.status(500).json({
      error: '内部服务器错误',
      message: NODE_ENV === 'development' ? err.message : '服务暂时不可用',
      timestamp: new Date().toISOString()
    });
  }
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🎵 音频代理服务器启动成功!`);
  logger.info(`📡 服务地址: http://0.0.0.0:${PORT}`);
  logger.info(`🔗 代理端点: http://0.0.0.0:${PORT}/audio-proxy?url=<音频URL>`);
  logger.info(`💚 健康检查: http://0.0.0.0:${PORT}/health`);
  logger.info(`🌍 运行环境: ${NODE_ENV}`);
});

// 优雅关闭
const gracefulShutdown = (signal) => {
  logger.info(`收到${signal}信号，正在优雅关闭服务器...`);
  
  server.close((err) => {
    if (err) {
      logger.error('关闭服务器时出错:', err);
      process.exit(1);
    }
    
    logger.info('服务器已关闭');
    process.exit(0);
  });
  
  // 强制关闭超时
  setTimeout(() => {
    logger.error('强制关闭服务器');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));