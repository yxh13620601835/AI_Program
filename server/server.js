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

// 检查环境变量和URL格式
const checkEnvVariables = () => {
  const missingVars = [];
  const envVars = {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL
  };

  console.log(`当前运行环境: ${isVercelEnvironment ? 'Vercel' : '本地开发'}`);

  // 检查环境变量是否存在
  Object.entries(envVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      missingVars.push(key);
      console.error(`[${isVercelEnvironment ? 'Vercel' : 'Local'}] 环境变量 ${key} 未设置或为空`);
    } else {
      console.log(`[${isVercelEnvironment ? 'Vercel' : 'Local'}] 环境变量 ${key} 已正确设置`);
    }
  });

  if (missingVars.length > 0) {
    console.error(`错误: 以下环境变量未正确设置: ${missingVars.join(', ')}`);
    return {
      valid: false,
      error: `缺少必要的环境变量: ${missingVars.join(', ')}`
    };
  }

  // 验证API URL格式
  try {
    // 检查URL是否以http或https开头
    if (!process.env.DEEPSEEK_API_URL.match(/^https?:\/\/.+/)) {
      return {
        valid: false,
        error: 'API URL必须以http://或https://开头'
      };
    }
    console.log('API URL格式验证通过:', process.env.DEEPSEEK_API_URL);
    return { valid: true };
  } catch (error) {
    console.error('API URL格式验证失败:', error.message);
    return {
      valid: false,
      error: 'API URL格式无效'
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
  try {
    // 每次请求时重新检查环境变量
    const envCheck = checkEnvVariables();
    if (!envCheck.valid) {
      console.error(`[${isVercelEnvironment ? 'Vercel' : 'Local'}] API调用失败：环境变量验证错误:`, envCheck.error);
      return res.status(503).json({
        error: '服务暂时不可用',
        message: envCheck.error,
        environment: isVercelEnvironment ? 'vercel' : 'local'
      });
    }

    // 验证API URL
    if (!process.env.DEEPSEEK_API_URL.match(/^https?:\/\/.+/)) {
      throw new Error('API URL必须以http://或https://开头');
    }

    // 打印请求体以便调试
    console.log('发送到DeepSeek API的请求体:', JSON.stringify(req.body, null, 2));
    console.log('使用的API URL:', process.env.DEEPSEEK_API_URL);

    const response = await fetch(process.env.DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });

    // 打印响应状态和头信息以便调试
    console.log('DeepSeek API响应状态:', response.status);
    console.log('DeepSeek API响应头:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    if (!response.ok) {
      let errorData;
      try {
        const responseText = await response.text();
        console.log('原始错误响应:', responseText);
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('解析错误响应失败:', parseError);
        errorData = {};
      }

      console.error('API响应错误:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: process.env.DEEPSEEK_API_URL
      });

      return res.status(response.status).json({
        error: '请求处理失败',
        message: errorData.error || `API请求失败 (${response.status}: ${response.statusText})`
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('API请求错误:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: '处理请求时发生意外错误，请稍后重试'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});