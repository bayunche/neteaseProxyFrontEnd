# 使用官方Node.js 18 Alpine镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 安装必要的系统依赖
RUN apk add --no-cache \
    curl \
    ca-certificates \
    && update-ca-certificates

# 复制package.json和package-lock.json
COPY package.json package-lock.json ./

# 安装Node.js依赖（使用npm ci以获得确定性构建）
RUN npm ci --omit=dev && npm cache clean --force

# 复制应用程序代码
COPY server.js ./

# 创建非root用户来运行应用
RUN addgroup -g 1001 -S nodejs && \
    adduser -S audioproxy -u 1001 -G nodejs

# 修改文件所有权
RUN chown -R audioproxy:nodejs /app
USER audioproxy

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# 启动应用
CMD ["node", "server.js"]