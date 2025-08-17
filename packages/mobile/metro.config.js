const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo配置
config.watchFolders = [monorepoRoot];

// 修正nodeModulesPath为正确的属性名
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 解析shared包
config.resolver.alias = {
  '@music-player/shared': path.resolve(monorepoRoot, 'packages/shared/src'),
};

// 添加平台特定的文件扩展名
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 支持更多文件类型
config.resolver.assetExts.push(
  // 音频文件
  'mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac',
  // 字体文件
  'ttf', 'otf', 'woff', 'woff2',
  // 其他资源
  'json', 'txt'
);

// 添加对TypeScript和JavaScript文件的支持
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// 排除不需要的文件
config.resolver.blockList = [
  // 排除 web 端的构建产物
  /packages\/web\/dist\/.*/,
  // 排除 node_modules 中的某些文件
  /node_modules\/.*\/Pods\/.*/,
];

// 启用 Hermes 转换器优化
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// 缓存配置优化
config.cacheStores = [
  {
    name: 'FileStore',
    options: {
      cacheDirectory: path.resolve(projectRoot, '.metro-cache'),
    },
  },
];

module.exports = config;