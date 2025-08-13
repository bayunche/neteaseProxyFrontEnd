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
