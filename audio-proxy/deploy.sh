#!/bin/bash

# 音频代理服务器部署脚本
set -e

echo "🎵 音频代理服务器部署脚本"
echo "=========================="

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装Docker Compose"
    exit 1
fi

# 检查.env文件
if [ ! -f .env ]; then
    echo "📝 创建.env配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件，配置你的域名设置"
    echo "⚠️  配置完成后重新运行此脚本"
    exit 0
fi

echo "🔨 构建Docker镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

echo "🔍 检查服务状态..."
sleep 5
docker-compose ps

echo "🏥 健康检查..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ 服务启动成功!"
    echo "📡 代理服务器: http://localhost:3001"
    echo "💚 健康检查: http://localhost:3001/health"
    echo "📊 服务信息: http://localhost:3001/info"
else
    echo "❌ 服务启动失败，请检查日志:"
    docker-compose logs audio-proxy
    exit 1
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo "  更新服务: docker-compose up --build -d"
echo ""
echo "🔧 配置前端:"
echo "  1. 将你的域名配置到前端的 .env 文件中:"
echo "     VITE_AUDIO_PROXY_PRODUCTION=https://your-domain.com"
echo "  2. 确保服务器防火墙开放端口 3001"
echo "  3. 配置Nginx反向代理或使用 --profile nginx"