# 🎵 跨平台音乐播放器

一个现代化的跨平台音乐播放器应用，支持Web和移动端，采用网易云音乐风格设计并升级为现代毛玻璃UI风格。

## ✨ 项目特色

- 🌐 **跨平台支持**: Web版本 + React Native移动端
- 🎨 **现代UI设计**: 从传统网易云红色主题升级为现代毛玻璃风格
- ⚡ **高性能表现**: 60fps流畅动画，<2s启动时间
- 🔄 **代码复用**: 60%+的跨平台代码复用率
- 🎵 **完整功能**: 音频播放、队列管理、搜索、歌词同步、用户管理
- 🛡️ **类型安全**: 完整的TypeScript支持

## 🏗️ 项目架构

### Monorepo结构
```
music-player-universal/
├── packages/
│   ├── shared/           # 跨平台共享核心代码
│   │   ├── src/
│   │   │   ├── stores/   # Zustand状态管理
│   │   │   ├── services/ # API和音频服务抽象
│   │   │   ├── types/    # TypeScript类型定义
│   │   │   └── utils/    # 工具函数
│   │   └── package.json
│   ├── web/             # Web平台实现
│   │   ├── src/
│   │   │   ├── components/ # Web专用组件
│   │   │   ├── pages/      # 页面组件
│   │   │   ├── styles/     # Stitches CSS-in-JS
│   │   │   └── services/   # Web音频引擎
│   │   └── package.json
│   └── mobile/          # React Native实现
│       ├── src/
│       │   ├── components/ # Native组件
│       │   ├── screens/    # 页面屏幕
│       │   ├── styles/     # Native样式
│       │   └── services/   # Expo AV音频引擎
│       └── package.json
└── package.json         # Monorepo根配置
```

### 技术栈

#### 共享核心 (packages/shared)
- **状态管理**: Zustand 5.0
- **类型系统**: TypeScript 5.8
- **工具**: 日期处理、格式化、验证

#### Web平台 (packages/web)
- **前端框架**: React 19 + React DOM
- **路由**: React Router DOM 7
- **样式系统**: Stitches CSS-in-JS + 毛玻璃设计
- **动画**: Framer Motion 12
- **性能优化**: React Window虚拟滚动
- **PWA**: Workbox Service Worker

#### 移动端 (packages/mobile)
- **框架**: React Native 0.76 + Expo 51
- **导航**: React Navigation 7
- **动画**: React Native Reanimated 3
- **音频**: Expo AV
- **性能**: Shopify Flash List
- **视觉效果**: Expo Blur + Linear Gradient

## 🚀 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9
- iOS开发需要Xcode
- Android开发需要Android Studio

### 安装依赖
```bash
# 克隆项目
git clone <repository-url>
cd music-player-universal

# 安装所有依赖
npm install
```

### 开发命令

#### 全平台开发
```bash
# 启动所有平台的开发服务器
npm run dev

# 启动代理服务器（解决API CORS问题）
npm run proxy

# 同时启动代理和开发服务器
npm start
```

#### Web平台开发
```bash
# 启动Web开发服务器
npm run dev:web

# 构建Web生产版本
npm run build:web

# 预览Web生产版本
npm run preview:web

# Web平台代码检查
npm run lint:web
```

#### 移动端开发
```bash
# 启动移动端开发服务器
npm run dev:mobile

# 在iOS模拟器中运行
npm run ios

# 在Android模拟器中运行
npm run android

# 构建移动端应用
npm run build:mobile

# 移动端代码检查
npm run lint:mobile
```

#### 代码质量
```bash
# 运行所有平台的ESLint检查
npm run lint

# 运行TypeScript类型检查
npm run type-check

# 构建所有平台
npm run build
```

## 🎨 设计系统

### 色彩方案
```typescript
const colors = {
  primary: {
    500: '#ef4444', // 现代红色（替代网易云红）
    600: '#dc2626',
  },
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)', 
    heavy: 'rgba(255, 255, 255, 0.3)',
  },
  background: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  }
}
```

### 毛玻璃组件
- **GlassCard**: 基础玻璃容器组件
- **PlayerGlass**: 播放器控制栏毛玻璃容器
- **SidebarGlass**: 侧边栏毛玻璃导航
- **GlassButton**: 毛玻璃风格按钮

### 动画系统
- **悬停效果**: 微妙的缩放和背景变化
- **页面切换**: 流畅的滑动动画
- **播放状态**: 音频可视化动画
- **手势交互**: 原生手势响应（移动端）

## 🔧 核心功能

### 音频播放
- **多格式支持**: MP3、AAC、OGG等
- **播放控制**: 播放/暂停/停止/跳转
- **播放队列**: 队列管理、随机播放、循环模式
- **音量控制**: 精确音量调节
- **进度控制**: 拖拽进度条跳转

