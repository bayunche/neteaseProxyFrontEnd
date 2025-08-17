#!/bin/bash

# Expo移动端构建脚本
# 使用方法: ./scripts/build.sh [profile] [platform]

set -e

PROFILE=${1:-development}
PLATFORM=${2:-all}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 开始构建移动端应用"
echo "📱 构建配置: $PROFILE"
echo "🔧 目标平台: $PLATFORM"

cd "$PROJECT_DIR"

# 检查依赖
check_dependencies() {
    echo "📋 检查依赖..."
    
    if ! command -v eas &> /dev/null; then
        echo "❌ EAS CLI 未安装，正在安装..."
        npm install -g @expo/eas-cli
    fi
    
    if ! command -v expo &> /dev/null; then
        echo "❌ Expo CLI 未安装，正在安装..."
        npm install -g @expo/cli
    fi
    
    echo "✅ 依赖检查完成"
}

# 预构建共享包
prebuild_shared() {
    echo "🔨 构建共享包..."
    cd ../shared
    npm run build
    cd - > /dev/null
    echo "✅ 共享包构建完成"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装依赖..."
    npm install
    echo "✅ 依赖安装完成"
}

# 清理缓存
clean_cache() {
    echo "🧹 清理缓存..."
    rm -rf node_modules/.cache
    rm -rf .expo
    npx expo install --fix
    echo "✅ 缓存清理完成"
}

# 执行构建
build_app() {
    echo "🏗️  开始构建应用..."
    
    case $PLATFORM in
        "android")
            echo "🤖 构建Android版本..."
            eas build --platform android --profile $PROFILE
            ;;
        "ios")
            echo "🍎 构建iOS版本..."
            eas build --platform ios --profile $PROFILE
            ;;
        "all")
            echo "📱 构建所有平台..."
            eas build --platform all --profile $PROFILE
            ;;
        *)
            echo "❌ 不支持的平台: $PLATFORM"
            echo "支持的平台: android, ios, all"
            exit 1
            ;;
    esac
    
    echo "✅ 构建完成"
}

# 显示构建信息
show_build_info() {
    echo ""
    echo "🎉 构建完成!"
    echo "📊 构建信息:"
    echo "  - 配置: $PROFILE"
    echo "  - 平台: $PLATFORM"
    echo "  - 项目ID: $(cat app.json | grep projectId | cut -d'"' -f4)"
    echo ""
    echo "📱 查看构建状态:"
    echo "  eas build:list"
    echo ""
    echo "📱 安装到设备:"
    echo "  eas build:run --platform android --latest"
    echo "  eas build:run --platform ios --latest"
}

# 错误处理
handle_error() {
    echo "❌ 构建失败！"
    echo "💡 尝试以下解决方案:"
    echo "  1. 运行 npm run prebuild:clean 清理项目"
    echo "  2. 检查 eas.json 配置"
    echo "  3. 确认 EAS 登录状态: eas whoami"
    echo "  4. 查看详细日志: eas build:list"
    exit 1
}

# 设置错误处理
trap 'handle_error' ERR

# 主执行流程
main() {
    check_dependencies
    install_dependencies
    prebuild_shared
    
    # 根据配置决定是否清理缓存
    if [ "$PROFILE" = "production" ]; then
        clean_cache
    fi
    
    build_app
    show_build_info
}

# 执行主流程
main