#!/usr/bin/env node

/**
 * 统一构建脚本
 * 支持不同平台和构建模式
 */

import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 构建配置
const BUILD_CONFIGS = {
  'shared': {
    command: 'npm run build --workspace=packages/shared',
    description: '构建共享包'
  },
  'mobile': {
    command: 'npx expo export --platform all',
    description: '导出Mobile应用',
    cwd: 'packages/mobile',
    dependencies: ['shared']
  },
  'mobile:android': {
    command: 'eas build --platform android --profile production',
    description: '构建Android应用',
    cwd: 'packages/mobile',
    dependencies: ['shared']
  },
  'mobile:ios': {
    command: 'eas build --platform ios --profile production',
    description: '构建iOS应用',
    cwd: 'packages/mobile',
    dependencies: ['shared']
  },
  'mobile:preview': {
    command: 'eas build --platform all --profile preview',
    description: '构建Mobile预览版',
    cwd: 'packages/mobile',
    dependencies: ['shared']
  },
  'all': {
    description: '构建所有平台',
    dependencies: ['shared', 'mobile']
  }
};

// 解析命令行参数
const args = process.argv.slice(2);
const target = args[0] || 'all';
const isProduction = args.includes('--production') || process.env.NODE_ENV === 'production';
const skipDeps = args.includes('--skip-deps');

console.log(`🚀 开始构建: ${target}`);
console.log(`📦 环境: ${isProduction ? 'Production' : 'Development'}`);

/**
 * 执行命令
 */
function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    const child = exec(command, {
      cwd: options.cwd ? path.join(process.cwd(), options.cwd) : process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: isProduction ? 'production' : 'development',
        ...options.env
      }
    });

    child.stdout?.on('data', (data) => {
      process.stdout.write(data);
    });

    child.stderr?.on('data', (data) => {
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

/**
 * 构建依赖项
 */
async function buildDependencies(config) {
  if (skipDeps || !config.dependencies) {
    return;
  }

  console.log(`📋 构建依赖项: ${config.dependencies.join(', ')}`);
  
  for (const dep of config.dependencies) {
    if (dep === target) continue; // 避免循环依赖
    
    const depConfig = BUILD_CONFIGS[dep];
    if (depConfig && depConfig.command) {
      console.log(`⚙️  构建依赖: ${dep}`);
      await executeCommand(depConfig.command, {
        cwd: depConfig.cwd,
        env: depConfig.env
      });
    }
  }
}

/**
 * 构建特定目标
 */
async function buildTarget(targetName) {
  const config = BUILD_CONFIGS[targetName];
  
  if (!config) {
    throw new Error(`未知的构建目标: ${targetName}`);
  }

  console.log(`🔨 ${config.description}`);

  // 构建依赖项
  await buildDependencies(config);

  // 执行构建命令
  if (config.command) {
    await executeCommand(config.command, {
      cwd: config.cwd,
      env: config.env
    });
  }
}

/**
 * 生成构建报告
 */
function generateBuildReport() {
  const report = {
    timestamp: new Date().toISOString(),
    target,
    environment: isProduction ? 'production' : 'development',
    packages: {}
  };

  // 检查各包的构建产物
  const packages = ['shared', 'web'];
  
  for (const pkg of packages) {
    const distPath = path.join(process.cwd(), 'packages', pkg, 'dist');
    if (fs.existsSync(distPath)) {
      const stats = fs.statSync(distPath);
      report.packages[pkg] = {
        built: true,
        buildTime: stats.mtime,
        size: getDirectorySize(distPath)
      };
    } else {
      report.packages[pkg] = {
        built: false
      };
    }
  }

  // 保存报告
  const reportPath = path.join(process.cwd(), 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📊 构建报告已保存到: ${reportPath}`);
}

/**
 * 获取目录大小
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    try {
      const stats = fs.statSync(currentPath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        const files = fs.readdirSync(currentPath);
        files.forEach(file => {
          calculateSize(path.join(currentPath, file));
        });
      }
    } catch (error) {
      // 忽略权限错误等
    }
  }
  
  calculateSize(dirPath);
  return totalSize;
}

/**
 * 主函数
 */
async function main() {
  try {
    const startTime = Date.now();
    
    if (target === 'all') {
      // 依次构建所有目标
      await buildTarget('shared');
      await buildTarget('mobile');
    } else {
      await buildTarget(target);
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ 构建完成! 耗时: ${(duration / 1000).toFixed(2)}s`);
    
    // 生成构建报告
    generateBuildReport();
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
  }
}

// 运行构建
main();