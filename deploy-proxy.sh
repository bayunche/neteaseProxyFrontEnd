#!/bin/bash

# 网易云音乐代理服务器部署脚本
# 使用方法: ./deploy-proxy.sh [环境]

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="netease-proxy"

echo "🚀 开始部署网易云音乐代理服务器 - 环境: $ENVIRONMENT"

# 检查必要的工具
check_dependencies() {
    echo "📋 检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    echo "✅ 依赖检查完成"
}

# 检查环境配置
check_environment() {
    echo "🔧 检查环境配置..."
    
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        echo "❌ 环境配置文件 .env.$ENVIRONMENT 不存在"
        echo "请创建配置文件并设置以下变量:"
        echo "  - ALLOWED_ORIGINS"
        echo "  - PORT"
        exit 1
    fi
    
    echo "✅ 环境配置检查完成"
}

# 构建镜像
build_image() {
    echo "🔨 构建 Docker 镜像..."
    
    docker build -f Dockerfile.proxy -t $PROJECT_NAME:$ENVIRONMENT .
    
    echo "✅ 镜像构建完成"
}

# 停止现有服务
stop_existing() {
    echo "🛑 停止现有服务..."
    
    if docker-compose -f docker-compose.proxy.yml ps -q | grep -q .; then
        docker-compose -f docker-compose.proxy.yml down
    fi
    
    echo "✅ 现有服务已停止"
}

# 启动服务
start_service() {
    echo "🌟 启动服务..."
    
    # 复制环境配置
    cp ".env.$ENVIRONMENT" .env
    
    # 启动服务
    docker-compose -f docker-compose.proxy.yml up -d
    
    echo "✅ 服务启动完成"
}

# 健康检查
health_check() {
    echo "🏥 进行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            echo "✅ 服务健康检查通过"
            return 0
        fi
        
        echo "⏳ 等待服务启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    echo "❌ 服务健康检查失败"
    docker-compose -f docker-compose.proxy.yml logs
    exit 1
}

# 显示部署信息
show_info() {
    echo ""
    echo "🎉 部署完成!"
    echo "📊 服务信息:"
    echo "  - 健康检查: http://localhost:3001/health"
    echo "  - 音频代理: http://localhost:3001/audio-proxy?url=<音频URL>"
    echo "  - 图片代理: http://localhost:3001/image-proxy?url=<图片URL>"
    echo ""
    echo "📝 查看日志: docker-compose -f docker-compose.proxy.yml logs -f"
    echo "🛑 停止服务: docker-compose -f docker-compose.proxy.yml down"
    echo "🔄 重启服务: docker-compose -f docker-compose.proxy.yml restart"
}

# 备份功能
backup_config() {
    echo "💾 备份配置文件..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    cp ".env.$ENVIRONMENT" "$backup_dir/"
    cp "docker-compose.proxy.yml" "$backup_dir/"
    
    echo "✅ 配置已备份到 $backup_dir"
}

# 主执行流程
main() {
    cd "$SCRIPT_DIR"
    
    check_dependencies
    check_environment
    backup_config
    stop_existing
    build_image
    start_service
    health_check
    show_info
}

# 错误处理
trap 'echo "❌ 部署失败，请查看错误信息"; exit 1' ERR

# 执行主流程
main