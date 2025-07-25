# NetEase Music API 集成计划与接口文档

> **API 服务地址**: `http://8.134.196.44:8210`  
> **API 前缀**: `/api`  
> **创建时间**: 2025-07-23  
> **状态**: 测试完成，准备集成

## 🔍 API 测试结果

通过实际测试API服务，获得以下接口信息：

### ✅ 可用接口
| 接口 | 路径 | 状态 | 测试结果 |
|------|------|------|----------|
| **搜索接口** | `/api/search` | ✅ 可用 | 返回: "这里是搜索API" |
| **歌曲URL** | `/api/song/url` | ✅ 可用 | 返回JSON格式数据 |
| **API根路径** | `/api/` | ✅ 可用 | 返回: "这是API" |

### ❌ 需要调试的接口
| 接口 | 路径 | 状态 | 问题 |
|------|------|------|------|
| **歌曲详情** | `/api/song/detail` | ❌ 500错误 | 服务器内部错误 |
| **登录接口** | `/api/login/cellphone` | ❌ 404错误 | 路径不存在 |

## 📋 详细接口规范

### 1. 🔍 搜索接口

#### 基本信息
- **路径**: `/api/search`
- **方法**: GET / POST
- **状态**: ✅ 已确认可用

#### 参数规范
```javascript
// GET 请求
GET /api/search?keywords=周杰伦&type=1&limit=10&offset=0

// POST 请求
POST /api/search
Content-Type: application/json
{
  "keywords": "周杰伦",     // 搜索关键词
  "type": 1,               // 搜索类型: 1=歌曲, 10=专辑, 100=艺术家, 1000=歌单
  "limit": 10,             // 返回数量限制 (默认30)
  "offset": 0              // 偏移量，用于分页
}
```

#### 集成计划
- [x] **API测试** - 确认接口可用
- [ ] **前端集成** - 集成到SearchBar组件
- [ ] **数据格式化** - 处理搜索结果数据结构
- [ ] **错误处理** - 添加网络异常处理
- [ ] **缓存机制** - 实现搜索结果缓存

---

### 2. 🎵 歌曲播放URL接口

#### 基本信息
- **路径**: `/api/song/url`
- **方法**: GET
- **状态**: ✅ 已确认可用

#### 参数规范
```javascript
GET /api/song/url?id=25643859&br=320000
```

#### 参数说明
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 歌曲ID |
| `br` | number | ❌ | 音质码率: 128000/192000/320000/999000 |

#### 响应示例
```json
{
  "data": [{
    "id": 25643859,
    "url": null,
    "br": 0,
    "code": 404,
    "message": null
  }],
  "code": 200
}
```

#### 集成计划
- [x] **API测试** - 确认接口可用
- [ ] **AudioService集成** - 集成到音频播放服务
- [ ] **音质选择** - 实现不同音质选择
- [ ] **URL验证** - 检查播放链接有效性
- [ ] **错误处理** - 处理歌曲不可用情况

---

### 3. 📱 登录接口 (需要调试)

#### 基本信息
- **路径**: `/api/login/cellphone` (待确认)
- **方法**: POST
- **状态**: ❌ 需要调试路径

#### 预期参数规范
```javascript
POST /api/login/cellphone
Content-Type: application/json
{
  "phone": "手机号",
  "password": "密码"
}
```

#### 集成计划
- [ ] **路径确认** - 与后端确认正确的登录路径
- [ ] **参数测试** - 测试登录参数和响应格式
- [ ] **状态管理** - 集成到用户状态管理
- [ ] **Token处理** - 实现登录token存储和使用
- [ ] **错误处理** - 处理登录失败情况

---

### 4. 🎧 歌曲详情接口 (需要调试)

#### 基本信息
- **路径**: `/api/song/detail`
- **方法**: GET
- **状态**: ❌ 500错误，需要调试

#### 预期参数规范
```javascript
GET /api/song/detail?ids=25643859,28391863
```

#### 集成计划
- [ ] **错误调试** - 解决500服务器错误
- [ ] **参数格式** - 确认ids参数的正确格式
- [ ] **数据结构** - 确认响应数据结构
- [ ] **组件集成** - 集成到SongCard组件
- [ ] **缓存机制** - 实现歌曲信息缓存

## 🚀 整体集成实施计划

### 第一阶段: API服务层搭建 (1-2天)

#### 1.1 创建API服务架构
```
src/services/api/
├── index.ts              # API服务入口
├── NetEaseAPI.ts         # NetEase API核心类
├── types.ts              # API请求/响应类型定义
├── config.ts             # API配置和常量
└── utils.ts              # API工具函数
```

