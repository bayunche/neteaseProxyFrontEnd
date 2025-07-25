import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://8.134.196.44:8210',
        changeOrigin: true,
        secure: false
      },
      // 代理音频文件 - 动态代理不同的音频服务器
      '^/audio/.*': {
        target: '',
        changeOrigin: true,
        secure: false,
        router: (req) => {
          // 从路径中提取目标服务器
          const match = req.url.match(/^\/audio\/([^\/]+)/);
          if (match) {
            const host = match[1];
            return `http://${host}`;
          }
          return 'http://localhost:5173';
        },
        pathRewrite: {
          '^/audio/[^/]+': '' // 移除 /audio/域名 前缀
        },
        onProxyReq: (proxyReq, req, res) => {
          // 设置必要的请求头
          proxyReq.setHeader('Referer', 'https://music.163.com/');
          proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        }
      }
    }
  }
})
