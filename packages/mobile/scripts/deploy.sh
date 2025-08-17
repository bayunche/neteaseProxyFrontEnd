#!/bin/bash

# Expo移动端发布脚本
# 使用方法: ./scripts/deploy.sh [环境] [操作]

set -e

ENVIRONMENT=${1:-preview}
ACTION=${2:-update}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 开始发布移动端应用"
echo "🌍 发布环境: $ENVIRONMENT"
echo "⚡ 发布操作: $ACTION"

cd "$PROJECT_DIR"

# 检查登录状态
check_login() {
    echo "🔐 检查EAS登录状态..."
    
    if ! eas whoami &> /dev/null; then
        echo "❌ 未登录EAS，请先登录"
        eas login
    fi
    
    echo "✅ EAS登录检查完成"
}

# 检查环境配置
check_environment() {
    echo "🔧 检查环境配置..."
    
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        echo "❌ 环境配置文件 .env.$ENVIRONMENT 不存在"
        exit 1
    fi
    
    # 验证必要的环境变量
    source ".env.$ENVIRONMENT"
    
    if [ -z "$EXPO_PUBLIC_API_URL" ]; then
        echo "❌ EXPO_PUBLIC_API_URL 未设置"
        exit 1
    fi
    
    echo "✅ 环境配置检查完成"
}

# 更新版本号
update_version() {
    echo "📈 更新版本号..."
    
    local current_version=$(cat app.json | grep '"version"' | cut -d'"' -f4)
    echo "当前版本: $current_version"
    
    # 根据环境自动更新版本号
    case $ENVIRONMENT in
        "development")
            # 开发环境不更新版本号
            ;;
        "preview")
            # 预览环境更新patch版本
            npm version patch --no-git-tag-version
            ;;
        "production")
            # 生产环境需要手动确认版本号
            echo "🤔 是否要更新生产版本号? (y/n)"
            read -r response
            if [[ "$response" = "y" ]]; then
                echo "选择版本类型: patch/minor/major"
                read -r version_type
                npm version $version_type --no-git-tag-version
            fi
            ;;
    esac
    
    local new_version=$(cat app.json | grep '"version"' | cut -d'"' -f4)
    echo "新版本: $new_version"
}

# 执行构建
build_app() {
    echo "🏗️  构建应用..."
    ./scripts/build.sh $ENVIRONMENT all
    echo "✅ 构建完成"
}

# 发布更新
publish_update() {
    echo "📡 发布OTA更新..."
    
    # 构建共享包
    npm run prebuild:shared
    
    # 发布更新
    case $ENVIRONMENT in
        "development")
            eas update --branch development --message "Development update $(date)"
            ;;
        "preview")
            eas update --branch preview --message "Preview update $(date)"
            ;;
        "production")
            echo "🚨 发布生产环境更新，请确认:"
            echo "  - 已经测试所有功能"
            echo "  - 已经通过代码审查"
            echo "  - 确认要发布到生产环境"
            echo "确认发布? (yes/no)"
            read -r confirm
            if [[ "$confirm" = "yes" ]]; then
                eas update --branch production --message "Production update $(date)"
            else
                echo "❌ 取消发布"
                exit 1
            fi
            ;;
    esac
    
    echo "✅ 更新发布完成"
}

# 提交到应用商店
submit_app() {
    echo "🏪 提交应用到商店..."
    
    if [ "$ENVIRONMENT" != "production" ]; then
        echo "❌ 只有生产环境才能提交到应用商店"
        exit 1
    fi
    
    echo "选择提交平台:"
    echo "1) Android (Google Play)"
    echo "2) iOS (App Store)"
    echo "3) 两个平台"
    read -r platform_choice
    
    case $platform_choice in
        "1")
            eas submit --platform android --profile production
            ;;
        "2")
            eas submit --platform ios --profile production
            ;;
        "3")
            eas submit --platform all --profile production
            ;;
        *)
            echo "❌ 无效选择"
            exit 1
            ;;
    esac
    
    echo "✅ 应用提交完成"
}

# 显示发布信息
show_deploy_info() {
    echo ""
    echo "🎉 发布完成!"
    echo "📊 发布信息:"
    echo "  - 环境: $ENVIRONMENT"
    echo "  - 操作: $ACTION"
    echo "  - 时间: $(date)"
    echo ""
    
    case $ACTION in
        "update")
            echo "📱 用户更新方式:"
            echo "  - 重启应用自动获取更新"
            echo "  - 或拉取刷新触发更新"
            ;;
        "build")
            echo "📱 安装方式:"
            echo "  - 扫描二维码安装内测版"
            echo "  - 或从应用商店下载"
            ;;
        "submit")
            echo "📱 审核状态:"
            echo "  - Google Play: 通常1-3天审核"
            echo "  - App Store: 通常1-7天审核"
            ;;
    esac
    
    echo ""
    echo "🔍 查看更多信息:"
    echo "  eas build:list    # 查看构建历史"
    echo "  eas update:list   # 查看更新历史"
    echo "  eas submit:list   # 查看提交历史"
}

# 错误处理
handle_error() {
    echo "❌ 发布失败！"
    echo "💡 常见问题解决方案:"
    echo "  1. 检查网络连接"
    echo "  2. 确认EAS登录状态: eas whoami"
    echo "  3. 检查环境配置文件"
    echo "  4. 查看EAS控制台: https://expo.dev/"
    exit 1
}

# 设置错误处理
trap 'handle_error' ERR

# 主执行流程
main() {
    check_login
    check_environment
    
    case $ACTION in
        "update")
            update_version
            publish_update
            ;;
        "build")
            update_version
            build_app
            ;;
        "submit")
            submit_app
            ;;
        *)
            echo "❌ 不支持的操作: $ACTION"
            echo "支持的操作: update, build, submit"
            exit 1
            ;;
    esac
    
    show_deploy_info
}

# 执行主流程
main