#### 1.2 实现基础API类
- [ ] **NetEaseAPI核心类**
  - HTTP请求封装
  - 错误处理机制
  - 请求拦截器
  - 响应拦截器
- [ ] **类型定义**
  - 搜索请求/响应类型
  - 歌曲信息类型
  - 用户登录类型
  - 错误响应类型

### 第二阶段: 搜索功能集成 (1-2天)

#### 2.1 搜索接口集成
- [ ] **SearchAPI类实现**
  ```typescript
  class SearchAPI {
    static async search(keywords: string, type: SearchType): Promise<SearchResult>
    static async searchSongs(keywords: string): Promise<Song[]>
    static async searchAlbums(keywords: string): Promise<Album[]>
  }
  ```

#### 2.2 前端组件集成
- [ ] **SearchBar组件改造** (`src/components/search/SearchBar.tsx`)
  - 真实API调用
  - 加载状态显示
  - 防抖搜索优化
- [ ] **SearchResults组件改造** (`src/components/search/SearchResults.tsx`)
  - 真实数据展示
  - 分页功能
  - 搜索结果缓存

### 第三阶段: 播放功能集成 (2-3天)

#### 3.1 歌曲URL接口集成
- [ ] **SongAPI类实现**
  ```typescript
  class SongAPI {
    static async getSongUrl(id: number, br?: number): Promise<string>
    static async getSongDetail(ids: number[]): Promise<Song[]>
  }
  ```

#### 3.2 AudioService集成
- [ ] **网络音频支持** (`src/services/audio/AudioService.ts`)
  - API音频URL获取
  - 音质选择功能
  - 播放失败降级处理
- [ ] **播放器组件集成**
  - SongCard组件API数据支持
  - PlayerBar组件网络音频播放

### 第四阶段: 登录功能集成 (1-2天)

#### 4.1 登录接口调试和集成
- [ ] **与后端协调** - 确认登录接口路径和参数
- [ ] **AuthAPI类实现**
  ```typescript
  class AuthAPI {
    static async login(phone: string, password: string): Promise<LoginResult>
    static async logout(): Promise<void>
    static async getUserInfo(): Promise<UserInfo>
  }
  ```

#### 4.2 用户状态管理
- [ ] **登录状态集成** - 更新Zustand store
- [ ] **Token管理** - 实现token存储和自动刷新
- [ ] **登录UI** - 创建登录组件和流程

## 🛠️ 技术实现细节

### API请求封装示例
```typescript
// src/services/api/NetEaseAPI.ts
class NetEaseAPI {
  private static baseURL = 'http://8.134.196.44:8210/api';
  
  static async request<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const response = await fetch(url, {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: options?.body ? JSON.stringify(options.body) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
}
```

### 错误处理策略
```typescript
// API错误处理
enum APIErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR', 
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

class APIError extends Error {
  constructor(
    public type: APIErrorType,
    public message: string,
    public code?: number
  ) {
    super(message);
  }
}
```

## 📊 进度跟踪

| 功能模块 | 接口状态 | 集成状态 | 预计完成时间 | 负责人 |
|----------|----------|----------|-------------|-------|
| **搜索功能** | ✅ API可用 | ⏳ 待开始 | 2天 | 开发者 |
| **播放功能** | ✅ API可用 | ⏳ 待开始 | 3天 | 开发者 |
| **歌曲详情** | ❌ 需调试 | ⏳ 待调试 | 1天 | 后端+前端 |
| **登录功能** | ❌ 需调试 | ⏳ 待调试 | 2天 | 后端+前端 |

## ⚠️ 风险和注意事项

### 技术风险
1. **接口稳定性** - 部分接口存在500/404错误，需要后端调试
2. **数据完整性** - 歌曲URL可能返回null，需要降级处理
3. **网络延迟** - API响应时间可能影响用户体验
4. **版权限制** - 某些歌曲可能无法播放

### 解决方案
1. **降级机制** - API失败时使用mock数据
2. **缓存策略** - 减少API调用频率
3. **错误反馈** - 用户友好的错误提示
4. **性能监控** - API调用性能跟踪

## 🎯 成功标准

### 功能完成标准
- [x] API服务连通性测试通过
- [ ] 搜索功能完全可用
- [ ] 音频播放支持网络歌曲
- [ ] 用户登录流程完整
- [ ] 错误处理机制完善

### 性能标准
- 搜索响应时间 < 2秒
- 音频加载时间 < 3秒
- API错误率 < 5%
- 缓存命中率 > 80%

---

**最后更新**: 2025-07-23  
**下一步**: 开始API服务层架构搭建