# 生产环境部署指南

## 🎯 概述

本指南详细说明如何在生产环境中部署网易云音乐代理服务器，包括安全配置、性能优化和监控设置。

## 📋 部署前检查清单

### 必需的调整

#### 1. 🔒 安全配置

- [ ] **CORS配置**: 更新 `.env.production` 中的 `ALLOWED_ORIGINS`
- [ ] **域名白名单**: 确认代理服务器只能访问网易云音乐相关域名
- [ ] **SSL证书**: 配置HTTPS证书（推荐Let's Encrypt）
- [ ] **防火墙规则**: 只开放必要端口（80, 443, 3001）

#### 2. ⚡ 性能优化

- [ ] **速率限制**: 配置合理的请求频率限制
- [ ] **缓存策略**: 启用图片缓存提升性能
- [ ] **压缩**: 启用gzip压缩减少带宽使用
- [ ] **负载均衡**: 多实例部署时配置负载均衡

#### 3. 📊 监控和日志

- [ ] **日志收集**: 配置日志轮转和集中收集
- [ ] **监控指标**: 设置CPU、内存、网络监控
- [ ] **告警机制**: 配置服务异常告警
- [ ] **健康检查**: 确保负载均衡器健康检查正常

## 🚀 快速部署

### 方式一：Docker Compose（推荐）

1. **准备环境配置**
```bash
# 复制生产环境配置
cp .env.production .env

# 修改关键配置
nano .env
```

2. **更新CORS域名**
```bash
# 在 .env 中设置你的域名
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

3. **执行部署**
```bash
./deploy-proxy.sh production
```

### 方式二：手动Docker部署

```bash
# 1. 构建镜像
docker build -f Dockerfile.proxy -t netease-proxy:production .

# 2. 运行容器
docker run -d \
  --name netease-proxy \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e ALLOWED_ORIGINS=https://yourdomain.com \
  --restart unless-stopped \
  netease-proxy:production
```

## 🔧 生产环境配置详解

### 环境变量配置

| 变量名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `NODE_ENV` | ✅ | production | 运行环境 |
| `PORT` | ✅ | 3001 | 服务端口 |
| `ALLOWED_ORIGINS` | ✅ | - | CORS允许的域名 |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ | 1000 | 每15分钟最大请求数 |
| `PROXY_RATE_LIMIT_MAX_REQUESTS` | ❌ | 100 | 每分钟最大代理请求数 |

### Nginx反向代理配置

```nginx
# /etc/nginx/sites-available/proxy.yourdomain.com
server {
    listen 443 ssl http2;
    server_name proxy.yourdomain.com;

    # SSL配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 代理到后端服务
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 监控和维护

### 日志管理

```bash
# 查看实时日志
docker-compose -f docker-compose.proxy.yml logs -f

# 查看特定服务日志
docker logs netease-proxy

# 日志轮转（使用logrotate）
sudo nano /etc/logrotate.d/netease-proxy
```

### 健康检查

```bash
# 检查服务状态
curl http://localhost:3001/health

# 检查监控指标
curl http://localhost:3001/metrics
```

### 性能监控

推荐使用以下工具：
- **Prometheus + Grafana**: 指标收集和可视化
- **ELK Stack**: 日志分析
- **Uptime Robot**: 可用性监控

## 🛡️ 安全最佳实践

### 1. 网络安全

```bash
# 防火墙配置（UFW示例）
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 3001   # 直接访问代理端口
sudo ufw enable
```

### 2. 容器安全

- 使用非root用户运行容器
- 定期更新基础镜像
- 限制容器资源使用
- 启用只读文件系统（如适用）

### 3. 应用安全

- 定期更新依赖包
- 启用Helmet安全头
- 配置合理的超时时间
- 实施请求大小限制

## 🔄 更新和回滚

### 更新部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 备份当前配置
./deploy-proxy.sh production

# 3. 零停机更新
docker-compose -f docker-compose.proxy.yml up -d --no-deps proxy
```

### 快速回滚

```bash
# 回滚到之前的镜像版本
docker tag netease-proxy:production netease-proxy:production-backup
docker tag netease-proxy:previous netease-proxy:production
docker-compose -f docker-compose.proxy.yml up -d --no-deps proxy
```

## ❌ 常见问题

### CORS错误

**问题**: 前端无法访问代理服务器
**解决**: 检查 `ALLOWED_ORIGINS` 配置是否包含前端域名

### 502 Bad Gateway

**问题**: Nginx返回502错误
**解决**: 
1. 检查代理服务器是否正常运行
2. 验证Nginx upstream配置
3. 查看防火墙设置

### 速率限制触发

**问题**: 频繁收到429错误
**解决**: 调整速率限制配置或优化前端请求频率

## 📞 支持

遇到问题时，请按以下顺序排查：

1. 检查服务日志: `docker logs netease-proxy`
2. 验证配置文件: 确认 `.env` 文件正确
3. 测试网络连接: `curl` 命令测试各端点
4. 查看系统资源: `htop` 或 `docker stats`

## 📚 相关文档

- [Docker官方文档](https://docs.docker.com/)
- [Nginx配置指南](https://nginx.org/en/docs/)
- [Let's Encrypt证书](https://letsencrypt.org/)
- [PM2进程管理](https://pm2.keymetrics.io/)

---

🚨 **重要提醒**: 生产环境部署前请务必完成安全检查清单中的所有项目！