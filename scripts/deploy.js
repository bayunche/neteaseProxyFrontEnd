#!/usr/bin/env node

/**
 * 统一部署脚本
 * 支持不同环境和平台的部署
 */

import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 部署配置
const DEPLOY_CONFIGS = {
  'mobile:eas': {
    command: 'eas update --auto',
    description: '发布Mobile应用OTA更新',
    cwd: 'packages/mobile',
    env: 'production'
  },
  'mobile:build:android': {
    command: 'eas build --platform android --profile production',
    description: '构建Android应用',
    cwd: 'packages/mobile',
    env: 'production'
  },
  'mobile:build:ios': {
    command: 'eas build --platform ios --profile production',
    description: '构建iOS应用',
    cwd: 'packages/mobile',
    env: 'production'
  },
  'mobile:build:preview': {
    command: 'eas build --platform all --profile preview',
    description: '构建Mobile预览版',
    cwd: 'packages/mobile',
    env: 'preview'
  },
  'mobile:submit:android': {
    command: 'eas submit --platform android --profile production',
    description: '提交Android应用到Google Play',
    cwd: 'packages/mobile',
    env: 'production'
  },
  'mobile:submit:ios': {
    command: 'eas submit --platform ios --profile production',
    description: '提交iOS应用到App Store',
    cwd: 'packages/mobile',
    env: 'production'
  }
};

// 解析命令行参数
const args = process.argv.slice(2);
const target = args[0];
const isDryRun = args.includes('--dry-run');

if (!target || !DEPLOY_CONFIGS[target]) {
  console.log('❌ 请指定有效的部署目标:');
  Object.keys(DEPLOY_CONFIGS).forEach(key => {
    console.log(`  • ${key}: ${DEPLOY_CONFIGS[key].description}`);
  });
  process.exit(1);
}

/**
 * 执行命令
 */
function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 执行: ${command}`);
    
    if (isDryRun) {
      console.log('🏃‍♂️ Dry run模式，跳过实际执行');
      resolve();
      return;
    }

    const child = exec(command, {
      cwd: options.cwd ? path.join(process.cwd(), options.cwd) : process.cwd(),
      env: {
        ...process.env,
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
 * 检查部署前置条件
 */
async function checkPrerequisites(config) {
  console.log('🔍 检查部署前置条件...');

  // 检查Mobile应用配置
  if (target.includes('mobile')) {
    const appJsonPath = path.join(process.cwd(), 'packages/mobile/app.json');
    if (!fs.existsSync(appJsonPath)) {
      throw new Error('Mobile应用配置文件缺失: packages/mobile/app.json');
    }
    
    const easJsonPath = path.join(process.cwd(), 'packages/mobile/eas.json');
    if (!fs.existsSync(easJsonPath)) {
      throw new Error('EAS配置文件缺失: packages/mobile/eas.json');
    }
  }

  // 检查环境变量
  const requiredEnvVars = [];
  
  if (target.includes('mobile')) {
    requiredEnvVars.push('EXPO_TOKEN');
  }

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    console.warn(`⚠️  缺少环境变量: ${missingEnvVars.join(', ')}`);
    console.warn('请在.env文件或GitHub Secrets中设置这些变量');
  }

  // 检查工具依赖
  const requiredTools = [];
  
  if (target.includes('mobile')) {
    requiredTools.push('@expo/cli');
    requiredTools.push('eas-cli');
  }

  for (const tool of requiredTools) {
    try {
      await executeCommand(`${tool} --version`);
    } catch (error) {
      throw new Error(`缺少工具: ${tool}，请先安装: npm install -g ${tool}`);
    }
  }
}

/**
 * 执行部署
 */
async function deploy() {
  const config = DEPLOY_CONFIGS[target];
  
  console.log(`🚀 开始部署: ${config.description}`);
  console.log(`📦 环境: ${config.env}`);
  
  if (isDryRun) {
    console.log('🏃‍♂️ Dry run模式');
  }

  try {
    // 检查前置条件
    await checkPrerequisites(config);

    // 执行部署命令
    await executeCommand(config.command, {
      cwd: config.cwd,
      env: config.env
    });

    console.log('✅ 部署成功!');
    
    // 生成部署报告
    generateDeploymentReport(config);
    
  } catch (error) {
    console.error('❌ 部署失败:', error.message);
    process.exit(1);
  }
}

/**
 * 生成部署报告
 */
function generateDeploymentReport(config) {
  const report = {
    timestamp: new Date().toISOString(),
    target,
    environment: config.env,
    description: config.description,
    success: true,
    dryRun: isDryRun
  };

  const reportPath = path.join(process.cwd(), 'deployment-report.json');
  
  // 读取现有报告
  let reports = [];
  if (fs.existsSync(reportPath)) {
    try {
      reports = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    } catch (error) {
      console.warn('无法读取现有部署报告');
    }
  }

  // 添加新报告
  reports.push(report);
  
  // 只保留最近10次部署记录
  if (reports.length > 10) {
    reports = reports.slice(-10);
  }

  fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2));
  console.log(`📊 部署报告已保存到: ${reportPath}`);
}

// 运行部署
deploy();