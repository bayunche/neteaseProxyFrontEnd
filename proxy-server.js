import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();
const PORT = 3001;

// 启用CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));

// 通用代理中间件函数
const createGenericProxy = (type = 'audio') => createProxyMiddleware({
  target: 'http://placeholder.com', // 占位符，会被动态替换
  changeOrigin: true,
  secure: false,
  router: (req) => {
    // 从查询参数中获取原始URL
    const originalUrl = req.query.url;
    if (originalUrl) {
      try {
        const url = new URL(originalUrl);
        return `${url.protocol}//${url.host}`;
      } catch (error) {
        console.error('Invalid URL:', originalUrl);
        return 'http://localhost:3001';
      }
    }
    return 'http://localhost:3001';
  },
  pathRewrite: (path, req) => {
    // 从查询参数中获取原始URL的路径
    const originalUrl = req.query.url;
    if (originalUrl) {
      try {
        const url = new URL(originalUrl);
        return url.pathname + url.search;
      } catch (error) {
        console.error('Invalid URL for path rewrite:', originalUrl);
        return '/';
      }
    }
    return '/';
  },
  onProxyReq: (proxyReq, req, res) => {
    // 设置必要的请求头
    proxyReq.setHeader('Referer', 'https://music.163.com/');
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    if (type === 'audio') {
      proxyReq.setHeader('Accept', 'audio/mpeg,audio/*,*/*');
    } else if (type === 'image') {
      proxyReq.setHeader('Accept', 'image/webp,image/apng,image/*,*/*;q=0.8');
    }
    
    console.log(`${type}代理请求: ${req.query.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // 设置CORS头
    proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
    
    console.log(`${type}代理响应: ${proxyRes.statusCode} - ${req.query.url}`);
  },
  onError: (err, req, res) => {
    console.error(`${type}代理错误:`, err.message);
    res.status(500).json({ 
      error: `${type}代理服务器错误`, 
      message: err.message,
      url: req.query.url 
    });
  }
});

// 创建音频和图片代理实例
const audioProxy = createGenericProxy('audio');
const imageProxy = createGenericProxy('image');

// 音频代理路由
app.use('/audio-proxy', audioProxy);

// 图片代理路由
app.use('/image-proxy', imageProxy);

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🎵 音频/图片代理服务器启动成功!`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔗 音频代理端点: http://localhost:${PORT}/audio-proxy?url=<音频URL>`);
  console.log(`🖼️  图片代理端点: http://localhost:${PORT}/image-proxy?url=<图片URL>`);
  console.log(`💚 健康检查: http://localhost:${PORT}/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});