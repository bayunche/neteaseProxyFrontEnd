# 🎵 音频代理服务器

一个专门用于解决音频文件CORS跨域问题的Node.js代理服务器，支持Docker部署到公网服务器。

## 🚀 功能特性

- ✅ **解决CORS问题**: 代理音频请求，避免跨域限制
- ✅ **多域名支持**: 自动处理不同音频服务器域名
- ✅ **Docker部署**: 完整的Docker和Docker Compose配置
- ✅ **生产就绪**: 包含健康检查、日志记录、优雅关闭
- ✅ **安全配置**: CORS白名单、请求头设置、用户权限控制
- ✅ **缓存支持**: 可选Redis缓存层提升性能
- ✅ **负载均衡**: 支持Nginx反向代理和Traefik

## 📁 项目结构

```
audio-proxy/
├── server.js              # 主服务器文件
├── package.json           # Node.js依赖配置
├── Dockerfile             # Docker镜像构建文件
├── docker-compose.yml     # Docker Compose配置
├── .dockerignore          # Docker忽略文件
├── .env.example           # 环境变量示例
└── README.md              # 项目文档
```

## 🔧 安装与运行

### 本地开发

```bash
# 进入项目目录
cd audio-proxy

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或启动生产服务器
npm start
```

### Docker部署

#### 1. 构建并运行基础服务

```bash
# 构建镜像
docker build -t audio-proxy-server .

# 运行容器
docker run -d \
  --name audio-proxy \
  -p 3001:3001 \
  -e NODE_ENV=production \
  audio-proxy-server
```

#### 2. 使用Docker Compose（推荐）

```bash
# 仅运行代理服务
docker-compose up -d

# 运行代理服务 + Nginx反向代理
docker-compose --profile nginx up -d

# 运行代理服务 + Redis缓存
docker-compose --profile cache up -d

# 运行完整服务（代理 + Nginx + Redis）
docker-compose --profile nginx --profile cache up -d
```

## 🌍 公网部署

### 1. 服务器准备

在你的公网服务器上安装Docker和Docker Compose：

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker

# CentOS/RHEL
sudo yum install docker docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 上传代码

```bash
# 在本地打包
tar -czf audio-proxy.tar.gz audio-proxy/

# 上传到服务器
scp audio-proxy.tar.gz user@your-server:/opt/

# 在服务器上解压
ssh user@your-server
cd /opt
tar -xzf audio-proxy.tar.gz
cd audio-proxy
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
nano .env
```

修改`.env`文件中的域名配置：

```env
ALLOWED_ORIGINS=https://your-music-app.com,https://www.your-music-app.com
```

### 4. 部署服务

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

### 5. 配置域名和SSL（可选）

如果使用Nginx配置：

```bash
# 创建Nginx配置目录
mkdir -p nginx/ssl

# 将SSL证书复制到nginx/ssl/目录
# 配置nginx.conf（见下方示例）
```

## 📡 API接口

### 健康检查
```
GET /health
```

响应示例：
```json
{
  "status": "ok",
  "service": "audio-proxy-server",
  "version": "1.0.0",
  "timestamp": "2024-01-20T10:30:45.123Z",
  "port": 3001,
  "environment": "production",
  "uptime": 3600
}
```

### 音频代理
```
GET /audio-proxy?url=<编码后的音频URL>
```

使用示例：
```javascript
// 原始音频URL
const originalUrl = 'http://m804.music.126.net/path/to/audio.mp3';

// 通过代理访问
const proxyUrl = `https://your-domain.com/audio-proxy?url=${encodeURIComponent(originalUrl)}`;

// 在HTML中使用
const audio = new Audio(proxyUrl);
audio.play();
```

### 服务信息
```
GET /info
```

## 🔐 安全配置

### CORS白名单

在生产环境中，服务器只允许指定域名的跨域请求。在`server.js`中修改：

```javascript
const corsOptions = {
  origin: [
    'https://your-music-app.com',
    'https://www.your-music-app.com'
  ],
  credentials: true
};
```

### 防火墙配置

```bash
# 仅开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3001  # 代理服务器（如果直接暴露）
sudo ufw enable
```

## 🎛️ 监控与维护

### 查看服务状态

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs audio-proxy

# 实时查看日志
docker-compose logs -f audio-proxy

# 查看资源使用
docker stats audio-proxy-server
```

### 更新服务

```bash
# 拉取最新代码
git pull origin main

# 重新构建并启动
docker-compose up --build -d

# 清理旧镜像
docker image prune -f
```

### 备份与恢复

```bash
# 备份配置文件
tar -czf audio-proxy-backup.tar.gz .env docker-compose.yml

# 如果使用Redis，备份数据
docker exec audio-proxy-redis redis-cli BGSAVE
```

## 🔧 故障排除

### 常见问题

1. **端口占用**
   ```bash
   # 检查端口占用
   netstat -tlnp | grep 3001
   
   # 杀死占用进程
   sudo kill -9 <PID>
   ```

2. **容器无法启动**
   ```bash
   # 查看详细错误
   docker-compose logs audio-proxy
   
   # 检查配置文件语法
   docker-compose config
   ```

3. **音频无法播放**
   - 检查原始URL是否有效
   - 确认CORS配置正确
   - 查看服务器日志排查错误

### 性能优化

1. **启用Redis缓存**
   ```bash
   docker-compose --profile cache up -d
   ```

2. **使用Nginx负载均衡**
   ```bash
   docker-compose --profile nginx up -d
   ```

3. **配置CDN**
   - 使用Cloudflare等CDN服务
   - 配置音频文件缓存策略

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题，请提交Issue或联系维护者。