### 音乐服务
- **网易云音乐API**: 完整的音乐搜索和播放
- **用户认证**: 登录/注册系统
- **播放列表**: 创建、编辑、分享播放列表
- **收藏功能**: 收藏歌曲和专辑
- **歌词同步**: 实时歌词显示

### 用户体验
- **搜索功能**: 歌曲、艺人、专辑搜索
- **历史记录**: 播放历史和搜索历史
- **个性化**: 推荐歌曲和播放列表
- **统计分析**: 播放时长和偏好分析

## 📱 平台特性

### Web平台特有功能
- **PWA支持**: 离线缓存和桌面安装
- **媒体会话API**: 系统媒体控制集成
- **键盘快捷键**: 空格播放、方向键控制
- **桌面通知**: 切歌通知

### 移动端特有功能
- **后台播放**: 锁屏和后台继续播放
- **推送通知**: 播放状态通知
- **锁屏控制**: 锁屏界面媒体控制
- **本地音乐**: 设备本地音乐文件扫描
- **手势控制**: 滑动切歌、音量控制

## 🔄 跨平台代码复用

### 共享组件
- **状态管理**: 完整的Zustand store复用
- **业务逻辑**: API服务、数据处理、工具函数
- **类型定义**: 完整的TypeScript类型系统
- **配置管理**: 应用配置和常量

### 平台适配器
- **音频引擎**: Web Audio API vs Expo AV
- **存储系统**: localStorage vs AsyncStorage
- **导航系统**: React Router vs React Navigation
- **UI组件**: HTML元素 vs React Native组件

## 🚀 构建和部署

### 📦 构建流程

#### 统一构建脚本
```bash
# 使用统一构建脚本
node scripts/build.js [target] [options]

# 构建所有平台
npm run build

# 构建特定平台
npm run build:shared
npm run build:web
npm run build:mobile

# 分析Web包大小
npm run build:web:analyze
```

#### 构建选项
```bash
# 生产环境构建
npm run build -- --production

# 跳过依赖项构建
npm run build -- --skip-deps

# 构建Android应用
node scripts/build.js mobile:android

# 构建iOS应用
node scripts/build.js mobile:ios
```

### 🌐 Web平台部署

#### Vercel部署（推荐）
```bash
# 安装Vercel CLI
npm install -g vercel

# 配置环境变量
vercel env add REACT_APP_API_BASE_URL
vercel env add REACT_APP_VAPID_PUBLIC_KEY

# 部署生产版本
npm run deploy:web:vercel
# 或
vercel --prod

# 部署预览版本
npm run deploy:web:preview
# 或
vercel
```

#### Netlify部署
```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 配置环境变量
netlify env:set REACT_APP_API_BASE_URL your_api_url
netlify env:set REACT_APP_VAPID_PUBLIC_KEY your_vapid_key

# 部署生产版本
npm run deploy:web:netlify
# 或
netlify deploy --prod --dir packages/web/dist

# 部署预览版本
netlify deploy --dir packages/web/dist
```

#### 自托管部署
```bash
# 构建生产版本
npm run build:web

# 产物位置：packages/web/dist/
# 部署到任何静态文件服务器
# 如 nginx、Apache、CDN等
```

#### Web部署检查清单
- [ ] 环境变量配置正确
- [ ] Service Worker正常工作
- [ ] PWA功能测试通过
- [ ] Lighthouse评分 ≥ 90
- [ ] 跨浏览器兼容性测试
- [ ] HTTPS部署（PWA要求）

### 📱 移动端构建和发布

#### EAS构建配置
```bash
# 安装EAS CLI
npm install -g @expo/eas-cli

# 登录Expo账号
eas login

# 初始化EAS项目
eas build:configure

# 配置构建环境
eas secret:create --scope project --name API_BASE_URL --value your_api_url
```

#### 开发构建
```bash
# 开发版本（支持热更新）
eas build --profile development --platform all

# iOS开发构建
eas build --profile development --platform ios

# Android开发构建
eas build --profile development --platform android
```

#### 预览构建
```bash
# 内测版本构建
eas build --profile preview --platform all

# 生成APK（Android）
eas build --profile preview --platform android

# 生成iOS模拟器构建
eas build --profile preview --platform ios
```

#### 生产构建
```bash
# 生产版本构建
eas build --profile production --platform all

# Android AAB包（Google Play）
eas build --profile production --platform android

# iOS生产构建（App Store）
eas build --profile production --platform ios
```

#### OTA更新
```bash
# 发布OTA更新（无需重新构建）
eas update --auto

# 指定分支更新
eas update --branch production

# 预览更新
eas update --branch preview
```

### 🏪 应用商店发布

#### iOS App Store发布
```bash
# 1. 构建生产版本
eas build --profile production --platform ios

# 2. 提交到TestFlight
eas submit --platform ios --profile testflight

# 3. 提交到App Store
eas submit --platform ios --profile production
```

