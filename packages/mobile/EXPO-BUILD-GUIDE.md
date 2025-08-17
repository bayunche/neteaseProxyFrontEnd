# 📱 Expo移动端构建部署指南

## 🎯 概述

本指南详细说明如何使用Expo EAS (Expo Application Services) 进行移动端应用的构建、测试和发布。

## 📋 前置要求

### 必需工具
```bash
# 安装Expo CLI
npm install -g @expo/cli

# 安装EAS CLI
npm install -g @expo/eas-cli

# 登录Expo账号
eas login
```

### 账号要求
- ✅ Expo账号 (免费版即可开始)
- ✅ Apple Developer账号 (iOS发布)
- ✅ Google Play Console账号 (Android发布)

## 🔧 项目配置

### 环境配置文件

项目支持三种环境：

| 环境 | 配置文件 | API地址 | 用途 |
|------|----------|---------|------|
| Development | `.env.development` | `http://localhost:3001` | 开发调试 |
| Preview | `.env.preview` | `http://8.134.196.44:3001` | 内测预览 |
| Production | `.env.production` | `http://8.134.196.44:3001` | 生产发布 |

### EAS构建配置 (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "NODE_ENV": "development",
        "EXPO_PUBLIC_API_URL": "http://localhost:3001"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "NODE_ENV": "staging", 
        "EXPO_PUBLIC_API_URL": "http://8.134.196.44:3001"
      }
    },
    "production": {
      "env": {
        "NODE_ENV": "production",
        "EXPO_PUBLIC_API_URL": "http://8.134.196.44:3001"
      }
    }
  }
}
```

## 🚀 构建流程

### 1. 快速构建

```bash
# 开发版本 (内部测试)
npm run build:development

# 预览版本 (内测分发)
npm run build:preview  

# 生产版本 (应用商店)
npm run build:production

# 构建所有版本
npm run build:all
```

### 2. 使用构建脚本

```bash
# 构建特定平台
./scripts/build.sh development android
./scripts/build.sh preview ios
./scripts/build.sh production all
```

### 3. 手动构建

```bash
# Android APK (测试用)
eas build --platform android --profile development

# iOS模拟器版本
eas build --platform ios --profile development

# 生产版本
eas build --platform all --profile production
```

## 📡 OTA更新发布

### Over-The-Air 更新

适用于JavaScript代码更新，无需重新下载应用：

```bash
# 发布开发环境更新
npm run update:development

# 发布预览环境更新  
npm run update:preview

# 发布生产环境更新
npm run update:production
```

### 使用发布脚本

```bash
# 发布OTA更新
./scripts/deploy.sh production update

# 构建新版本
./scripts/deploy.sh production build

# 提交应用商店
./scripts/deploy.sh production submit
```

## 🏪 应用商店发布

### Android (Google Play)

```bash
# 构建AAB文件
eas build --platform android --profile production

# 提交到Google Play
eas submit --platform android --profile production
```

### iOS (App Store)

```bash
# 构建IPA文件
eas build --platform ios --profile production

# 提交到App Store
eas submit --platform ios --profile production
```

### 自动化发布

```bash
# 一键发布到两个平台
./scripts/deploy.sh production submit
```

## 🔄 版本管理

### 自动版本更新

构建脚本会根据环境自动管理版本：

- **Development**: 不更新版本号
- **Preview**: 自动更新patch版本 (1.0.0 → 1.0.1)
- **Production**: 手动选择版本类型 (patch/minor/major)

### 手动版本管理

```bash
# 更新补丁版本
npm version patch

# 更新次版本
npm version minor

# 更新主版本
npm version major
```

## 📊 监控和管理

### 查看构建状态

```bash
# 查看构建历史
eas build:list

# 查看更新历史
eas update:list

# 查看提交历史
eas submit:list
```

### 安装测试版本

```bash
# 安装最新构建
eas build:run --platform android --latest
eas build:run --platform ios --latest

# 安装特定构建
eas build:run --platform android --id [BUILD_ID]
```

## 🛠️ 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清理缓存重新构建
npm run prebuild:clean
eas build --platform all --profile production --clear-cache
```

#### 2. 共享包问题
```bash
# 重新构建共享包
npm run prebuild:shared
cd ../shared && npm run build
```

#### 3. Metro缓存问题
```bash
# 清理Metro缓存
npx expo start --clear
rm -rf .expo
rm -rf node_modules/.cache
```

#### 4. 证书问题 (iOS)
```bash
# 重新生成证书
eas credentials
```

### 环境变量问题

确保环境变量正确设置：
```bash
# 检查当前环境变量
eas env:list

# 添加环境变量
eas env:create EXPO_PUBLIC_API_URL http://8.134.196.44:3001

# 删除环境变量
eas env:delete EXPO_PUBLIC_API_URL
```

## 📈 性能优化

### 构建优化

1. **启用Hermes引擎** (app.json):
```json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

2. **启用代码压缩** (eas.json):
```json
{
  "android": {
    "gradleCommand": ":app:bundleRelease"
  }
}
```

3. **资源优化**:
```json
{
  "expo": {
    "assetBundlePatterns": [
      "assets/images/*",
      "assets/fonts/*"
    ]
  }
}
```

### 包大小优化

```bash
# 分析包大小
npx react-native-bundle-visualizer

# 移除未使用的依赖
npm prune

# 使用动态导入
const Component = lazy(() => import('./Component'));
```

## 🔐 安全配置

### 环境变量安全

- ❌ 不要在代码中硬编码API密钥
- ✅ 使用 `EXPO_PUBLIC_` 前缀的环境变量
- ✅ 敏感信息使用EAS Secrets

### 代码混淆

启用ProGuard (Android):
```json
{
  "android": {
    "proguardMinifyEnabled": true,
    "enableProguardInReleaseBuilds": true
  }
}
```

## 📚 相关链接

- [Expo官方文档](https://docs.expo.dev/)
- [EAS Build文档](https://docs.expo.dev/build/introduction/)
- [EAS Submit文档](https://docs.expo.dev/submit/introduction/)
- [Expo应用配置](https://docs.expo.dev/workflow/configuration/)

---

## 🎉 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 构建共享包
npm run prebuild:shared

# 3. 开发版本构建
npm run build:development

# 4. 预览版本发布
./scripts/deploy.sh preview update
```

🚨 **重要提醒**: 
- 生产环境发布前务必完成充分测试
- 确保代理服务器稳定运行
- 定期备份构建配置和证书