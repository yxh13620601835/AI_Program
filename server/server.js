require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// 静态文件服务配置
app.use(express.static('public'));

// 根路由处理
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// 检查当前运行环境
const isVercelEnvironment = process.env.VERCEL === '1';
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// 检查环境变量
const checkEnvVariables = () => {
  const missingVars = [];
  const requiredEnvVars = ['DEEPSEEK_API_KEY', 'DEEPSEEK_API_URL'];
  const timestamp = new Date().toISOString();
  
  console.log('----------------------------------------');
  console.log(`[${timestamp}] 环境检查开始`);
  console.log(`运行环境: ${isVercelEnvironment ? 'Vercel' : '本地开发'}`);
  console.log(`NODE_ENV: ${nodeEnv} (${isProduction ? '生产环境' : '开发环境'})`);
  console.log('Node.js 版本:', process.version);
  console.log('系统环境:', process.platform, process.arch);
  console.log('环境变量检查:');

  // 检查必需的环境变量
  for (const key of requiredEnvVars) {
    const value = process.env[key];
    console.log(`检查 ${key}...`);

    if (!value || typeof value !== 'string' || value.trim() === '') {
      missingVars.push(key);
      console.error(`[错误] ${key} 未设置或值无效`);
      continue;
    }

    const maskedValue = key === 'DEEPSEEK_API_KEY' ? '***' : value;
    console.log(`[成功] ${key} = ${maskedValue}`);
  }

  if (missingVars.length > 0) {
    const errorMsg = `环境变量验证失败: ${missingVars.join(', ')} ${isVercelEnvironment ? '(Vercel)' : '(本地)'}`;    
    console.error(errorMsg);
    return {
      valid: false,
      error: errorMsg
    };
  }

  // 验证API URL格式
  try {
    new URL(process.env.DEEPSEEK_API_URL);
    console.log('[成功] API URL格式验证通过');
    console.log('----------------------------------------');
    return { valid: true };
  } catch (error) {
    const errorMsg = 'API URL格式无效';
    console.error(`[错误] ${errorMsg}`);
    console.log('----------------------------------------');
    return {
      valid: false,
      error: errorMsg
    };
  }
}

// 初始环境变量检查
const initialEnvCheck = checkEnvVariables();
if (!initialEnvCheck.valid) {
  console.error('服务器启动时环境变量检查失败:', initialEnvCheck.error);
}

// API路由
app.post('/api/chat', async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = new Date();
  
  // 根据环境调整日志输出
  if (!isProduction) {
    console.log(`\n[${startTime.toISOString()}] 收到新的API请求 (ID: ${requestId})`);
  }

  try {
    // 每次请求时重新检查环境变量
    console.log(`[${requestId}] 验证环境变量...`);
    const envCheck = checkEnvVariables();
    if (!envCheck.valid) {
      const errorMsg = `环境变量验证失败: ${envCheck.error}`;
      console.error(`[${requestId}] ${errorMsg}`);
      return res.status(503).json({
        error: '服务配置错误',
        message: errorMsg,
        request_id: requestId,
        environment: isVercelEnvironment ? 'vercel' : 'local'
      });
    }

    // 记录API请求信息
    const apiUrl = process.env.DEEPSEEK_API_URL;
    if (!isProduction) {
      console.log(`[${requestId}] 准备发送请求到DeepSeek API`);
      console.log(`[${requestId}] 目标URL: ${apiUrl}`);
      console.log(`[${requestId}] 请求体:`, JSON.stringify(req.body, null, 2));
    }

    // 发送API请求
    console.log(`[${requestId}] 发送请求...`);
    // 使用客户端传入的请求体
    if (!isProduction) {
      console.log(`[${requestId}] 客户端请求体:`, JSON.stringify(req.body, null, 2));
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    // 打印响应状态和头信息以便调试
    console.log(`[${requestId}] DeepSeek API响应状态:`, response.status);
    console.log(`[${requestId}] DeepSeek API响应头:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    // 处理API响应
    console.log(`[${requestId}] 收到响应 (状态码: ${response.status})`);
    
    if (!response.ok) {
      let errorData;
      let responseText;
      
      try {
        responseText = await response.text();
        console.log(`[${requestId}] 错误响应内容:`, responseText);
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`[${requestId}] 解析错误响应失败:`, parseError);
        errorData = { error: '无法解析错误响应' };
      }

      const errorInfo = {
        request_id: requestId,
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: apiUrl,
        response_text: responseText,
        timestamp: new Date().toISOString()
      };

      console.error(`[${requestId}] API请求失败:`, JSON.stringify(errorInfo, null, 2));

      return res.status(response.status).json({
        error: '请求处理失败',
        message: errorData.error || `API请求失败 (${response.status}: ${response.statusText})`,
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }

    // 处理成功响应
    try {
      const data = await response.json();
      const endTime = new Date();
      const duration = endTime - startTime;
      
      console.log(`[${requestId}] 请求成功完成 (耗时: ${duration}ms)`);
      res.json({
        ...data,
        request_id: requestId,
        timestamp: endTime.toISOString()
      });
    } catch (parseError) {
      console.error(`[${requestId}] 解析成功响应失败:`, parseError);
      res.status(500).json({
        error: '响应解析失败',
        message: '服务器返回的数据格式无效',
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    const errorTime = new Date();
    console.error(`[${requestId}] 处理请求时发生错误:`, error);
    
    res.status(500).json({
      error: '服务器内部错误',
      message: '处理请求时发生意外错误，请稍后重试',
      request_id: requestId,
      timestamp: errorTime.toISOString()
    });
  }
});

const startServer = (port) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port)
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`端口 ${port} 已被占用，尝试使用下一个可用端口...`);
          server.close();
          resolve(false);
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        console.log(`服务器成功运行在端口 ${port}`);
        resolve(true);
      });
  });
};

const PORT = process.env.PORT || 3000;
const MAX_PORT = 3010; // 设置最大尝试端口号

(async () => {
  let currentPort = PORT;
  while (currentPort <= MAX_PORT) {
    try {
      const success = await startServer(currentPort);
      if (success) break;
      currentPort++;
    } catch (err) {
      console.error('启动服务器时发生错误:', err);
      process.exit(1);
    }
  }
  
  if (currentPort > MAX_PORT) {
    console.error(`无法找到可用端口 (尝试范围: ${PORT}-${MAX_PORT})`);
    process.exit(1);
  }
})();