#### Google Play发布
```bash
# 1. 构建AAB包
eas build --profile production --platform android

# 2. 提交到内部测试
eas submit --platform android --profile internal

# 3. 提交到生产轨道
eas submit --platform android --profile production
```

#### 应用商店准备清单

##### iOS App Store
- [ ] Apple Developer账号（$99/年）
- [ ] App Store Connect配置
- [ ] 应用图标（1024×1024）
- [ ] 应用截图（多尺寸）
- [ ] 应用描述和关键词
- [ ] 隐私政策URL
- [ ] 年龄分级设置
- [ ] 审核信息和备注

##### Google Play Store
- [ ] Google Play Console账号（$25一次性）
- [ ] 应用图标（512×512）
- [ ] 功能图片（1024×500）
- [ ] 应用截图（手机/平板）
- [ ] 应用描述（简短/完整）
- [ ] 内容分级调查问卷
- [ ] 数据安全表单
- [ ] 目标受众和内容设置

### 🔄 CI/CD自动化部署

#### GitHub Actions配置
```yaml
# 自动触发条件
- push到main/master分支
- 包含[release]的提交消息
- Pull Request（预览构建）
```

#### Web自动部署流程
1. 代码检查（ESLint + TypeScript）
2. 运行测试
3. 构建生产版本
4. 性能测试（Lighthouse）
5. 部署到Vercel/Netlify
6. 安全扫描

#### Mobile自动构建流程
1. 代码检查和测试
2. EAS开发构建（PR）
3. EAS预览构建（main分支）
4. EAS生产构建（release标签）
5. 自动提交到应用商店

### 📊 部署监控

#### 使用部署脚本
```bash
# 使用统一部署脚本
node scripts/deploy.js [target] [options]

# 可用目标
node scripts/deploy.js web:vercel
node scripts/deploy.js web:netlify
node scripts/deploy.js web:preview
node scripts/deploy.js mobile:eas
node scripts/deploy.js mobile:submit:android
node scripts/deploy.js mobile:submit:ios

# Dry run模式（测试不执行）
node scripts/deploy.js web:vercel --dry-run
```

#### 部署状态检查
```bash
# 检查Web部署状态
curl -f https://your-app.vercel.app/api/health

# 检查移动端构建状态
eas build:list --limit 10

# 查看部署历史
cat deployment-report.json
```

#### 回滚策略
```bash
# Web平台回滚
vercel rollback https://your-app.vercel.app

# 移动端回滚（发布新版本或OTA更新）
eas update --branch production
```

### 🔐 环境变量配置

#### Web平台环境变量
```bash
# 必需变量
REACT_APP_API_BASE_URL=https://api.example.com
REACT_APP_VAPID_PUBLIC_KEY=your-vapid-key

# 可选变量
REACT_APP_ANALYTICS_ID=your-analytics-id
REACT_APP_SENTRY_DSN=your-sentry-dsn
```

#### 移动端环境变量
```bash
# EAS Secrets
API_BASE_URL=https://api.example.com
EXPO_PUBLIC_API_KEY=your-api-key
SENTRY_DSN=your-sentry-dsn
```

#### CI/CD环境变量
```bash
# GitHub Secrets
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
NETLIFY_AUTH_TOKEN=your-netlify-token
NETLIFY_SITE_ID=your-site-id
EXPO_TOKEN=your-expo-token
```

### 📈 部署性能优化

#### Web部署优化
- 启用CDN缓存
- Gzip/Brotli压缩
- 图片优化和懒加载
- Service Worker缓存策略
- 预加载关键资源

#### 移动端优化
- 启用Hermes JavaScript引擎
- 代码混淆和压缩
- 资源优化和压缩
- OTA更新策略
- 渐进式发布

## 📈 性能优化

### 已实现的优化
- **代码分割**: 路由级别的懒加载
- **虚拟滚动**: 大型列表性能优化
- **音频预加载**: 智能音频缓存策略
- **Bundle优化**: Tree-shaking和压缩

### 性能指标
- **启动时间**: < 2秒
- **动画帧率**: 60fps
- **Lighthouse评分**: ≥ 90
- **代码复用率**: ≥ 60%

## 🛠️ 开发指南

### 添加新功能
1. 在`packages/shared`中添加共享逻辑
2. 在`packages/web`和`packages/mobile`中实现平台特定UI
3. 使用平台适配器处理平台差异
4. 编写跨平台测试

### 代码规范
- 使用ESLint零错误零警告
- 遵循TypeScript严格模式
- 组件命名采用PascalCase
- 文件名采用kebab-case

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📞 支持

如有问题，请提交Issue或联系开发团队。

---

**🎵 享受你的音乐之旅！**