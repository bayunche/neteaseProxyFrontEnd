const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo配置
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPath = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 解析shared包
config.resolver.alias = {
  '@music-player/shared': path.resolve(monorepoRoot, 'packages/shared/src'),
};

// 添加对TypeScript和JavaScript文件的支持
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

module.exports = config;