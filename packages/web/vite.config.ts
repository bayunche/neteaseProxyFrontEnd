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
        secure: false,
        rewrite: (path) => {
          console.log('代理请求:', path);
          return path;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('代理请求详情:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('代理响应:', proxyRes.statusCode, req.url);
          });
        }
      },
      // 代理音频文件 - 简化版本
      '^/audio/.*': {
        target: 'http://music.163.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/audio/, '')
      }
    }
  }
})
