#!/usr/bin/env node

/**
 * 代理服务器日志测试脚本
 * 用于测试和验证详细日志输出功能
 */

import http from 'http';

// 测试URL配置
const TEST_URLS = {
  // 可用的测试图片
  validImage: 'https://via.placeholder.com/300x300/FF0000/FFFFFF?text=Test',
  
  // 不存在的图片（会触发404）
  invalidImage: 'https://p1.music.126.net/nonexistent/image.jpg',
  
  // 可用的测试音频
  validAudio: 'https://www.w3schools.com/html/horse.mp3',
  
  // 不存在的音频（会触发404）
  invalidAudio: 'https://example.com/nonexistent.mp3'
};

const PROXY_SERVER = 'http://localhost:3001';

/**
 * 发送测试请求
 */
function sendTestRequest(type, url, description) {
  const endpoint = type === 'image' ? '/image-proxy' : '/audio-proxy';
  const testUrl = `${PROXY_SERVER}${endpoint}?url=${encodeURIComponent(url)}`;
  
  console.log(`\n🧪 测试 [${description}]`);
  console.log(`📋 类型: ${type}`);
  console.log(`🔗 测试URL: ${testUrl}`);
  console.log(`⏱️  开始时间: ${new Date().toISOString()}`);
  console.log(`────────────────────────────────────────────────────────────────`);
  
  const req = http.get(testUrl, (res) => {
    console.log(`✅ 响应状态: ${res.statusCode}`);
    console.log(`📦 内容类型: ${res.headers['content-type']}`);
    console.log(`📏 内容长度: ${res.headers['content-length'] || 'unknown'}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode >= 400) {
        try {
          const errorData = JSON.parse(data);
          console.log(`❌ 错误信息:`, errorData);
        } catch (e) {
          console.log(`❌ 错误响应:`, data.substring(0, 200));
        }
      } else {
        console.log(`📊 响应大小: ${data.length} bytes`);
      }
      console.log(`⏱️  完成时间: ${new Date().toISOString()}\n`);
    });
  });
  
  req.on('error', (err) => {
    console.error(`❌ 请求错误:`, err.message);
  });
  
  req.setTimeout(10000, () => {
    console.error(`⏰ 请求超时`);
    req.destroy();
  });
}

/**
 * 测试健康检查
 */
function testHealthCheck() {
  console.log(`\n💚 测试健康检查`);
  console.log(`🔗 URL: ${PROXY_SERVER}/health`);
  
  const req = http.get(`${PROXY_SERVER}/health`, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const healthData = JSON.parse(data);
        console.log(`✅ 健康检查成功:`, healthData);
      } catch (e) {
        console.log(`❌ 健康检查失败:`, data);
      }
    });
  });
  
  req.on('error', (err) => {
    console.error(`❌ 健康检查错误:`, err.message);
    console.log(`🔧 请确保代理服务器正在运行在端口3001`);
  });
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log(`🎯 ========== 代理服务器日志测试开始 ==========`);
  console.log(`📅 测试时间: ${new Date().toISOString()}`);
  console.log(`🎯 代理服务器: ${PROXY_SERVER}`);
  console.log(`📝 这个测试将验证详细日志输出功能`);
  console.log(`==================================================`);
  
  // 先测试健康检查
  testHealthCheck();
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 测试有效图片代理
  sendTestRequest('image', TEST_URLS.validImage, '有效图片代理测试');
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 测试无效图片代理（会触发404）
  sendTestRequest('image', TEST_URLS.invalidImage, '无效图片代理测试（404错误）');
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 测试有效音频代理
  sendTestRequest('audio', TEST_URLS.validAudio, '有效音频代理测试');
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 测试无效音频代理
  sendTestRequest('audio', TEST_URLS.invalidAudio, '无效音频代理测试（连接错误）');
  
  console.log(`\n🎉 所有测试已发送，请查看代理服务器的详细日志输出！`);
  console.log(`📋 检查以下内容:`);
  console.log(`   1. 请求信息是否详细打印`);
  console.log(`   2. 响应信息是否完整显示`);
  console.log(`   3. 错误信息是否清晰易懂`);
  console.log(`   4. 日志格式是否易于阅读`);
}

// 运行测试
runTests().catch(console.error);