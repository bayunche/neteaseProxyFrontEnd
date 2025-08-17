# 📱 移动端打包实战指南

## 🚀 快速开始（5分钟上手）

### 前置条件
```bash
# 确保在移动端目录
cd packages/mobile

# 安装依赖（如果还没有）
npm install
```

### 第1步：登录EAS
```bash
# 登录Expo账号
eas login

# 验证登录状态
eas whoami
```

### 第2步：选择打包方式

#### 🎯 方式一：一键打包（推荐新手）
```bash
# 开发版本（内部测试，可在设备上直接安装）
npm run build:development

# 预览版本（给测试人员的版本）
npm run build:preview

# 生产版本（上传应用商店的版本）
npm run build:production
```

#### 🎯 方式二：使用智能脚本（推荐高级用户）
```bash
# 构建开发版本的Android APK
./scripts/build.sh development android

# 构建预览版本的iOS应用
./scripts/build.sh preview ios

# 构建生产版本的所有平台
./scripts/build.sh production all
```

#### 🎯 方式三：手动精确控制
```bash
# 只构建Android APK（可直接安装）
eas build --platform android --profile development

# 只构建iOS应用（需要Apple设备）
eas build --platform ios --profile production

# 同时构建两个平台
eas build --platform all --profile production
```

## 📱 各种构建类型说明

### Development（开发版本）
- **用途**: 开发人员内部测试
- **特点**: 
  - 包含调试信息
  - 连接本地API服务器
  - 可以直接安装到设备
  - 不需要应用商店审核

```bash
npm run build:development
```

### Preview（预览版本）
- **用途**: 内测人员测试
- **特点**:
  - 连接生产API服务器
  - 启用部分优化
  - 可通过二维码分发
  - 适合UAT测试

```bash
npm run build:preview
```

### Production（生产版本）
- **用途**: 发布到应用商店
- **特点**:
  - 完整代码优化和混淆
  - 最小化包体积
  - 生产环境配置
  - 符合应用商店要求

```bash
npm run build:production
```

## 🔍 构建过程详解

### 自动执行的步骤
1. **预构建共享包**: `npm run prebuild:shared`
2. **安装依赖**: 确保所有包都是最新的
3. **环境配置**: 根据profile设置环境变量
4. **原生代码生成**: Expo prebuild生成iOS/Android代码
5. **编译构建**: 使用Xcode/Gradle编译应用
6. **签名和打包**: 生成可安装的文件

### 构建产物
- **Android**: `.apk`文件（开发）或`.aab`文件（生产）
- **iOS**: `.ipa`文件

## ⏱️ 构建时间预估

| 构建类型 | Android | iOS | 备注 |
|----------|---------|-----|------|
| Development | 3-5分钟 | 5-8分钟 | 包含调试信息 |
| Preview | 5-8分钟 | 8-12分钟 | 部分优化 |
| Production | 8-15分钟 | 12-20分钟 | 完整优化 |

## 📥 安装构建产物

### 查看构建状态
```bash
# 查看最近的构建
eas build:list

# 查看特定构建详情
eas build:view [BUILD_ID]
```

### 安装到设备
```bash
# 安装最新的Android构建
eas build:run --platform android --latest

# 安装最新的iOS构建（需要iOS设备）
eas build:run --platform ios --latest

# 通过二维码安装
# 构建完成后，EAS会提供二维码链接
```

## 🔧 常用构建场景

### 场景1：本地开发测试
```bash
# 快速构建开发版本
npm run build:development
```

### 场景2：团队内测
```bash
# 构建预览版本并分享
./scripts/build.sh preview all
eas build:list  # 获取下载链接
```

### 场景3：准备发布
```bash
# 构建生产版本
./scripts/build.sh production all

# 可选：直接提交到应用商店
eas submit --platform all --profile production
```

## 🛠️ 故障排除

### 常见问题1：构建失败
```bash
# 清理缓存重试
npm run prebuild:clean
eas build --platform android --profile development --clear-cache
```

### 常见问题2：共享包问题
```bash
# 重新构建共享包
cd ../shared
npm run build
cd ../mobile
```

### 常见问题3：依赖问题
```bash
# 清理并重新安装
rm -rf node_modules
npm install
```

### 常见问题4：证书问题（iOS）
```bash
# 重新配置证书
eas credentials
```

## 📊 监控构建

### 实时查看构建日志
```bash
# 在浏览器中查看构建进度
eas build:list
# 点击构建ID查看详细日志
```

### 构建通知
- 构建开始/完成会收到邮件通知
- 可以在Expo Dashboard查看状态
- 支持Slack/Discord集成

## 🎉 成功标识

### 构建成功的标志
- ✅ 显示"Build completed"
- ✅ 提供下载链接或二维码
- ✅ 文件大小合理（通常10-50MB）

### 下一步
- 📱 安装到设备测试
- 🔍 功能验证
- 📤 分发给测试团队
- 🏪 提交应用商店（生产版本）

---

## 💡 小贴士

1. **首次构建较慢**: 需要下载依赖和配置环境
2. **增量构建更快**: 后续构建会复用缓存
3. **建议顺序**: development → preview → production
4. **保持网络稳定**: 构建过程需要上传代码到云端
5. **及时更新工具**: 定期更新EAS CLI和Expo CLI