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
  const timestamp = new Date().toISOString();
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const origin = req.headers.origin || 'Unknown';
  
  logger.info(`\n🚀 接收请求 [${timestamp}]`);
  logger.info(`📋 ${req.method} ${req.url}`);
  logger.info(`🌐 客户端IP: ${req.ip || req.connection.remoteAddress}`);
  logger.info(`🔗 来源: ${origin}`);
  logger.info(`🖥️  User-Agent: ${userAgent.substring(0, 100)}${userAgent.length > 100 ? '...' : ''}`);
  
  if (req.query.url) {
    logger.info(`📎 代理目标: ${decodeURIComponent(req.query.url)}`);
  }
  
  logger.info(`────────────────────────────────────────────────────────────────\n`);
  next();
});

// 创建通用代理中间件
const createProxyHandler = (isImage = false) => {
  return createProxyMiddleware({
    target: 'http://placeholder.com', // 占位符，会被动态替换
    changeOrigin: true,
    secure: false,
    timeout: 30000, // 30秒超时
    proxyTimeout: 30000,
    followRedirects: true,
    router: (req) => {
      const originalUrl = req.query.url;
      logger.info(`\n🔍 Router调试 - ${isImage ? '图片' : '音频'}代理:`);
      logger.info(`   请求路径: ${req.url}`);
      logger.info(`   查询参数: ${JSON.stringify(req.query)}`);
      logger.info(`   原始URL: ${originalUrl}`);
      
      if (originalUrl) {
        try {
          const url = new URL(originalUrl);
          const target = `${url.protocol}//${url.host}`;
          logger.info(`   解析目标: ${target}`);
          logger.info(`   URL组件: 协议=${url.protocol}, 主机=${url.host}, 端口=${url.port || '默认'}`);
          return target;
        } catch (error) {
          logger.error(`   ❌ URL解析错误: ${originalUrl} - ${error.message}`);
          return 'http://localhost:3001';
        }
      }
      logger.warn(`   ⚠️  没有URL参数，使用默认目标`);
      return 'http://localhost:3001';
    },
    pathRewrite: (path, req) => {
      const originalUrl = req.query.url;
      logger.info(`\n🔄 PathRewrite调试 - ${isImage ? '图片' : '音频'}代理:`);
      logger.info(`   输入路径: ${path}`);
      logger.info(`   请求URL: ${req.url}`);
      logger.info(`   查询中的URL: ${originalUrl}`);
      
      if (originalUrl) {
        try {
          const url = new URL(originalUrl);
          const newPath = url.pathname + url.search;
          logger.info(`   目标路径: ${newPath}`);
          logger.info(`   路径组件: pathname=${url.pathname}, search=${url.search}`);
          logger.info(`   ✅ 路径重写成功: ${path} -> ${newPath}`);
          return newPath;
        } catch (error) {
          logger.error(`   ❌ URL解析失败: ${originalUrl} - ${error.message}`);
          return '/';
        }
      }
      logger.warn(`   ⚠️  路径重写失败: 没有找到url参数, 使用默认路径 /`);
      return '/';
    },
    onProxyReq: (proxyReq, req, res) => {
      // 设置必要的请求头
      proxyReq.setHeader('Referer', 'https://music.163.com/');
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      if (isImage) {
        proxyReq.setHeader('Accept', 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8');
      } else {
        proxyReq.setHeader('Accept', 'audio/mpeg,audio/ogg,audio/wav,audio/*,*/*;q=0.9');
      }
      
      proxyReq.setHeader('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8');
      proxyReq.setHeader('Cache-Control', 'no-cache');
      proxyReq.setHeader('Pragma', 'no-cache');
      
      // 保持Range头用于音频流
      if (!isImage && req.headers.range) {
        proxyReq.setHeader('Range', req.headers.range);
        logger.info(`🎵 传递Range请求头: ${req.headers.range}`);
      }
      
      // 移除可能引起问题的请求头，但保留Range
      proxyReq.removeHeader('host');
      proxyReq.removeHeader('origin');
      
      // 详细的请求信息打印
      const originalUrl = req.query.url;
      const targetUrl = `${proxyReq.protocol || 'http:'}//${proxyReq.host}${proxyReq.path}`;
      
      logger.info(`\n==================== ${isImage ? '图片' : '音频'}代理请求开始 ====================`);
      logger.info(`🔗 原始URL: ${originalUrl}`);
      logger.info(`🎯 目标URL: ${targetUrl}`);
      logger.info(`📋 请求方法: ${proxyReq.method}`);
      logger.info(`🏠 目标主机: ${proxyReq.host}`);
      logger.info(`📂 目标路径: ${proxyReq.path}`);
      logger.info(`🌐 客户端IP: ${req.ip || req.connection.remoteAddress}`);
      logger.info(`🔧 请求头:`);
      
      // 打印重要的请求头
      const importantHeaders = ['referer', 'user-agent', 'accept', 'accept-language', 'cache-control'];
      importantHeaders.forEach(header => {
        const value = proxyReq.getHeader(header);
        if (value) {
          logger.info(`     ${header}: ${value}`);
        }
      });
      
      logger.info(`===============================================================\n`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // 详细的响应信息打印
      const originalUrl = req.query.url;
      const targetUrl = `${req.protocol || 'http:'}://${proxyRes.req.host}${proxyRes.req.path}`;
      
      logger.info(`\n==================== ${isImage ? '图片' : '音频'}代理响应开始 ====================`);
      logger.info(`🔗 原始URL: ${originalUrl}`);
      logger.info(`🎯 目标URL: ${targetUrl}`);
      logger.info(`📊 响应状态: ${proxyRes.statusCode} ${proxyRes.statusMessage || ''}`);
      logger.info(`📦 内容类型: ${proxyRes.headers['content-type'] || 'unknown'}`);
      logger.info(`📏 内容长度: ${proxyRes.headers['content-length'] || 'unknown'}`);
      logger.info(`⏱️  响应时间: ${new Date().toISOString()}`);
      
      // 打印重要的响应头
      logger.info(`🔧 重要响应头:`);
      const importantResHeaders = ['content-type', 'content-length', 'cache-control', 'last-modified', 'etag', 'server'];
      importantResHeaders.forEach(header => {
        const value = proxyRes.headers[header];
        if (value) {
          logger.info(`     ${header}: ${value}`);
        }
      });
      
      // 如果是错误状态，打印更多信息
      if (proxyRes.statusCode >= 400) {
        logger.error(`❌ 错误状态码: ${proxyRes.statusCode}`);
        logger.error(`❌ 所有响应头:`, JSON.stringify(proxyRes.headers, null, 2));
      }
      
      // 设置CORS响应头 - 修复版本
      const origin = req.headers.origin;
      logger.info(`🔒 CORS处理: 请求来源=${origin}`);
      
      // 检查来源是否被允许
      let originAllowed = false;
      if (Array.isArray(corsOptions.origin)) {
        originAllowed = corsOptions.origin.some(allowedOrigin => {
          if (typeof allowedOrigin === 'string') return allowedOrigin === origin;
          if (allowedOrigin instanceof RegExp) return allowedOrigin.test(origin);
          return false;
        });
      } else if (corsOptions.origin === true || corsOptions.origin === '*') {
        originAllowed = true;
      }
      
      if (originAllowed || !origin) {
        proxyRes.headers['Access-Control-Allow-Origin'] = origin || '*';
        logger.info(`✅ CORS允许来源: ${origin || '*'}`);
      } else {
        logger.warn(`⚠️  CORS拒绝来源: ${origin}`);
      }
      
      // 设置必要的CORS头
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS, POST';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range';
      
      // 音频流需要的特殊头
      if (!isImage) {
        proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Range, Content-Length, Accept-Ranges';
      }
      
      // 设置缓存头 - 支持206状态码
      if (proxyRes.statusCode === 200 || proxyRes.statusCode === 206) {
        proxyRes.headers['Cache-Control'] = 'public, max-age=3600'; // 缓存1小时
      }
      
      logger.info(`✅ CORS头设置完成 - 状态码: ${proxyRes.statusCode}`);
      logger.info(`🔧 设置的CORS头:`);
      logger.info(`     Access-Control-Allow-Origin: ${proxyRes.headers['Access-Control-Allow-Origin']}`);
      logger.info(`     Access-Control-Allow-Methods: ${proxyRes.headers['Access-Control-Allow-Methods']}`);
      logger.info(`     Access-Control-Expose-Headers: ${proxyRes.headers['Access-Control-Expose-Headers'] || 'none'}`);
      logger.info(`===============================================================\n`);
    },
    onError: (err, req, res) => {
      const originalUrl = req.query.url;
      
      logger.error(`\n==================== ${isImage ? '图片' : '音频'}代理错误 ====================`);
      logger.error(`🔗 原始URL: ${originalUrl}`);
      logger.error(`❌ 错误类型: ${err.name || 'Unknown'}`);
      logger.error(`❌ 错误消息: ${err.message}`);
      logger.error(`❌ 错误代码: ${err.code || 'N/A'}`);
      logger.error(`🌐 客户端IP: ${req.ip || req.connection.remoteAddress}`);
      logger.error(`⏱️  错误时间: ${new Date().toISOString()}`);
      
      // 打印错误栈（仅在开发环境）
      if (NODE_ENV === 'development' && err.stack) {
        logger.error(`📚 错误堆栈:\n${err.stack}`);
      }
      
      // 分析可能的错误原因
      let errorReason = '未知错误';
      if (err.code === 'ENOTFOUND') {
        errorReason = 'DNS解析失败 - 目标域名不存在';
      } else if (err.code === 'ECONNREFUSED') {
        errorReason = '连接被拒绝 - 目标服务器拒绝连接';
      } else if (err.code === 'ETIMEDOUT') {
        errorReason = '连接超时 - 目标服务器响应超时';
      } else if (err.code === 'ECONNRESET') {
        errorReason = '连接重置 - 目标服务器主动断开连接';
      } else if (err.message.includes('404')) {
        errorReason = '资源不存在 - 目标URL对应的资源不存在';
      } else if (err.message.includes('403')) {
        errorReason = '访问被禁止 - 目标服务器拒绝访问';
      } else if (err.message.includes('500')) {
        errorReason = '目标服务器内部错误';
      }
      
      logger.error(`🔍 错误分析: ${errorReason}`);
      logger.error(`===============================================================\n`);
      
      if (!res.headersSent) {
        res.status(502).json({ 
          error: '代理服务器错误', 
          message: NODE_ENV === 'development' ? err.message : '服务暂时不可用',
          errorCode: err.code || 'UNKNOWN',
          errorReason: errorReason,
          url: originalUrl,
          timestamp: new Date().toISOString(),
          type: isImage ? 'image' : 'audio'
        });
      }
    }
  });
};

// 音频代理中间件
const audioProxy = createProxyHandler(false);

// 图片代理中间件
const imageProxy = createProxyHandler(true);

// OPTIONS请求处理中间件
const handleOptions = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin;
    logger.info(`🔒 处理OPTIONS预检请求，来源: ${origin}`);
    
    // 检查来源是否被允许
    let originAllowed = false;
    if (Array.isArray(corsOptions.origin)) {
      originAllowed = corsOptions.origin.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') return allowedOrigin === origin;
        if (allowedOrigin instanceof RegExp) return allowedOrigin.test(origin);
        return false;
      });
    } else if (corsOptions.origin === true || corsOptions.origin === '*') {
      originAllowed = true;
    }
    
    if (originAllowed || !origin) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range');
      res.header('Access-Control-Max-Age', '86400'); // 24小时
      
      logger.info(`✅ OPTIONS请求处理完成`);
      return res.status(204).end();
    } else {
      logger.warn(`⚠️  OPTIONS请求被拒绝，来源: ${origin}`);
      return res.status(403).json({ error: 'CORS request denied' });
    }
  }
  next();
};

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
app.use('/audio-proxy', handleOptions, validateProxyRequest, audioProxy);

