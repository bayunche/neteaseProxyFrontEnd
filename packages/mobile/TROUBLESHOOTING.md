# 🛠️ 移动端打包故障排除指南

## 🔍 常见问题快速诊断

### 问题分类速查表

| 问题类型 | 症状 | 快速解决 |
|----------|------|----------|
| 环境问题 | EAS命令不存在 | `npm install -g eas-cli` |
| 登录问题 | Not logged in | `eas login` |
| 依赖问题 | Module not found | `npm install && npm run prebuild:shared` |
| 缓存问题 | 构建行为异常 | `--clear-cache` |
| 网络问题 | 上传失败 | 检查网络连接 |
| 配置问题 | 构建失败 | 检查eas.json和app.json |

## 🚨 常见错误及解决方案

### 1. EAS CLI相关问题

#### 错误：`eas: command not found`
```bash
# 解决方案
npm install -g eas-cli

# 验证安装
eas --version
```

#### 错误：`Not logged in`
```bash
# 解决方案
eas login

# 输入Expo账号邮箱和密码
# 验证登录
eas whoami
```

#### 错误：`Project not configured for EAS Build`
```bash
# 解决方案
eas build:configure

# 或手动检查eas.json文件是否存在且格式正确
```

### 2. 构建失败问题

#### 错误：`Module '@music-player/shared' not found`
```bash
# 原因：共享包未正确构建
# 解决方案
cd ../shared
npm run build
cd ../mobile

# 或使用预构建脚本
npm run prebuild:shared
```

#### 错误：`Failed to resolve dependencies`
```bash
# 解决方案1：清理并重新安装依赖
rm -rf node_modules
rm package-lock.json
npm install

# 解决方案2：清理metro缓存
npx expo start --clear
rm -rf .expo
```

#### 错误：`Build failed with exit code 1`
```bash
# 解决方案：查看详细日志
eas build:list
# 点击失败的构建查看详细错误

# 常见原因和解决方案：
# 1. TypeScript错误
npm run typecheck

# 2. ESLint错误
npm run lint

# 3. 清理缓存重试
eas build --platform android --profile development --clear-cache
```

### 3. Android构建问题

#### 错误：`AAPT: error: resource android:attr/lStar not found`
```bash
# 原因：Android SDK版本问题
# 解决方案：在app.json中更新Android配置
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34
          }
        }
      ]
    ]
  }
}
```

#### 错误：`Gradle build failed`
```bash
# 解决方案1：增加Gradle内存
# 在eas.json中添加
{
  "build": {
    "production": {
      "android": {
        "gradleCommand": ":app:bundleRelease -Xmx4g"
      }
    }
  }
}

# 解决方案2：清理Gradle缓存
eas build --platform android --clear-cache
```

### 4. iOS构建问题

#### 错误：`No profiles for team ID found`
```bash
# 原因：iOS证书配置问题
# 解决方案
eas credentials

# 按提示重新配置证书和provisioning profile
```

#### 错误：`Code signing error`
```bash
# 解决方案：重新生成证书
eas credentials --platform ios

# 选择：
# 1. Build credentials (Apple Distribution Certificate)
# 2. Push notification key
```

#### 错误：`Archive failed`
```bash
# 常见原因：内存不足或依赖冲突
# 解决方案1：简化依赖
npm audit fix

# 解决方案2：检查iOS兼容性
# 确保app.json中的ios.deploymentTarget >= "13.0"
```

### 5. 网络和上传问题

#### 错误：`Upload timed out`
```bash
# 原因：网络连接问题或文件过大
# 解决方案1：重试构建
eas build --platform android --profile development

# 解决方案2：检查网络连接
ping expo.dev

# 解决方案3：优化包大小
# 检查app.json中的assetBundlePatterns
```

#### 错误：`Rate limit exceeded`
```bash
# 原因：构建频率过高
# 解决方案：等待一段时间后重试
# 免费账户有构建限制，考虑升级到付费计划
```

### 6. 配置文件问题

#### 错误：`Invalid configuration in app.json`
```bash
# 解决方案：验证JSON格式
npx expo config --type public

# 检查常见问题：
# 1. JSON语法错误（多余的逗号）
# 2. 必需字段缺失（name, slug, version）
# 3. 字段值类型错误
```

#### 错误：`Environment variable not found`
```bash
# 解决方案：检查环境变量配置
# 1. 确保.env文件存在
ls -la .env.*

# 2. 检查eas.json中的env配置
cat eas.json | grep -A 5 "env"

# 3. 使用EAS Secrets（敏感信息）
eas secret:list
eas secret:create --name EXPO_PUBLIC_API_URL --value "your-value"
```

## 🔧 高级故障排除

### 调试模式构建
```bash
# 启用详细日志
eas build --platform android --profile development --verbose

# 启用本地构建（需要本地环境）
eas build --platform android --local
```

### Metro缓存问题
```bash
# 完全清理Metro缓存
npx expo start --clear
rm -rf node_modules/.cache
rm -rf .expo
rm -rf ~/Library/Developer/Xcode/DerivedData  # macOS Xcode缓存
```

### 依赖冲突解决
```bash
# 检查依赖冲突
npm ls

# 解决peer dependency警告
npm install --legacy-peer-deps

# 强制解析特定版本
# 在package.json中添加overrides字段
{
  "overrides": {
    "package-name": "version"
  }
}
```

## 📊 性能问题排查

### 构建时间过长
```bash
# 检查构建时间分布
eas build:view [BUILD_ID]

# 优化建议：
# 1. 减少不必要的依赖
# 2. 启用构建缓存
# 3. 使用--local进行本地构建调试
```

### 包体积过大
```bash
# 分析包内容
npx react-native-bundle-visualizer

# 优化策略：
# 1. 移除未使用的依赖
# 2. 启用代码分割
# 3. 优化图片资源
# 4. 使用动态导入
```

## 🆘 求助渠道

### 官方资源
- [Expo文档](https://docs.expo.dev/)
- [EAS Build故障排除](https://docs.expo.dev/build/troubleshooting/)
- [Expo论坛](https://forums.expo.dev/)

### 社区支持
- [GitHub Issues](https://github.com/expo/expo/issues)
- [Discord社区](https://discord.gg/4gtbPAdpaE)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

### 付费支持
- [Expo专业支持](https://expo.dev/support)

## 📋 问题报告模板

遇到无法解决的问题时，请提供以下信息：

```markdown
### 环境信息
- EAS CLI版本: `eas --version`
- Expo CLI版本: `expo --version`
- Node.js版本: `node --version`
- 操作系统: macOS/Windows/Linux

### 问题描述
- 具体错误信息
- 复现步骤
- 预期行为 vs 实际行为

### 配置文件
- app.json相关配置
- eas.json相关配置
- package.json依赖版本

### 构建信息
- 构建ID（如果有）
- 构建平台和profile
- 构建日志（关键部分）
```

## 🎯 预防措施

### 定期维护
```bash
# 每月检查并更新依赖
npm update
npm audit fix

# 每季度更新EAS CLI
npm install -g eas-cli@latest

# 定期清理缓存
eas build --clear-cache
```

### 最佳实践
1. **版本锁定**: 在package.json中锁定关键依赖版本
2. **渐进式更新**: 一次只更新一个主要依赖
3. **备份配置**: 定期备份eas.json和app.json
4. **测试流程**: 建立标准的测试流程
5. **监控日志**: 定期查看构建日志

---

💡 **记住**: 大多数问题都有标准解决方案，保持耐心，逐步排查！