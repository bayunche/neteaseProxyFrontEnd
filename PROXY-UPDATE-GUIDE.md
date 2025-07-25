# 🔧 代理服务器更新指南

## 问题描述

当前图片代理返回404错误，原因：
- 图片代理使用了错误的音频代理中间件
- 缺少适合图片请求的Accept头设置
- 代理逻辑需要针对图片和音频分别优化

## 🚀 服务器更新步骤

### 1. 登录到服务器
```bash
ssh your-username@8.134.196.44
```

### 2. 进入项目目录
```bash
cd /path/to/your/audio-proxy  # 替换为实际路径
```

### 3. 拉取最新代码
```bash
git pull origin master
```

### 4. 重新构建和部署
```bash
# 停止当前服务
docker-compose down

# 重新构建并启动
docker-compose up --build -d

# 查看服务状态
docker-compose ps
docker-compose logs -f audio-proxy
```

### 5. 验证服务
```bash
# 健康检查
curl http://localhost:3001/health

# 服务信息
curl http://localhost:3001/info

# 测试图片代理
curl -I "http://localhost:3001/image-proxy?url=https%3A%2F%2Fvia.placeholder.com%2F300x300"

# 测试音频代理
curl -I "http://localhost:3001/audio-proxy?url=https%3A%2F%2Fwww.w3schools.com%2Fhtml%2Fhorse.mp3"
```

## 📋 更新内容

### 修复的问题
- ✅ 分离图片和音频代理中间件
- ✅ 为图片请求设置正确的Accept头
- ✅ 改进错误日志和类型标识
- ✅ 优化代理处理逻辑

### 新功能
- 🎯 独立的图片代理处理器
- 📝 更详细的代理日志
- 🔧 类型感知的错误处理

## 🧪 测试验证

更新后，以下URL应该正常工作：

### 图片代理测试
```bash
# 测试公共图片
curl "http://8.134.196.44:3001/image-proxy?url=https%3A%2F%2Fvia.placeholder.com%2F300x300%2FFF0000%2FFFFFFF%3Ftext%3DTest"

# 测试网易云图片（如果存在）
curl "http://8.134.196.44:3001/image-proxy?url=https%3A%2F%2Fp1.music.126.net%2F109951163014923060%2F109951163014923060.jpg"
```

### 音频代理测试
```bash
# 测试公共音频
curl "http://8.134.196.44:3001/audio-proxy?url=https%3A%2F%2Fwww.w3schools.com%2Fhtml%2Fhorse.mp3"
```

## ⚠️ 故障排除

### 如果服务无法启动
```bash
# 查看详细日志
docker-compose logs audio-proxy

# 检查端口占用
netstat -tlnp | grep 3001

# 手动重启
docker-compose restart audio-proxy
```

### 如果代理仍然失败
1. 检查防火墙设置
2. 确认端口3001已开放
3. 检查服务器网络连接
4. 查看详细错误日志

## 📞 技术支持

如果更新过程中遇到问题：
1. 保存错误日志：`docker-compose logs audio-proxy > error.log`
2. 提交GitHub Issue附带日志
3. 或联系技术支持

## 🎉 更新完成

更新成功后，您的音乐播放器应该能够：
- ✅ 正常加载专辑封面
- ✅ 显示艺术家头像  
- ✅ 播放音频文件
- ✅ 加载歌单封面

所有图片和音频资源都将通过代理服务器正常加载！