// 图片代理路由（使用专门的图片代理中间件）
app.use('/image-proxy', handleOptions, validateProxyRequest, imageProxy);

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
  logger.info(`\n🎵 ========== 音频和图片代理服务器启动成功! ==========`);
  logger.info(`📡 服务地址: http://0.0.0.0:${PORT}`);
  logger.info(`🎧 音频代理: http://0.0.0.0:${PORT}/audio-proxy?url=<音频URL>`);
  logger.info(`🖼️  图片代理: http://0.0.0.0:${PORT}/image-proxy?url=<图片URL>`);
  logger.info(`💚 健康检查: http://0.0.0.0:${PORT}/health`);
  logger.info(`📊 服务信息: http://0.0.0.0:${PORT}/info`);
  logger.info(`🌍 运行环境: ${NODE_ENV}`);
  logger.info(`⏰ 启动时间: ${new Date().toISOString()}`);
  logger.info(`📝 日志级别: 详细模式（包含请求/响应详情）`);
  logger.info(`=================================================\n`);
  
  // 打印支持的CORS来源
  logger.info(`🔒 CORS配置:`);
  if (Array.isArray(corsOptions.origin)) {
    corsOptions.origin.forEach((origin, index) => {
      logger.info(`   ${index + 1}. ${origin}`);
    });
  } else {
    logger.info(`   允许所有来源: ${corsOptions.origin}`);
  }
  logger.info(`\n🚀 服务器已就绪，等待请求...\n`);
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