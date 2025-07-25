# 音频代理服务器

## 概述

这是一个专门用于解决音频文件CORS跨域问题的Node.js代理服务器。它将网易云音乐等平台的音频URL转发，让前端可以正常播放音频。

## 功能特性

- ✅ 解决音频文件CORS跨域问题
- ✅ 支持多种音频服务器域名
- ✅ 自动设置必要的请求头
- ✅ 完整的错误处理和日志记录
- ✅ 健康检查端点

## 使用方法

### 1. 启动代理服务器

```bash
# 仅启动代理服务器
npm run proxy

# 同时启动代理服务器和前端开发服务器
npm run start
```

### 2. 服务端点

- **代理服务器**: http://localhost:3001
- **代理端点**: http://localhost:3001/audio-proxy?url=<音频URL>
- **健康检查**: http://localhost:3001/health

### 3. 使用示例

原始音频URL:
```
http://m804.music.126.net/20250725084955/cb356daaff308ab1a8a20681e4076c4e/jdymusic/obj/wo3DlMOGwrbDjj7DisKw/28481789095/c3bd/9d0d/b7fd/1cd8fd805e0567cd02ce7256c2112021.mp3
```

通过代理服务器访问:
```
http://localhost:3001/audio-proxy?url=http%3A//m804.music.126.net/20250725084955/cb356daaff308ab1a8a20681e4076c4e/jdymusic/obj/wo3DlMOGwrbDjj7DisKw/28481789095/c3bd/9d0d/b7fd/1cd8fd805e0567cd02ce7256c2112021.mp3
```

## 前端集成

前端SongAPI已自动配置使用此代理服务器。当获取歌曲播放URL时，会自动转换为代理URL格式。

## 技术实现

### 依赖包
- `express`: Web服务器框架
- `http-proxy-middleware`: HTTP代理中间件
- `cors`: 跨域资源共享支持

### 关键特性
1. **动态路由**: 根据查询参数中的URL动态设置代理目标
2. **请求头设置**: 自动添加必要的Referer和User-Agent
3. **错误处理**: 完整的错误捕获和响应
4. **CORS支持**: 允许前端跨域访问

## 启动脚本说明

```json
{
  "proxy": "node proxy-server.js",           // 仅启动代理服务器
  "start": "concurrently \"npm run proxy\" \"npm run dev\""  // 同时启动代理和前端
}
```

## 注意事项

1. 确保端口3001未被占用
2. 代理服务器需要在前端应用之前启动
3. 支持的前端端口: 5173, 5174, 5175
4. 适用于开发和生产环境