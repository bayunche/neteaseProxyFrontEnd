# Expo自动打包配置指南

## 🚀 快速配置步骤

### 1. 获取Expo Token

#### 步骤一：登录Expo
访问 [expo.dev](https://expo.dev) 并登录你的账号

#### 步骤二：创建Access Token
1. 点击右上角头像 → "Account Settings"
2. 左侧菜单选择 "Access Tokens"
3. 点击 "Create Token"
4. 填写信息：
   - Name: `music-player-ci-cd`
   - Scope: 选择 "Full access" 或根据需要选择特定权限
5. **重要**：立即复制token（只显示一次！）

### 2. 配置GitHub Secrets

1. 打开GitHub仓库
2. Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. 添加：
   - **Name**: `EXPO_TOKEN`
   - **Value**: 粘贴你的Expo token

### 3. 初始化EAS项目

在项目根目录运行：

```bash
# 进入移动端目录
cd packages/mobile

# 登录EAS（如果还没有）
eas login

# 初始化EAS配置（如果还没有）
eas build:configure

# 获取项目ID
eas project:info
```

### 4. 更新项目配置

将获取的项目ID更新到 `packages/mobile/app.json`：

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "你的真实项目ID"
      }
    }
  }
}
```

### 5. 配置应用商店凭据（可选）

#### Google Play Store配置

1. 创建服务账号密钥：
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 创建服务账号
   - 下载JSON密钥文件
   - 重命名为 `google-play-service-account.json`
   - 放在 `packages/mobile/` 目录下

2. 更新 `eas.json` 中的配置：
   ```json
   "android": {
     "serviceAccountKeyPath": "./google-play-service-account.json",
     "track": "internal"
   }
   ```

#### iOS App Store配置

更新 `eas.json` 中的iOS配置：
```json
"ios": {
  "appleId": "你的Apple ID",
  "ascAppId": "App Store Connect中的应用ID",
  "appleTeamId": "你的开发者团队ID"
}
```

## 🔧 测试配置

### 本地测试

```bash
# 测试EAS连接
eas whoami

# 测试构建配置
eas build --platform android --profile preview --dry-run

# 实际构建测试
eas build --platform android --profile development
```

### CI/CD测试

创建测试提交来触发自动构建：

```bash
# 创建测试分支
git checkout -b test-ci-cd

# 修改任意移动端文件
echo "// Test CI/CD" >> packages/mobile/App.tsx

# 提交并推送
git add .
git commit -m "test: CI/CD configuration"
git push origin test-ci-cd

# 创建PR查看自动构建
```

## 📱 构建配置说明

### 构建Profile说明

| Profile | 用途 | 触发条件 | 输出格式 |
|---------|------|----------|----------|
| `development` | 开发测试 | Pull Request | APK (Android) |
| `preview` | 内部测试 | Push to main | APK/IPA |
| `production` | 正式发布 | Release tag | AAB/IPA |

### 自动触发规则

```yaml
# 开发构建
on:
  pull_request:
    paths: ['packages/mobile/**', 'packages/shared/**']

# 预览构建  
on:
  push:
    branches: [main, master]
    paths: ['packages/mobile/**', 'packages/shared/**']

# 生产构建
on:
  push:
    tags: ['v*']
  # 或包含 [release] 的提交消息
```

## 🔍 故障排除

### 常见问题

1. **Token权限不足**
   ```
   Error: Authentication failed
   ```
   解决：检查token权限，重新创建完整权限的token

2. **项目ID不匹配**
   ```
   Error: Project not found
   ```
   解决：运行 `eas project:info` 获取正确的项目ID

3. **构建配置错误**
   ```
   Error: Invalid build configuration
   ```
   解决：检查 `eas.json` 和 `app.json` 配置格式

### 调试命令

```bash
# 查看项目信息
eas project:info

# 查看构建历史
eas build:list

# 查看构建日志
eas build:view [BUILD_ID]

# 查看更新历史
eas update:list
```

## 📦 完整的CI/CD工作流

配置完成后，你的工作流将是：

1. **开发** → 创建PR → 自动触发development构建
2. **测试** → PR合并到main → 自动触发preview构建  
3. **发布** → 打tag或提交包含[release] → 自动触发production构建并提交应用商店
4. **更新** → 推送到main → 自动发布OTA更新

## 🔗 相关链接

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)